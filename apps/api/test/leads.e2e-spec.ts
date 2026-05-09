import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "@/app.module";
import { PrismaService } from "@/database/prisma.service";

const EMAIL = "phase8-leads@indobraga.local";
const PASSWORD = "Phase8Leads123!";
const PREFIX = "phase8-leads";
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

function numericId(value: unknown): number {
  if (typeof value !== "number") {
    throw new Error("Response id is missing.");
  }

  return value;
}

async function cleanup(prisma: PrismaService): Promise<void> {
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { actor: { is: { email: EMAIL } } },
        { resourceType: { in: ["inquiries", "whatsapp-leads"] } },
      ],
    },
  });
  await prisma.inquiry.deleteMany({
    where: {
      OR: [
        { name: { startsWith: PREFIX } },
        { email: { startsWith: PREFIX } },
        { company: { startsWith: PREFIX } },
      ],
    },
  });
  await prisma.whatsAppLead.deleteMany({
    where: { OR: [{ name: { startsWith: PREFIX } }, { message: { startsWith: PREFIX } }] },
  });
  await prisma.adminSession.deleteMany({ where: { user: { email: EMAIL } } });
  await prisma.user.deleteMany({ where: { email: EMAIL } });
}

describe("Lead API", () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;
  let csrfToken: string;
  let agent: ReturnType<typeof request.agent>;
  let inquiryId: number;
  let whatsAppLeadId: number;

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
        name: "Phase 8 Leads Admin",
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

  it("stores a public inquiry with source metadata", async () => {
    const response = await request(httpServer)
      .post("/api/v1/public/inquiries")
      .set("referer", "https://indobraga.com/kontak")
      .set("user-agent", "phase8-leads-test")
      .send({
        name: `${PREFIX} Inquiry`,
        email: `${PREFIX}@example.test`,
        phone: "+62 812 3456 7890",
        company: `${PREFIX} Company`,
        message: "Saya ingin konsultasi produksi jersey custom untuk event perusahaan.",
      })
      .expect(201);
    const result = data(response.body);
    inquiryId = numericId(result.id);

    expect(result.status).toBe("new");
    expect(response.headers["cache-control"]).toBe("no-store");

    const stored = await prisma.inquiry.findUniqueOrThrow({ where: { id: inquiryId } });
    expect(stored.source).toBe("https://indobraga.com/kontak");
    expect(stored.notificationStatus).toBe("pending");
    if (!isRecord(stored.meta)) {
      throw new Error("Inquiry metadata is missing.");
    }
    expect(stored.meta.user_agent).toBe("phase8-leads-test");
    expect(stored.meta.referrer).toBe("https://indobraga.com/kontak");
    expect(typeof stored.meta.ip_hash).toBe("string");
  });

  it("returns validation errors for invalid public inquiry payloads", async () => {
    const response = await request(httpServer)
      .post("/api/v1/public/inquiries")
      .send({ name: "A", email: "not-email", phone: "abc", message: "pendek" })
      .expect(400);

    expect(error(response.body).code).toBe("VALIDATION_ERROR");
  });

  it("stores a public WhatsApp lead and builds the redirect URL from site settings", async () => {
    const response = await request(httpServer)
      .post("/api/v1/public/whatsapp-leads")
      .send({
        name: `${PREFIX} WhatsApp`,
        phone: "+62 813 1111 2222",
        message: `${PREFIX} konsultasi kebutuhan produksi kain.`,
      })
      .expect(201);
    const result = data(response.body);
    whatsAppLeadId = numericId(result.id);

    expect(result.status).toBe("new");
    expect(result.whatsapp_url).toEqual(expect.stringContaining("https://wa.me/"));
    expect(result.whatsapp_url).toEqual(expect.stringContaining("text="));
    expect(result.generated_message).toBe(`${PREFIX} konsultasi kebutuhan produksi kain.`);
  });

  it("protects admin lead listing", async () => {
    await request(httpServer).get("/api/v1/admin/inquiries").expect(401);
  });

  it("supports admin inquiry list, detail, update, and archive", async () => {
    const listResponse = await agent
      .get("/api/v1/admin/inquiries")
      .query({ q: PREFIX, status: "new" })
      .expect(200);
    const list = data(listResponse.body);
    expect(list.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: inquiryId })]),
    );

    await agent.get(`/api/v1/admin/inquiries/${String(inquiryId)}`).expect(200);

    const updateResponse = await agent
      .patch(`/api/v1/admin/inquiries/${String(inquiryId)}`)
      .set("x-csrf-token", csrfToken)
      .send({
        status: "in_progress",
        internal_note: "Follow up oleh tim sales.",
      })
      .expect(200);
    const updated = data(updateResponse.body);
    expect(updated.status).toBe("in_progress");
    expect(updated.internal_note).toBe("Follow up oleh tim sales.");

    await agent
      .delete(`/api/v1/admin/inquiries/${String(inquiryId)}`)
      .set("x-csrf-token", csrfToken)
      .expect(200);
    await agent.get(`/api/v1/admin/inquiries/${String(inquiryId)}`).expect(404);
  });

  it("supports admin WhatsApp lead list, detail, update, and archive", async () => {
    const listResponse = await agent
      .get("/api/v1/admin/whatsapp-leads")
      .query({ q: PREFIX, status: "new" })
      .expect(200);
    const list = data(listResponse.body);
    expect(list.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: whatsAppLeadId })]),
    );

    await agent.get(`/api/v1/admin/whatsapp-leads/${String(whatsAppLeadId)}`).expect(200);

    const updateResponse = await agent
      .patch(`/api/v1/admin/whatsapp-leads/${String(whatsAppLeadId)}`)
      .set("x-csrf-token", csrfToken)
      .send({
        status: "contacted",
        internal_note: "Sudah dihubungi via WhatsApp.",
      })
      .expect(200);
    const updated = data(updateResponse.body);
    expect(updated.status).toBe("contacted");
    expect(updated.internal_note).toBe("Sudah dihubungi via WhatsApp.");

    await agent
      .delete(`/api/v1/admin/whatsapp-leads/${String(whatsAppLeadId)}`)
      .set("x-csrf-token", csrfToken)
      .expect(200);
    await agent.get(`/api/v1/admin/whatsapp-leads/${String(whatsAppLeadId)}`).expect(404);
  });

  it("rate-limits public WhatsApp lead submission", async () => {
    for (let index = 0; index < 9; index += 1) {
      await request(httpServer)
        .post("/api/v1/public/whatsapp-leads")
        .send({
          name: `${PREFIX} Rate ${index}`,
          phone: "+62 813 1111 3333",
          message: `${PREFIX} rate limit ${index}`,
        })
        .expect(201);
    }

    const response = await request(httpServer)
      .post("/api/v1/public/whatsapp-leads")
      .send({
        name: `${PREFIX} Rate Blocked`,
        phone: "+62 813 1111 3333",
        message: `${PREFIX} rate limit blocked`,
      })
      .expect(429);

    expect(error(response.body).code).toBe("RATE_LIMITED");
  });
});
