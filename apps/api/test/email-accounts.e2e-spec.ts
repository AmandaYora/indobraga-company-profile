import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { EmailProviderType, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "@/app.module";
import { PrismaService } from "@/database/prisma.service";

const SUPER_EMAIL = "phase9-super@indobraga.local";
const EDITOR_EMAIL = "phase9-editor@indobraga.local";
const PASSWORD = "Phase9Email123!";
const PREFIX = "phase9-email";
const SMTP_EMAIL = `${PREFIX}-smtp@indobraga.local`;
const GOOGLE_EMAIL = `${PREFIX}-google@indobraga.local`;
const CSRF_COOKIE_NAME = "indobraga_csrf";

type AgentWithCsrf = {
  agent: ReturnType<typeof request.agent>;
  csrfToken: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function data(body: unknown): Record<string, unknown> {
  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Response data is missing.");
  }

  return body.data;
}

function csrfFrom(headers: Record<string, unknown>): string {
  const raw = headers["set-cookie"];
  const cookies = Array.isArray(raw)
    ? raw.filter((value): value is string => typeof value === "string")
    : [];
  const cookie = cookies.find((value) => value.startsWith(`${CSRF_COOKIE_NAME}=`));
  const token = cookie?.split(";")[0]?.slice(CSRF_COOKIE_NAME.length + 1);

  if (!token) {
    throw new Error("CSRF token missing.");
  }

  return token;
}

function numericId(value: unknown): number {
  if (typeof value !== "number") {
    throw new Error("Response id is missing.");
  }

  return value;
}

function stringValue(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Response string value is missing.");
  }

  return value;
}

function stateFromAuthorizationUrl(url: string): string {
  const parsed = new URL(url);
  const state = parsed.searchParams.get("state");
  if (!state) {
    throw new Error("OAuth state is missing.");
  }

  return state;
}

async function login(httpServer: Server, email: string): Promise<AgentWithCsrf> {
  const agent = request.agent(httpServer);
  const response = await agent
    .post("/api/v1/auth/login")
    .send({ email, password: PASSWORD })
    .expect(200);

  return {
    agent,
    csrfToken: csrfFrom(response.headers),
  };
}

async function cleanup(prisma: PrismaService): Promise<void> {
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { actor: { is: { email: { in: [SUPER_EMAIL, EDITOR_EMAIL] } } } },
        { resourceType: "email-accounts" },
      ],
    },
  });
  await prisma.emailOAuthState.deleteMany({
    where: {
      OR: [
        { emailHint: { startsWith: PREFIX } },
        { displayName: { startsWith: PREFIX } },
        { adminUser: { email: { in: [SUPER_EMAIL, EDITOR_EMAIL] } } },
      ],
    },
  });
  await prisma.emailAccount.deleteMany({
    where: { email: { startsWith: PREFIX } },
  });
  await prisma.adminSession.deleteMany({
    where: { user: { email: { in: [SUPER_EMAIL, EDITOR_EMAIL] } } },
  });
  await prisma.user.deleteMany({ where: { email: { in: [SUPER_EMAIL, EDITOR_EMAIL] } } });
}

