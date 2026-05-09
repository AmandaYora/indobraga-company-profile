import { ConfigService } from "@nestjs/config";
import { NotFoundException } from "@nestjs/common";
import { ContentStatus, MediaKind, MediaStatus } from "@prisma/client";
import type { Env } from "@/config/env";
import { SeoAssetsService } from "@/seo-assets/seo-assets.service";

const config = (publicSiteUrl = "https://indobraga.com/"): ConfigService<Env, true> =>
  ({
    get: jest.fn((key: string) => (key === "PUBLIC_SITE_URL" ? publicSiteUrl : undefined)),
  }) as unknown as ConfigService<Env, true>;

const media = {
  id: 1,
  kind: MediaKind.IMAGE,
  status: MediaStatus.COMPLETED,
  originalUrl: "https://cdn.example.com/original.jpg",
  thumbnailUrl: "https://cdn.example.com/thumb.jpg",
  mediumUrl: "https://cdn.example.com/medium.jpg",
  largeUrl: "https://cdn.example.com/large.jpg",
  mimeType: "image/jpeg",
  altText: "OG image",
  width: 1200,
  height: 630,
  durationSeconds: null,
  sizeOriginalBytes: null,
  sizeFinalBytes: null,
  storageKeyOriginal: "original.jpg",
  storageKeyFinal: "large.jpg",
  checksumSha256: "checksum",
  createdById: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const settings = {
  id: 1,
  brand: "Indobraga",
  legalName: "PT Indo Braga Textile",
  seoTitle: "Indobraga Garment",
  seoDescription: "Cetak kain custom dan garment.",
  ogMediaFile: media,
};

describe("SeoAssetsService", () => {
  it("generates robots.txt with public sitemap and private admin/API disallow rules", () => {
    const service = new SeoAssetsService({} as never, config());

    expect(service.robotsText()).toContain("Disallow: /admin");
    expect(service.robotsText()).toContain("Disallow: /api/");
    expect(service.robotsText()).toContain("Sitemap: https://indobraga.com/sitemap.xml");
  });

  it("generates sitemap with static routes and published news", async () => {
    const prisma = {
      newsArticle: {
        findMany: jest.fn().mockResolvedValue([
          {
            slug: "artikel-a",
            updatedAt: new Date("2026-02-02T00:00:00.000Z"),
            publishedAt: new Date("2026-02-01T00:00:00.000Z"),
          },
        ]),
      },
    };
    const service = new SeoAssetsService(prisma as never, config());

    const xml = await service.sitemapXml();

    expect(prisma.newsArticle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: ContentStatus.PUBLISHED } }),
    );
    expect(xml).toContain("<loc>https://indobraga.com/portfolio</loc>");
    expect(xml).toContain("<loc>https://indobraga.com/berita/artikel-a</loc>");
    expect(xml).toContain("<lastmod>2026-02-02T00:00:00.000Z</lastmod>");
  });

  it("returns route SEO using site settings", async () => {
    const prisma = {
      siteSettings: {
        findUnique: jest.fn().mockResolvedValue(settings),
      },
    };
    const service = new SeoAssetsService(prisma as never, config());

    await expect(service.seo("/portfolio/")).resolves.toEqual({
      title: "Portofolio - Indobraga",
      description: "Portofolio produksi garment dan cetak kain custom Indobraga.",
      canonical_url: "https://indobraga.com/portfolio",
      og_image_url: "https://cdn.example.com/large.jpg",
      noindex: false,
    });
  });

  it("returns published news SEO with article media fallback", async () => {
    const prisma = {
      siteSettings: {
        findUnique: jest.fn().mockResolvedValue(settings),
      },
      newsArticle: {
        findFirst: jest.fn().mockResolvedValue({
          slug: "artikel-a",
          title: "Judul Artikel",
          excerpt: "Ringkasan artikel",
          seoTitle: null,
          seoDescription: null,
          ogMedia: null,
          thumbnailMedia: media,
        }),
      },
    };
    const service = new SeoAssetsService(prisma as never, config());

    await expect(service.seo("berita:artikel-a")).resolves.toEqual({
      title: "Judul Artikel",
      description: "Ringkasan artikel",
      canonical_url: "https://indobraga.com/berita/artikel-a",
      og_image_url: "https://cdn.example.com/large.jpg",
      noindex: false,
    });
    expect(prisma.newsArticle.findFirst).toHaveBeenCalledWith({
      where: { slug: "artikel-a", status: ContentStatus.PUBLISHED },
      include: { thumbnailMedia: true, ogMedia: true },
    });
  });

  it("throws not found for unavailable settings or routes", async () => {
    const service = new SeoAssetsService(
      { siteSettings: { findUnique: jest.fn().mockResolvedValue(null) } } as never,
      config(),
    );

    await expect(service.seo("unknown")).rejects.toBeInstanceOf(NotFoundException);
  });
});
