import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  EmailAccountStatus,
  EmailCampaignStatus,
  EmailProviderType,
  UserRole,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "@/app.module";
import { PrismaService } from "@/database/prisma.service";

const EMAIL = "phase12-dashboard@indobraga.local";
const PASSWORD = "Phase12Dashboard123!";
const PREFIX = "phase12-dashboard";
const SENDER_EMAIL = `${PREFIX}-sender@indobraga.local`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function data(body: unknown): Record<string, unknown> {
  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Response data is missing.");
  }

  return body.data;
}

async function cleanup(prisma: PrismaService): Promise<void> {
  await prisma.emailSendLog.deleteMany({
    where: { campaign: { name: { startsWith: PREFIX } } },
  });
  await prisma.emailCampaignRecipient.deleteMany({
    where: { campaign: { name: { startsWith: PREFIX } } },
  });
  await prisma.emailCampaign.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.emailAccount.deleteMany({ where: { email: SENDER_EMAIL } });
  await prisma.inquiry.deleteMany({ where: { email: { startsWith: PREFIX } } });
  await prisma.whatsAppLead.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.adminSession.deleteMany({ where: { user: { email: EMAIL } } });
  await prisma.user.deleteMany({ where: { email: EMAIL } });
}

describe("Dashboard API", () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;
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
        name: "Phase 12 Dashboard Admin",
        email: EMAIL,
        passwordHash,
        role: UserRole.CONTENT_EDITOR,
        status: UserStatus.ACTIVE,
      },
    });
    const sender = await prisma.emailAccount.create({
      data: {
        provider: EmailProviderType.SMTP_HOSTING,
        email: SENDER_EMAIL,
        displayName: `${PREFIX} Sender`,
        status: EmailAccountStatus.CONNECTED,
      },
    });
    await prisma.emailCampaign.create({
      data: {
        senderAccountId: sender.id,
        name: `${PREFIX} Campaign`,
        subject: "Dashboard Campaign",
        bodyHtml: "<p>Dashboard</p>",
        status: EmailCampaignStatus.COMPLETED,
        totalRecipients: 2,
        sentCount: 1,
        failedCount: 1,
      },
    });
    await prisma.inquiry.create({
      data: {
        name: `${PREFIX} Inquiry`,
        email: `${PREFIX}@example.test`,
        phone: "+62 812 1111 2222",
        message: "Dashboard inquiry test.",
      },
    });
    await prisma.whatsAppLead.create({
      data: {
        name: `${PREFIX} WhatsApp`,
        phone: "+62 813 1111 2222",
        message: "Dashboard WhatsApp lead test.",
      },
    });

    agent = request.agent(httpServer);
    await agent.post("/api/v1/auth/login").send({ email: EMAIL, password: PASSWORD }).expect(200);
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  it("blocks unauthenticated dashboard access", async () => {
    await request(httpServer).get("/api/v1/admin/dashboard").expect(401);
  });

  it("returns no-store dashboard totals and latest operational data", async () => {
    const response = await agent.get("/api/v1/admin/dashboard").expect(200);
    const result = data(response.body);

    expect(response.headers["cache-control"]).toBe("no-store");
    if (!isRecord(result.totals)) {
      throw new Error("Dashboard totals are missing.");
    }
    for (const key of [
      "inquiries",
      "whatsapp_leads",
      "published_gallery",
      "published_news",
      "active_portfolios",
      "email_campaigns",
    ]) {
      expect(typeof result.totals[key]).toBe("number");
    }
    expect(result.latest_inquiries).toEqual(
      expect.arrayContaining([expect.objectContaining({ email: `${PREFIX}@example.test` })]),
    );
    expect(result.latest_whatsapp_leads).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: `${PREFIX} WhatsApp` })]),
    );
    expect(result.latest_email_campaigns).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: `${PREFIX} Campaign` })]),
    );
    expect(JSON.stringify(result)).not.toContain("encrypted");
    expect(JSON.stringify(result)).not.toContain("password");
  });
});
