import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ContentStatus, MediaKind, MediaStatus, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "@/app.module";
import { PrismaService } from "@/database/prisma.service";

const PREFIX = "phase6-admin";
const SUPER_EMAIL = "phase6-super@indobraga.local";
const EDITOR_EMAIL = "phase6-editor@indobraga.local";
const PASSWORD = "Phase6Admin123!";
const CSRF_COOKIE_NAME = "indobraga_csrf";

type AgentWithCsrf = {
  agent: ReturnType<typeof request.agent>;
  csrfToken: string;
};

type ResourceCase = {
  path: string;
  payload: Record<string, unknown>;
  listQuery?: Record<string, unknown>;
  statusBody?: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function bodyData(body: unknown): Record<string, unknown> {
  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Response data is missing.");
  }

  return body.data;
}

function bodyError(body: unknown): Record<string, unknown> {
  if (!isRecord(body) || !isRecord(body.error)) {
    throw new Error("Response error is missing.");
  }

  return body.error;
}

function responseId(body: unknown): number {
  const data = bodyData(body);
  if (typeof data.id !== "number") {
    throw new Error("Response data.id is missing.");
  }

  return data.id;
}

function setCookies(headers: Record<string, unknown>): string[] {
  const raw = headers["set-cookie"];
  return Array.isArray(raw)
    ? raw.filter((value): value is string => typeof value === "string")
    : [];
}

function csrfFrom(headers: Record<string, unknown>): string {
  const cookie = setCookies(headers).find((value) => value.startsWith(`${CSRF_COOKIE_NAME}=`));
  const token = cookie?.split(";")[0]?.slice(CSRF_COOKIE_NAME.length + 1);

  if (!token) {
    throw new Error("CSRF token is missing.");
  }

  return token;
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
  await prisma.revalidationEvent.deleteMany({
    where: {
      resourceType: {
        in: [
          "hero",
          "hero-slides",
          "partners",
          "production-strengths",
          "portfolios",
          "machines",
          "printing-capacities",
          "production-capacities",
          "services",
          "gallery-items",
          "news",
        ],
      },
    },
  });
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { actor: { email: { in: [SUPER_EMAIL, EDITOR_EMAIL] } } },
        {
          resourceType: {
            in: [
              "hero",
              "hero-slides",
              "partners",
              "production-strengths",
              "portfolios",
              "machines",
              "printing-capacities",
              "production-capacities",
              "services",
              "gallery-items",
              "news",
            ],
          },
        },
      ],
    },
  });
  await prisma.galleryItem.deleteMany({ where: { caption: { startsWith: PREFIX } } });
  await prisma.newsArticle.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.portfolio.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.portfolioCategory.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.machine.deleteMany({ where: { slug: { startsWith: PREFIX } } });
  await prisma.printingCapacity.deleteMany({ where: { label: { startsWith: PREFIX } } });
  await prisma.productionCapacity.deleteMany({ where: { product: { startsWith: PREFIX } } });
  await prisma.serviceItem.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.productionStrength.deleteMany({ where: { label: { startsWith: PREFIX } } });
  await prisma.partner.deleteMany({ where: { name: { startsWith: PREFIX } } });
  await prisma.heroSection.deleteMany({ where: { title: { startsWith: PREFIX } } });
  await prisma.mediaFile.deleteMany({ where: { originalFilename: { startsWith: PREFIX } } });
  await prisma.adminSession.deleteMany({
    where: { user: { email: { in: [SUPER_EMAIL, EDITOR_EMAIL] } } },
  });
  await prisma.user.deleteMany({ where: { email: { in: [SUPER_EMAIL, EDITOR_EMAIL] } } });
}

async function seedUsers(prisma: PrismaService): Promise<void> {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  await prisma.user.createMany({
    data: [
      {
        name: "Phase 6 Super Admin",
        email: SUPER_EMAIL,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
      },
      {
        name: "Phase 6 Content Editor",
        email: EDITOR_EMAIL,
        passwordHash,
        role: UserRole.CONTENT_EDITOR,
        status: UserStatus.ACTIVE,
      },
    ],
  });
}

async function seedMedia(prisma: PrismaService): Promise<number> {
  const media = await prisma.mediaFile.create({
    data: {
      kind: MediaKind.IMAGE,
      status: MediaStatus.COMPLETED,
      originalFilename: `${PREFIX}-image.webp`,
      mimeType: "image/webp",
      extension: "webp",
      publicUrl: "https://media.indobraga.com/phase6/image.webp",
      thumbnailUrl: "https://media.indobraga.com/phase6/image-thumb.webp",
      mediumUrl: "https://media.indobraga.com/phase6/image-medium.webp",
      largeUrl: "https://media.indobraga.com/phase6/image-large.webp",
    },
  });

  return media.id;
}

