import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "@/app.module";
import { PrismaService } from "@/database/prisma.service";

const EMAIL = "phase7-media@indobraga.local";
const PASSWORD = "Phase7Media123!";
const PREFIX = "phase7-media";
const CSRF_COOKIE_NAME = "indobraga_csrf";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function data(body: unknown): Record<string, unknown> {
  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Response data is missing.");
  }

  return body.data;
}

function error(body: unknown): Record<string, unknown> {
  if (!isRecord(body) || !isRecord(body.error)) {
    throw new Error("Response error is missing.");
  }

  return body.error;
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

async function cleanup(prisma: PrismaService): Promise<void> {
  await prisma.revalidationEvent.deleteMany({ where: { resourceType: "media" } });
  await prisma.auditLog.deleteMany({ where: { actor: { is: { email: EMAIL } } } });
  await prisma.mediaFile.deleteMany({ where: { originalFilename: { startsWith: PREFIX } } });
  await prisma.adminSession.deleteMany({ where: { user: { email: EMAIL } } });
  await prisma.user.deleteMany({ where: { email: EMAIL } });
  await rm(join(process.cwd(), ".local-storage", "upload", "dev", "galeri"), {
    recursive: true,
    force: true,
  });
}

describe("Media API", () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;
  let csrfToken: string;
  let agent: ReturnType<typeof request.agent>;

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
    await prisma.user.create({
      data: {
        name: "Phase 7 Media Admin",
        email: EMAIL,
        passwordHash,
        role: UserRole.CONTENT_EDITOR,
        status: UserStatus.ACTIVE,
      },
    });

    agent = request.agent(httpServer);
    const loginResponse = await agent
      .post("/api/v1/auth/login")
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);
    csrfToken = csrfFrom(loginResponse.headers);
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  it("uploads an image, creates WebP derivatives, and stores metadata only", async () => {
    const image = await sharp({
      create: {
        width: 64,
        height: 64,
        channels: 3,
        background: "#1d4ed8",
      },
    })
      .png()
      .toBuffer();

    const response = await agent
      .post("/api/v1/admin/media")
      .set("x-csrf-token", csrfToken)
      .field("usage", "gallery")
      .field("alt_text", "Media test Indobraga")
      .attach("file", image, `${PREFIX}-image.png`)
      .expect(201);
    const uploaded = data(response.body);

    expect(uploaded.media_type).toBe("image");
    expect(uploaded.compression_status).toBe("completed");
    expect(uploaded.thumbnail_url).toEqual(expect.stringContaining("/upload/dev/galeri/"));
    expect(uploaded.medium_url).toEqual(expect.stringContaining("/upload/dev/galeri/"));
    expect(uploaded.large_url).toEqual(expect.stringContaining("/upload/dev/galeri/"));
    expect(uploaded).not.toHaveProperty("object_key");

    const id = uploaded.id;
    expect(typeof id).toBe("number");

    await agent.get("/api/v1/admin/media").query({ usage: "gallery" }).expect(200);
    await agent.get(`/api/v1/admin/media/${String(id)}`).expect(200);

    const auditCount = await prisma.auditLog.count({ where: { actor: { is: { email: EMAIL } } } });
    const revalidationCount = await prisma.revalidationEvent.count({
      where: { resourceType: "media" },
    });

    expect(auditCount).toBeGreaterThan(0);
    expect(revalidationCount).toBeGreaterThan(0);

    await agent
      .delete(`/api/v1/admin/media/${String(id)}`)
      .set("x-csrf-token", csrfToken)
      .expect(200);
  });

  it("rejects unsupported file signatures", async () => {
    const response = await agent
      .post("/api/v1/admin/media")
      .set("x-csrf-token", csrfToken)
      .field("usage", "gallery")
      .attach("file", Buffer.from("not-an-image"), `${PREFIX}-bad.txt`)
      .expect(415);

    expect(error(response.body).code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });
});
