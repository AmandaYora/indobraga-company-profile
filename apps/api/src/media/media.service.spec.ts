import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { Readable } from "node:stream";
import { MediaKind, MediaStatus } from "@prisma/client";
import sharp from "sharp";
import type { AuditService } from "@/audit/audit.service";
import { MediaService } from "@/media/media.service";
import type { RevalidationService } from "@/revalidation/revalidation.service";

const now = new Date("2026-05-11T00:00:00.000Z");

const configMock = (overrides: Record<string, unknown> = {}) => ({
  get: jest.fn((key: string) => {
    const values: Record<string, unknown> = {
      MEDIA_LARGE_MAX_WIDTH: 1600,
      MEDIA_MEDIUM_MAX_WIDTH: 960,
      MEDIA_OBJECT_PREFIX: "upload",
      MEDIA_PATH_TIME_ZONE: "UTC",
      MEDIA_STORAGE_ENV: "test",
      MEDIA_THUMBNAIL_MAX_WIDTH: 480,
      NODE_ENV: "test",
      UPLOAD_IMAGE_MAX_MB: 10,
      UPLOAD_VIDEO_MAX_MB: 100,
      ...overrides,
    };

    return values[key];
  }),
});

const auditMock = () => ({
  record: jest.fn().mockResolvedValue(undefined),
});

const revalidationMock = () => ({
  queue: jest.fn().mockResolvedValue(undefined),
});

const storageMock = () => ({
  delete: jest.fn().mockResolvedValue(undefined),
  ping: jest.fn().mockResolvedValue(undefined),
  put: jest.fn((key: string, buffer: Buffer) =>
    Promise.resolve({
      bytes: buffer.byteLength,
      objectKey: key,
      publicUrl: `https://cdn.example.test/${key}`,
    }),
  ),
});

const firstMockArg = <T>(mock: jest.Mock): T => {
  const calls = mock.mock.calls as unknown[][];
  return calls[0]?.[0] as T;
};