describe("Email Account API", () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;
  let admin: AgentWithCsrf;
  let editor: AgentWithCsrf;
  let smtpAccountId: number;
  let googleAccountId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
    httpServer = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);

    await cleanup(prisma);
    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    await prisma.user.createMany({
      data: [
        {
          name: "Phase 9 Super Admin",
          email: SUPER_EMAIL,
          passwordHash,
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
        {
          name: "Phase 9 Content Editor",
          email: EDITOR_EMAIL,
          passwordHash,
          role: UserRole.CONTENT_EDITOR,
          status: UserStatus.ACTIVE,
        },
      ],
    });

    admin = await login(httpServer, SUPER_EMAIL);
    editor = await login(httpServer, EDITOR_EMAIL);
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  it("allows content editors to manage email account tools", async () => {
    await editor.agent.get("/api/v1/admin/email-accounts").expect(200);

    const response = await editor.agent
      .post("/api/v1/admin/email-accounts/smtp/test")
      .set("x-csrf-token", editor.csrfToken)
      .send({
        email_address: SMTP_EMAIL,
        display_name: `${PREFIX} SMTP`,
        smtp_host: "smtp.indobraga.local",
        smtp_port: 465,
        smtp_security: "ssl_tls",
        smtp_username: SMTP_EMAIL,
        smtp_password: "secret",
      })
      .expect(201);

    expect(data(response.body).valid).toBe(true);
  });

  it("tests SMTP config through the mock adapter", async () => {
    const successResponse = await admin.agent
      .post("/api/v1/admin/email-accounts/smtp/test")
      .set("x-csrf-token", admin.csrfToken)
      .send({
        email_address: SMTP_EMAIL,
        display_name: `${PREFIX} SMTP`,
        smtp_host: "smtp.indobraga.local",
        smtp_port: 465,
        smtp_security: "ssl_tls",
        smtp_username: SMTP_EMAIL,
        smtp_password: "secret",
      })
      .expect(201);
    expect(data(successResponse.body).valid).toBe(true);

    const failResponse = await admin.agent
      .post("/api/v1/admin/email-accounts/smtp/test")
      .set("x-csrf-token", admin.csrfToken)
      .send({
        email_address: SMTP_EMAIL,
        display_name: `${PREFIX} SMTP`,
        smtp_host: "fail.smtp.indobraga.local",
        smtp_port: 465,
        smtp_security: "ssl_tls",
        smtp_username: SMTP_EMAIL,
        smtp_password: "secret",
      })
      .expect(201);
    expect(data(failResponse.body).valid).toBe(false);
  });

  it("stores SMTP accounts with encrypted secrets and redacted responses", async () => {
    const response = await admin.agent
      .post("/api/v1/admin/email-accounts/smtp")
      .set("x-csrf-token", admin.csrfToken)
      .send({
        email_address: SMTP_EMAIL,
        display_name: `${PREFIX} SMTP`,
        smtp_host: "smtp.indobraga.local",
        smtp_port: 465,
        smtp_security: "ssl_tls",
        smtp_username: SMTP_EMAIL,
        smtp_password: "secret-password",
      })
      .expect(201);
    const created = data(response.body);
    smtpAccountId = numericId(created.id);

    expect(created.provider).toBe("smtp");
    expect(created.status).toBe("connected");
    expect(created).not.toHaveProperty("smtp_password");
    expect(created).not.toHaveProperty("encrypted_smtp_password");

    const stored = await prisma.emailAccount.findUniqueOrThrow({ where: { id: smtpAccountId } });
    expect(stored.encryptedSmtpPassword).toEqual(expect.stringContaining("v1:"));
    expect(stored.encryptedSmtpPassword).not.toContain("secret-password");

    const listResponse = await admin.agent
      .get("/api/v1/admin/email-accounts")
      .query({ provider: "smtp", q: PREFIX })
      .expect(200);
    const list = data(listResponse.body);
    expect(JSON.stringify(list)).not.toContain("secret-password");
    expect(JSON.stringify(list)).not.toContain("encrypted_smtp_password");
  });

  it("updates and disables SMTP accounts", async () => {
    const updateResponse = await admin.agent
      .patch(`/api/v1/admin/email-accounts/${String(smtpAccountId)}`)
      .set("x-csrf-token", admin.csrfToken)
      .send({
        display_name: `${PREFIX} SMTP Updated`,
        smtp_port: 587,
        smtp_security: "starttls",
      })
      .expect(200);
    const updated = data(updateResponse.body);
    expect(updated.display_name).toBe(`${PREFIX} SMTP Updated`);
    expect(updated.smtp_security).toBe("starttls");

    const disableResponse = await admin.agent
      .post(`/api/v1/admin/email-accounts/${String(smtpAccountId)}/disable`)
      .set("x-csrf-token", admin.csrfToken)
      .expect(201);
    expect(data(disableResponse.body).status).toBe("disabled");
  });

  it("creates signed Google OAuth state and rejects invalid callback state", async () => {
    const response = await admin.agent
      .post("/api/v1/admin/email-accounts/google/oauth-url")
      .set("x-csrf-token", admin.csrfToken)
      .send({
        email_hint: GOOGLE_EMAIL,
        display_name: `${PREFIX} Google`,
      })
      .expect(201);
    const result = data(response.body);
    const authorizationUrl = stringValue(result.authorization_url);
    expect(authorizationUrl).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(authorizationUrl).toContain("gmail.send");

    await request(httpServer)
      .get("/api/v1/oauth/google/email/callback")
      .query({ code: "mock-invalid", state: "invalid-state" })
      .expect(302)
      .expect("location", /status=error/);
  });

  it("connects Google OAuth accounts through a valid mock callback", async () => {
    const urlResponse = await admin.agent
      .post("/api/v1/admin/email-accounts/google/oauth-url")
      .set("x-csrf-token", admin.csrfToken)
      .send({
        email_hint: GOOGLE_EMAIL,
        display_name: `${PREFIX} Google`,
      })
      .expect(201);
    const state = stateFromAuthorizationUrl(stringValue(data(urlResponse.body).authorization_url));

    await request(httpServer)
      .get("/api/v1/oauth/google/email/callback")
      .query({ code: "mock-code-google", state })
      .expect(302)
      .expect("location", /status=success/);

    const account = await prisma.emailAccount.findUniqueOrThrow({
      where: {
        provider_email: {
          provider: EmailProviderType.GOOGLE_OAUTH,
          email: GOOGLE_EMAIL,
        },
      },
    });
    googleAccountId = account.id;
    expect(account.encryptedAccessToken).toEqual(expect.stringContaining("v1:"));
    expect(account.encryptedRefreshToken).toEqual(expect.stringContaining("v1:"));

    const listResponse = await admin.agent
      .get("/api/v1/admin/email-accounts")
      .query({ provider: "google", q: PREFIX })
      .expect(200);
    const list = data(listResponse.body);
    expect(JSON.stringify(list)).not.toContain("mock-access");
    expect(JSON.stringify(list)).not.toContain("encrypted_access_token");
  });

  it("returns a new OAuth URL for Google reconnect and soft-deletes through disable", async () => {
    const reconnectResponse = await admin.agent
      .post(`/api/v1/admin/email-accounts/${String(googleAccountId)}/reconnect`)
      .set("x-csrf-token", admin.csrfToken)
      .expect(201);
    expect(data(reconnectResponse.body).authorization_url).toEqual(expect.any(String));

    const deleteResponse = await admin.agent
      .delete(`/api/v1/admin/email-accounts/${String(googleAccountId)}`)
      .set("x-csrf-token", admin.csrfToken)
      .expect(200);
    expect(data(deleteResponse.body).status).toBe("disabled");
  });
});
