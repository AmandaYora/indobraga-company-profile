import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ContentStatus, MediaKind, MediaStatus, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "@/app.module";
import { MediaService } from "@/media/media.service";
import { PrismaService } from "@/database/prisma.service";

/**
 * End-to-end coverage for the fixes made after the Elcodelabs QA report
 * (IB-01 ... IB-17), run against the real database. The "last active account" guard is
 * covered by unit tests: exercising it here would disable other suites' users.
 */
const PREFIX = "qa-hardening";
const SUPER_EMAIL = "qa-hardening-super@indobraga.local";
const EDITOR_EMAIL = "qa-hardening-editor@indobraga.local";
const PASSWORD = "QaHardening123!";
const CSRF_COOKIE_NAME = "indobraga_csrf";

type Session = { agent: ReturnType<typeof request.agent>; csrfToken: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function data(body: unknown): Record<string, unknown> {
  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Response data is missing.");
  }
  return body.data;
}

function errorOf(body: unknown): Record<string, unknown> {
  if (!isRecord(body) || !isRecord(body.error)) {
    throw new Error("Response error is missing.");
  }
  return body.error;
}

function csrfFrom(headers: Record<string, unknown>): string {
  const raw = headers["set-cookie"];
  const cookies = Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
  const cookie = cookies.find((value) => value.startsWith(`${CSRF_COOKIE_NAME}=`));
  const token = cookie?.split(";")[0]?.slice(CSRF_COOKIE_NAME.length + 1);
  if (!token) {
    throw new Error("CSRF token is missing.");
  }
  return token;
}

async function login(server: Server, email: string): Promise<Session> {
  const agent = request.agent(server);
  const response = await agent.post("/api/v1/auth/login").send({ email, password: PASSWORD });
  expect(response.status).toBe(200);
  return { agent, csrfToken: csrfFrom(response.headers) };
}

async function cleanup(prisma: PrismaService): Promise<void> {
  await prisma.partner.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.portfolio.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.portfolioCategory.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.newsArticle.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.heroSection.deleteMany({ where: { title: { startsWith: PREFIX } } });
  await prisma.emailTemplate.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.mediaFile.deleteMany({ where: { originalFilename: { startsWith: PREFIX } } });
  await prisma.revalidationEvent.deleteMany({
    where: { cacheKey: { startsWith: "qa-hardening" } },
  });
  await prisma.adminSession.deleteMany({
    where: { user: { email: { in: [SUPER_EMAIL, EDITOR_EMAIL] } } },
  });
  await prisma.auditLog.deleteMany({
    where: { actor: { email: { in: [SUPER_EMAIL, EDITOR_EMAIL] } } },
  });
  await prisma.user.deleteMany({ where: { email: { in: [SUPER_EMAIL, EDITOR_EMAIL] } } });
}

