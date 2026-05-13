import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ContentStatus } from "@prisma/client";
import type { Env } from "@/config/env";
import { PrismaService } from "@/database/prisma.service";
import { getBestImageUrl } from "@/media/media-presenter";

type SitemapUrl = {
  loc: string;
  lastmod?: Date | null;
  priority?: string;
};

@Injectable()
export class SeoAssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  robotsText(): string {
    const siteUrl = this.siteUrl();

    return [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin",
      "Disallow: /login",
      "Disallow: /api/",
      "Disallow: /internal/",
      "",
      `Sitemap: ${siteUrl}/sitemap.xml`,
      "",
    ].join("\n");
  }

  async sitemapXml(): Promise<string> {
    const news = await this.prisma.newsArticle.findMany({
      where: { status: ContentStatus.PUBLISHED },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      select: { slug: true, updatedAt: true, publishedAt: true },
    });
    const urls: SitemapUrl[] = [
      { loc: "/", priority: "1.0" },
      { loc: "/portfolio", priority: "0.8" },
      { loc: "/fasilitas", priority: "0.8" },
      { loc: "/galeri", priority: "0.7" },
      { loc: "/berita", priority: "0.7" },
      { loc: "/kontak", priority: "0.7" },
      ...news.map((article) => ({
        loc: `/berita/${article.slug}`,
        lastmod: article.updatedAt ?? article.publishedAt,
        priority: "0.6",
      })),
    ];

    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...urls.map((url) => this.sitemapUrl(url)),
      "</urlset>",
      "",
    ].join("\n");
  }

  async seo(route: string) {
    const settings = await this.prisma.siteSettings.findUnique({
      where: { id: 1 },
      include: { ogMediaFile: true },
    });
    if (!settings) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Pengaturan website belum tersedia.",
      });
    }

    const normalizedRoute = route.trim().replace(/^\/+|\/+$/g, "") || "home";
    const siteUrl = this.siteUrl();
    const ogImageUrl = getBestImageUrl(settings.ogMediaFile);

    if (normalizedRoute.startsWith("berita:")) {
      const slug = normalizedRoute.slice("berita:".length);
      return this.newsSeo(slug);
    }

    const routeSeo: Record<string, { path: string; title: string; description: string }> = {
      home: {
        path: "/",
        title: settings.seoTitle ?? settings.brand,
        description: settings.seoDescription ?? settings.legalName,
      },
      portfolio: {
        path: "/portfolio",
        title: `Portofolio - ${settings.brand}`,
        description: "Portofolio produksi garment dan cetak kain custom Indobraga.",
      },
      fasilitas: {
        path: "/fasilitas",
        title: `Mesin & Fasilitas - ${settings.brand}`,
        description: "Mesin, fasilitas, dan kapasitas produksi Indobraga.",
      },
      galeri: {
        path: "/galeri",
        title: `Galeri - ${settings.brand}`,
        description: "Galeri produksi dan hasil pengerjaan Indobraga.",
      },
      berita: {
        path: "/berita",
        title: `Berita - ${settings.brand}`,
        description: "Berita dan pembaruan terbaru dari Indobraga.",
      },
      kontak: {
        path: "/kontak",
        title: `Kontak - ${settings.brand}`,
        description: "Hubungi Indobraga untuk konsultasi produksi garment dan cetak kain.",
      },
    };
    const selected = routeSeo[normalizedRoute];
    if (!selected) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "SEO route tidak ditemukan.",
      });
    }

    return {
      title: selected.title,
      description: selected.description,
      canonical_url: `${siteUrl}${selected.path === "/" ? "" : selected.path}`,
      og_image_url: ogImageUrl,
      noindex: false,
    };
  }

  private async newsSeo(slug: string) {
    const article = await this.prisma.newsArticle.findFirst({
      where: { slug, status: ContentStatus.PUBLISHED },
      include: { thumbnailMedia: true, ogMedia: true },
    });
    if (!article) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Berita tidak ditemukan.",
      });
    }

    return {
      title: article.seoTitle ?? article.title,
      description: article.seoDescription ?? article.excerpt,
      canonical_url: `${this.siteUrl()}/berita/${article.slug}`,
      og_image_url: getBestImageUrl(article.ogMedia) ?? getBestImageUrl(article.thumbnailMedia),
      noindex: false,
    };
  }

  private sitemapUrl(url: SitemapUrl): string {
    const parts = [`  <url>`, `    <loc>${this.escapeXml(`${this.siteUrl()}${url.loc}`)}</loc>`];
    if (url.lastmod) {
      parts.push(`    <lastmod>${url.lastmod.toISOString()}</lastmod>`);
    }
    if (url.priority) {
      parts.push(`    <priority>${url.priority}</priority>`);
    }
    parts.push("  </url>");

    return parts.join("\n");
  }

  private siteUrl(): string {
    return this.config.get("PUBLIC_SITE_URL", { infer: true }).replace(/\/+$/, "");
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
