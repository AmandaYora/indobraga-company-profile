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
  PRISMA_TO_API_CONTENT_STATUS,
} from "@/core/content-status.dto";
import { createPagePaginationMeta, normalizePagePagination } from "@/core/pagination";
import { PrismaService } from "@/database/prisma.service";
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
  | "portfolios"
  | "machines"
  | "printing-capacities"
  | "production-capacities"
  | "services"
  | "gallery-items"
  | "news";

@Injectable()
export class AdminContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly revalidation: RevalidationService,
  ) {}

  async getSiteSettings() {
    const settings = await this.prisma.siteSettings.findUnique({
      where: { id: 1 },
      include: { ogMediaFile: true },
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
      og_media_file_id: settings.ogMediaFileId,
      og_image_url: settings.ogMediaFile?.publicUrl ?? settings.ogMediaFile?.largeUrl ?? null,
      created_at: settings.createdAt,
      updated_at: settings.updatedAt,
    };
  }

  async updateSiteSettings(dto: SiteSettingsUpdateDto, actor: Actor) {
    if (dto.og_media_file_id) {
      await this.assertCompletedMedia(dto.og_media_file_id);
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
        ogMediaFileId: dto.og_media_file_id,
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
        ogMediaFileId: dto.og_media_file_id,
      },
      include: { ogMediaFile: true },
    });

    await this.afterMutation("site-settings", "update", settings.id, actor);
    return this.getSiteSettings();
  }

  async listHero(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.HeroSectionWhereInput = {
      ...(query.status ? { status: API_TO_PRISMA_CONTENT_STATUS[query.status] } : {}),
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
      include: { slides: true },
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
      ...(query.status ? { status: API_TO_PRISMA_CONTENT_STATUS[query.status] } : {}),
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
    const item = await this.prisma.heroSlide.findUnique({ where: { id } });
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
      }),
    );
    await this.afterMutation("hero-slides", "update", item.id, actor);
    return this.presentHeroSlide(item);
  }

  async listPartners(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.PartnerWhereInput = {
      ...(query.status ? { status: API_TO_PRISMA_CONTENT_STATUS[query.status] } : {}),
      ...(query.segment ? { segment: query.segment } : {}),
      ...(query.q ? { name: { contains: query.q } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.partner.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
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
    const item = await this.prisma.partner.findUnique({ where: { id } });
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
      }),
    );
    await this.afterMutation("partners", "update", item.id, actor);
    return this.presentPartner(item);
  }

  async listStrengths(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.ProductionStrengthWhereInput = {
      ...(query.status ? { status: API_TO_PRISMA_CONTENT_STATUS[query.status] } : {}),
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

  async listPortfolios(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.PortfolioWhereInput = {
      ...(query.status ? { status: API_TO_PRISMA_CONTENT_STATUS[query.status] } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q } },
              { category: { contains: query.q } },
              { description: { contains: query.q } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.portfolio.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
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
    const item = await this.prisma.portfolio.findUnique({ where: { id } });
    if (!item) {
      throw this.notFound("portfolios");
    }
    return this.presentPortfolio(item);
  }

  async createPortfolio(dto: AdminContentDto, actor: Actor) {
    this.requireFields(dto, ["title", "category"], "portfolios");
    await this.validatePublishedMedia(dto.status, dto.media_file_id, "portfolios");
    const item = await this.write(async () =>
      this.prisma.portfolio.create({
        data: {
          title: dto.title ?? "",
          slug: dto.slug ?? this.slugify(dto.title ?? ""),
          category: dto.category ?? "",
          description: dto.short_description ?? dto.description,
          imageMediaId: dto.media_file_id,
          featured: dto.is_featured ?? false,
          sortOrder: dto.sort_order ?? 0,
          status: this.statusOrDefault(dto.status),
          publishedAt: this.publishedAt(dto.status, dto.published_at),
          seoTitle: dto.seo_title,
          seoDescription: dto.seo_description,
        },
      }),
    );
    await this.afterMutation("portfolios", "create", item.id, actor);
    return this.presentPortfolio(item);
  }

  async updatePortfolio(id: number, dto: AdminContentDto, actor: Actor) {
    if (dto.media_file_id) {
      await this.assertCompletedMedia(dto.media_file_id);
    }
    const current = await this.prisma.portfolio.findUnique({ where: { id } });
    if (!current) {
      throw this.notFound("portfolios");
    }
    const nextStatus = dto.status ? API_TO_PRISMA_CONTENT_STATUS[dto.status] : current.status;
    if (nextStatus === ContentStatus.PUBLISHED && !(dto.media_file_id ?? current.imageMediaId)) {
      throw this.publishValidation("portfolios", "media_file_id wajib untuk publish.");
    }
    const item = await this.write(async () =>
      this.prisma.portfolio.update({
        where: { id },
        data: {
          title: dto.title,
          slug: dto.slug,
          category: dto.category,
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
    const item = await this.prisma.machine.findUnique({ where: { id } });
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
    const item = await this.prisma.printingCapacity.findUnique({ where: { id } });
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
      ...(query.status ? { status: API_TO_PRISMA_CONTENT_STATUS[query.status] } : {}),
      ...(query.type ? { type: this.mediaKind(query.type) } : {}),
      ...(query.q ? { caption: { contains: query.q } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.galleryItem.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
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
    const item = await this.prisma.galleryItem.findUnique({ where: { id } });
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
      }),
    );
    await this.afterMutation("gallery-items", "update", item.id, actor);
    return this.presentGalleryItem(item);
  }

  async listNews(query: AdminListQueryDto) {
    const pagination = this.getPage(query);
    const where: Prisma.NewsArticleWhereInput = {
      ...(query.status ? { status: API_TO_PRISMA_CONTENT_STATUS[query.status] } : {}),
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
    const item = await this.prisma.newsArticle.findUnique({ where: { id } });
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
      }),
    );
    await this.afterMutation("news", "update", item.id, actor);
    return this.presentNews(item);
  }

  async updateStatus(resource: ResourceType, id: number, status: ApiContentStatus, actor: Actor) {
    const prismaStatus = API_TO_PRISMA_CONTENT_STATUS[status];
    const data = {
      status: prismaStatus,
      ...(status === "published" ? { publishedAt: new Date() } : {}),
    };
    const item = await this.updateStatusByResource(resource, id, data);
    await this.afterMutation(resource, "status", id, actor);
    return item;
  }

  async deleteResource(resource: ResourceType, id: number, actor: Actor) {
    const item = await this.updateStatusByResource(resource, id, {
      status: ContentStatus.INACTIVE,
    });
    await this.afterMutation(resource, "delete", id, actor);
    return item;
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
    data: { status: ContentStatus; publishedAt?: Date },
  ) {
    return this.write(async () => {
      switch (resource) {
        case "hero":
          return this.presentHero(
            await this.prisma.heroSection.update({ where: { id }, data: { status: data.status } }),
          );
        case "hero-slides":
          return this.presentHeroSlide(
            await this.prisma.heroSlide.update({ where: { id }, data: { status: data.status } }),
          );
        case "partners":
          return this.presentPartner(
            await this.prisma.partner.update({ where: { id }, data: { status: data.status } }),
          );
        case "production-strengths":
          return this.presentStrength(
            await this.prisma.productionStrength.update({
              where: { id },
              data: { status: data.status },
            }),
          );
        case "portfolios":
          return this.presentPortfolio(
            await this.prisma.portfolio.update({
              where: { id },
              data: { status: data.status, publishedAt: data.publishedAt },
            }),
          );
        case "machines":
          return this.presentMachine(
            await this.prisma.machine.update({ where: { id }, data: { status: data.status } }),
          );
        case "printing-capacities":
          return this.presentPrintingCapacity(
            await this.prisma.printingCapacity.update({
              where: { id },
              data: { status: data.status },
            }),
          );
        case "production-capacities":
          return this.presentProductionCapacity(
            await this.prisma.productionCapacity.update({
              where: { id },
              data: { status: data.status },
            }),
          );
        case "services":
          return this.presentService(
            await this.prisma.serviceItem.update({ where: { id }, data: { status: data.status } }),
          );
        case "gallery-items":
          return this.presentGalleryItem(
            await this.prisma.galleryItem.update({
              where: { id },
              data: { status: data.status, publishedAt: data.publishedAt },
            }),
          );
        case "news":
          return this.presentNews(
            await this.prisma.newsArticle.update({
              where: { id },
              data: { status: data.status, publishedAt: data.publishedAt },
            }),
          );
        case "site-settings":
          throw new BadRequestException({
            code: "BAD_REQUEST",
            message: "Site settings tidak memiliki status.",
          });
      }
    });
  }

  private reorderByResource(resource: ResourceType, id: number, sortOrder: number) {
    switch (resource) {
      case "hero-slides":
        return this.prisma.heroSlide.update({ where: { id }, data: { sortOrder } });
      case "partners":
        return this.prisma.partner.update({ where: { id }, data: { sortOrder } });
      case "production-strengths":
        return this.prisma.productionStrength.update({ where: { id }, data: { sortOrder } });
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
          message: `Resource ${resource} tidak mendukung reorder.`,
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
  ): { status?: ContentStatus; OR?: Array<Record<T, { contains: string }>> } {
    return {
      ...(query.status ? { status: API_TO_PRISMA_CONTENT_STATUS[query.status] } : {}),
      ...(query.q
        ? {
            OR: fields.map((field) => ({
              [field]: { contains: query.q ?? "" },
            })) as Array<Record<T, { contains: string }>>,
          }
        : {}),
    };
  }

  private async assertCompletedMedia(id: number): Promise<void> {
    const media = await this.prisma.mediaFile.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!media || media.status !== MediaStatus.COMPLETED) {
      throw new BadRequestException({
        code: "UNPROCESSABLE_ENTITY",
        message: "Media harus tersedia dan berstatus completed.",
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
      throw this.publishValidation(resource, "media_file_id wajib untuk publish.");
    }
  }

  private validateNewsPublish(dto: AdminContentDto): void {
    if (dto.status === "published" && (!dto.content || dto.content.length === 0)) {
      throw this.publishValidation("news", "content wajib untuk publish.");
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
    resource: ResourceType,
  ): void {
    const missing = fields.filter((field) => {
      const value = dto[field];
      return value === undefined || value === null || value === "";
    });

    if (missing.length > 0) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: `${resource} wajib memiliki field: ${missing.join(", ")}.`,
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
        return ["public:home", "seo:site", "sitemap"];
      case "hero":
      case "hero-slides":
      case "partners":
        return ["public:home"];
      case "production-strengths":
        return ["public:home", "public:facilities"];
      case "portfolios":
        return ["public:home", "public:portfolio:list", "sitemap"];
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

  private presentHero(item: Prisma.HeroSectionGetPayload<object>) {
    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      cta_label: item.ctaLabel,
      cta_href: item.ctaHref,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentHeroSlide(item: Prisma.HeroSlideGetPayload<object>) {
    return {
      id: item.id,
      hero_section_id: item.heroSectionId,
      label: item.label,
      title: item.title,
      metric: item.metric,
      alt_text: item.altText,
      media_file_id: item.mediaFileId,
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentPartner(item: Prisma.PartnerGetPayload<object>) {
    return {
      id: item.id,
      name: item.name,
      segment: item.segment,
      logo_media_id: item.logoMediaId,
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
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
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentPortfolio(item: Prisma.PortfolioGetPayload<object>) {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      category: item.category,
      short_description: item.description,
      media_file_id: item.imageMediaId,
      is_featured: item.featured,
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      published_at: item.publishedAt,
      seo_title: item.seoTitle,
      seo_description: item.seoDescription,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentMachine(item: Prisma.MachineGetPayload<object>) {
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      metric: item.metric,
      description: item.description,
      media_file_id: item.imageMediaId,
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentPrintingCapacity(item: Prisma.PrintingCapacityGetPayload<object>) {
    return {
      id: item.id,
      label: item.label,
      value: item.value,
      unit: item.unit,
      description: item.description,
      media_file_id: item.imageMediaId,
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
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
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentGalleryItem(item: Prisma.GalleryItemGetPayload<object>) {
    return {
      id: item.id,
      media_type: item.type === MediaKind.VIDEO ? "video" : "image",
      caption: item.caption,
      media_file_id: item.mediaFileId,
      poster_media_id: item.posterMediaId,
      sort_order: item.sortOrder,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
      published_at: item.publishedAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentNews(item: Prisma.NewsArticleGetPayload<object>) {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      category: item.category,
      excerpt: item.excerpt,
      content: this.readStringArray(item.content),
      thumbnail_media_file_id: item.thumbnailMediaId,
      og_image_media_file_id: item.ogMediaId,
      status: PRISMA_TO_API_CONTENT_STATUS[item.status],
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

  private publishValidation(resource: ResourceType, message: string): UnprocessableEntityException {
    return new UnprocessableEntityException({
      code: "UNPROCESSABLE_ENTITY",
      message: `${resource}: ${message}`,
    });
  }

  private notFound(resource: ResourceType): NotFoundException {
    return new NotFoundException({
      code: "NOT_FOUND",
      message: `${resource} tidak ditemukan.`,
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
            message: "Slug atau nilai unik sudah digunakan.",
          });
        }

        if (error.code === "P2025") {
          throw new NotFoundException({
            code: "NOT_FOUND",
            message: "Resource tidak ditemukan.",
          });
        }
      }

      throw error;
    }
  }
}
