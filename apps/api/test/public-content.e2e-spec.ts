import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { ContentStatus, MediaKind, MediaStatus } from "@prisma/client";
import type { Server } from "node:http";
import request from "supertest";
import { AppModule } from "@/app.module";
import { PrismaService } from "@/database/prisma.service";

const PREFIX = "phase5-public";

type TestMedia = {
  imageId: number;
  videoId: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getData(body: unknown): Record<string, unknown> {
  if (!isRecord(body) || !isRecord(body.data)) {
    throw new Error("Response data is missing.");
  }

  return body.data;
}

function getItems(data: Record<string, unknown>): unknown[] {
  if (!Array.isArray(data.items)) {
    throw new Error("Response data.items is missing.");
  }

  return data.items;
}

function getString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`${field} is not a string.`);
  }

  return value;
}

function getNullableString(value: unknown, field: string): string | null {
  if (value === null) {
    return null;
  }

  return getString(value, field);
}

function getRecordItemByField(
  items: unknown[],
  field: string,
  expected: string,
): Record<string, unknown> {
  const item = items.find((candidate) => isRecord(candidate) && candidate[field] === expected);

  if (!isRecord(item)) {
    throw new Error(`Item with ${field}=${expected} is missing.`);
  }

  return item;
}

async function cleanup(prisma: PrismaService): Promise<void> {
  await prisma.galleryItem.deleteMany({
    where: {
      caption: {
        startsWith: PREFIX,
      },
    },
  });
  await prisma.newsArticle.deleteMany({
    where: {
      slug: {
        startsWith: PREFIX,
      },
    },
  });
  await prisma.portfolio.deleteMany({
    where: {
      slug: {
        startsWith: PREFIX,
      },
    },
  });
  await prisma.portfolioCategory.deleteMany({
    where: {
      slug: {
        startsWith: PREFIX,
      },
    },
  });
  await prisma.heroSection.deleteMany({
    where: {
      title: {
        startsWith: PREFIX,
      },
    },
  });
  await prisma.partner.deleteMany({
    where: {
      name: {
        startsWith: PREFIX,
      },
    },
  });
  await prisma.productionStrength.deleteMany({
    where: {
      label: {
        startsWith: PREFIX,
      },
    },
  });
  await prisma.machine.deleteMany({
    where: {
      slug: {
        startsWith: PREFIX,
      },
    },
  });
  await prisma.printingCapacity.deleteMany({
    where: {
      label: {
        startsWith: PREFIX,
      },
    },
  });
  await prisma.productionCapacity.deleteMany({
    where: {
      product: {
        startsWith: PREFIX,
      },
    },
  });
  await prisma.serviceItem.deleteMany({
    where: {
      name: {
        startsWith: PREFIX,
      },
    },
  });
  await prisma.mediaFile.deleteMany({
    where: {
      originalFilename: {
        startsWith: PREFIX,
      },
    },
  });
}

async function createMedia(prisma: PrismaService): Promise<TestMedia> {
  const image = await prisma.mediaFile.create({
    data: {
      kind: MediaKind.IMAGE,
      status: MediaStatus.COMPLETED,
      originalFilename: `${PREFIX}-image.webp`,
      mimeType: "image/webp",
      extension: "webp",
      publicUrl: "https://media.indobraga.com/phase5/image.webp",
      thumbnailUrl: "https://media.indobraga.com/phase5/image-thumb.webp",
      mediumUrl: "https://media.indobraga.com/phase5/image-medium.webp",
      largeUrl: "https://media.indobraga.com/phase5/image-large.webp",
    },
  });
  const video = await prisma.mediaFile.create({
    data: {
      kind: MediaKind.VIDEO,
      status: MediaStatus.COMPLETED,
      originalFilename: `${PREFIX}-video.mp4`,
      mimeType: "video/mp4",
      extension: "mp4",
      publicUrl: "https://media.indobraga.com/phase5/video.mp4",
      thumbnailUrl: "https://media.indobraga.com/phase5/video-thumb.webp",
      posterUrl: "https://media.indobraga.com/phase5/video-poster.webp",
      videoUrl: "https://media.indobraga.com/phase5/video.mp4",
    },
  });

  return {
    imageId: image.id,
    videoId: video.id,
  };
}

