import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ContentStatus, MediaKind, MediaStatus } from "@prisma/client";
import { encodeCursor } from "@/core/pagination";
import { PublicContentService } from "@/public-content/public-content.service";

const now = new Date("2026-05-11T00:00:00.000Z");

const firstMockArg = <T>(mock: jest.Mock): T => {
  const calls = mock.mock.calls as unknown[][];
  return calls[0]?.[0] as T;
};

const prismaMock = () => ({
  $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
  siteSettings: {
    findUnique: jest.fn(),
  },
  heroSection: {
    findFirst: jest.fn(),
  },
  partner: {
    findMany: jest.fn(),
  },
  productionStrength: {
    findMany: jest.fn(),
  },
  portfolio: {
    findMany: jest.fn(),
  },
  machine: {
    findMany: jest.fn(),
  },
  printingCapacity: {
    findMany: jest.fn(),
  },
  productionCapacity: {
    findMany: jest.fn(),
  },
  serviceItem: {
    findMany: jest.fn(),
  },
  galleryItem: {
    findMany: jest.fn(),
  },
  newsArticle: {
    count: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
});

const configMock = () => ({
  get: jest.fn((key: string) =>
    key === "PUBLIC_SITE_URL" ? "https://indobraga.example.test" : undefined,
  ),
});

const media = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  kind: MediaKind.IMAGE,
  status: MediaStatus.COMPLETED,
  originalFilename: "asset.png",
  mimeType: "image/png",
  extension: "png",
  objectKey: "upload/test/asset.webp",
  publicUrl: "https://cdn.example.test/asset.webp",
  thumbnailUrl: "https://cdn.example.test/asset-thumb.webp",
  mediumUrl: "https://cdn.example.test/asset-medium.webp",
  largeUrl: "https://cdn.example.test/asset-large.webp",
  posterUrl: null,
  videoUrl: null,
  sizeOriginalBytes: BigInt(120),
  sizeFinalBytes: BigInt(80),
  width: 1200,
  height: 630,
  durationSeconds: null,
  errorMessage: null,
  createdById: 1,
  variants: {},
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const portfolioRow = (overrides: Record<string, unknown> = {}) => ({
  id: 21,
  title: "Kaos Event",
  slug: "kaos-event",
  category: "Kaos",
  description: "Produksi kaos event",
  sortOrder: 1,
  imageMedia: media(),
  ...overrides,
});

const newsRow = (overrides: Record<string, unknown> = {}) => ({
  id: 31,
  title: "Berita Produksi",
  slug: "berita-produksi",
  category: "Produksi",
  excerpt: "Update produksi",
  thumbnailMedia: media(),
  publishedAt: now,
  ...overrides,
});

describe("PublicContentService", () => {
  it("presents site settings with completed OG media fallback", async () => {
    const prisma = prismaMock();
    prisma.siteSettings.findUnique.mockResolvedValue({
      id: 1,
      brand: "Indobraga",
      legalName: "PT Braga Indonesia Perkasa",
      email: "support@indobraga.com",
      phone: "0851",
      whatsapp: "62851",
      instagram: "indobraga",
      contactPerson: "Dika",
      contactRole: "Marketing",
      address: "Bandung",
      seoTitle: "Indobraga Garment",
      seoDescription: "Konveksi Bandung",
      ogMediaFile: media({ largeUrl: null, mediumUrl: "https://cdn.example.test/og-medium.webp" }),
    });
    const service = new PublicContentService(prisma as never, configMock() as never);

    await expect(service.getSiteSettings()).resolves.toEqual({
      brand: "Indobraga",
      legal_name: "PT Braga Indonesia Perkasa",
      email: "support@indobraga.com",
      phone: "0851",
      whatsapp: "62851",
      instagram: "indobraga",
      contact_person: "Dika",
      contact_role: "Marketing",
      address: "Bandung",
      seo: {
        title: "Indobraga Garment",
        description: "Konveksi Bandung",
        og_image_url: "https://cdn.example.test/og-medium.webp",
      },
    });
  });

  it("throws not found when public site settings are missing", async () => {
    const prisma = prismaMock();
    prisma.siteSettings.findUnique.mockResolvedValue(null);
    const service = new PublicContentService(prisma as never, configMock() as never);

    await expect(service.getSiteSettings()).rejects.toBeInstanceOf(NotFoundException);
  });

  it("projects home content from published records only", async () => {
    const prisma = prismaMock();
    prisma.heroSection.findFirst.mockResolvedValue({
      id: 1,
      title: "Produksi Garment",
      subtitle: "Vendor konveksi Bandung",
      ctaLabel: "Hubungi Kami",
      ctaHref: "/kontak",
      slides: [
        {
          id: 11,
          label: "Workshop",
          title: "Tim Produksi",
          metric: "500 pcs/hari",
          altText: null,
          mediaFile: media(),
        },
      ],
    });
    prisma.partner.findMany.mockResolvedValue([
      { id: 2, name: "Brand A", segment: "Retail", logoMedia: media() },
    ]);
    prisma.productionStrength.findMany.mockResolvedValue([
      { id: 3, label: "Kapasitas", value: "10K", suffix: "pcs" },
    ]);
    prisma.portfolio.findMany.mockResolvedValue([portfolioRow()]);
    prisma.machine.findMany.mockResolvedValue([
      {
        id: 4,
        name: "Mesin Jahit",
        slug: "mesin-jahit",
        metric: "24 unit",
        description: "Line produksi",
        imageMedia: media(),
      },
    ]);
    prisma.printingCapacity.findMany.mockResolvedValue([
      {
        id: 5,
        label: "Sablon",
        value: "1000",
        unit: "pcs",
        description: "Per hari",
        imageMedia: media(),
      },
    ]);
    prisma.productionCapacity.findMany.mockResolvedValue([
      { id: 6, product: "Kaos", value: "500", unit: "pcs/hari" },
    ]);
    prisma.serviceItem.findMany.mockResolvedValue([{ id: 7, name: "Cut Make Trim" }]);
    prisma.newsArticle.findMany.mockResolvedValue([newsRow()]);
    const service = new PublicContentService(prisma as never, configMock() as never);

    await expect(service.getHome()).resolves.toMatchObject({
      hero: {
        title: "Produksi Garment",
        primary_cta: { label: "Hubungi Kami", url: "/kontak" },
        slides: [
          { alt_text: "Tim Produksi", image_url: "https://cdn.example.test/asset-large.webp" },
        ],
      },
      partners: [{ logo_url: "https://cdn.example.test/asset-large.webp", name: "Brand A" }],
      featured_portfolios: [
        { slug: "kaos-event", thumbnail_url: "https://cdn.example.test/asset-thumb.webp" },
      ],
      facilities_summary: {
        machines: [
          { image_url: "https://cdn.example.test/asset-medium.webp", name: "Mesin Jahit" },
        ],
        printing_capacities: [
          { image_url: "https://cdn.example.test/asset-medium.webp", label: "Sablon" },
        ],
        production_capacities: [{ product: "Kaos" }],
        services: [{ name: "Cut Make Trim" }],
      },
      latest_news: [{ slug: "berita-produksi" }],
    });
  });

  it("applies portfolio category and cursor filters while exposing the next cursor", async () => {
    const prisma = prismaMock();
    prisma.portfolio.findMany.mockResolvedValue([
      portfolioRow({ id: 21, sortOrder: 2 }),
      portfolioRow({ id: 22, sortOrder: 3, slug: "kaos-kedua" }),
      portfolioRow({ id: 23, sortOrder: 4, slug: "kaos-ketiga" }),
    ]);
    const service = new PublicContentService(prisma as never, configMock() as never);
    const cursor = encodeCursor({ sort_order: 1, id: 20 });

    await expect(
      service.getPortfolio({ category: "Kaos", cursor, limit: 2 }),
    ).resolves.toMatchObject({
      items: [{ id: 21 }, { id: 22 }],
      has_more: true,
      next_cursor: encodeCursor({ sort_order: 3, id: 22 }),
    });

    const findManyArg = firstMockArg<{ where: Record<string, unknown>; take: number }>(
      prisma.portfolio.findMany,
    );
    expect(findManyArg.take).toBe(3);
    expect(findManyArg.where).toMatchObject({
      category: "Kaos",
      status: ContentStatus.PUBLISHED,
      OR: [{ sortOrder: { gt: 1 } }, { sortOrder: 1, id: { gt: 20 } }],
    });
  });

  it("rejects sort cursors that do not contain numeric sort order and id", async () => {
    const prisma = prismaMock();
    const service = new PublicContentService(prisma as never, configMock() as never);

    await expect(
      service.getPortfolio({
        cursor: encodeCursor({ sort_order: "1", id: 20 }),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.portfolio.findMany).not.toHaveBeenCalled();
  });

  it("presents gallery video items using poster thumbnail fallback", async () => {
    const prisma = prismaMock();
    prisma.galleryItem.findMany.mockResolvedValue([
      {
        id: 41,
        type: MediaKind.VIDEO,
        caption: "Video produksi",
        publishedAt: now,
        sortOrder: 1,
        mediaFile: media({
          kind: MediaKind.VIDEO,
          largeUrl: null,
          mediumUrl: null,
          posterUrl: "https://cdn.example.test/video-poster.webp",
          publicUrl: "https://cdn.example.test/video.mp4",
          thumbnailUrl: null,
          videoUrl: "https://cdn.example.test/video.mp4",
        }),
        posterMedia: media({
          publicUrl: "https://cdn.example.test/poster.webp",
          thumbnailUrl: "https://cdn.example.test/poster-thumb.webp",
        }),
      },
    ]);
    const service = new PublicContentService(prisma as never, configMock() as never);

    await expect(service.getGallery({ type: "video", limit: 8 })).resolves.toMatchObject({
      items: [
        {
          id: 41,
          type: "video",
          media_url: "https://cdn.example.test/video.mp4",
          thumbnail_url: "https://cdn.example.test/poster-thumb.webp",
        },
      ],
      has_more: false,
      next_cursor: null,
    });
    const findManyArg = firstMockArg<{ where: Record<string, unknown> }>(
      prisma.galleryItem.findMany,
    );
    expect(findManyArg.where).toMatchObject({
      status: ContentStatus.PUBLISHED,
      type: MediaKind.VIDEO,
    });
  });

  it("paginates news and maps public list fields", async () => {
    const prisma = prismaMock();
    prisma.newsArticle.findMany.mockResolvedValue([newsRow({ id: 32, slug: "berita-kedua" })]);
    prisma.newsArticle.count.mockResolvedValue(5);
    const service = new PublicContentService(prisma as never, configMock() as never);

    await expect(
      service.getNews({ category: "Produksi", page: 2, limit: 2 }),
    ).resolves.toMatchObject({
      items: [
        {
          id: 32,
          slug: "berita-kedua",
          thumbnail_url: "https://cdn.example.test/asset-thumb.webp",
        },
      ],
      pagination: {
        page: 2,
        limit: 2,
        total: 5,
        total_pages: 3,
      },
    });
    const findManyArg = firstMockArg<{
      skip: number;
      take: number;
      where: Record<string, unknown>;
    }>(prisma.newsArticle.findMany);
    expect(findManyArg.skip).toBe(2);
    expect(findManyArg.take).toBe(2);
    expect(findManyArg.where).toEqual({
      category: "Produksi",
      status: ContentStatus.PUBLISHED,
    });
  });

  it("builds news detail SEO and normalizes block content", async () => {
    const prisma = prismaMock();
    prisma.newsArticle.findFirst.mockResolvedValue({
      ...newsRow(),
      content: {
        blocks: [
          { type: "paragraph", text: "Paragraf pertama" },
          { type: "paragraph", text: "Paragraf kedua" },
          { type: "image", url: "https://cdn.example.test/image.webp" },
        ],
      },
      ogMedia: media({ largeUrl: "https://cdn.example.test/news-og.webp" }),
      seoDescription: null,
      seoTitle: null,
    });
    const service = new PublicContentService(prisma as never, configMock() as never);

    await expect(service.getNewsDetail("berita-produksi")).resolves.toEqual({
      id: 31,
      title: "Berita Produksi",
      slug: "berita-produksi",
      category: "Produksi",
      thumbnail_url: "https://cdn.example.test/asset-large.webp",
      excerpt: "Update produksi",
      content: ["Paragraf pertama", "Paragraf kedua"],
      seo: {
        title: "Berita Produksi",
        description: "Update produksi",
        canonical_url: "https://indobraga.example.test/berita/berita-produksi",
        og_image_url: "https://cdn.example.test/news-og.webp",
      },
      published_at: now,
    });
  });

  it("throws not found for unpublished or missing news detail", async () => {
    const prisma = prismaMock();
    prisma.newsArticle.findFirst.mockResolvedValue(null);
    const service = new PublicContentService(prisma as never, configMock() as never);

    await expect(service.getNewsDetail("tidak-ada")).rejects.toBeInstanceOf(NotFoundException);
  });
});
