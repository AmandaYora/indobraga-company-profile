import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ContentStatus, MediaKind, MediaStatus, Prisma } from "@prisma/client";
import type { AuditService } from "@/audit/audit.service";
import { AdminContentService } from "@/admin-content/admin-content.service";
import type { MediaService } from "@/media/media.service";
import type { RevalidationService } from "@/revalidation/revalidation.service";

const now = new Date("2026-05-11T00:00:00.000Z");

const auditMock = () => ({
  record: jest.fn().mockResolvedValue(undefined),
});

const revalidationMock = () => ({
  queue: jest.fn().mockResolvedValue(undefined),
});

const mediaCleanupMock = () => ({
  permanentlyDeleteIfUnused: jest.fn().mockResolvedValue("skipped"),
});

const firstMockArg = <T>(mock: jest.Mock): T => {
  const calls = mock.mock.calls as unknown[][];
  return calls[0]?.[0] as T;
};

const prismaMock = () => ({
  $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
  heroSection: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  heroSlide: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  siteSettings: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  mediaFile: {
    findUnique: jest.fn(),
  },
  partner: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  productionStrength: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  portfolio: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  portfolioCategory: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  machine: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  printingCapacity: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  productionCapacity: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  newsArticle: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  galleryItem: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  serviceItem: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
});

const completedMedia = {
  id: 7,
  status: MediaStatus.COMPLETED,
};