describe("QA hardening (Elcodelabs report)", () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let media: MediaService;
  let admin: Session;
  let editor: Session;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api/v1");
    await app.init();
    server = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);
    media = app.get(MediaService);

    await cleanup(prisma);
    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    await prisma.user.createMany({
      data: [
        {
          name: "QA Super",
          email: SUPER_EMAIL,
          passwordHash,
          role: UserRole.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
        {
          name: "QA Editor",
          email: EDITOR_EMAIL,
          passwordHash,
          role: UserRole.CONTENT_EDITOR,
          status: UserStatus.ACTIVE,
        },
      ],
    });
    admin = await login(server, SUPER_EMAIL);
    editor = await login(server, EDITOR_EMAIL);
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  it("IB-03: refuses javascript: as a hero button link but accepts safe ones", async () => {
    const bad = await admin.agent
      .post("/api/v1/admin/hero")
      .set("x-csrf-token", admin.csrfToken)
      .send({
        title: `${PREFIX} Hero XSS`,
        cta_label: "Klik",
        cta_href: "javascript:window.__qaXss=1",
      });
    expect(bad.status).toBe(400);
    expect(JSON.stringify(errorOf(bad.body).details)).toContain("cta_href");

    const good = await admin.agent
      .post("/api/v1/admin/hero")
      .set("x-csrf-token", admin.csrfToken)
      .send({
        title: `${PREFIX} Hero OK`,
        cta_label: "Kontak",
        cta_href: "/kontak",
        status: "draft",
      });
    expect(good.status).toBe(201);
    expect(data(good.body).cta_href).toBe("/kontak");
  });

  it("IB-06/IB-10: a logo-less client cannot be published and the error names the field", async () => {
    const response = await admin.agent
      .post("/api/v1/admin/partners")
      .set("x-csrf-token", admin.csrfToken)
      .send({ name: `${PREFIX} Klien`, status: "published" });

    expect(response.status).toBe(422);
    expect(errorOf(response.body).details).toEqual([
      expect.objectContaining({ field: "logo_media_id" }),
    ]);

    const draft = await admin.agent
      .post("/api/v1/admin/partners")
      .set("x-csrf-token", admin.csrfToken)
      .send({ name: `${PREFIX} Klien Draf` });
    expect(draft.status).toBe(201);
    expect(data(draft.body).status).toBe("draft");

    // Toggling it live from the list is blocked as well.
    const toggle = await admin.agent
      .patch(`/api/v1/admin/partners/${String(data(draft.body).id)}/status`)
      .set("x-csrf-token", admin.csrfToken)
      .send({ status: "published" });
    expect(toggle.status).toBe(422);
  });

  it("IB-10: empty required fields come back as per-field details", async () => {
    const response = await admin.agent
      .post("/api/v1/admin/partners")
      .set("x-csrf-token", admin.csrfToken)
      .send({});

    expect(response.status).toBe(400);
    expect(errorOf(response.body).details).toEqual([
      { field: "name", message: "Nama wajib diisi." },
    ]);
  });

  it("IB-04: global search finds content and respects permissions", async () => {
    await prisma.newsArticle.create({
      data: {
        title: `${PREFIX} Persib Juara`,
        slug: `${PREFIX}-persib-juara`,
        category: "Berita",
        excerpt: "Ringkasan",
        content: [],
        status: ContentStatus.PUBLISHED,
      },
    });

    const found = await admin.agent.get("/api/v1/admin/search").query({ q: "Persib Juara" });
    expect(found.status).toBe(200);
    expect(JSON.stringify(data(found.body).groups)).toContain(`${PREFIX} Persib Juara`);
    expect(data(found.body).total).toBeGreaterThanOrEqual(1);

    const tooShort = await admin.agent.get("/api/v1/admin/search").query({ q: "a" });
    expect(tooShort.status).toBe(400);

    const unauthenticated = await request(server)
      .get("/api/v1/admin/search")
      .query({ q: "Persib" });
    expect(unauthenticated.status).toBe(401);
  });

  it("IB-14/IB-15: unknown portfolio slug is a real 404, a published one has SEO fields", async () => {
    const category = await prisma.portfolioCategory.create({
      data: { name: `${PREFIX} Jersey`, slug: `${PREFIX}-jersey`, status: ContentStatus.PUBLISHED },
    });
    await prisma.portfolio.create({
      data: {
        title: `${PREFIX} Jersey Klub`,
        slug: `${PREFIX}-jersey-klub`,
        category: category.name,
        categoryId: category.id,
        description: "Jersey custom",
        status: ContentStatus.PUBLISHED,
        seoTitle: "Judul Google Jersey",
        seoDescription: "Deskripsi Google Jersey",
      },
    });
    await prisma.portfolio.create({
      data: {
        title: `${PREFIX} Draf`,
        slug: `${PREFIX}-draf`,
        category: category.name,
        categoryId: category.id,
        status: ContentStatus.DRAFT,
      },
    });

    const ok = await request(server).get(`/api/v1/public/portfolio/${PREFIX}-jersey-klub`);
    expect(ok.status).toBe(200);
    expect(data(ok.body).seo).toMatchObject({
      title: "Judul Google Jersey",
      description: "Deskripsi Google Jersey",
    });

    expect((await request(server).get("/api/v1/public/portfolio/slug-acak")).status).toBe(404);
    expect((await request(server).get(`/api/v1/public/portfolio/${PREFIX}-draf`)).status).toBe(404);

    const sitemap = await request(server).get("/api/v1/sitemap.xml");
    expect(sitemap.text).toContain(`/portfolio/${PREFIX}-jersey-klub`);
    expect(sitemap.text).not.toContain(`/portfolio/${PREFIX}-draf`);
  });

  it("IB-02: stored email template HTML has event handlers and scripts removed", async () => {
    const response = await admin.agent
      .post("/api/v1/admin/email-templates")
      .set("x-csrf-token", admin.csrfToken)
      .send({
        name: `${PREFIX} Template`,
        subject: "Tes {{nama}}",
        content_mode: "html",
        body_html:
          "<p>Halo {{nama}}</p><img src=x onerror=window.__qaXss=1><script>alert(1)</script>",
      });

    expect(response.status).toBe(201);
    const html = String(data(response.body).body_html);
    expect(html).toContain("Halo {{nama}}");
    expect(html).not.toMatch(/onerror|<script|__qaXss/i);
  });

  it("IB-09: sweeps aged orphan uploads but keeps referenced and recent ones", async () => {
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const baseMedia = {
      kind: MediaKind.IMAGE,
      status: MediaStatus.COMPLETED,
      mimeType: "image/webp",
      extension: "webp",
    };
    const orphan = await prisma.mediaFile.create({
      data: { ...baseMedia, originalFilename: `${PREFIX}-orphan.webp`, createdAt: old },
    });
    const recent = await prisma.mediaFile.create({
      data: { ...baseMedia, originalFilename: `${PREFIX}-recent.webp` },
    });
    const used = await prisma.mediaFile.create({
      data: { ...baseMedia, originalFilename: `${PREFIX}-used.webp`, createdAt: old },
    });
    await prisma.partner.create({
      data: { name: `${PREFIX} Berlogo`, logoMediaId: used.id, status: ContentStatus.PUBLISHED },
    });

    const summary = await media.cleanupOrphans(500);

    expect(summary.deleted).toBeGreaterThanOrEqual(1);
    expect(await prisma.mediaFile.findUnique({ where: { id: orphan.id } })).toBeNull();
    expect(await prisma.mediaFile.findUnique({ where: { id: recent.id } })).not.toBeNull();
    expect(await prisma.mediaFile.findUnique({ where: { id: used.id } })).not.toBeNull();
  });

  it("IB-08: an editor cannot administer users, settings, senders or send mail", async () => {
    const me = await editor.agent.get("/api/v1/auth/me");
    expect(me.status).toBe(200);
    const permissions = (data(me.body).user as { permissions: string[] }).permissions;
    for (const forbidden of [
      "users.manage",
      "site_settings.manage",
      "email_accounts.manage",
      "email_campaigns.send",
    ]) {
      expect(permissions).not.toContain(forbidden);
    }
    expect(permissions).toContain("content.manage");

    expect((await editor.agent.get("/api/v1/admin/users")).status).toBe(403);
    expect((await editor.agent.get("/api/v1/admin/site-settings")).status).toBe(403);
  });
});