const prismaMock = () => ({
  $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
  mediaFile: {
    count: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  siteSettings: { count: jest.fn() },
  heroSlide: { count: jest.fn() },
  partner: { count: jest.fn() },
  portfolio: { count: jest.fn() },
  portfolioImage: { count: jest.fn() },
  machine: { count: jest.fn() },
  printingCapacity: { count: jest.fn() },
  galleryItem: { count: jest.fn() },
  newsArticle: { count: jest.fn() },
});

const mediaRow = (overrides: Record<string, unknown> = {}) => ({
  id: 51,
  kind: MediaKind.IMAGE,
  status: MediaStatus.COMPLETED,
  originalFilename: "logo.png",
  mimeType: "image/png",
  extension: "png",
  objectKey: "upload/test/seo/2026-05-11/asset-large.webp",
  publicUrl: "https://cdn.example.test/asset-large.webp",
  thumbnailUrl: "https://cdn.example.test/asset-thumbnail.webp",
  mediumUrl: "https://cdn.example.test/asset-medium.webp",
  largeUrl: "https://cdn.example.test/asset-large.webp",
  posterUrl: null,
  videoUrl: null,
  sizeOriginalBytes: BigInt(100),
  sizeFinalBytes: BigInt(80),
  width: 1200,
  height: 630,
  durationSeconds: null,
  errorMessage: null,
  createdById: 9,
  variants: {},
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const multerFile = (buffer: Buffer, originalname = "upload.png"): Express.Multer.File => ({
  buffer,
  destination: "",
  encoding: "7bit",
  fieldname: "file",
  filename: originalname,
  mimetype: "application/octet-stream",
  originalname,
  path: "",
  size: buffer.byteLength,
  stream: Readable.from(buffer),
});

describe("MediaService", () => {
  it("rejects missing and unsupported upload files", async () => {
    const service = new MediaService(
      prismaMock() as never,
      configMock() as never,
      storageMock(),
      auditMock() as unknown as AuditService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(service.upload(undefined, { usage: "og" }, { id: 9 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.upload(multerFile(Buffer.from("not-media")), { usage: "og" }, { id: 9 }),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
  });

  it("rejects uploads that exceed configured size limits", async () => {
    const service = new MediaService(
      prismaMock() as never,
      configMock({ UPLOAD_IMAGE_MAX_MB: 0 }) as never,
      storageMock(),
      auditMock() as unknown as AuditService,
      revalidationMock() as unknown as RevalidationService,
    );
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    await expect(
      service.upload(multerFile(pngHeader), { usage: "og" }, { id: 9 }),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
  });

  it("processes image uploads into variants, stores metadata, and queues revalidation", async () => {
    const prisma = prismaMock();
    const storage = storageMock();
    const audit = auditMock();
    const revalidation = revalidationMock();
    prisma.mediaFile.create.mockImplementation((input: { data: Record<string, unknown> }) =>
      Promise.resolve(
        mediaRow({
          ...input.data,
          id: 61,
          createdAt: now,
          updatedAt: now,
        }),
      ),
    );
    const service = new MediaService(
      prisma as never,
      configMock() as never,
      storage,
      audit as unknown as AuditService,
      revalidation as unknown as RevalidationService,
    );
    const buffer = await sharp({
      create: {
        background: "#ffffff",
        channels: 3,
        height: 4,
        width: 4,
      },
    })
      .png()
      .toBuffer();

    await expect(
      service.upload(
        multerFile(buffer, "logo.png"),
        { usage: "og", alt_text: "Logo", caption: "OG" },
        { id: 9 },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        compression_status: "completed",
        id: 61,
        media_type: "image",
        original_file_name: "logo.png",
      }),
    );

    expect(storage.put).toHaveBeenCalledTimes(3);
    const imageCreateArg = firstMockArg<{
      data: Record<string, unknown>;
    }>(prisma.mediaFile.create);
    expect(imageCreateArg.data.createdById).toBe(9);
    expect(imageCreateArg.data.kind).toBe(MediaKind.IMAGE);
    expect(imageCreateArg.data.status).toBe(MediaStatus.COMPLETED);
    expect(imageCreateArg.data.variants).toMatchObject({
      alt_text: "Logo",
      caption: "OG",
      usage: "og",
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "media.upload",
        resourceId: 61,
      }),
    );
    expect(revalidation.queue).toHaveBeenCalledWith(
      expect.objectContaining({
        cacheKeys: [
          "public:home",
          "public:portfolio:list",
          "public:gallery:list",
          "public:news:list",
          "seo:site",
        ],
      }),
    );
  });

  it("processes MP4 uploads through storage without image variants", async () => {
    const prisma = prismaMock();
    const storage = storageMock();
    prisma.mediaFile.create.mockImplementation((input: { data: Record<string, unknown> }) =>
      Promise.resolve(
        mediaRow({
          ...input.data,
          height: null,
          id: 62,
          kind: MediaKind.VIDEO,
          mediumUrl: null,
          mimeType: "video/mp4",
          thumbnailUrl: null,
          updatedAt: now,
          width: null,
        }),
      ),
    );
    const service = new MediaService(
      prisma as never,
      configMock() as never,
      storage,
      auditMock() as unknown as AuditService,
      revalidationMock() as unknown as RevalidationService,
    );
    const mp4 = Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x18]), Buffer.from("ftypmp42")]);

    await expect(
      service.upload(multerFile(mp4, "video.mp4"), { usage: "gallery" }, { id: 9 }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 62,
        media_type: "video",
      }),
    );
    expect(storage.put).toHaveBeenCalledTimes(1);
    const videoCreateArg = firstMockArg<{
      data: Record<string, unknown>;
    }>(prisma.mediaFile.create);
    expect(videoCreateArg.data.kind).toBe(MediaKind.VIDEO);
    expect(videoCreateArg.data.objectKey).toEqual(expect.stringContaining("upload/test/galeri/"));
    expect(videoCreateArg.data.videoUrl).toEqual(expect.stringContaining("upload/test/galeri/"));
  });

  it("lists media with default active filter and API field mapping", async () => {
    const prisma = prismaMock();
    prisma.mediaFile.findMany.mockResolvedValue([mediaRow()]);
    prisma.mediaFile.count.mockResolvedValue(1);
    const service = new MediaService(
      prisma as never,
      configMock() as never,
      storageMock(),
      auditMock() as unknown as AuditService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(service.list({ page: 1, limit: 16, usage: "og" })).resolves.toMatchObject({
      items: [
        {
          compression_status: "completed",
          media_type: "image",
          optimized_size: 80,
          original_size: 100,
        },
      ],
      pagination: {
        page: 1,
        total: 1,
      },
    });
    const findManyArg = firstMockArg<{
      where: Record<string, unknown>;
    }>(prisma.mediaFile.findMany);
    expect(findManyArg.where.status).toEqual({
      notIn: [
        MediaStatus.ARCHIVED,
        MediaStatus.PENDING_DELETE,
        MediaStatus.DELETED,
        MediaStatus.CLEANUP_FAILED,
      ],
    });
    expect(findManyArg.where.variants).toEqual({ path: "$.usage", equals: "og" });
  });

  it("prevents removing media that is still referenced", async () => {
    const prisma = prismaMock();
    prisma.mediaFile.findUnique.mockResolvedValue(mediaRow());
    prisma.siteSettings.count.mockResolvedValue(1);
    [
      prisma.heroSlide,
      prisma.partner,
      prisma.portfolio,
      prisma.portfolioImage,
      prisma.machine,
      prisma.printingCapacity,
      prisma.galleryItem,
      prisma.newsArticle,
    ].forEach((model) => model.count.mockResolvedValue(0));
    const service = new MediaService(
      prisma as never,
      configMock() as never,
      storageMock(),
      auditMock() as unknown as AuditService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(service.remove(51, { id: 9 })).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.siteSettings.count).toHaveBeenCalledWith({
      where: {
        OR: [
          { logoMediaFileId: 51 },
          { footerLogoMediaFileId: 51 },
          { ogMediaFileId: 51 },
          { contactHeroMediaFileId: 51 },
        ],
      },
    });
    expect(prisma.mediaFile.update).not.toHaveBeenCalled();
  });

  it("permanently deletes unreferenced media and records storage cleanup side effects", async () => {
    const prisma = prismaMock();
    const storage = storageMock();
    const audit = auditMock();
    const revalidation = revalidationMock();
    prisma.mediaFile.findUnique.mockResolvedValue(mediaRow());
    [
      prisma.siteSettings,
      prisma.heroSlide,
      prisma.partner,
      prisma.portfolio,
      prisma.portfolioImage,
      prisma.machine,
      prisma.printingCapacity,
      prisma.galleryItem,
      prisma.newsArticle,
    ].forEach((model) => model.count.mockResolvedValue(0));
    prisma.mediaFile.delete.mockResolvedValue(mediaRow());
    const service = new MediaService(
      prisma as never,
      configMock() as never,
      storage,
      audit as unknown as AuditService,
      revalidation as unknown as RevalidationService,
    );

    await expect(service.remove(51, { id: 9 })).resolves.toEqual({
      id: 51,
      status: "permanently_deleted",
    });
    expect(prisma.mediaFile.update).toHaveBeenCalledWith({
      data: {
        deletedAt: expect.any(Date),
        deletedById: 9,
        status: MediaStatus.PENDING_DELETE,
      },
      where: { id: 51 },
    });
    expect(storage.delete).toHaveBeenCalledWith("upload/test/seo/2026-05-11/asset-large.webp");
    expect(prisma.mediaFile.delete).toHaveBeenCalledWith({ where: { id: 51 } });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "media.object_storage_delete_success",
        actorUserId: 9,
      }),
    );
    expect(revalidation.queue).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 51 }));
  });

  it("only allows retry for failed media", async () => {
    const prisma = prismaMock();
    prisma.mediaFile.findUnique.mockResolvedValueOnce(mediaRow({ status: MediaStatus.COMPLETED }));
    const service = new MediaService(
      prisma as never,
      configMock() as never,
      storageMock(),
      auditMock() as unknown as AuditService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(service.retry(51, { id: 9 })).rejects.toBeInstanceOf(BadRequestException);

    prisma.mediaFile.findUnique.mockResolvedValueOnce(mediaRow({ status: MediaStatus.FAILED }));
    prisma.mediaFile.update.mockResolvedValue(
      mediaRow({
        errorMessage: "Original temporary file tidak tersedia. Silakan upload ulang.",
        status: MediaStatus.FAILED,
      }),
    );

    await expect(service.retry(51, { id: 9 })).resolves.toEqual(
      expect.objectContaining({
        compression_status: "failed",
        error: "Original temporary file tidak tersedia. Silakan upload ulang.",
      }),
    );
  });

  it("throws not found for missing media detail", async () => {
    const prisma = prismaMock();
    prisma.mediaFile.findUnique.mockResolvedValue(null);
    const service = new MediaService(
      prisma as never,
      configMock() as never,
      storageMock(),
      auditMock() as unknown as AuditService,
      revalidationMock() as unknown as RevalidationService,
    );

    await expect(service.detail(404)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("sweeps only unreferenced, aged uploads and re-checks references before deleting (QA IB-09)", async () => {
    const prisma = prismaMock();
    prisma.mediaFile.findMany.mockResolvedValue([{ id: 61 }, { id: 62 }]);
    // 61 is truly orphaned; 62 got attached between the query and the delete (race) -> skipped
    prisma.mediaFile.findUnique.mockImplementation(({ where }: { where: { id: number } }) =>
      Promise.resolve(mediaRow({ id: where.id, objectKey: `upload/orphan-${where.id}.webp` })),
    );
    prisma.mediaFile.update.mockResolvedValue(mediaRow());
    prisma.mediaFile.delete.mockResolvedValue(mediaRow());
    prisma.partner.count.mockImplementation(({ where }: { where: { logoMediaId: number } }) =>
      Promise.resolve(where.logoMediaId === 62 ? 1 : 0),
    );
    for (const model of [
      prisma.siteSettings,
      prisma.heroSlide,
      prisma.portfolio,
      prisma.portfolioImage,
      prisma.machine,
      prisma.printingCapacity,
      prisma.galleryItem,
      prisma.newsArticle,
    ]) {
      model.count.mockResolvedValue(0);
    }
    const storage = storageMock();
    const service = new MediaService(
      prisma as never,
      configMock({ MEDIA_ORPHAN_TTL_HOURS: 24 }) as never,
      storage,
      auditMock() as unknown as AuditService,
      revalidationMock() as unknown as RevalidationService,
    );

    const summary = await service.cleanupOrphans();

    expect(summary).toEqual({ scanned: 2, deleted: 1, skipped: 1, cleanup_failed: 0 });
    const [query] = prisma.mediaFile.findMany.mock.calls[0] as [
      { where: Record<string, unknown>; take: number },
    ];
    expect(query.where.createdAt).toEqual({ lt: expect.any(Date) as Date });
    const ageMs = Date.now() - (query.where.createdAt as { lt: Date }).lt.getTime();
    expect(ageMs).toBeGreaterThan(23.9 * 60 * 60 * 1000);
    expect(query.where.status).toEqual({
      in: [MediaStatus.COMPLETED, MediaStatus.FAILED, MediaStatus.CLEANUP_FAILED],
    });
    // every relation must be required to be empty, archived media is never touched
    for (const relation of [
      "siteSettingsLogo",
      "siteSettingsFooterLogo",
      "partnerLogos",
      "portfolioImages",
      "portfolioGalleryImages",
      "newsOgArticles",
    ]) {
      expect(query.where[relation]).toEqual({ none: {} });
    }
    expect(storage.delete).toHaveBeenCalledTimes(1);
    expect(storage.delete).toHaveBeenCalledWith("upload/orphan-61.webp");
  });

});
