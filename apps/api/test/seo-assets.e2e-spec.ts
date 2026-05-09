import { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { ContentStatus, RevalidationStatus } from "@prisma/client";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "@/app.module";
import type { Env } from "@/config/env";
import { PrismaService } from "@/database/prisma.service";

const PREFIX = "phase11-seo";

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
  await prisma.revalidationEvent.deleteMany({
    where: { cacheKey: { startsWith: PREFIX } },
  });
  await prisma.newsArticle.deleteMany({ where: { slug: { startsWith: PREFIX } } });
}

describe("SEO assets and revalidation", () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;
  let workerSecret: string;

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
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  it("serves robots.txt with public cache headers", async () => {
    const response = await request(httpServer).get("/api/v1/robots.txt").expect(200);

    expect(response.headers["cache-control"]).toContain("public");
    expect(response.text).toContain("Disallow: /admin");
    expect(response.text).toContain("Disallow: /api/");
    expect(response.text).toContain("Sitemap: https://indobraga.com/sitemap.xml");
  });

  it("builds a dynamic sitemap from published content only", async () => {
    const published = await prisma.newsArticle.create({
      data: {
        title: `${PREFIX} Published`,
        slug: `${PREFIX}-published`,
        category: "Fasilitas",
        excerpt: "Published sitemap article.",
        content: ["Published content."],
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
    await prisma.newsArticle.create({
      data: {
        title: `${PREFIX} Draft`,
        slug: `${PREFIX}-draft`,
        category: "Fasilitas",
        excerpt: "Draft sitemap article.",
        content: ["Draft content."],
        status: ContentStatus.DRAFT,
      },
    });

    const first = await request(httpServer).get("/api/v1/sitemap.xml").expect(200);
    expect(first.headers["cache-control"]).toContain("public");
    expect(first.text).toContain("/berita/phase11-seo-published");
    expect(first.text).not.toContain("/berita/phase11-seo-draft");
    expect(first.text).not.toContain("/admin");
    expect(first.text).not.toContain("/api/");

    await prisma.newsArticle.update({
      where: { id: published.id },
      data: { slug: `${PREFIX}-updated` },
    });
    const slugUpdated = await request(httpServer).get("/api/v1/sitemap.xml").expect(200);
    expect(slugUpdated.text).toContain("/berita/phase11-seo-updated");
    expect(slugUpdated.text).not.toContain("/berita/phase11-seo-published");

    await prisma.newsArticle.update({
      where: { id: published.id },
      data: { status: ContentStatus.DRAFT },
    });
    const unpublished = await request(httpServer).get("/api/v1/sitemap.xml").expect(200);
    expect(unpublished.text).not.toContain("/berita/phase11-seo-updated");
  });

  it("returns route SEO metadata without exposing draft content", async () => {
    const article = await prisma.newsArticle.create({
      data: {
        title: `${PREFIX} News SEO`,
        slug: `${PREFIX}-news-seo`,
        category: "Fasilitas",
        excerpt: "SEO article excerpt.",
        content: ["SEO content."],
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        seoTitle: `${PREFIX} SEO Title`,
        seoDescription: `${PREFIX} SEO Description`,
      },
    });

    const homeResponse = await request(httpServer).get("/api/v1/public/seo/home").expect(200);
    expect(data(homeResponse.body).canonical_url).toBe("https://indobraga.com");

    const newsRoute = encodeURIComponent(`berita:${article.slug}`);
    const newsResponse = await request(httpServer)
      .get(`/api/v1/public/seo/${newsRoute}`)
      .expect(200);
    expect(data(newsResponse.body).title).toBe(`${PREFIX} SEO Title`);
    expect(data(newsResponse.body).canonical_url).toContain(`/berita/${article.slug}`);

    await prisma.newsArticle.update({
      where: { id: article.id },
      data: { status: ContentStatus.DRAFT },
    });
    await request(httpServer).get(`/api/v1/public/seo/${newsRoute}`).expect(404);
  });

  it("processes revalidation events idempotently through an internal tick", async () => {
    await prisma.revalidationEvent.createMany({
      data: [
        { resourceType: "test", cacheKey: `${PREFIX}:home` },
        { resourceType: "test", cacheKey: `${PREFIX}:sitemap` },
      ],
    });

    await request(httpServer).post("/api/v1/internal/revalidation/tick").expect(401);

    const response = await request(httpServer)
      .post("/api/v1/internal/revalidation/tick")
      .set("x-internal-worker-secret", workerSecret)
      .expect(201);
    expect(data(response.body).processed).toBeGreaterThanOrEqual(2);

    const second = await request(httpServer)
      .post("/api/v1/internal/revalidation/tick")
      .set("x-internal-worker-secret", workerSecret)
      .expect(201);
    expect(typeof data(second.body).processed).toBe("number");

    const pendingPrefixEvents = await prisma.revalidationEvent.count({
      where: {
        cacheKey: { startsWith: PREFIX },
        status: RevalidationStatus.PENDING,
      },
    });
    expect(pendingPrefixEvents).toBe(0);
  });
});
