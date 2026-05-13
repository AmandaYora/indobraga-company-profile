import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "@/app.module";
import { PrismaService } from "@/database/prisma.service";

const TEST_EMAIL = "auth-test-admin@indobraga.local";
const TEST_PASSWORD = "AuthTest123!";
const MANAGED_EMAIL = "managed-admin@indobraga.local";
const MANAGED_PASSWORD = "Managed123!";
const MANAGED_NEW_PASSWORD = "ManagedNew123!";
const SESSION_COOKIE_NAME = "indobraga_admin_session";
const CSRF_COOKIE_NAME = "indobraga_csrf";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getSetCookies(rawCookies: unknown): string[] {
  if (Array.isArray(rawCookies)) {
    return rawCookies.filter((value): value is string => typeof value === "string");
  }

  return typeof rawCookies === "string" ? [rawCookies] : [];
}

function getCookieFromSetCookie(rawCookies: unknown, name: string): string {
  const cookie = getSetCookies(rawCookies).find((value) => value.startsWith(`${name}=`));
  const rawValue = cookie?.split(";")[0]?.slice(name.length + 1);

  if (!rawValue) {
    throw new Error(`Cookie ${name} is missing.`);
  }

  return rawValue;
}

function getBody(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) {
    throw new Error("Response body is not an object.");
  }

  return body;
}

function getUserPermissions(body: Record<string, unknown>): unknown[] {
  if (
    !isRecord(body.data) ||
    !isRecord(body.data.user) ||
    !Array.isArray(body.data.user.permissions)
  ) {
    throw new Error("Response user.permissions is missing.");
  }

  return body.data.user.permissions;
}

function getData(body: Record<string, unknown>): Record<string, unknown> {
  if (!isRecord(body.data)) {
    throw new Error("Response data is missing.");
  }

  return body.data;
}

function getResponseUserId(body: Record<string, unknown>): number {
  const data = getData(body);
  if (typeof data.id === "number") {
    return data.id;
  }

  throw new Error("Response data.id is missing.");
}

describe("Auth API", () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
    httpServer = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);

    await prisma.adminSession.deleteMany({
      where: {
        user: {
          email: {
            in: [TEST_EMAIL, MANAGED_EMAIL],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: MANAGED_EMAIL,
      },
    });

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
    await prisma.user.upsert({
      where: { email: TEST_EMAIL },
      update: {
        name: "Auth Test Admin",
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
      create: {
        name: "Auth Test Admin",
        email: TEST_EMAIL,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
    });
  });

  afterAll(async () => {
    await prisma.adminSession.deleteMany({
      where: {
        user: {
          email: TEST_EMAIL,
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [TEST_EMAIL, MANAGED_EMAIL],
        },
      },
    });
    await app.close();
  });

  it("logs in, reads current session, and logs out", async () => {
    const agent = request.agent(httpServer);
    const loginResponse = await agent
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(200);

    const loginBody = getBody(loginResponse.body);
    expect(loginBody.success).toBe(true);
    expect(loginBody.data).toMatchObject({
      user: {
        email: TEST_EMAIL,
        role: "super_admin",
      },
    });
    expect(getUserPermissions(loginBody)).toContain("users.manage");
    expect(JSON.stringify(loginBody)).not.toContain("passwordHash");
    expect(loginResponse.headers["cache-control"]).toBe("no-store");

    const rawSetCookie: unknown = loginResponse.headers["set-cookie"];
    expect(getCookieFromSetCookie(rawSetCookie, SESSION_COOKIE_NAME)).toBeTruthy();
    const csrfToken = getCookieFromSetCookie(rawSetCookie, CSRF_COOKIE_NAME);

    const meResponse = await agent.get("/api/v1/auth/me").expect(200);
    expect(getBody(meResponse.body).data).toMatchObject({
      user: {
        email: TEST_EMAIL,
        role: "super_admin",
      },
    });

    await agent.post("/api/v1/auth/logout").set("x-csrf-token", csrfToken).expect(200);
    await agent.get("/api/v1/auth/me").expect(401);
  });

  it("rejects invalid credentials", async () => {
    const response = await request(httpServer)
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: "wrong-password" })
      .expect(401);

    expect(getBody(response.body)).toMatchObject({
      success: false,
      error: {
        code: "UNAUTHENTICATED",
      },
    });
  });

  it("requires CSRF token for authenticated mutations", async () => {
    const agent = request.agent(httpServer);
    await agent
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(200);

    const response = await agent.post("/api/v1/auth/logout").expect(403);
    expect(getBody(response.body)).toMatchObject({
      success: false,
      error: {
        code: "FORBIDDEN",
      },
    });
  });

  it("manages admin users with users.manage permission", async () => {
    const agent = request.agent(httpServer);
    const loginResponse = await agent
      .post("/api/v1/auth/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(200);
    const csrfToken = getCookieFromSetCookie(loginResponse.headers["set-cookie"], CSRF_COOKIE_NAME);

    const createResponse = await agent
      .post("/api/v1/admin/users")
      .set("x-csrf-token", csrfToken)
      .send({
        name: "Managed Admin",
        email: MANAGED_EMAIL,
        role: "content_editor",
        temporary_password: MANAGED_PASSWORD,
      })
      .expect(201);
    const createdUserBody = getBody(createResponse.body);
    const managedUserId = getResponseUserId(createdUserBody);

    expect(getData(createdUserBody)).toMatchObject({
      email: MANAGED_EMAIL,
      role: "content_editor",
      status: "active",
    });
    expect(JSON.stringify(createdUserBody)).not.toContain(MANAGED_PASSWORD);
    expect(JSON.stringify(createdUserBody)).not.toContain("passwordHash");

    await agent.get("/api/v1/admin/users").expect(200);
    await agent.get(`/api/v1/admin/users/${managedUserId}`).expect(200);

    const updateResponse = await agent
      .patch(`/api/v1/admin/users/${managedUserId}`)
      .set("x-csrf-token", csrfToken)
      .send({ name: "Managed Editor", new_password: MANAGED_NEW_PASSWORD })
      .expect(200);
    expect(JSON.stringify(updateResponse.body)).not.toContain(MANAGED_NEW_PASSWORD);
    const updatedManagedUser = await prisma.user.findUniqueOrThrow({
      where: { email: MANAGED_EMAIL },
    });
    await expect(
      bcrypt.compare(MANAGED_NEW_PASSWORD, updatedManagedUser.passwordHash),
    ).resolves.toBe(true);

    const editorAgent = request.agent(httpServer);
    await editorAgent
      .post("/api/v1/auth/login")
      .send({ email: MANAGED_EMAIL, password: MANAGED_NEW_PASSWORD })
      .expect(200);
    await editorAgent.get("/api/v1/admin/users").expect(200);

    await agent
      .patch(`/api/v1/admin/users/${managedUserId}/status`)
      .set("x-csrf-token", csrfToken)
      .send({ status: "inactive" })
      .expect(200);

    await agent
      .delete(`/api/v1/admin/users/${managedUserId}`)
      .set("x-csrf-token", csrfToken)
      .expect(200);
  });
});
