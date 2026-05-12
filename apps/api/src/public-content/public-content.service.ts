import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ContentStatus, MediaKind, Prisma } from "@prisma/client";
import type { Env } from "@/config/env";
import {
  createPagePaginationMeta,
  decodeCursor,
  encodeCursor,
  normalizePagePagination,
} from "@/core/pagination";
import { PrismaService } from "@/database/prisma.service";
import { GalleryQueryDto } from "@/public-content/dto/gallery-query.dto";
import { NewsQueryDto } from "@/public-content/dto/news-query.dto";
import { PortfolioQueryDto } from "@/public-content/dto/portfolio-query.dto";
import {
  getBestImageUrl,
  getMediumUrl,
  getPublicMediaUrls,
  getThumbnailUrl,
} from "@/public-content/media-presenter";

type SortCursor = {
  sortOrder: number;
  id: number;
};

type NewsContentBlock = {
  type?: unknown;
  text?: unknown;
};

@Injectable()
export class PublicContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async getSiteSettings() {
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

    return {
      brand: settings.brand,
      legal_name: settings.legalName,
      email: settings.email,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      instagram: settings.instagram,
      contact_person: settings.contactPerson,
      contact_role: settings.contactRole,
      address: settings.address,
      seo: {
        title: settings.seoTitle,
        description: settings.seoDescription,
        og_image_url: getBestImageUrl(settings.ogMediaFile),
      },
    };
  }

  async getHome() {
    const [
      hero,
      partners,
      strengths,
      featuredPortfolios,
      machines,
      printingCapacities,
      productionCapacities,
      services,
      latestNews,
    ] = await this.prisma.$transaction([
      this.prisma.heroSection.findFirst({
        where: { status: ContentStatus.PUBLISHED },
        orderBy: { id: "asc" },
        include: {
          slides: {
            where: { status: ContentStatus.PUBLISHED },
            orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
            include: { mediaFile: true },
          },
        },
      }),
      this.prisma.partner.findMany({
        where: { status: ContentStatus.PUBLISHED },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: { logoMedia: true },
        take: 12,
      }),
      this.prisma.productionStrength.findMany({
        where: { status: ContentStatus.PUBLISHED },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
      this.prisma.portfolio.findMany({
        where: {
          status: ContentStatus.PUBLISHED,
          featured: true,
          categoryRef: { status: ContentStatus.PUBLISHED },
        },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: { categoryRef: true, imageMedia: true },
        take: 6,
      }),
      this.prisma.machine.findMany({
        where: { status: ContentStatus.PUBLISHED },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: { imageMedia: true },
        take: 3,
      }),
      this.prisma.printingCapacity.findMany({
        where: { status: ContentStatus.PUBLISHED },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: { imageMedia: true },
        take: 3,
      }),
      this.prisma.productionCapacity.findMany({
        where: { status: ContentStatus.PUBLISHED },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        take: 6,
      }),
      this.prisma.serviceItem.findMany({
        where: { status: ContentStatus.PUBLISHED },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        take: 10,
      }),
      this.prisma.newsArticle.findMany({
        where: { status: ContentStatus.PUBLISHED },
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        include: { thumbnailMedia: true },
        take: 3,
      }),
    ]);

    return {
      hero: hero
        ? {
            title: hero.title,
            subtitle: hero.subtitle,
            primary_cta: hero.ctaLabel
              ? {
                  label: hero.ctaLabel,
                  url: hero.ctaHref,
                }
              : null,
            slides: hero.slides.map((slide) => ({
              id: slide.id,
              label: slide.label,
              title: slide.title,
              metric: slide.metric,
              image_url: getBestImageUrl(slide.mediaFile),
              alt_text: slide.altText ?? slide.title,
            })),
          }
        : null,
      partners: partners.map((partner) => ({
        id: partner.id,
        name: partner.name,
        segment: partner.segment,
        logo_url: getBestImageUrl(partner.logoMedia),
      })),
      strengths: strengths.map((strength) => ({
        id: strength.id,
        label: strength.label,
        value: strength.value,
        suffix: strength.suffix,
      })),
      featured_portfolios: featuredPortfolios.map((portfolio) => ({
        id: portfolio.id,
        title: portfolio.title,
        slug: portfolio.slug,
        category: portfolio.categoryRef?.name ?? portfolio.category,
        category_slug: portfolio.categoryRef?.slug ?? null,
        thumbnail_url: getThumbnailUrl(portfolio.imageMedia),
        medium_url: getMediumUrl(portfolio.imageMedia),
        alt_text: portfolio.title,
        short_description: portfolio.description,
      })),
      facilities_summary: {
        machines: machines.map((machine) => this.presentMachine(machine)),
        printing_capacities: printingCapacities.map((capacity) =>
          this.presentPrintingCapacity(capacity),
        ),
        production_capacities: productionCapacities.map((capacity) => ({
          id: capacity.id,
          product: capacity.product,
          value: capacity.value,
          unit: capacity.unit,
        })),
        services: services.map((service) => ({
          id: service.id,
          name: service.name,
        })),
      },
      latest_news: latestNews.map((article) => this.presentNewsListItem(article)),
    };
  }

  async getPortfolio(query: PortfolioQueryDto) {
    const limit = query.limit ?? 8;
    const cursor = this.decodeSortCursor(query.cursor);
    const categorySlug = query.category_slug ?? query.category;
    const where: Prisma.PortfolioWhereInput = {
      status: ContentStatus.PUBLISHED,
      categoryRef: categorySlug
        ? {
            status: ContentStatus.PUBLISHED,
            OR: [{ slug: categorySlug }, { name: categorySlug }],
          }
        : { status: ContentStatus.PUBLISHED },
      ...(cursor ? { OR: this.buildSortCursorWhere(cursor) } : {}),
    };

    const items = await this.prisma.portfolio.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: { categoryRef: true, imageMedia: true },
      take: limit + 1,
    });
    const visibleItems = items.slice(0, limit);
    const nextItem = items.length > limit ? visibleItems.at(-1) : undefined;

    return {
      items: visibleItems.map((portfolio) => ({
        id: portfolio.id,
        title: portfolio.title,
        slug: portfolio.slug,
        category: portfolio.categoryRef?.name ?? portfolio.category,
        category_slug: portfolio.categoryRef?.slug ?? null,
        thumbnail_url: getThumbnailUrl(portfolio.imageMedia),
        medium_url: getMediumUrl(portfolio.imageMedia),
        alt_text: portfolio.title,
        short_description: portfolio.description,
      })),
      next_cursor: nextItem
        ? encodeCursor({ sort_order: nextItem.sortOrder, id: nextItem.id })
        : null,
      has_more: Boolean(nextItem),
    };
  }

  async getPortfolioCategories() {
    const categories = await this.prisma.portfolioCategory.findMany({
      where: {
        status: ContentStatus.PUBLISHED,
        portfolios: { some: { status: ContentStatus.PUBLISHED } },
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: {
        _count: {
          select: {
            portfolios: { where: { status: ContentStatus.PUBLISHED } },
          },
        },
      },
    });

    return {
      items: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        count: category._count.portfolios,
      })),
    };
  }

  async getFacilities() {
    const [strengths, machines, printingCapacities, productionCapacities, services] =
      await this.prisma.$transaction([
        this.prisma.productionStrength.findMany({
          where: { status: ContentStatus.PUBLISHED },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        }),
        this.prisma.machine.findMany({
          where: { status: ContentStatus.PUBLISHED },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
          include: { imageMedia: true },
        }),
        this.prisma.printingCapacity.findMany({
          where: { status: ContentStatus.PUBLISHED },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
          include: { imageMedia: true },
        }),
        this.prisma.productionCapacity.findMany({
          where: { status: ContentStatus.PUBLISHED },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        }),
        this.prisma.serviceItem.findMany({
          where: { status: ContentStatus.PUBLISHED },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        }),
      ]);

    return {
      strengths: strengths.map((strength) => ({
        id: strength.id,
        label: strength.label,
        value: strength.value,
        suffix: strength.suffix,
      })),
      machines: machines.map((machine) => this.presentMachine(machine)),
      printing_capacities: printingCapacities.map((capacity) =>
        this.presentPrintingCapacity(capacity),
      ),
      production_capacities: productionCapacities.map((capacity) => ({
        id: capacity.id,
        product: capacity.product,
        value: capacity.value,
        unit: capacity.unit,
      })),
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
      })),
    };
  }

  async getGallery(query: GalleryQueryDto) {
    const limit = query.limit ?? 8;
    const cursor = this.decodeSortCursor(query.cursor);
    const typeFilter = query.type ? this.galleryTypeToMediaKind(query.type) : undefined;
    const where: Prisma.GalleryItemWhereInput = {
      status: ContentStatus.PUBLISHED,
      type: typeFilter ? typeFilter : { in: [MediaKind.IMAGE, MediaKind.VIDEO] },
      ...(cursor ? { OR: this.buildSortCursorWhere(cursor) } : {}),
    };

    const items = await this.prisma.galleryItem.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: { mediaFile: true, posterMedia: true },
      take: limit + 1,
    });
    const visibleItems = items.slice(0, limit);
    const nextItem = items.length > limit ? visibleItems.at(-1) : undefined;

    return {
      items: visibleItems.map((item) => {
        const mediaUrls = getPublicMediaUrls(item.mediaFile);
        const posterUrls = getPublicMediaUrls(item.posterMedia);
        const thumbnailUrl =
          posterUrls.thumbnail_url ??
          posterUrls.public_url ??
          mediaUrls.thumbnail_url ??
          mediaUrls.poster_url ??
          mediaUrls.medium_url ??
          mediaUrls.public_url;

        return {
          id: item.id,
          type: item.type === MediaKind.VIDEO ? "video" : "image",
          thumbnail_url: thumbnailUrl,
          media_url:
            item.type === MediaKind.VIDEO
              ? (mediaUrls.video_url ?? mediaUrls.public_url)
              : (mediaUrls.large_url ?? mediaUrls.public_url ?? mediaUrls.medium_url),
          caption: item.caption,
          alt_text: item.caption,
          published_at: item.publishedAt,
        };
      }),
      next_cursor: nextItem
        ? encodeCursor({ sort_order: nextItem.sortOrder, id: nextItem.id })
        : null,
      has_more: Boolean(nextItem),
    };
  }

  async getNews(query: NewsQueryDto) {
    const pagination = normalizePagePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 6,
      maxLimit: 24,
    });
    const where: Prisma.NewsArticleWhereInput = {
      status: ContentStatus.PUBLISHED,
      ...(query.category ? { category: query.category } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.newsArticle.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        include: { thumbnailMedia: true },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.newsArticle.count({ where }),
    ]);

    return {
      items: items.map((article) => this.presentNewsListItem(article)),
      pagination: createPagePaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async getNewsDetail(slug: string) {
    const article = await this.prisma.newsArticle.findFirst({
      where: {
        slug,
        status: ContentStatus.PUBLISHED,
      },
      include: {
        thumbnailMedia: true,
        ogMedia: true,
      },
    });

    if (!article) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Berita tidak ditemukan.",
      });
    }

    const thumbnailUrl = getBestImageUrl(article.thumbnailMedia);
    const ogImageUrl = getBestImageUrl(article.ogMedia) ?? thumbnailUrl;

    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      category: article.category,
      thumbnail_url: thumbnailUrl,
      excerpt: article.excerpt,
      content: this.presentNewsContent(article.content),
      seo: {
        title: article.seoTitle ?? article.title,
        description: article.seoDescription ?? article.excerpt,
        canonical_url: `${this.config.get("PUBLIC_SITE_URL", { infer: true })}/berita/${article.slug}`,
        og_image_url: ogImageUrl,
      },
      published_at: article.publishedAt,
    };
  }

  private presentMachine(machine: Prisma.MachineGetPayload<{ include: { imageMedia: true } }>) {
    return {
      id: machine.id,
      name: machine.name,
      slug: machine.slug,
      metric: machine.metric,
      description: machine.description,
      image_url: getMediumUrl(machine.imageMedia),
      alt_text: machine.name,
    };
  }

  private presentPrintingCapacity(
    capacity: Prisma.PrintingCapacityGetPayload<{ include: { imageMedia: true } }>,
  ) {
    return {
      id: capacity.id,
      label: capacity.label,
      value: capacity.value,
      unit: capacity.unit,
      description: capacity.description,
      image_url: getMediumUrl(capacity.imageMedia),
      alt_text: capacity.label,
    };
  }

  private presentNewsListItem(
    article: Prisma.NewsArticleGetPayload<{ include: { thumbnailMedia: true } }>,
  ) {
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      category: article.category,
      thumbnail_url: getThumbnailUrl(article.thumbnailMedia),
      excerpt: article.excerpt,
      published_at: article.publishedAt,
    };
  }

  private presentNewsContent(content: Prisma.JsonValue): string[] {
    if (Array.isArray(content)) {
      return content.flatMap((item): string[] => {
        if (typeof item === "string") {
          return [item];
        }

        if (this.isNewsContentBlock(item) && typeof item.text === "string") {
          return [item.text];
        }

        return [];
      });
    }

    if (this.isRecord(content) && Array.isArray(content.blocks)) {
      return content.blocks.flatMap((item): string[] =>
        this.isNewsContentBlock(item) && typeof item.text === "string" ? [item.text] : [],
      );
    }

    return [];
  }

  private isNewsContentBlock(value: unknown): value is NewsContentBlock {
    return this.isRecord(value);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private decodeSortCursor(cursor: string | undefined): SortCursor | null {
    const decoded = decodeCursor(cursor);

    if (!decoded) {
      return null;
    }

    const sortOrder = decoded.sort_order;
    const id = decoded.id;

    if (typeof sortOrder !== "number" || typeof id !== "number") {
      throw new BadRequestException({
        code: "BAD_REQUEST",
        message: "Cursor tidak valid.",
      });
    }

    return { sortOrder, id };
  }

  private buildSortCursorWhere(cursor: SortCursor) {
    return [
      { sortOrder: { gt: cursor.sortOrder } },
      { sortOrder: cursor.sortOrder, id: { gt: cursor.id } },
    ];
  }

  private galleryTypeToMediaKind(type: "image" | "video"): MediaKind {
    return type === "video" ? MediaKind.VIDEO : MediaKind.IMAGE;
  }
}
