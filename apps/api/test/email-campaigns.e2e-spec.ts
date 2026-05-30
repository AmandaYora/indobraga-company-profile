import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import {
  EmailAccountStatus,
  EmailProviderType,
  SmtpSecurityMode,
  UserRole,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "@/app.module";
import type { Env } from "@/config/env";
import { PrismaService } from "@/database/prisma.service";

const EMAIL = "phase10-campaigns@indobraga.local";
const SUPER_EMAIL = "phase10-campaigns-super@indobraga.local";
const PASSWORD = "Phase10Campaign123!";
const PREFIX = "phase10-campaign";
const SENDER_EMAIL = `${PREFIX}-sender@indobraga.local`;
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

function numericId(value: unknown): number {
  if (typeof value !== "number") {
    throw new Error("Response id is missing.");
  }

  return value;
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
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { actor: { is: { email: { in: [EMAIL, SUPER_EMAIL] } } } },
        { resourceType: "email-campaigns" },
      ],
    },
  });
  await prisma.emailSendLog.deleteMany({
    where: { campaign: { name: { startsWith: PREFIX } } },
  });
  await prisma.emailCampaignRecipient.deleteMany({
    where: { campaign: { name: { startsWith: PREFIX } } },
  });
  await prisma.emailCampaign.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.emailAccount.deleteMany({ where: { email: SENDER_EMAIL } });
  await prisma.adminSession.deleteMany({
    where: { user: { email: { in: [EMAIL, SUPER_EMAIL] } } },
  });
  await prisma.user.deleteMany({ where: { email: { in: [EMAIL, SUPER_EMAIL] } } });
}

