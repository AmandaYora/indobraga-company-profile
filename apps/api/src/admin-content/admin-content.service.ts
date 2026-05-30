import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ContentStatus, MediaKind, MediaStatus, Prisma } from "@prisma/client";
import { AuditService } from "@/audit/audit.service";
import {
  API_TO_PRISMA_CONTENT_STATUS,
  ApiContentStatus,
  ApiPublishableContentStatus,
  PRISMA_TO_API_CONTENT_STATUS,
} from "@/core/content-status.dto";
import { createPagePaginationMeta, normalizePagePagination } from "@/core/pagination";
import { PrismaService } from "@/database/prisma.service";
import { getPublicMediaUrls } from "@/media/media-presenter";
import { MediaService } from "@/media/media.service";
import { PRISMA_TO_API_MEDIA_KIND, PRISMA_TO_API_MEDIA_STATUS } from "@/media/media-status.dto";
import { RevalidationService } from "@/revalidation/revalidation.service";
import { AdminContentDto } from "@/admin-content/dto/admin-content.dto";
import { AdminListQueryDto } from "@/admin-content/dto/admin-list-query.dto";
import { ReorderDto } from "@/admin-content/dto/reorder.dto";
import { SiteSettingsUpdateDto } from "@/admin-content/dto/site-settings-update.dto";

type Actor = {
  id?: number;
};

type ResourceType =
  | "site-settings"
  | "hero"
  | "hero-slides"
  | "partners"
  | "production-strengths"
  | "portfolio-categories"
  | "portfolios"
  | "machines"
  | "printing-capacities"
  | "production-capacities"
  | "services"
  | "gallery-items"
  | "news";

type ContentLifecycle = {
  previousStatus: ContentStatus | null;
  status: ContentStatus;
};

const CONTENT_RESOURCES: readonly ResourceType[] = [
  "hero",
  "hero-slides",
  "partners",
  "production-strengths",
  "portfolio-categories",
  "portfolios",
  "machines",
  "printing-capacities",
  "production-capacities",
  "services",
  "gallery-items",
  "news",
];

const MEDIA_PREVIEW_SELECT = {
  createdAt: true,
  durationSeconds: true,
  height: true,
  id: true,
  kind: true,
  largeUrl: true,
  mediumUrl: true,
  mimeType: true,
  originalFilename: true,
  posterUrl: true,
  publicUrl: true,
  status: true,
  thumbnailUrl: true,
  updatedAt: true,
  videoUrl: true,
  width: true,
} as const;
const HERO_SLIDE_ADMIN_INCLUDE = { mediaFile: { select: MEDIA_PREVIEW_SELECT } } as const;
const PARTNER_ADMIN_INCLUDE = { logoMedia: { select: MEDIA_PREVIEW_SELECT } } as const;
const PORTFOLIO_ADMIN_INCLUDE = {
  categoryRef: true,
  imageMedia: { select: MEDIA_PREVIEW_SELECT },
} as const;
const MACHINE_ADMIN_INCLUDE = { imageMedia: { select: MEDIA_PREVIEW_SELECT } } as const;
const PRINTING_CAPACITY_ADMIN_INCLUDE = {
  imageMedia: { select: MEDIA_PREVIEW_SELECT },
} as const;
const GALLERY_ITEM_ADMIN_INCLUDE = {
  mediaFile: { select: MEDIA_PREVIEW_SELECT },
  posterMedia: { select: MEDIA_PREVIEW_SELECT },
} as const;
const NEWS_ADMIN_INCLUDE = {
  ogMedia: { select: MEDIA_PREVIEW_SELECT },
  thumbnailMedia: { select: MEDIA_PREVIEW_SELECT },
} as const;

type AdminMediaPreviewPayload = Prisma.MediaFileGetPayload<{ select: typeof MEDIA_PREVIEW_SELECT }>;
type AdminHeroSlidePayload = Prisma.HeroSlideGetPayload<{
  include: typeof HERO_SLIDE_ADMIN_INCLUDE;
}>;
type AdminPartnerPayload = Prisma.PartnerGetPayload<{ include: typeof PARTNER_ADMIN_INCLUDE }>;
type AdminPortfolioPayload = Prisma.PortfolioGetPayload<{
  include: typeof PORTFOLIO_ADMIN_INCLUDE;
}>;
type AdminMachinePayload = Prisma.MachineGetPayload<{ include: typeof MACHINE_ADMIN_INCLUDE }>;
type AdminPrintingCapacityPayload = Prisma.PrintingCapacityGetPayload<{
  include: typeof PRINTING_CAPACITY_ADMIN_INCLUDE;
}>;
type AdminGalleryItemPayload = Prisma.GalleryItemGetPayload<{
  include: typeof GALLERY_ITEM_ADMIN_INCLUDE;
}>;
type AdminNewsPayload = Prisma.NewsArticleGetPayload<{ include: typeof NEWS_ADMIN_INCLUDE }>;