const portfolioCategory = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: "Kaos",
  slug: "kaos",
  sortOrder: 10,
  status: ContentStatus.PUBLISHED,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const portfolio = (overrides: Record<string, unknown> = {}) => ({
  id: 21,
  title: "Kaos Event",
  slug: "kaos-event",
  category: "Kaos",
  categoryId: 1,
  categoryRef: portfolioCategory(),
  description: "Produksi kaos event",
  imageMediaId: 7,
  featured: false,
  sortOrder: 3,
  status: ContentStatus.DRAFT,
  publishedAt: null,
  seoTitle: null,
  seoDescription: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const hero = (overrides: Record<string, unknown> = {}) => ({
  id: 11,
  title: "Hero Utama",
  subtitle: "Produksi garment Bandung",
  ctaLabel: "Hubungi Kami",
  ctaHref: "/kontak",
  status: ContentStatus.PUBLISHED,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const heroSlide = (overrides: Record<string, unknown> = {}) => ({
  id: 12,
  heroSectionId: 11,
  label: "Workshop",
  title: "Produksi rapi",
  metric: "500 pcs/hari",
  altText: "Workshop Indobraga",
  mediaFileId: 7,
  sortOrder: 2,
  status: ContentStatus.DRAFT,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const partner = (overrides: Record<string, unknown> = {}) => ({
  id: 13,
  name: "Brand Partner",
  segment: "Retail",
  logoMediaId: 7,
  sortOrder: 1,
  status: ContentStatus.DRAFT,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const strength = (overrides: Record<string, unknown> = {}) => ({
  id: 14,
  label: "Kapasitas",
  value: "10K",
  suffix: "pcs",
  sortOrder: 1,
  status: ContentStatus.DRAFT,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const machine = (overrides: Record<string, unknown> = {}) => ({
  id: 15,
  name: "Mesin Jahit",
  slug: "mesin-jahit",
  metric: "24 unit",
  description: "Line produksi",
  imageMediaId: 7,
  sortOrder: 1,
  status: ContentStatus.DRAFT,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const printingCapacity = (overrides: Record<string, unknown> = {}) => ({
  id: 16,
  label: "Sablon",
  value: "1000",
  unit: "pcs",
  description: "Per hari",
  imageMediaId: 7,
  sortOrder: 1,
  status: ContentStatus.DRAFT,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const productionCapacity = (overrides: Record<string, unknown> = {}) => ({
  id: 17,
  product: "Kaos",
  value: "500",
  unit: "pcs/hari",
  sortOrder: 1,
  status: ContentStatus.DRAFT,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const galleryItem = (overrides: Record<string, unknown> = {}) => ({
  id: 41,
  type: MediaKind.IMAGE,
  caption: "Galeri produksi",
  mediaFileId: 7,
  posterMediaId: null,
  sortOrder: 5,
  status: ContentStatus.PUBLISHED,
  publishedAt: now,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const news = (overrides: Record<string, unknown> = {}) => ({
  id: 51,
  title: "Berita Produksi",
  slug: "berita-produksi",
  category: "Produksi",
  excerpt: "Update produksi",
  content: ["Paragraf pertama"],
  thumbnailMediaId: 7,
  ogMediaId: null,
  status: ContentStatus.DRAFT,
  publishedAt: null,
  seoTitle: null,
  seoDescription: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

describe("AdminContentService", () => {
  it("presents site settings with OG image fallback", async () => {
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
      seoTitle: "Indobraga",
      seoDescription: "Garment",
      logoMediaFileId: 9,
      logoMediaFile: {
        largeUrl: null,
        mediumUrl: "https://cdn.example.test/logo-medium.webp",
        publicUrl: "https://cdn.example.test/logo.webp",
      },
      ogMediaFileId: 7,
      ogMediaFile: { publicUrl: null, largeUrl: "https://cdn.example.test/og.webp" },
      contactHeroMediaFileId: 8,
      contactHeroMediaFile: {
        largeUrl: "https://cdn.example.test/contact-hero-large.webp",
        mediumUrl: "https://cdn.example.test/contact-hero-medium.webp",
        publicUrl: "https://cdn.example.test/contact-hero.webp",
      },
      createdAt: now,
      updatedAt: now,
    });
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(service.getSiteSettings()).resolves.toMatchObject({
      brand: "Indobraga",
      legal_name: "PT Braga Indonesia Perkasa",
      logo_media_file_id: 9,
      logo_url: "https://cdn.example.test/logo-medium.webp",
      og_media_file_id: 7,
      og_image_url: "https://cdn.example.test/og.webp",
      contact_hero_media_file_id: 8,
      contact_hero_image_url: "https://cdn.example.test/contact-hero-large.webp",
    });
  });

  it("updates site settings through mapped Prisma fields and queues public revalidation", async () => {
    const prisma = prismaMock();
    const audit = auditMock();
    const revalidation = revalidationMock();
    prisma.mediaFile.findUnique.mockResolvedValue(completedMedia);
    prisma.siteSettings.upsert.mockResolvedValue({ id: 1 });
    prisma.siteSettings.findUnique.mockResolvedValue({
      id: 1,
      brand: "Indobraga Baru",
      legalName: "PT Baru",
      email: "support@indobraga.com",
      phone: "0851",
      whatsapp: "62851",
      instagram: "indobraga",
      contactPerson: "Dika",
      contactRole: "Marketing",
      address: "Bandung",
      seoTitle: "SEO",
      seoDescription: "Description",
      logoMediaFileId: 9,
      logoMediaFile: null,
      ogMediaFileId: 7,
      ogMediaFile: null,
      contactHeroMediaFileId: 8,
      contactHeroMediaFile: null,
      createdAt: now,
      updatedAt: now,
    });
    const service = new AdminContentService(
      prisma as never,
      audit as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidation as unknown as RevalidationService,
    );

    await service.updateSiteSettings(
      {
        brand: "Indobraga Baru",
        legal_name: "PT Baru",
        email: "support@indobraga.com",
        phone: "0851",
        whatsapp: "62851",
        instagram: "indobraga",
        contact_person: "Dika",
        contact_role: "Marketing",
        address: "Bandung",
        seo_title: "SEO",
        seo_description: "Description",
        logo_media_file_id: 9,
        og_media_file_id: 7,
        contact_hero_media_file_id: 8,
      },
      { id: 9 },
    );

    expect(prisma.mediaFile.findUnique).toHaveBeenCalledWith({
      where: { id: 9 },
      select: { id: true, status: true },
    });
    expect(prisma.mediaFile.findUnique).toHaveBeenCalledWith({
      where: { id: 7 },
      select: { id: true, status: true },
    });
    expect(prisma.mediaFile.findUnique).toHaveBeenCalledWith({
      where: { id: 8 },
      select: { id: true, status: true },
    });
    const upsertArg = firstMockArg<{
      update: Record<string, unknown>;
    }>(prisma.siteSettings.upsert);
    expect(upsertArg.update).toMatchObject({
      contactHeroMediaFileId: 8,
      contactPerson: "Dika",
      legalName: "PT Baru",
      logoMediaFileId: 9,
      ogMediaFileId: 7,
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "site-settings.update",
        actorUserId: 9,
        resourceType: "site-settings",
      }),
    );
    expect(revalidation.queue).toHaveBeenCalledWith(
      expect.objectContaining({
        cacheKeys: ["public:home", "public:site-settings", "seo:site", "sitemap"],
      }),
    );
  });

  it("lists hero sections with status/search filters and page metadata", async () => {
    const prisma = prismaMock();
    prisma.heroSection.findMany.mockResolvedValue([hero()]);
    prisma.heroSection.count.mockResolvedValue(1);
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(
      service.listHero({ limit: 5, page: 2, q: "garment", status: "published" }),
    ).resolves.toMatchObject({
      items: [
        {
          cta_href: "/kontak",
          cta_label: "Hubungi Kami",
          id: 11,
          status: "published",
          title: "Hero Utama",
        },
      ],
      pagination: {
        limit: 5,
        page: 2,
        total: 1,
      },
    });
    const findManyArg = firstMockArg<{
      skip: number;
      take: number;
      where: Record<string, unknown>;
    }>(prisma.heroSection.findMany);
    expect(findManyArg.skip).toBe(5);
    expect(findManyArg.take).toBe(5);
    expect(findManyArg.where).toMatchObject({
      OR: [{ title: { contains: "garment" } }, { subtitle: { contains: "garment" } }],
      status: ContentStatus.PUBLISHED,
    });
  });

  it("presents hero detail with slides and rejects incomplete hero creation", async () => {
    const prisma = prismaMock();
    prisma.heroSection.findUnique.mockResolvedValue({
      ...hero(),
      slides: [heroSlide({ status: ContentStatus.PUBLISHED })],
    });
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(service.getHero(11)).resolves.toMatchObject({
      id: 11,
      slides: [
        {
          hero_section_id: 11,
          media_file_id: 7,
          status: "published",
          title: "Produksi rapi",
        },
      ],
    });
    await expect(service.createHero({ subtitle: "Tanpa title" }, { id: 9 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.heroSection.create).not.toHaveBeenCalled();
  });

  it("creates hero slides with completed media and maps cache invalidation", async () => {
    const prisma = prismaMock();
    const audit = auditMock();
    const revalidation = revalidationMock();
    prisma.mediaFile.findUnique.mockResolvedValue(completedMedia);
    prisma.heroSlide.create.mockResolvedValue(heroSlide({ status: ContentStatus.PUBLISHED }));
    const service = new AdminContentService(
      prisma as never,
      audit as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidation as unknown as RevalidationService,
    );

    await expect(
      service.createHeroSlide(
        {
          alt_text: "Workshop",
          hero_section_id: 11,
          label: "Workshop",
          media_file_id: 7,
          metric: "500 pcs/hari",
          sort_order: 2,
          status: "published",
          title: "Produksi rapi",
        },
        { id: 9 },
      ),
    ).resolves.toMatchObject({
      alt_text: "Workshop Indobraga",
      hero_section_id: 11,
      media_file_id: 7,
      status: "published",
    });
    const createArg = firstMockArg<{ data: Record<string, unknown> }>(prisma.heroSlide.create);
    expect(createArg.data).toMatchObject({
      altText: "Workshop",
      heroSectionId: 11,
      mediaFileId: 7,
      sortOrder: 2,
      status: ContentStatus.PUBLISHED,
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "hero-slides.create",
        actorUserId: 9,
      }),
    );
    expect(revalidation.queue).toHaveBeenCalledWith(
      expect.objectContaining({
        cacheKeys: ["public:home"],
      }),
    );
  });

  it("lists and updates partners with segment filter and completed logo validation", async () => {
    const prisma = prismaMock();
    const revalidation = revalidationMock();
    prisma.partner.findMany.mockResolvedValue([partner({ status: ContentStatus.PUBLISHED })]);
    prisma.partner.count.mockResolvedValue(1);
    prisma.mediaFile.findUnique.mockResolvedValue(completedMedia);
    prisma.partner.update.mockResolvedValue(partner({ name: "Brand Baru" }));
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidation as unknown as RevalidationService,
    );

    await expect(
      service.listPartners({ q: "Brand", segment: "Retail", status: "published" }),
    ).resolves.toMatchObject({
      items: [{ logo_media_id: 7, name: "Brand Partner", status: "published" }],
    });
    const findManyArg = firstMockArg<{ where: Record<string, unknown> }>(prisma.partner.findMany);
    expect(findManyArg.where).toMatchObject({
      name: { contains: "Brand" },
      segment: "Retail",
      status: ContentStatus.PUBLISHED,
    });

    await expect(
      service.updatePartner(13, { logo_media_id: 7, name: "Brand Baru", sort_order: 3 }, { id: 9 }),
    ).resolves.toMatchObject({
      logo_media_id: 7,
      name: "Brand Baru",
    });
    const updateArg = firstMockArg<{ data: Record<string, unknown> }>(prisma.partner.update);
    expect(updateArg.data).toMatchObject({
      logoMediaId: 7,
      name: "Brand Baru",
      sortOrder: 3,
    });
    expect(revalidation.queue).toHaveBeenCalledWith(
      expect.objectContaining({
        cacheKeys: ["public:home"],
      }),
    );
  });

  it("creates production strengths and validates required strength fields", async () => {
    const prisma = prismaMock();
    prisma.productionStrength.create.mockResolvedValue(
      strength({ status: ContentStatus.PUBLISHED }),
    );
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(service.createStrength({ label: "Kapasitas" }, { id: 9 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.createStrength(
        { label: "Kapasitas", sort_order: 1, status: "published", suffix: "pcs", value: "10K" },
        { id: 9 },
      ),
    ).resolves.toMatchObject({
      label: "Kapasitas",
      status: "published",
      value: "10K",
    });
    const createArg = firstMockArg<{ data: Record<string, unknown> }>(
      prisma.productionStrength.create,
    );
    expect(createArg.data).toMatchObject({
      label: "Kapasitas",
      sortOrder: 1,
      status: ContentStatus.PUBLISHED,
      suffix: "pcs",
      value: "10K",
    });
  });

  it("rejects published portfolio creation when media is missing", async () => {
    const prisma = prismaMock();
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(
      service.createPortfolio(
        {
          title: "Kaos Event",
          category_id: 1,
          status: "published",
        },
        { id: 9 },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prisma.portfolio.create).not.toHaveBeenCalled();
  });

  it("publishes an existing portfolio when current media satisfies the rule", async () => {
    const prisma = prismaMock();
    prisma.portfolio.findUnique.mockResolvedValue(portfolio({ status: ContentStatus.DRAFT }));
    prisma.portfolio.update.mockResolvedValue(portfolio({ status: ContentStatus.PUBLISHED }));
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(service.updatePortfolio(21, { status: "published" }, { id: 9 })).resolves.toEqual(
      expect.objectContaining({
        id: 21,
        status: "published",
        media_file_id: 7,
      }),
    );
    const updateArg = firstMockArg<{
      data: Record<string, unknown>;
    }>(prisma.portfolio.update);
    expect(updateArg.data.status).toBe(ContentStatus.PUBLISHED);
    expect(updateArg.data.publishedAt).toBeInstanceOf(Date);
  });

  it("lists portfolios with category search and creates portfolio slugs from title", async () => {
    const prisma = prismaMock();
    const audit = auditMock();
    prisma.portfolio.findMany.mockResolvedValue([portfolio({ status: ContentStatus.PUBLISHED })]);
    prisma.portfolio.count.mockResolvedValue(1);
    prisma.mediaFile.findUnique.mockResolvedValue(completedMedia);
    prisma.portfolioCategory.findUnique.mockResolvedValue(
      portfolioCategory({ id: 2, name: "Komunitas", slug: "komunitas" }),
    );
    prisma.portfolio.create.mockResolvedValue(
      portfolio({
        category: "Komunitas",
        categoryId: 2,
        categoryRef: portfolioCategory({ id: 2, name: "Komunitas", slug: "komunitas" }),
        featured: true,
        publishedAt: now,
        slug: "kaos-komunitas-bandung",
        status: ContentStatus.PUBLISHED,
      }),
    );
    const service = new AdminContentService(
      prisma as never,
      audit as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(
      service.listPortfolios({ category: "Kaos", limit: 10, page: 1, q: "event" }),
    ).resolves.toMatchObject({
      items: [{ category: "Kaos", slug: "kaos-event", status: "published" }],
    });
    const findManyArg = firstMockArg<{ where: Record<string, unknown> }>(prisma.portfolio.findMany);
    expect(findManyArg.where).toMatchObject({
      AND: [
        {
          OR: [
            { category: "Kaos" },
            { categoryRef: { is: { name: "Kaos" } } },
            { categoryRef: { is: { slug: "Kaos" } } },
          ],
        },
        {
          OR: [
            { title: { contains: "event" } },
            { category: { contains: "event" } },
            { categoryRef: { is: { name: { contains: "event" } } } },
            { description: { contains: "event" } },
          ],
        },
      ],
    });

    await expect(
      service.createPortfolio(
        {
          category_id: 2,
          is_featured: true,
          media_file_id: 7,
          published_at: now.toISOString(),
          short_description: "Produksi kaos komunitas",
          status: "published",
          title: "Kaos Komunitas Bandung",
        },
        { id: 9 },
      ),
    ).resolves.toMatchObject({
      is_featured: true,
      slug: "kaos-komunitas-bandung",
      status: "published",
    });
    const createArg = firstMockArg<{ data: Record<string, unknown> }>(prisma.portfolio.create);
    expect(createArg.data).toMatchObject({
      category: "Komunitas",
      categoryId: 2,
      description: "Produksi kaos komunitas",
      featured: true,
      imageMediaId: 7,
      publishedAt: now,
      slug: "kaos-komunitas-bandung",
      status: ContentStatus.PUBLISHED,
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "portfolios.create",
        metadata: undefined,
      }),
    );
  });

  it("manages portfolio categories as an admin content resource", async () => {
    const prisma = prismaMock();
    const audit = auditMock();
    prisma.portfolioCategory.findMany.mockResolvedValue([
      portfolioCategory({ name: "Jersey", slug: "jersey" }),
    ]);
    prisma.portfolioCategory.count.mockResolvedValue(1);
    prisma.portfolioCategory.create.mockResolvedValue(
      portfolioCategory({ id: 2, name: "Wearpack", slug: "wearpack", sortOrder: 30 }),
    );
    prisma.portfolioCategory.update.mockResolvedValue(
      portfolioCategory({ id: 2, name: "Wearpack Safety", slug: "wearpack-safety" }),
    );
    const service = new AdminContentService(
      prisma as never,
      audit as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(service.listPortfolioCategories({ q: "jersey" })).resolves.toMatchObject({
      items: [{ name: "Jersey", slug: "jersey" }],
    });
    const findManyArg = firstMockArg<{ where: Record<string, unknown> }>(
      prisma.portfolioCategory.findMany,
    );
    expect(findManyArg.where).toMatchObject({
      OR: [{ name: { contains: "jersey" } }, { slug: { contains: "jersey" } }],
    });

    await expect(
      service.createPortfolioCategory({ name: "Wearpack", sort_order: 30 }, { id: 9 }),
    ).resolves.toMatchObject({
      name: "Wearpack",
      slug: "wearpack",
      status: "published",
    });
    const createArg = firstMockArg<{ data: Record<string, unknown> }>(
      prisma.portfolioCategory.create,
    );
    expect(createArg.data).toMatchObject({
      name: "Wearpack",
      slug: "wearpack",
      sortOrder: 30,
      status: ContentStatus.PUBLISHED,
    });

    await expect(
      service.updatePortfolioCategory(2, { name: "Wearpack Safety" }, { id: 9 }),
    ).resolves.toMatchObject({
      name: "Wearpack Safety",
      slug: "wearpack-safety",
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "portfolio-categories.create" }),
    );
  });

  it("creates machines with generated slugs and completed media", async () => {
    const prisma = prismaMock();
    prisma.mediaFile.findUnique.mockResolvedValue(completedMedia);
    prisma.machine.create.mockResolvedValue(
      machine({ name: "Mesin Obras 4 Benang", slug: "mesin-obras-4-benang" }),
    );
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(
      service.createMachine(
        {
          description: "Untuk finishing jahitan",
          media_file_id: 7,
          metric: "12 unit",
          name: "Mesin Obras 4 Benang",
          sort_order: 4,
        },
        { id: 9 },
      ),
    ).resolves.toMatchObject({
      media_file_id: 7,
      name: "Mesin Obras 4 Benang",
      slug: "mesin-obras-4-benang",
    });
    const createArg = firstMockArg<{ data: Record<string, unknown> }>(prisma.machine.create);
    expect(createArg.data).toMatchObject({
      description: "Untuk finishing jahitan",
      imageMediaId: 7,
      metric: "12 unit",
      name: "Mesin Obras 4 Benang",
      slug: "mesin-obras-4-benang",
      sortOrder: 4,
    });
  });

  it("creates printing and production capacities with required field mapping", async () => {
    const prisma = prismaMock();
    prisma.mediaFile.findUnique.mockResolvedValue(completedMedia);
    prisma.printingCapacity.create.mockResolvedValue(printingCapacity());
    prisma.productionCapacity.create.mockResolvedValue(productionCapacity());
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(
      service.createPrintingCapacity(
        {
          description: "Sablon plastisol",
          label: "Sablon",
          media_file_id: 7,
          sort_order: 2,
          unit: "pcs",
          value: "1000",
        },
        { id: 9 },
      ),
    ).resolves.toMatchObject({
      label: "Sablon",
      media_file_id: 7,
      unit: "pcs",
    });
    const printingArg = firstMockArg<{ data: Record<string, unknown> }>(
      prisma.printingCapacity.create,
    );
    expect(printingArg.data).toMatchObject({
      description: "Sablon plastisol",
      imageMediaId: 7,
      label: "Sablon",
      sortOrder: 2,
      unit: "pcs",
      value: "1000",
    });

    await expect(
      service.createProductionCapacity(
        { product: "Kaos", sort_order: 3, unit: "pcs/hari", value: "500" },
        { id: 9 },
      ),
    ).resolves.toMatchObject({
      product: "Kaos",
      unit: "pcs/hari",
    });
    const productionArg = firstMockArg<{ data: Record<string, unknown> }>(
      prisma.productionCapacity.create,
    );
    expect(productionArg.data).toMatchObject({
      product: "Kaos",
      sortOrder: 3,
      unit: "pcs/hari",
      value: "500",
    });
  });

  it("rejects published news without content and never writes it", async () => {
    const prisma = prismaMock();
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(
      service.createNews(
        {
          title: "Berita",
          category: "Produksi",
          excerpt: "Ringkasan",
          status: "published",
          content: [],
        },
        { id: 9 },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prisma.newsArticle.create).not.toHaveBeenCalled();
  });

  it("creates and updates news with media validation, content mapping, and SEO fields", async () => {
    const prisma = prismaMock();
    const revalidation = revalidationMock();
    prisma.mediaFile.findUnique.mockResolvedValue(completedMedia);
    prisma.newsArticle.create.mockResolvedValue(
      news({
        ogMediaId: 8,
        publishedAt: now,
        seoDescription: "SEO desc",
        seoTitle: "SEO title",
        slug: "launch-produk-baru",
        status: ContentStatus.PUBLISHED,
      }),
    );
    prisma.newsArticle.findUnique.mockResolvedValue(news({ content: ["Konten lama"] }));
    prisma.newsArticle.update.mockResolvedValue(
      news({
        content: ["Konten baru"],
        publishedAt: now,
        slug: "launch-produk-baru",
        status: ContentStatus.PUBLISHED,
      }),
    );
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidation as unknown as RevalidationService,
    );

    await expect(
      service.createNews(
        {
          category: "Produksi",
          content: ["Paragraf pertama"],
          excerpt: "Update produksi",
          og_image_media_file_id: 8,
          published_at: now.toISOString(),
          seo_description: "SEO desc",
          seo_title: "SEO title",
          status: "published",
          thumbnail_media_file_id: 7,
          title: "Launch Produk Baru",
        },
        { id: 9 },
      ),
    ).resolves.toMatchObject({
      content: ["Paragraf pertama"],
      og_image_media_file_id: 8,
      slug: "launch-produk-baru",
      status: "published",
    });
    const createArg = firstMockArg<{ data: Record<string, unknown> }>(prisma.newsArticle.create);
    expect(createArg.data).toMatchObject({
      content: ["Paragraf pertama"],
      ogMediaId: 8,
      publishedAt: now,
      seoDescription: "SEO desc",
      seoTitle: "SEO title",
      slug: "launch-produk-baru",
      status: ContentStatus.PUBLISHED,
      thumbnailMediaId: 7,
    });

    await expect(
      service.updateNews(
        51,
        {
          content: ["Konten baru"],
          status: "published",
          thumbnail_media_file_id: 7,
        },
        { id: 9 },
      ),
    ).resolves.toMatchObject({
      content: ["Konten baru"],
      status: "published",
    });
    const updateArg = firstMockArg<{ data: Record<string, unknown> }>(prisma.newsArticle.update);
    expect(updateArg.data.status).toBe(ContentStatus.PUBLISHED);
    expect(updateArg.data.publishedAt).toBeInstanceOf(Date);
    expect(revalidation.queue).toHaveBeenCalledWith(
      expect.objectContaining({
        cacheKeys: ["public:news:list", "sitemap"],
      }),
    );
  });

  it("rejects publishing existing news when stored content has no text array", async () => {
    const prisma = prismaMock();
    prisma.newsArticle.findUnique.mockResolvedValue(news({ content: { blocks: [] } }));
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(service.updateNews(51, { status: "published" }, { id: 9 })).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(prisma.newsArticle.update).not.toHaveBeenCalled();
  });

  it("rejects gallery items when media is not completed", async () => {
    const prisma = prismaMock();
    prisma.mediaFile.findUnique.mockResolvedValue({ id: 7, status: MediaStatus.FAILED });
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(
      service.createGalleryItem(
        {
          media_type: "image",
          media_file_id: 7,
          caption: "Galeri",
        },
        { id: 9 },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.galleryItem.create).not.toHaveBeenCalled();
  });

  it("creates gallery image items with completed media and public cache invalidation", async () => {
    const prisma = prismaMock();
    const audit = auditMock();
    const revalidation = revalidationMock();
    prisma.mediaFile.findUnique.mockResolvedValue(completedMedia);
    prisma.galleryItem.create.mockResolvedValue(galleryItem());
    const service = new AdminContentService(
      prisma as never,
      audit as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidation as unknown as RevalidationService,
    );

    await expect(
      service.createGalleryItem(
        {
          media_type: "image",
          media_file_id: 7,
          caption: "Galeri produksi",
          sort_order: 5,
          status: "published",
          published_at: now.toISOString(),
        },
        { id: 9 },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 41,
        media_type: "image",
        status: "published",
      }),
    );
    const createArg = firstMockArg<{
      data: Record<string, unknown>;
    }>(prisma.galleryItem.create);
    expect(createArg.data.type).toBe(MediaKind.IMAGE);
    expect(createArg.data.publishedAt).toEqual(now);
    expect(revalidation.queue).toHaveBeenCalledWith(
      expect.objectContaining({
        cacheKeys: ["public:gallery:list", "public:home"],
      }),
    );
  });

  it("lists gallery videos and updates gallery poster media", async () => {
    const prisma = prismaMock();
    prisma.galleryItem.findMany.mockResolvedValue([galleryItem({ type: MediaKind.VIDEO })]);
    prisma.galleryItem.count.mockResolvedValue(1);
    prisma.mediaFile.findUnique.mockResolvedValue(completedMedia);
    prisma.galleryItem.update.mockResolvedValue(
      galleryItem({ posterMediaId: 8, type: MediaKind.VIDEO }),
    );
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(
      service.listGalleryItems({ q: "produksi", status: "published", type: "video" }),
    ).resolves.toMatchObject({
      items: [{ media_type: "video", status: "published" }],
    });
    const findManyArg = firstMockArg<{ where: Record<string, unknown> }>(
      prisma.galleryItem.findMany,
    );
    expect(findManyArg.where).toMatchObject({
      caption: { contains: "produksi" },
      status: ContentStatus.PUBLISHED,
      type: MediaKind.VIDEO,
    });

    await expect(
      service.updateGalleryItem(
        41,
        {
          media_file_id: 7,
          media_type: "video",
          poster_media_id: 8,
          status: "published",
        },
        { id: 9 },
      ),
    ).resolves.toMatchObject({
      media_type: "video",
      poster_media_id: 8,
    });
    const updateArg = firstMockArg<{ data: Record<string, unknown> }>(prisma.galleryItem.update);
    expect(updateArg.data.mediaFileId).toBe(7);
    expect(updateArg.data.posterMediaId).toBe(8);
    expect(updateArg.data.type).toBe(MediaKind.VIDEO);
    expect(updateArg.data.publishedAt).toBeInstanceOf(Date);
  });

  it("reorders services in a transaction and records metadata count", async () => {
    const prisma = prismaMock();
    const audit = auditMock();
    prisma.serviceItem.update.mockResolvedValue({});
    const service = new AdminContentService(
      prisma as never,
      audit as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(
      service.reorder(
        "services",
        {
          items: [
            { id: 1, sort_order: 2 },
            { id: 2, sort_order: 1 },
          ],
        },
        { id: 9 },
      ),
    ).resolves.toEqual({ status: "updated", count: 2 });
    expect(prisma.$transaction).toHaveBeenCalledWith([expect.any(Promise), expect.any(Promise)]);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "services.reorder",
        metadata: { count: 2 },
      }),
    );
  });

  it("updates status, archives, restores, and permanently deletes content with proper cache keys", async () => {
    const prisma = prismaMock();
    const audit = auditMock();
    const mediaCleanup = mediaCleanupMock();
    const revalidation = revalidationMock();
    prisma.newsArticle.update.mockResolvedValue(
      news({ publishedAt: now, status: ContentStatus.PUBLISHED }),
    );
    prisma.portfolio.findUnique
      .mockResolvedValueOnce(portfolio({ status: ContentStatus.PUBLISHED }))
      .mockResolvedValueOnce(portfolio({ previousStatus: ContentStatus.PUBLISHED, status: ContentStatus.ARCHIVED }))
      .mockResolvedValueOnce(portfolio({ imageMediaId: 7 }));
    prisma.portfolio.update
      .mockResolvedValueOnce(portfolio({ status: ContentStatus.ARCHIVED }))
      .mockResolvedValueOnce(portfolio({ status: ContentStatus.PUBLISHED }));
    prisma.portfolio.delete.mockResolvedValue(portfolio());
    const service = new AdminContentService(
      prisma as never,
      audit as unknown as AuditService,
      mediaCleanup as unknown as MediaService,
      revalidation as unknown as RevalidationService,
    );

    await expect(service.updateStatus("news", 51, "published", { id: 9 })).resolves.toMatchObject({
      id: 51,
      status: "published",
    });
    const statusArg = firstMockArg<{ data: Record<string, unknown> }>(prisma.newsArticle.update);
    expect(statusArg.data.status).toBe(ContentStatus.PUBLISHED);
    expect(statusArg.data.publishedAt).toBeInstanceOf(Date);

    await expect(service.archiveResource("portfolios", 21, { id: 9 })).resolves.toMatchObject({
      id: 21,
      status: "archived",
    });
    expect(prisma.portfolio.update).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          previousStatus: ContentStatus.PUBLISHED,
          status: ContentStatus.ARCHIVED,
        }),
      }),
    );

    await expect(service.unarchiveResource("portfolios", 21, { id: 9 })).resolves.toMatchObject({
      id: 21,
      status: "published",
    });
    expect(prisma.portfolio.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          archivedAt: null,
          previousStatus: null,
          status: ContentStatus.PUBLISHED,
        }),
      }),
    );

    await expect(service.deleteResource("portfolios", 21, { id: 9 })).resolves.toMatchObject({
      id: 21,
      status: "permanently_deleted",
    });
    expect(prisma.portfolio.delete).toHaveBeenCalledWith({ where: { id: 21 } });
    expect(mediaCleanup.permanentlyDeleteIfUnused).toHaveBeenCalledWith(7, { id: 9 });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "portfolios.permanent_delete",
        resourceId: 21,
      }),
    );
    expect(revalidation.queue).toHaveBeenCalledWith(
      expect.objectContaining({
        cacheKeys: ["public:home", "public:portfolio:list", "public:portfolio:categories", "sitemap"],
      }),
    );
  });

  it("rejects reorder for resources without sort order support", async () => {
    const prisma = prismaMock();
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(
      service.reorder("hero", { items: [{ id: 11, sort_order: 1 }] }, { id: 9 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects status changes for site settings", async () => {
    const service = new AdminContentService(
      prismaMock() as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(
      service.updateStatus("site-settings", 1, "published", { id: 9 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("maps Prisma unique and missing-record errors to API exceptions", async () => {
    const prisma = prismaMock();
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    prisma.serviceItem.update.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Unique failed", {
        clientVersion: "test",
        code: "P2002",
      }),
    );
    await expect(service.updateService(1, { name: "Duplikat" }, { id: 9 })).rejects.toBeInstanceOf(
      ConflictException,
    );

    prisma.serviceItem.update.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Missing record", {
        clientVersion: "test",
        code: "P2025",
      }),
    );
    await expect(service.updateService(404, { name: "Hilang" }, { id: 9 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("throws not found when site settings are unavailable", async () => {
    const prisma = prismaMock();
    prisma.siteSettings.findUnique.mockResolvedValue(null);
    const service = new AdminContentService(
      prisma as never,
      auditMock() as unknown as AuditService,
      mediaCleanupMock() as unknown as MediaService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(service.getSiteSettings()).rejects.toBeInstanceOf(NotFoundException);
  });
});