describe("Admin Content API", () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;
  let mediaId: number;
  let heroId: number;
  let categoryId: number;
  let originalSeoTitle: string | null;

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
    await seedUsers(prisma);
    mediaId = await seedMedia(prisma);
    const category = await prisma.portfolioCategory.create({
      data: {
        name: `${PREFIX} Jersey`,
        slug: `${PREFIX}-jersey`,
        sortOrder: 1,
        status: ContentStatus.PUBLISHED,
      },
    });
    categoryId = category.id;
    originalSeoTitle =
      (await prisma.siteSettings.findUnique({ where: { id: 1 } }))?.seoTitle ?? null;
  });

  afterAll(async () => {
    await prisma.siteSettings.update({
      where: { id: 1 },
      data: { seoTitle: originalSeoTitle },
    });
    await cleanup(prisma);
    await app.close();
  });

  it("allows content editors to manage site-wide settings", async () => {
    const editor = await login(httpServer, EDITOR_EMAIL);

    const detailResponse = await editor.agent.get("/api/v1/admin/site-settings").expect(200);
    expect(bodyData(detailResponse.body).brand).toEqual(expect.any(String));

    const updateResponse = await editor.agent
      .patch("/api/v1/admin/site-settings")
      .set("x-csrf-token", editor.csrfToken)
      .send({ seo_title: `${PREFIX} Editor SEO` })
      .expect(200);
    expect(bodyData(updateResponse.body).seo_title).toBe(`${PREFIX} Editor SEO`);
  });

  it("allows super admin to update site settings and queues revalidation", async () => {
    const admin = await login(httpServer, SUPER_EMAIL);
    const response = await admin.agent
      .patch("/api/v1/admin/site-settings")
      .set("x-csrf-token", admin.csrfToken)
      .send({ seo_title: `${PREFIX} SEO` })
      .expect(200);

    expect(bodyData(response.body).seo_title).toBe(`${PREFIX} SEO`);
    expect(response.headers["cache-control"]).toBe("no-store");

    const events = await prisma.revalidationEvent.count({
      where: { resourceType: "site-settings" },
    });
    expect(events).toBeGreaterThan(0);
  });

  it("supports CRUD/status/reorder pattern for main content resources", async () => {
    const editor = await login(httpServer, EDITOR_EMAIL);
    const heroResponse = await editor.agent
      .post("/api/v1/admin/hero")
      .set("x-csrf-token", editor.csrfToken)
      .send({ title: `${PREFIX} Hero`, subtitle: "Admin content e2e", status: "published" })
      .expect(201);
    heroId = responseId(heroResponse.body);

    const cases: ResourceCase[] = [
      {
        path: "hero-slides",
        payload: {
          hero_section_id: heroId,
          title: `${PREFIX} Hero Slide`,
          label: "Slide",
          media_file_id: mediaId,
          status: "published",
        },
      },
      {
        path: "partners",
        payload: { name: `${PREFIX} Partner`, logo_media_id: mediaId, status: "published" },
      },
      {
        path: "production-strengths",
        payload: { label: `${PREFIX} Strength`, value: "90K", status: "published" },
      },
      {
        path: "portfolios",
        payload: {
          title: `${PREFIX} Portfolio`,
          category_id: categoryId,
          media_file_id: mediaId,
          short_description: "Portfolio admin e2e",
          is_featured: true,
          status: "published",
        },
        listQuery: { q: PREFIX, category: `${PREFIX}-jersey` },
      },
      {
        path: "machines",
        payload: { name: `${PREFIX} Machine`, media_file_id: mediaId, status: "published" },
      },
      {
        path: "printing-capacities",
        payload: { label: `${PREFIX} Print`, value: "20K", unit: "meter", status: "published" },
      },
      {
        path: "production-capacities",
        payload: { product: `${PREFIX} Jersey`, value: "90K", unit: "pcs", status: "published" },
      },
      {
        path: "services",
        payload: { name: `${PREFIX} Service`, sort_order: 5, status: "published" },
      },
      {
        path: "gallery-items",
        payload: {
          media_file_id: mediaId,
          media_type: "image",
          caption: `${PREFIX} Gallery`,
          status: "published",
        },
      },
      {
        path: "news",
        payload: {
          title: `${PREFIX} News`,
          category: "Fasilitas",
          excerpt: "News admin e2e",
          content: ["Paragraf admin content."],
          thumbnail_media_file_id: mediaId,
          status: "published",
        },
      },
    ];

    for (const item of cases) {
      const payload = { ...item.payload };
      if ("media_file_id" in payload) {
        payload.media_file_id = await seedMedia(prisma);
      }
      if ("logo_media_id" in payload) {
        payload.logo_media_id = await seedMedia(prisma);
      }
      if ("thumbnail_media_file_id" in payload) {
        payload.thumbnail_media_file_id = await seedMedia(prisma);
      }

      const createResponse = await editor.agent
        .post(`/api/v1/admin/${item.path}`)
        .set("x-csrf-token", editor.csrfToken)
        .send(payload)
        .expect(201);
      const id = responseId(createResponse.body);

      await editor.agent
        .get(`/api/v1/admin/${item.path}`)
        .query(item.listQuery ?? { q: PREFIX })
        .expect(200);
      await editor.agent.get(`/api/v1/admin/${item.path}/${id}`).expect(200);
      await editor.agent
        .patch(`/api/v1/admin/${item.path}/${id}/status`)
        .set("x-csrf-token", editor.csrfToken)
        .send({ status: "inactive" })
        .expect(200);
      await editor.agent
        .delete(`/api/v1/admin/${item.path}/${id}`)
        .set("x-csrf-token", editor.csrfToken)
        .expect(200);
    }

    const auditCount = await prisma.auditLog.count({
      where: { actor: { email: EDITOR_EMAIL } },
    });
    const revalidationCount = await prisma.revalidationEvent.count({
      where: { resourceType: { in: cases.map((item) => item.path) } },
    });

    expect(auditCount).toBeGreaterThanOrEqual(cases.length);
    expect(revalidationCount).toBeGreaterThanOrEqual(cases.length);
  });

  it("rejects publishing portfolio without completed media", async () => {
    const editor = await login(httpServer, EDITOR_EMAIL);
    const response = await editor.agent
      .post("/api/v1/admin/portfolios")
      .set("x-csrf-token", editor.csrfToken)
      .send({
        title: `${PREFIX} Invalid Portfolio`,
        category_id: categoryId,
        status: "published",
      })
      .expect(422);

    expect(bodyError(response.body).code).toBe("UNPROCESSABLE_ENTITY");
  });
});