@Injectable()
export class AdminContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly media: MediaService,
    private readonly revalidation: RevalidationService,
  ) {}

  async getSiteSettings() {
    const settings = await this.prisma.siteSettings.findUnique({
      where: { id: 1 },
      include: { contactHeroMediaFile: true, logoMediaFile: true, ogMediaFile: true },
    });

    if (!settings) {
      throw this.notFound("site-settings");
    }

    return {
      id: settings.id,
      brand: settings.brand,
      legal_name: settings.legalName,
      email: settings.email,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      instagram: settings.instagram,
      contact_person: settings.contactPerson,
      contact_role: settings.contactRole,
      address: settings.address,
      seo_title: settings.seoTitle,
      seo_description: settings.seoDescription,
      show_brand_text: settings.showBrandText,
      logo_media_file_id: settings.logoMediaFileId,
      logo_url:
        settings.logoMediaFile?.largeUrl ??
        settings.logoMediaFile?.mediumUrl ??
        settings.logoMediaFile?.publicUrl ??
        null,
      og_media_file_id: settings.ogMediaFileId,
      og_image_url: settings.ogMediaFile?.publicUrl ?? settings.ogMediaFile?.largeUrl ?? null,
      contact_hero_media_file_id: settings.contactHeroMediaFileId,
      contact_hero_image_url:
        settings.contactHeroMediaFile?.largeUrl ??
        settings.contactHeroMediaFile?.mediumUrl ??
        settings.contactHeroMediaFile?.publicUrl ??
        null,
      created_at: settings.createdAt,
      updated_at: settings.updatedAt,
    };
  }

  async updateSiteSettings(dto: SiteSettingsUpdateDto, actor: Actor) {
    if (dto.logo_media_file_id) {
      await this.assertCompletedMedia(dto.logo_media_file_id);
    }
    if (dto.og_media_file_id) {
      await this.assertCompletedMedia(dto.og_media_file_id);
    }
    if (dto.contact_hero_media_file_id) {
      await this.assertCompletedMedia(dto.contact_hero_media_file_id);
    }

    const settings = await this.prisma.siteSettings.upsert({
      where: { id: 1 },
      update: {
        brand: dto.brand,
        legalName: dto.legal_name,
        email: dto.email,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        instagram: dto.instagram,
        contactPerson: dto.contact_person,
        contactRole: dto.contact_role,
        address: dto.address,
        seoTitle: dto.seo_title,
        seoDescription: dto.seo_description,
        showBrandText: dto.show_brand_text,
        logoMediaFileId: dto.logo_media_file_id,
        ogMediaFileId: dto.og_media_file_id,
        contactHeroMediaFileId: dto.contact_hero_media_file_id,
      },
      create: {
        id: 1,
        brand: dto.brand ?? "Indobraga",
        legalName: dto.legal_name ?? "PT. Braga Indonesia Perkasa",
        email: dto.email ?? "indobraga@gmail.com",
        phone: dto.phone ?? "0851-5870-0895",
        whatsapp: dto.whatsapp ?? "6285158700895",
        instagram: dto.instagram ?? "indobraga",
        contactPerson: dto.contact_person ?? "Mahardika",
        contactRole: dto.contact_role ?? "Tim Marketing",
        address: dto.address ?? "Jalan Babakan Tarogong No. 292, Kota Bandung",
        seoTitle: dto.seo_title,
        seoDescription: dto.seo_description,
        showBrandText: dto.show_brand_text ?? false,
        logoMediaFileId: dto.logo_media_file_id,
        ogMediaFileId: dto.og_media_file_id,
        contactHeroMediaFileId: dto.contact_hero_media_file_id,
      },
      include: { contactHeroMediaFile: true, logoMediaFile: true, ogMediaFile: true },
    });

    await this.afterMutation("site-settings", "update", settings.id, actor);
    return this.getSiteSettings();
  }

  async listHero(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.HeroSectionWhereInput = {
      ...this.contentStatusWhere(query),
      ...(query.q
        ? {
            OR: [{ title: { contains: query.q } }, { subtitle: { contains: query.q } }],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.heroSection.findMany({
        where,
        orderBy: [{ id: "desc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.heroSection.count({ where }),
    ]);

    return this.page(
      items.map((item) => this.presentHero(item)),
      pagination,
      total,
    );
  }

  async getHero(id: number) {
    const item = await this.prisma.heroSection.findUnique({
      where: { id },
      include: { slides: { include: HERO_SLIDE_ADMIN_INCLUDE } },
    });

    if (!item) {
      throw this.notFound("hero");
    }

    return {
      ...this.presentHero(item),
      slides: item.slides.map((slide) => this.presentHeroSlide(slide)),
    };
  }

  async createHero(dto: AdminContentDto, actor: Actor) {
    this.requireFields(dto, ["title"], "hero");
    const item = await this.prisma.heroSection.create({
      data: {
        title: dto.title ?? "",
        subtitle: dto.subtitle,
        ctaLabel: dto.cta_label,
        ctaHref: dto.cta_href,
        status: this.statusOrDefault(dto.status),
      },
    });
    await this.afterMutation("hero", "create", item.id, actor);
    return this.presentHero(item);
  }

  async updateHero(id: number, dto: AdminContentDto, actor: Actor) {
    const item = await this.write(async () =>
      this.prisma.heroSection.update({
        where: { id },
        data: {
          title: dto.title,
          subtitle: dto.subtitle,
          ctaLabel: dto.cta_label,
          ctaHref: dto.cta_href,
          status: dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : undefined,
        },
      }),
    );
    await this.afterMutation("hero", "update", item.id, actor);
    return this.presentHero(item);
  }

  async listHeroSlides(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.HeroSlideWhereInput = {
      ...this.contentStatusWhere(query),
      ...(query.q
        ? {
            OR: [{ title: { contains: query.q } }, { label: { contains: query.q } }],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.heroSlide.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: HERO_SLIDE_ADMIN_INCLUDE,
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.heroSlide.count({ where }),
    ]);

    return this.page(
      items.map((item) => this.presentHeroSlide(item)),
      pagination,
      total,
    );
  }

  async getHeroSlide(id: number) {
    const item = await this.prisma.heroSlide.findUnique({
      where: { id },
      include: HERO_SLIDE_ADMIN_INCLUDE,
    });
    if (!item) {
      throw this.notFound("hero-slides");
    }
    return this.presentHeroSlide(item);
  }

  async createHeroSlide(dto: AdminContentDto, actor: Actor) {
    this.requireFields(dto, ["hero_section_id", "title"], "hero-slides");
    if (dto.media_file_id) {
      await this.assertCompletedMedia(dto.media_file_id);
    }
    const item = await this.prisma.heroSlide.create({
      data: {
        heroSectionId: dto.hero_section_id ?? 0,
        label: dto.label,
        title: dto.title ?? "",
        metric: dto.metric,
        altText: dto.alt_text,
        mediaFileId: dto.media_file_id,
        sortOrder: dto.sort_order ?? 0,
        status: this.statusOrDefault(dto.status),
      },
      include: HERO_SLIDE_ADMIN_INCLUDE,
    });
    await this.afterMutation("hero-slides", "create", item.id, actor);
    return this.presentHeroSlide(item);
  }

  async updateHeroSlide(id: number, dto: AdminContentDto, actor: Actor) {
    if (dto.media_file_id) {
      await this.assertCompletedMedia(dto.media_file_id);
    }
    const item = await this.write(async () =>
      this.prisma.heroSlide.update({
        where: { id },
        data: {
          heroSectionId: dto.hero_section_id,
          label: dto.label,
          title: dto.title,
          metric: dto.metric,
          altText: dto.alt_text,
          mediaFileId: dto.media_file_id,
          sortOrder: dto.sort_order,
          status: dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : undefined,
        },
        include: HERO_SLIDE_ADMIN_INCLUDE,
      }),
    );
    await this.afterMutation("hero-slides", "update", item.id, actor);
    return this.presentHeroSlide(item);
  }

  async listPartners(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.PartnerWhereInput = {
      ...this.contentStatusWhere(query),
      ...(query.segment ? { segment: query.segment } : {}),
      ...(query.q ? { name: { contains: query.q } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.partner.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: PARTNER_ADMIN_INCLUDE,
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.partner.count({ where }),
    ]);
    return this.page(
      items.map((item) => this.presentPartner(item)),
      pagination,
      total,
    );
  }

  async getPartner(id: number) {
    const item = await this.prisma.partner.findUnique({
      where: { id },
      include: PARTNER_ADMIN_INCLUDE,
    });
    if (!item) {
      throw this.notFound("partners");
    }
    return this.presentPartner(item);
  }

  async createPartner(dto: AdminContentDto, actor: Actor) {
    this.requireFields(dto, ["name"], "partners");
    if (dto.logo_media_id) {
      await this.assertCompletedMedia(dto.logo_media_id);
    }
    const item = await this.prisma.partner.create({
      data: {
        name: dto.name ?? "",
        segment: dto.segment,
        logoMediaId: dto.logo_media_id,
        sortOrder: dto.sort_order ?? 0,
        status: this.statusOrDefault(dto.status),
      },
      include: PARTNER_ADMIN_INCLUDE,
    });
    await this.afterMutation("partners", "create", item.id, actor);
    return this.presentPartner(item);
  }

  async updatePartner(id: number, dto: AdminContentDto, actor: Actor) {
    if (dto.logo_media_id) {
      await this.assertCompletedMedia(dto.logo_media_id);
    }
    const item = await this.write(async () =>
      this.prisma.partner.update({
        where: { id },
        data: {
          name: dto.name,
          segment: dto.segment,
          logoMediaId: dto.logo_media_id,
          sortOrder: dto.sort_order,
          status: dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : undefined,
        },
        include: PARTNER_ADMIN_INCLUDE,
      }),
    );
    await this.afterMutation("partners", "update", item.id, actor);
    return this.presentPartner(item);
  }

  async listStrengths(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.ProductionStrengthWhereInput = {
      ...this.contentStatusWhere(query),
      ...(query.q ? { label: { contains: query.q } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.productionStrength.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.productionStrength.count({ where }),
    ]);
    return this.page(
      items.map((item) => this.presentStrength(item)),
      pagination,
      total,
    );
  }

  async getStrength(id: number) {
    const item = await this.prisma.productionStrength.findUnique({ where: { id } });
    if (!item) {
      throw this.notFound("production-strengths");
    }
    return this.presentStrength(item);
  }

  async createStrength(dto: AdminContentDto, actor: Actor) {
    this.requireFields(dto, ["label", "value"], "production-strengths");
    const item = await this.prisma.productionStrength.create({
      data: {
        label: dto.label ?? "",
        value: dto.value ?? "",
        suffix: dto.suffix,
        sortOrder: dto.sort_order ?? 0,
        status: this.statusOrDefault(dto.status),
      },
    });
    await this.afterMutation("production-strengths", "create", item.id, actor);
    return this.presentStrength(item);
  }

  async updateStrength(id: number, dto: AdminContentDto, actor: Actor) {
    const item = await this.write(async () =>
      this.prisma.productionStrength.update({
        where: { id },
        data: {
          label: dto.label,
          value: dto.value,
          suffix: dto.suffix,
          sortOrder: dto.sort_order,
          status: dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : undefined,
        },
      }),
    );
    await this.afterMutation("production-strengths", "update", item.id, actor);
    return this.presentStrength(item);
  }

  async listPortfolioCategories(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.PortfolioCategoryWhereInput = this.searchStatusWhere(query, [
      "name",
      "slug",
    ]);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.portfolioCategory.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.portfolioCategory.count({ where }),
    ]);
    return this.page(
      items.map((item) => this.presentPortfolioCategory(item)),
      pagination,
      total,
    );
  }

  async getPortfolioCategory(id: number) {
    const item = await this.prisma.portfolioCategory.findUnique({ where: { id } });
    if (!item) {
      throw this.notFound("portfolio-categories");
    }
    return this.presentPortfolioCategory(item);
  }

  async createPortfolioCategory(dto: AdminContentDto, actor: Actor) {
    this.requireFields(dto, ["name"], "portfolio-categories");
    const item = await this.write(async () =>
      this.prisma.portfolioCategory.create({
        data: {
          name: dto.name ?? "",
          slug: dto.slug ?? this.slugify(dto.name ?? ""),
          sortOrder: dto.sort_order ?? 0,
          status: dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : ContentStatus.PUBLISHED,
        },
      }),
    );
    await this.afterMutation("portfolio-categories", "create", item.id, actor);
    return this.presentPortfolioCategory(item);
  }

  async updatePortfolioCategory(id: number, dto: AdminContentDto, actor: Actor) {
    const item = await this.write(async () =>
      this.prisma.portfolioCategory.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          sortOrder: dto.sort_order,
          status: dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : undefined,
        },
      }),
    );
    await this.afterMutation("portfolio-categories", "update", item.id, actor);
    return this.presentPortfolioCategory(item);
  }

  async listPortfolios(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const filters: Prisma.PortfolioWhereInput[] = [];
    if (query.category) {
      filters.push({
        OR: [
          { category: query.category },
          { categoryRef: { is: { name: query.category } } },
          { categoryRef: { is: { slug: query.category } } },
        ],
      });
    }
    if (query.q) {
      filters.push({
        OR: [
          { title: { contains: query.q } },
          { category: { contains: query.q } },
          { categoryRef: { is: { name: { contains: query.q } } } },
          { description: { contains: query.q } },
        ],
      });
    }
    const where: Prisma.PortfolioWhereInput = {
      ...this.contentStatusWhere(query),
      ...(filters.length > 0 ? { AND: filters } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.portfolio.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: PORTFOLIO_ADMIN_INCLUDE,
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.portfolio.count({ where }),
    ]);
    return this.page(
      items.map((item) => this.presentPortfolio(item)),
      pagination,
      total,
    );
  }

  async getPortfolio(id: number) {
    const item = await this.prisma.portfolio.findUnique({
      where: { id },
      include: PORTFOLIO_ADMIN_INCLUDE,
    });
    if (!item) {
      throw this.notFound("portfolios");
    }
    return this.presentPortfolio(item);
  }

  async createPortfolio(dto: AdminContentDto, actor: Actor) {
    this.requireFields(dto, ["title", "category_id"], "portfolios");
    await this.validatePublishedMedia(dto.status, dto.media_file_id, "portfolios");
    const category = await this.resolvePortfolioCategory(dto.category_id);
    const item = await this.write(async () =>
      this.prisma.portfolio.create({
        data: {
          title: dto.title ?? "",
          slug: dto.slug ?? this.slugify(dto.title ?? ""),
          category: category.name,
          categoryId: category.id,
          description: dto.short_description ?? dto.description,
          imageMediaId: dto.media_file_id,
          featured: dto.is_featured ?? false,
          sortOrder: dto.sort_order ?? 0,
          status: this.statusOrDefault(dto.status),
          publishedAt: this.publishedAt(dto.status, dto.published_at),
          seoTitle: dto.seo_title,
          seoDescription: dto.seo_description,
        },
        include: PORTFOLIO_ADMIN_INCLUDE,
      }),
    );
    await this.afterMutation("portfolios", "create", item.id, actor);
    return this.presentPortfolio(item);
  }

  async updatePortfolio(id: number, dto: AdminContentDto, actor: Actor) {
    if (dto.media_file_id) {
      await this.assertCompletedMedia(dto.media_file_id);
    }
    const current = await this.prisma.portfolio.findUnique({
      where: { id },
      include: PORTFOLIO_ADMIN_INCLUDE,
    });
    if (!current) {
      throw this.notFound("portfolios");
    }
    const category = dto.category_id
      ? await this.resolvePortfolioCategory(dto.category_id)
      : undefined;
    const nextStatus = dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : current.status;
    if (nextStatus === ContentStatus.PUBLISHED && !(dto.media_file_id ?? current.imageMediaId)) {
      throw this.publishValidation("portfolios", "media_file_id wajib untuk publish.");
    }
    if (nextStatus === ContentStatus.PUBLISHED) {
      this.validatePortfolioCategoryForPublish(category ?? current.categoryRef);
    }
    const item = await this.write(async () =>
      this.prisma.portfolio.update({
        where: { id },
        include: PORTFOLIO_ADMIN_INCLUDE,
        data: {
          title: dto.title,
          slug: dto.slug,
          category: category?.name ?? dto.category,
          categoryId: category?.id,
          description: dto.short_description ?? dto.description,
          imageMediaId: dto.media_file_id,
          featured: dto.is_featured,
          sortOrder: dto.sort_order,
          status: dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : undefined,
          publishedAt:
            dto.status === "published" ? this.publishedAt(dto.status, dto.published_at) : undefined,
          seoTitle: dto.seo_title,
          seoDescription: dto.seo_description,
        },
      }),
    );
    await this.afterMutation("portfolios", "update", item.id, actor);
    return this.presentPortfolio(item);
  }

  async listMachines(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.MachineWhereInput = this.searchStatusWhere(query, ["name", "description"]);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.machine.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: MACHINE_ADMIN_INCLUDE,
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.machine.count({ where }),
    ]);
    return this.page(
      items.map((item) => this.presentMachine(item)),
      pagination,
      total,
    );
  }

  async getMachine(id: number) {
    const item = await this.prisma.machine.findUnique({
      where: { id },
      include: MACHINE_ADMIN_INCLUDE,
    });
    if (!item) {
      throw this.notFound("machines");
    }
    return this.presentMachine(item);
  }

  async createMachine(dto: AdminContentDto, actor: Actor) {
    this.requireFields(dto, ["name"], "machines");
    if (dto.media_file_id) {
      await this.assertCompletedMedia(dto.media_file_id);
    }
    const item = await this.write(async () =>
      this.prisma.machine.create({
        data: {
          name: dto.name ?? "",
          slug: dto.slug ?? this.slugify(dto.name ?? ""),
          metric: dto.metric,
          description: dto.description,
          imageMediaId: dto.media_file_id,
          sortOrder: dto.sort_order ?? 0,
          status: this.statusOrDefault(dto.status),
        },
        include: MACHINE_ADMIN_INCLUDE,
      }),
    );
    await this.afterMutation("machines", "create", item.id, actor);
    return this.presentMachine(item);
  }

  async updateMachine(id: number, dto: AdminContentDto, actor: Actor) {
    if (dto.media_file_id) {
      await this.assertCompletedMedia(dto.media_file_id);
    }
    const item = await this.write(async () =>
      this.prisma.machine.update({
        where: { id },
        data: {
          name: dto.name,
          slug: dto.slug,
          metric: dto.metric,
          description: dto.description,
          imageMediaId: dto.media_file_id,
          sortOrder: dto.sort_order,
          status: dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : undefined,
        },
        include: MACHINE_ADMIN_INCLUDE,
      }),
    );
    await this.afterMutation("machines", "update", item.id, actor);
    return this.presentMachine(item);
  }

  async listPrintingCapacities(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.PrintingCapacityWhereInput = this.searchStatusWhere(query, [
      "label",
      "description",
    ]);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.printingCapacity.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: PRINTING_CAPACITY_ADMIN_INCLUDE,
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.printingCapacity.count({ where }),
    ]);
    return this.page(
      items.map((item) => this.presentPrintingCapacity(item)),
      pagination,
      total,
    );
  }

  async getPrintingCapacity(id: number) {
    const item = await this.prisma.printingCapacity.findUnique({
      where: { id },
      include: PRINTING_CAPACITY_ADMIN_INCLUDE,
    });
    if (!item) {
      throw this.notFound("printing-capacities");
    }
    return this.presentPrintingCapacity(item);
  }

  async createPrintingCapacity(dto: AdminContentDto, actor: Actor) {
    this.requireFields(dto, ["label", "value", "unit"], "printing-capacities");
    if (dto.media_file_id) {
      await this.assertCompletedMedia(dto.media_file_id);
    }
    const item = await this.prisma.printingCapacity.create({
      data: {
        label: dto.label ?? "",
        value: dto.value ?? "",
        unit: dto.unit ?? "",
        description: dto.description,
        imageMediaId: dto.media_file_id,
        sortOrder: dto.sort_order ?? 0,
        status: this.statusOrDefault(dto.status),
      },
      include: PRINTING_CAPACITY_ADMIN_INCLUDE,
    });
    await this.afterMutation("printing-capacities", "create", item.id, actor);
    return this.presentPrintingCapacity(item);
  }

  async updatePrintingCapacity(id: number, dto: AdminContentDto, actor: Actor) {
    if (dto.media_file_id) {
      await this.assertCompletedMedia(dto.media_file_id);
    }
    const item = await this.write(async () =>
      this.prisma.printingCapacity.update({
        where: { id },
        data: {
          label: dto.label,
          value: dto.value,
          unit: dto.unit,
          description: dto.description,
          imageMediaId: dto.media_file_id,
          sortOrder: dto.sort_order,
          status: dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : undefined,
        },
        include: PRINTING_CAPACITY_ADMIN_INCLUDE,
      }),
    );
    await this.afterMutation("printing-capacities", "update", item.id, actor);
    return this.presentPrintingCapacity(item);
  }

  async listProductionCapacities(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.ProductionCapacityWhereInput = this.searchStatusWhere(query, ["product"]);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.productionCapacity.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.productionCapacity.count({ where }),
    ]);
    return this.page(
      items.map((item) => this.presentProductionCapacity(item)),
      pagination,
      total,
    );
  }

  async getProductionCapacity(id: number) {
    const item = await this.prisma.productionCapacity.findUnique({ where: { id } });
    if (!item) {
      throw this.notFound("production-capacities");
    }
    return this.presentProductionCapacity(item);
  }

  async createProductionCapacity(dto: AdminContentDto, actor: Actor) {
    this.requireFields(dto, ["product", "value", "unit"], "production-capacities");
    const item = await this.prisma.productionCapacity.create({
      data: {
        product: dto.product ?? "",
        value: dto.value ?? "",
        unit: dto.unit ?? "",
        sortOrder: dto.sort_order ?? 0,
        status: this.statusOrDefault(dto.status),
      },
    });
    await this.afterMutation("production-capacities", "create", item.id, actor);
    return this.presentProductionCapacity(item);
  }

  async updateProductionCapacity(id: number, dto: AdminContentDto, actor: Actor) {
    const item = await this.write(async () =>
      this.prisma.productionCapacity.update({
        where: { id },
        data: {
          product: dto.product,
          value: dto.value,
          unit: dto.unit,
          sortOrder: dto.sort_order,
          status: dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : undefined,
        },
      }),
    );
    await this.afterMutation("production-capacities", "update", item.id, actor);
    return this.presentProductionCapacity(item);
  }

  async listServices(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.ServiceItemWhereInput = this.searchStatusWhere(query, ["name"]);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.serviceItem.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.serviceItem.count({ where }),
    ]);
    return this.page(
      items.map((item) => this.presentService(item)),
      pagination,
      total,
    );
  }

  async getService(id: number) {
    const item = await this.prisma.serviceItem.findUnique({ where: { id } });
    if (!item) {
      throw this.notFound("services");
    }
    return this.presentService(item);
  }

  async createService(dto: AdminContentDto, actor: Actor) {
    this.requireFields(dto, ["name"], "services");
    const item = await this.prisma.serviceItem.create({
      data: {
        name: dto.name ?? "",
        sortOrder: dto.sort_order ?? 0,
        status: this.statusOrDefault(dto.status),
      },
    });
    await this.afterMutation("services", "create", item.id, actor);
    return this.presentService(item);
  }

  async updateService(id: number, dto: AdminContentDto, actor: Actor) {
    const item = await this.write(async () =>
      this.prisma.serviceItem.update({
        where: { id },
        data: {
          name: dto.name,
          sortOrder: dto.sort_order,
          status: dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : undefined,
        },
      }),
    );
    await this.afterMutation("services", "update", item.id, actor);
    return this.presentService(item);
  }

  async listGalleryItems(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.GalleryItemWhereInput = {
      ...this.contentStatusWhere(query),
      ...(query.type ? { type: this.mediaKind(query.type) } : {}),
      ...(query.q ? { caption: { contains: query.q } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.galleryItem.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: GALLERY_ITEM_ADMIN_INCLUDE,
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.galleryItem.count({ where }),
    ]);
    return this.page(
      items.map((item) => this.presentGalleryItem(item)),
      pagination,
      total,
    );
  }

  async getGalleryItem(id: number) {
    const item = await this.prisma.galleryItem.findUnique({
      where: { id },
      include: GALLERY_ITEM_ADMIN_INCLUDE,
    });
    if (!item) {
      throw this.notFound("gallery-items");
    }
    return this.presentGalleryItem(item);
  }

  async createGalleryItem(dto: AdminContentDto, actor: Actor) {
    this.requireFields(dto, ["media_file_id", "media_type", "caption"], "gallery-items");
    await this.assertCompletedMedia(dto.media_file_id ?? 0);
    if (dto.poster_media_id) {
      await this.assertCompletedMedia(dto.poster_media_id);
    }
    const item = await this.prisma.galleryItem.create({
      data: {
        type: this.mediaKind(dto.media_type ?? "image"),
        caption: dto.caption ?? "",
        mediaFileId: dto.media_file_id,
        posterMediaId: dto.poster_media_id,
        sortOrder: dto.sort_order ?? 0,
        status: this.statusOrDefault(dto.status),
        publishedAt: this.publishedAt(dto.status, dto.published_at),
      },
      include: GALLERY_ITEM_ADMIN_INCLUDE,
    });
    await this.afterMutation("gallery-items", "create", item.id, actor);
    return this.presentGalleryItem(item);
  }

  async updateGalleryItem(id: number, dto: AdminContentDto, actor: Actor) {
    if (dto.media_file_id) {
      await this.assertCompletedMedia(dto.media_file_id);
    }
    if (dto.poster_media_id) {
      await this.assertCompletedMedia(dto.poster_media_id);
    }
    const item = await this.write(async () =>
      this.prisma.galleryItem.update({
        where: { id },
        data: {
          type: dto.media_type ? this.mediaKind(dto.media_type) : undefined,
          caption: dto.caption,
          mediaFileId: dto.media_file_id,
          posterMediaId: dto.poster_media_id,
          sortOrder: dto.sort_order,
          status: dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : undefined,
          publishedAt:
            dto.status === "published" ? this.publishedAt(dto.status, dto.published_at) : undefined,
        },
        include: GALLERY_ITEM_ADMIN_INCLUDE,
      }),
    );
    await this.afterMutation("gallery-items", "update", item.id, actor);
    return this.presentGalleryItem(item);
  }

  async listNews(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.NewsArticleWhereInput = {
      ...this.contentStatusWhere(query),
      ...(query.category ? { category: query.category } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q } },
              { slug: { contains: query.q } },
              { excerpt: { contains: query.q } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.newsArticle.findMany({
        where,
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        include: NEWS_ADMIN_INCLUDE,
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.newsArticle.count({ where }),
    ]);
    return this.page(
      items.map((item) => this.presentNews(item)),
      pagination,
      total,
    );
  }

  async getNews(id: number) {
    const item = await this.prisma.newsArticle.findUnique({
      where: { id },
      include: NEWS_ADMIN_INCLUDE,
    });
    if (!item) {
      throw this.notFound("news");
    }
    return this.presentNews(item);
  }

  async createNews(dto: AdminContentDto, actor: Actor) {
    this.requireFields(dto, ["title", "category", "excerpt"], "news");
    this.validateNewsPublish(dto);
    if (dto.thumbnail_media_file_id) {
      await this.assertCompletedMedia(dto.thumbnail_media_file_id);
    }
    if (dto.og_image_media_file_id) {
      await this.assertCompletedMedia(dto.og_image_media_file_id);
    }
    const item = await this.write(async () =>
      this.prisma.newsArticle.create({
        data: {
          title: dto.title ?? "",
          slug: dto.slug ?? this.slugify(dto.title ?? ""),
          category: dto.category ?? "",
          excerpt: dto.excerpt ?? "",
          content: dto.content ?? [],
          thumbnailMediaId: dto.thumbnail_media_file_id,
          ogMediaId: dto.og_image_media_file_id,
          status: this.statusOrDefault(dto.status),
          publishedAt: this.publishedAt(dto.status, dto.published_at),
          seoTitle: dto.seo_title,
          seoDescription: dto.seo_description,
        },
        include: NEWS_ADMIN_INCLUDE,
      }),
    );
    await this.afterMutation("news", "create", item.id, actor);
    return this.presentNews(item);
  }

  async updateNews(id: number, dto: AdminContentDto, actor: Actor) {
    const current = await this.prisma.newsArticle.findUnique({ where: { id } });
    if (!current) {
      throw this.notFound("news");
    }
    if (dto.thumbnail_media_file_id) {
      await this.assertCompletedMedia(dto.thumbnail_media_file_id);
    }
    if (dto.og_image_media_file_id) {
      await this.assertCompletedMedia(dto.og_image_media_file_id);
    }
    const nextStatus = dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : current.status;
    if (nextStatus === ContentStatus.PUBLISHED) {
      const nextContent = dto.content ?? this.readStringArray(current.content);
      if (nextContent.length === 0) {
        throw this.publishValidation("news", "content wajib untuk publish.");
      }
    }
    const item = await this.write(async () =>
      this.prisma.newsArticle.update({
        where: { id },
        data: {
          title: dto.title,
          slug: dto.slug,
          category: dto.category,
          excerpt: dto.excerpt,
          content: dto.content,
          thumbnailMediaId: dto.thumbnail_media_file_id,
          ogMediaId: dto.og_image_media_file_id,
          status: dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : undefined,
          publishedAt:
            dto.status === "published" ? this.publishedAt(dto.status, dto.published_at) : undefined,
          seoTitle: dto.seo_title,
          seoDescription: dto.seo_description,
        },
        include: NEWS_ADMIN_INCLUDE,
      }),
    );
    await this.afterMutation("news", "update", item.id, actor);
    return this.presentNews(item);
  }

  async updateStatus(
    resource: ResourceType,
    id: number,
    status: ApiPublishableContentStatus,
    actor: Actor,
  ) {
    const prismaStatus = API_TO_PRISMA_CONTENT_STATUS[status];
    if (resource === "portfolios" && prismaStatus === ContentStatus.PUBLISHED) {
      const current = await this.prisma.portfolio.findUnique({
        where: { id },
        include: { categoryRef: true },
      });
      if (!current) {
        throw this.notFound("portfolios");
      }
      if (!current.imageMediaId) {
        throw this.publishValidation("portfolios", "media_file_id wajib untuk publish.");
      }
      this.validatePortfolioCategoryForPublish(current.categoryRef);
    }
    const data = {
      status: prismaStatus,
      ...(status === "published" ? { publishedAt: new Date() } : {}),
    };
    const item = await this.updateStatusByResource(resource, id, data);
    await this.afterMutation(resource, "status", id, actor);
    return item;
  }

  async deleteResource(resource: ResourceType, id: number, actor: Actor) {
    await this.assertPermanentDeleteAllowed(resource, id);
    const mediaIds = await this.mediaIdsForResource(resource, id);
    await this.deleteByResource(resource, id);
    const cleanupResults = await Promise.all(
      [...new Set(mediaIds)].map((mediaId) => this.media.permanentlyDeleteIfUnused(mediaId, actor)),
    );
    await this.afterMutation(resource, "permanent_delete", id, actor, {
      cleanup_failed_media_count: cleanupResults.filter((result) => result === "cleanup_failed")
        .length,
      deleted_media_count: cleanupResults.filter((result) => result === "deleted").length,
      skipped_media_count: cleanupResults.filter((result) => result === "skipped").length,
    });
    return {
      cleanup_failed_media_count: cleanupResults.filter((result) => result === "cleanup_failed")
        .length,
      id,
      status: "permanently_deleted",
    };
  }

  async archiveResource(resource: ResourceType, id: number, actor: Actor) {
    const current = await this.getLifecycleByResource(resource, id);
    if (current.status === ContentStatus.ARCHIVED) {
      throw new BadRequestException({
        code: "BAD_REQUEST",
        message: "Konten ini sudah berada di arsip.",
      });
    }

    const item = await this.updateStatusByResource(resource, id, {
      archivedAt: new Date(),
      archivedById: actor.id,
      previousStatus: current.status,
      status: ContentStatus.ARCHIVED,
    });
    await this.afterMutation(resource, "archive", id, actor, {
      previous_status: PRISMA_TO_API_CONTENT_STATUS[current.status],
    });
    return item;
  }

  async archiveResourceByName(resource: string, id: number, actor: Actor) {
    return this.archiveResource(this.resourceFromParam(resource), id, actor);
  }

  async unarchiveResource(resource: ResourceType, id: number, actor: Actor) {
    const current = await this.getLifecycleByResource(resource, id);
    if (current.status !== ContentStatus.ARCHIVED) {
      throw new BadRequestException({
        code: "BAD_REQUEST",
        message: "Konten ini tidak berada di arsip.",
      });
    }

    const restoredStatus =
      current.previousStatus && current.previousStatus !== ContentStatus.ARCHIVED
        ? current.previousStatus
        : ContentStatus.DRAFT;
    const item = await this.updateStatusByResource(resource, id, {
      archivedAt: null,
      archivedById: null,
      previousStatus: null,
      status: restoredStatus,
    });
    await this.afterMutation(resource, "unarchive", id, actor, {
      restored_status: PRISMA_TO_API_CONTENT_STATUS[restoredStatus],
    });
    return item;
  }

  async unarchiveResourceByName(resource: string, id: number, actor: Actor) {
    return this.unarchiveResource(this.resourceFromParam(resource), id, actor);
  }

  async reorder(resource: ResourceType, dto: ReorderDto, actor: Actor) {
    await this.prisma.$transaction(
      dto.items.map((item) => this.reorderByResource(resource, item.id, item.sort_order)),
    );
    await this.afterMutation(resource, "reorder", undefined, actor, {
      count: dto.items.length,
    });
    return {
      status: "updated",
      count: dto.items.length,
    };
  }

  private async updateStatusByResource(
    resource: ResourceType,
    id: number,
    data: {
      archivedAt?: Date | null;
      archivedById?: number | null;
      previousStatus?: ContentStatus | null;
      publishedAt?: Date | null;
      status: ContentStatus;
    },
  ) {
    const lifecycle = {
      archivedAt: data.archivedAt,
      archivedById: data.archivedById,
      previousStatus: data.previousStatus,
      status: data.status,
    };
    return this.write(async () => {
      switch (resource) {
        case "hero":
          return this.presentHero(
            await this.prisma.heroSection.update({ where: { id }, data: lifecycle }),
          );
        case "hero-slides":
          return this.presentHeroSlide(
            await this.prisma.heroSlide.update({
              where: { id },
              data: lifecycle,
              include: HERO_SLIDE_ADMIN_INCLUDE,
            }),
          );
        case "partners":
          return this.presentPartner(
            await this.prisma.partner.update({
              where: { id },
              data: lifecycle,
              include: PARTNER_ADMIN_INCLUDE,
            }),
          );
        case "production-strengths":
          return this.presentStrength(
            await this.prisma.productionStrength.update({
              where: { id },
              data: lifecycle,
            }),
          );
        case "portfolio-categories":
          return this.presentPortfolioCategory(
            await this.prisma.portfolioCategory.update({
              where: { id },
              data: lifecycle,
            }),
          );
        case "portfolios":
          return this.presentPortfolio(
            await this.prisma.portfolio.update({
              where: { id },
              data: { ...lifecycle, publishedAt: data.publishedAt },
              include: PORTFOLIO_ADMIN_INCLUDE,
            }),
          );
        case "machines":
          return this.presentMachine(
            await this.prisma.machine.update({
              where: { id },
              data: lifecycle,
              include: MACHINE_ADMIN_INCLUDE,
            }),
          );
        case "printing-capacities":
          return this.presentPrintingCapacity(
            await this.prisma.printingCapacity.update({
              where: { id },
              data: lifecycle,
              include: PRINTING_CAPACITY_ADMIN_INCLUDE,
            }),
          );
        case "production-capacities":
          return this.presentProductionCapacity(
            await this.prisma.productionCapacity.update({
              where: { id },
              data: lifecycle,
            }),
          );
        case "services":
          return this.presentService(
            await this.prisma.serviceItem.update({ where: { id }, data: lifecycle }),
          );
        case "gallery-items":
          return this.presentGalleryItem(
            await this.prisma.galleryItem.update({
              where: { id },
              data: { ...lifecycle, publishedAt: data.publishedAt },
              include: GALLERY_ITEM_ADMIN_INCLUDE,
            }),
          );
        case "news":
          return this.presentNews(
            await this.prisma.newsArticle.update({
              where: { id },
              data: { ...lifecycle, publishedAt: data.publishedAt },
              include: NEWS_ADMIN_INCLUDE,
            }),
          );
        case "site-settings":
          throw new BadRequestException({
            code: "BAD_REQUEST",
            message: "Pengaturan website tidak memiliki status tayang.",
          });
      }
    });
  }

  private async getLifecycleByResource(
    resource: ResourceType,
    id: number,
  ): Promise<ContentLifecycle> {
    const select = { previousStatus: true, status: true } as const;
    let item: ContentLifecycle | null = null;

    switch (resource) {
      case "hero":
        item = await this.prisma.heroSection.findUnique({ where: { id }, select });
        break;
      case "hero-slides":
        item = await this.prisma.heroSlide.findUnique({ where: { id }, select });
        break;
      case "partners":
        item = await this.prisma.partner.findUnique({ where: { id }, select });
        break;
      case "production-strengths":
        item = await this.prisma.productionStrength.findUnique({ where: { id }, select });
        break;
      case "portfolio-categories":
        item = await this.prisma.portfolioCategory.findUnique({ where: { id }, select });
        break;
      case "portfolios":
        item = await this.prisma.portfolio.findUnique({ where: { id }, select });
        break;
      case "machines":
        item = await this.prisma.machine.findUnique({ where: { id }, select });
        break;
      case "printing-capacities":
        item = await this.prisma.printingCapacity.findUnique({ where: { id }, select });
        break;
      case "production-capacities":
        item = await this.prisma.productionCapacity.findUnique({ where: { id }, select });
        break;
      case "services":
        item = await this.prisma.serviceItem.findUnique({ where: { id }, select });
        break;
      case "gallery-items":
        item = await this.prisma.galleryItem.findUnique({ where: { id }, select });
        break;
      case "news":
        item = await this.prisma.newsArticle.findUnique({ where: { id }, select });
        break;
      case "site-settings":
        throw new BadRequestException({
          code: "BAD_REQUEST",
          message: "Pengaturan website tidak dapat diarsipkan atau dihapus.",
        });
    }

    if (!item) {
      throw this.notFound(resource);
    }

    return item;
  }

  private async assertPermanentDeleteAllowed(resource: ResourceType, id: number): Promise<void> {
    if (resource === "site-settings") {
      throw new BadRequestException({
        code: "BAD_REQUEST",
        message: "Pengaturan website tidak dapat dihapus.",
      });
    }

    if (resource === "portfolio-categories") {
      const count = await this.prisma.portfolio.count({ where: { categoryId: id } });
      if (count > 0) {
        throw new ConflictException({
          code: "CONFLICT",
          message:
            "Kategori masih dipakai oleh portofolio. Pindahkan portofolio ke kategori lain sebelum menghapus.",
        });
      }
    }
  }

  private async mediaIdsForResource(resource: ResourceType, id: number): Promise<number[]> {
    switch (resource) {
      case "hero": {
        const item = await this.prisma.heroSection.findUnique({
          where: { id },
          select: { slides: { select: { mediaFileId: true } } },
        });
        if (!item) {
          throw this.notFound(resource);
        }
        return item.slides.map((slide) => slide.mediaFileId).filter(this.isNumber);
      }
      case "hero-slides": {
        const item = await this.prisma.heroSlide.findUnique({
          where: { id },
          select: { mediaFileId: true },
        });
        if (!item) {
          throw this.notFound(resource);
        }
        return [item.mediaFileId].filter(this.isNumber);
      }
      case "partners": {
        const item = await this.prisma.partner.findUnique({
          where: { id },
          select: { logoMediaId: true },
        });
        if (!item) {
          throw this.notFound(resource);
        }
        return [item.logoMediaId].filter(this.isNumber);
      }
      case "portfolios": {
        const item = await this.prisma.portfolio.findUnique({
          where: { id },
          select: { imageMediaId: true },
        });
        if (!item) {
          throw this.notFound(resource);
        }
        return [item.imageMediaId].filter(this.isNumber);
      }
      case "machines": {
        const item = await this.prisma.machine.findUnique({
          where: { id },
          select: { imageMediaId: true },
        });
        if (!item) {
          throw this.notFound(resource);
        }
        return [item.imageMediaId].filter(this.isNumber);
      }
      case "printing-capacities": {
        const item = await this.prisma.printingCapacity.findUnique({
          where: { id },
          select: { imageMediaId: true },
        });
        if (!item) {
          throw this.notFound(resource);
        }
        return [item.imageMediaId].filter(this.isNumber);
      }
      case "gallery-items": {
        const item = await this.prisma.galleryItem.findUnique({
          where: { id },
          select: { mediaFileId: true, posterMediaId: true },
        });
        if (!item) {
          throw this.notFound(resource);
        }
        return [item.mediaFileId, item.posterMediaId].filter(this.isNumber);
      }
      case "news": {
        const item = await this.prisma.newsArticle.findUnique({
          where: { id },
          select: { ogMediaId: true, thumbnailMediaId: true },
        });
        if (!item) {
          throw this.notFound(resource);
        }
        return [item.thumbnailMediaId, item.ogMediaId].filter(this.isNumber);
      }
      case "portfolio-categories":
      case "production-capacities":
      case "production-strengths":
      case "services":
        await this.getLifecycleByResource(resource, id);
        return [];
      case "site-settings":
        throw new BadRequestException({
          code: "BAD_REQUEST",
          message: "Pengaturan website tidak dapat dihapus.",
        });
    }
  }

  private deleteByResource(resource: ResourceType, id: number) {
    return this.write(async () => {
      switch (resource) {
        case "hero":
          return this.prisma.heroSection.delete({ where: { id } });
        case "hero-slides":
          return this.prisma.heroSlide.delete({ where: { id } });
        case "partners":
          return this.prisma.partner.delete({ where: { id } });
        case "production-strengths":
          return this.prisma.productionStrength.delete({ where: { id } });
        case "portfolio-categories":
          return this.prisma.portfolioCategory.delete({ where: { id } });
        case "portfolios":
          return this.prisma.portfolio.delete({ where: { id } });
        case "machines":
          return this.prisma.machine.delete({ where: { id } });
        case "printing-capacities":
          return this.prisma.printingCapacity.delete({ where: { id } });
        case "production-capacities":
          return this.prisma.productionCapacity.delete({ where: { id } });
        case "services":
          return this.prisma.serviceItem.delete({ where: { id } });
        case "gallery-items":
          return this.prisma.galleryItem.delete({ where: { id } });
        case "news":
          return this.prisma.newsArticle.delete({ where: { id } });
        case "site-settings":
          throw new BadRequestException({
            code: "BAD_REQUEST",
            message: "Pengaturan website tidak dapat dihapus.",
          });
      }
    });
  }

  private isNumber(value: number | null | undefined): value is number {
    return typeof value === "number";
  }

  private reorderByResource(resource: ResourceType, id: number, sortOrder: number) {
    switch (resource) {
      case "hero-slides":
        return this.prisma.heroSlide.update({ where: { id }, data: { sortOrder } });
      case "partners":
        return this.prisma.partner.update({ where: { id }, data: { sortOrder } });
      case "production-strengths":
        return this.prisma.productionStrength.update({ where: { id }, data: { sortOrder } });
      case "portfolio-categories":
        return this.prisma.portfolioCategory.update({ where: { id }, data: { sortOrder } });
      case "portfolios":
        return this.prisma.portfolio.update({ where: { id }, data: { sortOrder } });
      case "machines":
        return this.prisma.machine.update({ where: { id }, data: { sortOrder } });
      case "printing-capacities":
        return this.prisma.printingCapacity.update({ where: { id }, data: { sortOrder } });
      case "production-capacities":
        return this.prisma.productionCapacity.update({ where: { id }, data: { sortOrder } });
      case "services":
        return this.prisma.serviceItem.update({ where: { id }, data: { sortOrder } });
      case "gallery-items":
        return this.prisma.galleryItem.update({ where: { id }, data: { sortOrder } });
      case "hero":
      case "news":
      case "site-settings":
        throw new BadRequestException({
          code: "BAD_REQUEST",
          message: "Konten ini belum bisa diurutkan ulang.",
        });
    }
  }

  private getPage(query: AdminListQueryDto) {
    return normalizePagePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 10,
      maxLimit: 100,
    });
  }

  private page<T>(items: T[], pagination: { page: number; limit: number }, total: number) {
    return {
      items,
      pagination: createPagePaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  private searchStatusWhere<T extends string>(
    query: AdminListQueryDto,
    fields: T[],
  ): {
    status?: ContentStatus | { not: ContentStatus };
    OR?: Array<Record<T, { contains: string }>>;
  } {
    return {
      ...this.contentStatusWhere(query),
      ...(query.q
        ? {
            OR: fields.map((field) => ({
              [field]: { contains: query.q ?? "" },
            })) as Array<Record<T, { contains: string }>>,
          }
        : {}),
    };
  }

  private contentStatusWhere(query: AdminListQueryDto): {
    status: ContentStatus | { not: ContentStatus };
  } {
    return {
      status: query.status
        ? API_TO_PRISMA_CONTENT_STATUS[query.status]
        : { not: ContentStatus.ARCHIVED },
    };
  }

  private resourceFromParam(resource: string): ResourceType {
    if ((CONTENT_RESOURCES as readonly string[]).includes(resource)) {
      return resource as ResourceType;
    }

    throw new BadRequestException({
      code: "BAD_REQUEST",
      message: "Menu konten tidak dikenal.",
    });
  }

  private async assertCompletedMedia(id: number): Promise<void> {
    const media = await this.prisma.mediaFile.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!media || media.status !== MediaStatus.COMPLETED) {
      throw new BadRequestException({
        code: "UNPROCESSABLE_ENTITY",
        message: "Media belum siap dipakai. Tunggu proses selesai atau unggah media lain.",
      });
    }
  }

  private async validatePublishedMedia(
    status: ApiContentStatus | undefined,
    mediaFileId: number | undefined,
    resource: ResourceType,
  ): Promise<void> {
    if (mediaFileId) {
      await this.assertCompletedMedia(mediaFileId);
    }

    if (status === "published" && !mediaFileId) {
      throw this.publishValidation(resource, "Pilih gambar sebelum menayangkan konten.");
    }
  }

  private async resolvePortfolioCategory(categoryId: number | undefined) {
    if (!categoryId) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Pilih kategori portofolio.",
      });
    }

    const category = await this.prisma.portfolioCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || category.status !== ContentStatus.PUBLISHED) {
      throw this.publishValidation("portfolios", "Pilih kategori portofolio yang aktif.");
    }

    return category;
  }

  private validatePortfolioCategoryForPublish(
    category: { status: ContentStatus } | null | undefined,
  ) {
    if (!category || category.status !== ContentStatus.PUBLISHED) {
      throw this.publishValidation("portfolios", "Pilih kategori portofolio yang aktif.");
    }
  }

  private validateNewsPublish(dto: AdminContentDto): void {
    if (dto.status === "published" && (!dto.content || dto.content.length === 0)) {
      throw this.publishValidation("news", "Isi berita wajib diisi sebelum ditayangkan.");
    }
  }

  private statusOrDefault(status: ApiContentStatus | undefined): ContentStatus {
    return status ? API_TO_PRISMA_CONTENT_STATUS[status] : ContentStatus.DRAFT;
  }

  private publishedAt(
    status: ApiContentStatus | undefined,
    value: string | undefined,
  ): Date | undefined {
    if (value) {
      return new Date(value);
    }

    return status === "published" ? new Date() : undefined;
  }

  private mediaKind(value: "image" | "video"): MediaKind {
    return value === "video" ? MediaKind.VIDEO : MediaKind.IMAGE;
  }

  private requireFields(
    dto: AdminContentDto,
    fields: Array<keyof AdminContentDto>,
    _resource: ResourceType,
  ): void {
    const missing = fields.filter((field) => {
      const value = dto[field];
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `Lengkapi bagian wajib: ${missing.map((field) => this.fieldLabel(field)).join(", ")}.`,
      });
    }
  }

  private async afterMutation(
    resourceType: ResourceType,
    action: string,
    resourceId: number | undefined,
    actor: Actor,
    metadata?: Prisma.InputJsonObject,
  ): Promise<void> {
    await this.audit.record({
      actorUserId: actor.id,
      action: `${resourceType}.${action}`,
      resourceType,
      resourceId,
      metadata,
    });
    await this.revalidation.queue({
      resourceType,
      resourceId,
      cacheKeys: this.cacheKeys(resourceType),
    });
  }

  private cacheKeys(resource: ResourceType): string[] {
    switch (resource) {
      case "site-settings":
        return ["public:home", "public:site-settings", "seo:site", "sitemap"];
      case "hero":
      case "hero-slides":
      case "partners":
        return ["public:home"];
      case "production-strengths":
        return ["public:home", "public:facilities"];
      case "portfolio-categories":
        return ["public:home", "public:portfolio:list", "public:portfolio:categories", "sitemap"];
      case "portfolios":
        return ["public:home", "public:portfolio:list", "public:portfolio:categories", "sitemap"];
      case "machines":
      case "printing-capacities":
        return ["public:home", "public:facilities"];
      case "production-capacities":
      case "services":
        return ["public:facilities"];
      case "gallery-items":
        return ["public:gallery:list", "public:home"];
      case "news":
        return ["public:news:list", "sitemap"];
    }
  }

  private presentMediaPreview(media: AdminMediaPreviewPayload | null | undefined) {
    if (!media) {
      return null;
    }

    const urls = getPublicMediaUrls(media);

    return {
      id: media.id,
      media_type: PRISMA_TO_API_MEDIA_KIND[media.kind],
      mime_type: media.mimeType,
      original_file_name: media.originalFilename,
      compression_status: PRISMA_TO_API_MEDIA_STATUS[media.status],
      file_url: urls.public_url,
      thumbnail_url: urls.thumbnail_url,
      medium_url: urls.medium_url,
      large_url: urls.large_url,
      poster_url: urls.poster_url,
      video_url: urls.video_url,
      width: media.width,
      height: media.height,
      duration_seconds: media.durationSeconds,
      created_at: media.createdAt,
      updated_at: media.updatedAt,
    };
  }

  private presentHero(item: Prisma.HeroSectionGetPayload<object>) {
    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      cta_label: item.ctaLabel,
      cta_href: item.ctaHref,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      previous_status: item.previousStatus
        ? PRISMA_TO_API_CONTENT_STATUS[item.previousStatus]
        : null,
      archived_at: item.archivedAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentHeroSlide(item: Prisma.HeroSlideGetPayload<object> | AdminHeroSlidePayload) {
    const mediaFile = "mediaFile" in item ? item.mediaFile : null;

    return {
      id: item.id,
      hero_section_id: item.heroSectionId,
      label: item.label,
      title: item.title,
      metric: item.metric,
      alt_text: item.altText,
      media_file_id: item.mediaFileId,
      media_file: this.presentMediaPreview(mediaFile),
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      previous_status: item.previousStatus
        ? PRISMA_TO_API_CONTENT_STATUS[item.previousStatus]
        : null,
      archived_at: item.archivedAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentPartner(item: Prisma.PartnerGetPayload<object> | AdminPartnerPayload) {
    const logoMedia = "logoMedia" in item ? item.logoMedia : null;

    return {
      id: item.id,
      name: item.name,
      segment: item.segment,
      logo_media_id: item.logoMediaId,
      logo_media: this.presentMediaPreview(logoMedia),
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      previous_status: item.previousStatus
        ? PRISMA_TO_API_CONTENT_STATUS[item.previousStatus]
        : null,
      archived_at: item.archivedAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentStrength(item: Prisma.ProductionStrengthGetPayload<object>) {
    return {
      id: item.id,
      label: item.label,
      value: item.value,
      suffix: item.suffix,
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      previous_status: item.previousStatus
        ? PRISMA_TO_API_CONTENT_STATUS[item.previousStatus]
        : null,
      archived_at: item.archivedAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentPortfolioCategory(item: Prisma.PortfolioCategoryGetPayload<object>) {
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      previous_status: item.previousStatus
        ? PRISMA_TO_API_CONTENT_STATUS[item.previousStatus]
        : null,
      archived_at: item.archivedAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentPortfolio(
    item:
      | Prisma.PortfolioGetPayload<object>
      | Prisma.PortfolioGetPayload<{ include: { categoryRef: true } }>
      | AdminPortfolioPayload,
  ) {
    const categoryRef = "categoryRef" in item ? item.categoryRef : null;
    const imageMedia = "imageMedia" in item ? item.imageMedia : null;

    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      category_id: item.categoryId,
      category: categoryRef?.name ?? item.category,
      category_slug: categoryRef?.slug ?? null,
      short_description: item.description,
      media_file_id: item.imageMediaId,
      media_file: this.presentMediaPreview(imageMedia),
      is_featured: item.featured,
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      previous_status: item.previousStatus
        ? PRISMA_TO_API_CONTENT_STATUS[item.previousStatus]
        : null,
      archived_at: item.archivedAt,
      published_at: item.publishedAt,
      seo_title: item.seoTitle,
      seo_description: item.seoDescription,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentMachine(item: Prisma.MachineGetPayload<object> | AdminMachinePayload) {
    const imageMedia = "imageMedia" in item ? item.imageMedia : null;

    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      metric: item.metric,
      description: item.description,
      media_file_id: item.imageMediaId,
      media_file: this.presentMediaPreview(imageMedia),
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      previous_status: item.previousStatus
        ? PRISMA_TO_API_CONTENT_STATUS[item.previousStatus]
        : null,
      archived_at: item.archivedAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentPrintingCapacity(
    item: Prisma.PrintingCapacityGetPayload<object> | AdminPrintingCapacityPayload,
  ) {
    const imageMedia = "imageMedia" in item ? item.imageMedia : null;

    return {
      id: item.id,
      label: item.label,
      value: item.value,
      unit: item.unit,
      description: item.description,
      media_file_id: item.imageMediaId,
      media_file: this.presentMediaPreview(imageMedia),
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      previous_status: item.previousStatus
        ? PRISMA_TO_API_CONTENT_STATUS[item.previousStatus]
        : null,
      archived_at: item.archivedAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentProductionCapacity(item: Prisma.ProductionCapacityGetPayload<object>) {
    return {
      id: item.id,
      product: item.product,
      value: item.value,
      unit: item.unit,
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      previous_status: item.previousStatus
        ? PRISMA_TO_API_CONTENT_STATUS[item.previousStatus]
        : null,
      archived_at: item.archivedAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentService(item: Prisma.ServiceItemGetPayload<object>) {
    return {
      id: item.id,
      name: item.name,
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      previous_status: item.previousStatus
        ? PRISMA_TO_API_CONTENT_STATUS[item.previousStatus]
        : null,
      archived_at: item.archivedAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentGalleryItem(item: Prisma.GalleryItemGetPayload<object> | AdminGalleryItemPayload) {
    const mediaFile = "mediaFile" in item ? item.mediaFile : null;
    const posterMedia = "posterMedia" in item ? item.posterMedia : null;

    return {
      id: item.id,
      media_type: item.type === MediaKind.VIDEO ? "video" : "image",
      caption: item.caption,
      media_file_id: item.mediaFileId,
      media_file: this.presentMediaPreview(mediaFile),
      poster_media_id: item.posterMediaId,
      poster_media: this.presentMediaPreview(posterMedia),
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      previous_status: item.previousStatus
        ? PRISMA_TO_API_CONTENT_STATUS[item.previousStatus]
        : null,
      archived_at: item.archivedAt,
      published_at: item.publishedAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentNews(item: Prisma.NewsArticleGetPayload<object> | AdminNewsPayload) {
    const thumbnailMedia = "thumbnailMedia" in item ? item.thumbnailMedia : null;
    const ogMedia = "ogMedia" in item ? item.ogMedia : null;

    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      category: item.category,
      excerpt: item.excerpt,
      content: this.readStringArray(item.content),
      thumbnail_media_file_id: item.thumbnailMediaId,
      thumbnail_media_file: this.presentMediaPreview(thumbnailMedia),
      og_image_media_file_id: item.ogMediaId,
      og_image_media_file: this.presentMediaPreview(ogMedia),
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      previous_status: item.previousStatus
        ? PRISMA_TO_API_CONTENT_STATUS[item.previousStatus]
        : null,
      archived_at: item.archivedAt,
      published_at: item.publishedAt,
      seo_title: item.seoTitle,
      seo_description: item.seoDescription,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private readStringArray(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((item): item is string => typeof item === "string");
  }

  private slugify(value: string): string {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return slug || `konten-${Date.now()}`;
  }

  private publishValidation(
    _resource: ResourceType,
    message: string,
  ): UnprocessableEntityException {
    return new UnprocessableEntityException({
      code: "UNPROCESSABLE_ENTITY",
      message,
    });
  }

  private fieldLabel(field: keyof AdminContentDto): string {
    const labels: Partial<Record<keyof AdminContentDto, string>> = {
      alt_text: "teks gambar",
      caption: "caption",
      category: "kategori",
      category_id: "kategori",
      content: "isi konten",
      cta_href: "link tombol",
      cta_label: "teks tombol",
      description: "deskripsi",
      excerpt: "ringkasan",
      hero_section_id: "bagian hero",
      label: "label",
      logo_media_id: "logo",
      media_file_id: "gambar",
      name: "nama",
      og_image_media_file_id: "gambar saat dibagikan",
      poster_media_id: "poster video",
      product: "produk",
      short_description: "deskripsi singkat",
      slug: "alamat halaman",
      subtitle: "subtitle",
      thumbnail_media_file_id: "thumbnail",
      title: "judul",
    };

    return labels[field] ?? String(field).replace(/_/g, " ");
  }

  private resourceLabel(resource: ResourceType): string {
    const labels: Record<ResourceType, string> = {
      "gallery-items": "Galeri",
      "hero-slides": "Slide hero",
      "portfolio-categories": "Kategori portofolio",
      "printing-capacities": "Kapasitas printing",
      "production-capacities": "Kapasitas produksi",
      "production-strengths": "Kekuatan produksi",
      hero: "Konten beranda",
      machines: "Mesin",
      news: "Berita",
      partners: "Logo klien",
      portfolios: "Portofolio",
      services: "Layanan",
      "site-settings": "Pengaturan website",
    };

    return labels[resource];
  }

  private notFound(resource: ResourceType): NotFoundException {
    return new NotFoundException({
      code: "NOT_FOUND",
      message: `${this.resourceLabel(resource)} tidak ditemukan.`,
    });
  }

  private async write<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException({
            code: "CONFLICT",
            message: "Alamat halaman atau data unik tersebut sudah digunakan.",
          });
        }

        if (error.code === "P2025") {
          throw new NotFoundException({
            code: "NOT_FOUND",
            message: "Data tidak ditemukan.",
          });
        }
      }

      throw error;
    }
  }
}