describe("Email Campaign API and worker", () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;
  let workerSecret: string;
  let agent: ReturnType<typeof request.agent>;
  let superAgent: ReturnType<typeof request.agent>;
  let csrfToken: string;
  let senderAccountId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
    httpServer = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);
    workerSecret = app
      .get<ConfigService<Env, true>>(ConfigService)
      .get("INTERNAL_WORKER_SECRET", { infer: true });

    await cleanup(prisma);
    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    await prisma.user.createMany({
      data: [
        {
          name: "Phase 10 Campaign Editor",
          email: EMAIL,
          passwordHash,
          role: UserRole.CONTENT_EDITOR,
          status: UserStatus.ACTIVE,
        },
        {
          name: "Phase 10 Campaign Super Admin",
          email: SUPER_EMAIL,
          passwordHash,
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
      ],
    });
    const sender = await prisma.emailAccount.create({
      data: {
        provider: EmailProviderType.SMTP_HOSTING,
        email: SENDER_EMAIL,
        displayName: `${PREFIX} Sender`,
        status: EmailAccountStatus.CONNECTED,
        smtpHost: "smtp.indobraga.local",
        smtpPort: 465,
        smtpSecurity: SmtpSecurityMode.SSL_TLS,
        smtpUsername: SENDER_EMAIL,
        encryptedSmtpPassword: "mock-not-used",
        lastTestAt: new Date(),
        connectedAt: new Date(),
      },
    });
    senderAccountId = sender.id;

    agent = request.agent(httpServer);
    const loginResponse = await agent
      .post("/api/v1/auth/login")
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);
    csrfToken = csrfFrom(loginResponse.headers);
    superAgent = request.agent(httpServer);
    await superAgent
      .post("/api/v1/auth/login")
      .send({ email: SUPER_EMAIL, password: PASSWORD })
      .expect(200);
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  it("creates, updates, sends, and processes a campaign without duplicate worker logs", async () => {
    const draftResponse = await agent
      .post("/api/v1/admin/email-campaigns/draft")
      .set("x-csrf-token", csrfToken)
      .send({
        title: `${PREFIX} Main`,
        email_account_id: senderAccountId,
        subject: "Penawaran Produksi Indobraga",
        body_html: "<p>Halo {{nama}}</p>",
        recipients: [
          { name: "Budi", email: `${PREFIX}-success@example.test` },
          { name: "Budi Duplicate", email: `${PREFIX}-success@example.test` },
          { name: "Gagal", email: `${PREFIX}-fail@example.test` },
        ],
      })
      .expect(201);
    const campaignId = numericId(data(draftResponse.body).id);
    expect(data(draftResponse.body).total_recipients).toBe(2);

    const updateResponse = await agent
      .patch(`/api/v1/admin/email-campaigns/${String(campaignId)}`)
      .set("x-csrf-token", csrfToken)
      .send({ subject: "Penawaran Produksi Garment Indobraga" })
      .expect(200);
    expect(data(updateResponse.body).subject).toBe("Penawaran Produksi Garment Indobraga");

    await agent.get("/api/v1/admin/email-campaigns").query({ q: PREFIX }).expect(200);
    await agent.get(`/api/v1/admin/email-campaigns/${String(campaignId)}/recipients`).expect(200);

    const sendResponse = await agent
      .post(`/api/v1/admin/email-campaigns/${String(campaignId)}/send`)
      .set("x-csrf-token", csrfToken)
      .expect(201);
    expect(data(sendResponse.body).status).toBe("pending");

    const invalidPatch = await agent
      .patch(`/api/v1/admin/email-campaigns/${String(campaignId)}`)
      .set("x-csrf-token", csrfToken)
      .send({ subject: "Tidak boleh berubah" })
      .expect(422);
    expect(error(invalidPatch.body).code).toBe("UNPROCESSABLE_ENTITY");

    await request(httpServer).post("/api/v1/internal/workers/email-campaigns/tick").expect(401);

    const [firstTick, secondTick] = await Promise.all([
      request(httpServer)
        .post("/api/v1/internal/workers/email-campaigns/tick")
        .set("x-internal-worker-secret", workerSecret)
        .expect(201),
      request(httpServer)
        .post("/api/v1/internal/workers/email-campaigns/tick")
        .set("x-internal-worker-secret", workerSecret)
        .expect(201),
    ]);
    const processed = [data(firstTick.body), data(secondTick.body)].reduce(
      (total, item) => total + (typeof item.processed === "number" ? item.processed : 0),
      0,
    );
    expect(processed).toBe(2);

    const detailResponse = await agent
      .get(`/api/v1/admin/email-campaigns/${String(campaignId)}`)
      .expect(200);
    const detail = data(detailResponse.body);
    expect(detail.status).toBe("completed");
    expect(detail.sent_count).toBe(1);
    expect(detail.failed_count).toBe(1);

    await agent.get(`/api/v1/admin/email-campaigns/${String(campaignId)}/logs`).expect(403);

    const logsResponse = await superAgent
      .get(`/api/v1/admin/email-campaigns/${String(campaignId)}/logs`)
      .expect(200);
    const logs = data(logsResponse.body);
    expect(logs.items).toHaveLength(2);
    expect(JSON.stringify(logs)).not.toContain("mock-not-used");
  });

  it("retries temporary failures and then records the final failed reason", async () => {
    const draftResponse = await agent
      .post("/api/v1/admin/email-campaigns/draft")
      .set("x-csrf-token", csrfToken)
      .send({
        title: `${PREFIX} Retry`,
        email_account_id: senderAccountId,
        subject: "Retry Test",
        body_html: "<p>Retry</p>",
        recipients: [{ name: "Temp", email: `${PREFIX}-tempfail@example.test` }],
      })
      .expect(201);
    const campaignId = numericId(data(draftResponse.body).id);

    await agent
      .post(`/api/v1/admin/email-campaigns/${String(campaignId)}/send`)
      .set("x-csrf-token", csrfToken)
      .expect(201);

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await request(httpServer)
        .post("/api/v1/internal/workers/email-campaigns/tick")
        .set("x-internal-worker-secret", workerSecret)
        .expect(201);
      await prisma.emailCampaignRecipient.updateMany({
        where: { campaignId },
        data: { nextAttemptAt: new Date(Date.now() - 1000) },
      });
    }

    const recipientsResponse = await agent
      .get(`/api/v1/admin/email-campaigns/${String(campaignId)}/recipients`)
      .expect(200);
    const recipients = data(recipientsResponse.body);
    expect(recipients.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "failed",
          attempts: 3,
          error_code: "MOCK_PERMANENT_FAILURE",
        }),
      ]),
    );

    await agent.get(`/api/v1/admin/email-campaigns/${String(campaignId)}/logs`).expect(403);

    const logsResponse = await superAgent
      .get(`/api/v1/admin/email-campaigns/${String(campaignId)}/logs`)
      .expect(200);
    expect(data(logsResponse.body).items).toHaveLength(3);
  });
});