async function createFixtures(prisma: PrismaService): Promise<void> {
  const media = await createMedia(prisma);
  const jerseyCategory = await prisma.portfolioCategory.create({
    data: {
      name: `${PREFIX} Jersey`,
      slug: `${PREFIX}-jersey`,
      sortOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  });
  const jaketCategory = await prisma.portfolioCategory.create({
    data: {
      name: `${PREFIX} Jaket`,
      slug: `${PREFIX}-jaket`,
      sortOrder: 2,
      status: ContentStatus.PUBLISHED,
    },
  });

  await prisma.heroSection.create({
    data: {
      title: `${PREFIX} Hero`,
      subtitle: "Homepage public test",
      ctaLabel: "Konsultasi Produksi",
      ctaHref: "/kontak",
      status: ContentStatus.PUBLISHED,
      slides: {
        create: [
          {
            title: `${PREFIX} Hero Slide`,
            label: "Sublim",
            metric: "90K pcs/bulan",
            altText: "Slide produksi Indobraga",
            mediaFileId: media.imageId,
            sortOrder: 1,
            status: ContentStatus.PUBLISHED,
          },
        ],
      },
    },
  });
  await prisma.partner.create({
    data: {
      name: `${PREFIX} Partner`,
      segment: "Corporate",
      logoMediaId: media.imageId,
      sortOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  });
  await prisma.productionStrength.createMany({
    data: [
      {
        label: `${PREFIX} Strength`,
        value: "90K",
        suffix: "pcs/bulan",
        sortOrder: 1,
        status: ContentStatus.PUBLISHED,
      },
      {
        label: `${PREFIX} Draft Strength`,
        value: "0",
        sortOrder: 2,
        status: ContentStatus.DRAFT,
      },
    ],
  });
  await prisma.portfolio.createMany({
    data: [
      {
        title: `${PREFIX} Jersey 1`,
        slug: `${PREFIX}-jersey-1`,
        category: jerseyCategory.name,
        categoryId: jerseyCategory.id,
        description: "Portofolio published pertama.",
        imageMediaId: media.imageId,
        featured: true,
        sortOrder: 1,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date("2026-05-01T00:00:00.000Z"),
      },
      {
        title: `${PREFIX} Jersey 2`,
        slug: `${PREFIX}-jersey-2`,
        category: jerseyCategory.name,
        categoryId: jerseyCategory.id,
        description: "Portofolio published kedua.",
        imageMediaId: media.imageId,
        featured: false,
        sortOrder: 2,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date("2026-05-02T00:00:00.000Z"),
      },
      {
        title: `${PREFIX} Jaket 1`,
        slug: `${PREFIX}-jaket-1`,
        category: jaketCategory.name,
        categoryId: jaketCategory.id,
        description: "Portofolio published kategori jaket.",
        imageMediaId: media.imageId,
        featured: false,
        sortOrder: 3,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date("2026-05-03T00:00:00.000Z"),
      },
      {
        title: `${PREFIX} Draft`,
        slug: `${PREFIX}-draft`,
        category: jerseyCategory.name,
        categoryId: jerseyCategory.id,
        description: "Portofolio draft.",
        imageMediaId: media.imageId,
        featured: false,
        sortOrder: 4,
        status: ContentStatus.DRAFT,
      },
    ],
  });
  await prisma.machine.createMany({
    data: [
      {
        name: `${PREFIX} Mesin Sublim`,
        slug: `${PREFIX}-mesin-sublim`,
        metric: "3 unit",
        description: "Mesin published.",
        imageMediaId: media.imageId,
        sortOrder: 1,
        status: ContentStatus.PUBLISHED,
      },
      {
        name: `${PREFIX} Mesin Draft`,
        slug: `${PREFIX}-mesin-draft`,
        metric: "0 unit",
        description: "Mesin draft.",
        sortOrder: 2,
        status: ContentStatus.DRAFT,
      },
    ],
  });
  await prisma.printingCapacity.create({
    data: {
      label: `${PREFIX} Kapasitas Printing`,
      value: "20K",
      unit: "meter/bulan",
      description: "Kapasitas published.",
      imageMediaId: media.imageId,
      sortOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  });
  await prisma.productionCapacity.create({
    data: {
      product: `${PREFIX} Jersey`,
      value: "90K",
      unit: "pcs/bulan",
      sortOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  });
  await prisma.serviceItem.create({
    data: {
      name: `${PREFIX} Cetak Kain Custom`,
      sortOrder: 1,
      status: ContentStatus.PUBLISHED,
    },
  });
  await prisma.galleryItem.createMany({
    data: [
      {
        type: MediaKind.IMAGE,
        caption: `${PREFIX} Galeri Image`,
        mediaFileId: media.imageId,
        sortOrder: 1,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date("2026-05-04T00:00:00.000Z"),
      },
      {
        type: MediaKind.VIDEO,
        caption: `${PREFIX} Galeri Video`,
        mediaFileId: media.videoId,
        posterMediaId: media.imageId,
        sortOrder: 2,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date("2026-05-05T00:00:00.000Z"),
      },
      {
        type: MediaKind.IMAGE,
        caption: `${PREFIX} Galeri Draft`,
        mediaFileId: media.imageId,
        sortOrder: 3,
        status: ContentStatus.DRAFT,
      },
    ],
  });
  await prisma.newsArticle.createMany({
    data: [
      {
        title: `${PREFIX} Berita 1`,
        slug: `${PREFIX}-berita-1`,
        category: `${PREFIX} Fasilitas`,
        excerpt: "Berita published pertama.",
        content: ["Paragraf berita pertama."],
        thumbnailMediaId: media.imageId,
        ogMediaId: media.imageId,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date("2026-05-06T00:00:00.000Z"),
        seoTitle: `${PREFIX} SEO Berita 1`,
        seoDescription: "SEO berita published pertama.",
      },
      {
        title: `${PREFIX} Berita 2`,
        slug: `${PREFIX}-berita-2`,
        category: `${PREFIX} Fasilitas`,
        excerpt: "Berita published kedua.",
        content: ["Paragraf berita kedua."],
        thumbnailMediaId: media.imageId,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date("2026-05-07T00:00:00.000Z"),
      },
      {
        title: `${PREFIX} Berita Draft`,
        slug: `${PREFIX}-berita-draft`,
        category: `${PREFIX} Fasilitas`,
        excerpt: "Berita draft.",
        content: ["Paragraf draft."],
        thumbnailMediaId: media.imageId,
        status: ContentStatus.DRAFT,
      },
    ],
  });
}

describe("Public Content API", () => {
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

    await cleanup(prisma);
    await createFixtures(prisma);
  });

  afterAll(async () => {
    await cleanup(prisma);
    await app.close();
  });

  it("returns public site settings with public cache", async () => {
    const response = await request(httpServer).get("/api/v1/public/site-settings").expect(200);
    const data = getData(response.body);

    expect(data.brand).toBe("Indobraga");
    expect(data).not.toHaveProperty("created_at");
    expect(response.headers["cache-control"]).toBe(
      "public, max-age=300, stale-while-revalidate=600",
    );
  });

  it("returns homepage content without draft items", async () => {
    const response = await request(httpServer).get("/api/v1/public/home").expect(200);
    const data = getData(response.body);
    const strengths = Array.isArray(data.strengths) ? data.strengths : [];
    const featuredPortfolios = Array.isArray(data.featured_portfolios)
      ? data.featured_portfolios
      : [];

    getRecordItemByField(strengths, "label", `${PREFIX} Strength`);
    getRecordItemByField(featuredPortfolios, "slug", `${PREFIX}-jersey-1`);
    expect(
      strengths.some((item) => isRecord(item) && item.label === `${PREFIX} Draft Strength`),
    ).toBe(false);
    expect(response.headers["cache-control"]).toBe(
      "public, max-age=60, stale-while-revalidate=300",
    );
  });

  it("returns cursor-paginated published portfolio", async () => {
    const firstPage = await request(httpServer)
      .get("/api/v1/public/portfolio")
      .query({ category_slug: `${PREFIX}-jersey`, limit: 1 })
      .expect(200);
    const firstData = getData(firstPage.body);
    const firstItems = getItems(firstData);
    const firstItem = getRecordItemByField(firstItems, "slug", `${PREFIX}-jersey-1`);

    expect(firstItem).not.toHaveProperty("status");
    expect(firstData.has_more).toBe(true);

    const nextCursor = getNullableString(firstData.next_cursor, "next_cursor");
    const secondPage = await request(httpServer)
      .get("/api/v1/public/portfolio")
      .query({ category_slug: `${PREFIX}-jersey`, limit: 2, cursor: nextCursor })
      .expect(200);
    const secondSlugs = getItems(getData(secondPage.body))
      .filter(isRecord)
      .map((item) => item.slug);

    expect(secondSlugs).toContain(`${PREFIX}-jersey-2`);
    expect(secondSlugs).not.toContain(`${PREFIX}-draft`);
  });

  it("returns published facilities only", async () => {
    const response = await request(httpServer).get("/api/v1/public/facilities").expect(200);
    const data = getData(response.body);
    const machines = Array.isArray(data.machines) ? data.machines : [];

    getRecordItemByField(machines, "slug", `${PREFIX}-mesin-sublim`);
    expect(machines.some((item) => isRecord(item) && item.slug === `${PREFIX}-mesin-draft`)).toBe(
      false,
    );
  });

  it("returns cursor-paginated gallery with type filter", async () => {
    const response = await request(httpServer)
      .get("/api/v1/public/gallery")
      .query({ type: "image", limit: 1 })
      .expect(200);
    const data = getData(response.body);
    const items = getItems(data);
    const item = getRecordItemByField(items, "caption", `${PREFIX} Galeri Image`);

    expect(item.type).toBe("image");
    expect(item).not.toHaveProperty("status");
    expect(
      items.some(
        (candidate) => isRecord(candidate) && candidate.caption === `${PREFIX} Galeri Draft`,
      ),
    ).toBe(false);
  });

  it("returns paginated news listing and published detail only", async () => {
    const listResponse = await request(httpServer)
      .get("/api/v1/public/news")
      .query({ category: `${PREFIX} Fasilitas`, page: 1, limit: 1 })
      .expect(200);
    const listData = getData(listResponse.body);
    const listItems = getItems(listData);
    const latestArticle = getRecordItemByField(listItems, "slug", `${PREFIX}-berita-2`);

    expect(latestArticle).not.toHaveProperty("content");
    expect(isRecord(listData.pagination) ? listData.pagination.total : 0).toBeGreaterThanOrEqual(2);

    const detailResponse = await request(httpServer)
      .get(`/api/v1/public/news/${PREFIX}-berita-1`)
      .expect(200);
    const detailData = getData(detailResponse.body);

    expect(detailData.slug).toBe(`${PREFIX}-berita-1`);
    expect(detailData.content).toEqual(["Paragraf berita pertama."]);
    expect(detailResponse.headers["cache-control"]).toBe(
      "public, max-age=300, stale-while-revalidate=600",
    );

    await request(httpServer).get(`/api/v1/public/news/${PREFIX}-berita-draft`).expect(404);
  });
});
