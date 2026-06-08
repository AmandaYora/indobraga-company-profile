import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MediaKind, MediaStatus, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { AuditService } from "@/audit/audit.service";
import type { Env } from "@/config/env";
import { createPagePaginationMeta, normalizePagePagination } from "@/core/pagination";
import { PrismaService } from "@/database/prisma.service";
import { RevalidationService } from "@/revalidation/revalidation.service";
import { ListMediaQueryDto } from "@/media/dto/list-media-query.dto";
import { UploadMediaDto } from "@/media/dto/upload-media.dto";
import { MEDIA_STORAGE, type MediaStorageService } from "@/media/media-storage.types";
import {
  API_TO_PRISMA_MEDIA_KIND,
  API_TO_PRISMA_MEDIA_STATUS,
  PRISMA_TO_API_MEDIA_KIND,
  PRISMA_TO_API_MEDIA_STATUS,
} from "@/media/media-status.dto";
import { sniffMedia } from "@/media/media-sniff";

type Actor = {
  id?: number;
};

type ImageVariant = {
  objectKey: string;
  publicUrl: string;
  bytes: number;
};

const CACHE_CONTROL_IMMUTABLE = "public, max-age=31536000, immutable";

// Bounds the decoded bitmap so a small but extreme "pixel bomb" image cannot
// exhaust memory during sharp processing (generous: covers any real photo).
const MAX_INPUT_PIXELS = 100_000_000;

const MEDIA_CATEGORY_BY_USAGE: Record<string, string> = {
  gallery: "galeri",
  hero: "hero",
  machine: "mesin",
  news: "berita",
  og: "seo",
  other: "lainnya",
  partner: "partner",
  portfolio: "portofolio",
};

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorageService,
    private readonly audit: AuditService,
    private readonly revalidation: RevalidationService,
  ) {}

  async upload(file: Express.Multer.File | undefined, dto: UploadMediaDto, actor: Actor) {
    if (!file) {
      throw new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "File wajib diunggah.",
      });
    }

    const sniffed = sniffMedia(file.buffer);
    if (!sniffed) {
      throw new UnsupportedMediaTypeException({
        code: "UNSUPPORTED_MEDIA_TYPE",
        message: "Format file belum didukung. Gunakan gambar atau video yang valid.",
      });
    }

    this.enforceSize(sniffed.kind, file.size);

    if (sniffed.kind === "image") {
      return this.processImage(file, sniffed.mimeType, sniffed.extension, dto, actor);
    }

    return this.processVideo(file, sniffed.mimeType, sniffed.extension, dto, actor);
  }

  async list(query: ListMediaQueryDto) {
    const pagination = normalizePagePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 16,
      maxLimit: 100,
    });
    const where: Prisma.MediaFileWhereInput = {
      ...(query.media_type ? { kind: API_TO_PRISMA_MEDIA_KIND[query.media_type] } : {}),
      ...(query.compression_status
        ? { status: API_TO_PRISMA_MEDIA_STATUS[query.compression_status] }
        : {
            status: {
              notIn: [
                MediaStatus.ARCHIVED,
                MediaStatus.PENDING_DELETE,
                MediaStatus.DELETED,
                MediaStatus.CLEANUP_FAILED,
              ],
            },
          }),
      ...(query.q
        ? {
            OR: [{ originalFilename: { contains: query.q } }, { mimeType: { contains: query.q } }],
          }
        : {}),
      ...(query.usage ? { variants: { path: "$.usage", equals: query.usage } } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.mediaFile.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.mediaFile.count({ where }),
    ]);

    return {
      items: items.map((item) => this.present(item)),
      pagination: createPagePaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async detail(id: number) {
    const media = await this.prisma.mediaFile.findUnique({ where: { id } });
    if (!media) {
      throw this.notFound();
    }

    return this.present(media);
  }

  async remove(id: number, actor: Actor) {
    return this.permanentlyDelete(id, actor, { failOnCleanupError: true });
  }

  async archive(id: number, actor: Actor) {
    const media = await this.prisma.mediaFile.findUnique({ where: { id } });
    if (!media) {
      throw this.notFound();
    }

    const references = await this.countReferences(id);
    if (references > 0) {
      throw new ConflictException({
        code: "CONFLICT",
        message: "Media masih dipakai oleh konten website. Lepaskan dari konten terlebih dahulu.",
      });
    }

    const updated = await this.prisma.mediaFile.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivedById: actor.id,
        previousStatus:
          media.status === MediaStatus.ARCHIVED
            ? (media.previousStatus ?? MediaStatus.COMPLETED)
            : media.status,
        status: MediaStatus.ARCHIVED,
      },
    });
    await this.afterMutation("archive", id, actor);

    return this.present(updated);
  }

  async unarchive(id: number, actor: Actor) {
    const media = await this.prisma.mediaFile.findUnique({ where: { id } });
    if (!media) {
      throw this.notFound();
    }

    if (media.status !== MediaStatus.ARCHIVED) {
      throw new BadRequestException({
        code: "BAD_REQUEST",
        message: "Media ini tidak berada di arsip.",
      });
    }

    const updated = await this.prisma.mediaFile.update({
      where: { id },
      data: {
        archivedAt: null,
        archivedById: null,
        previousStatus: null,
        status: media.previousStatus ?? MediaStatus.COMPLETED,
      },
    });
    await this.afterMutation("unarchive", id, actor);

    return this.present(updated);
  }

  async permanentlyDeleteIfUnused(
    id: number,
    actor: Actor,
  ): Promise<"deleted" | "skipped" | "cleanup_failed"> {
    const result = await this.permanentlyDelete(id, actor, {
      failOnCleanupError: false,
      skipIfReferenced: true,
    });

    return typeof result === "string" ? result : "deleted";
  }

  async retry(id: number, actor: Actor) {
    const media = await this.prisma.mediaFile.findUnique({ where: { id } });
    if (!media) {
      throw this.notFound();
    }

    if (media.status !== MediaStatus.FAILED) {
      throw new BadRequestException({
        code: "BAD_REQUEST",
        message: "Media ini belum perlu diproses ulang.",
      });
    }

    const updated = await this.prisma.mediaFile.update({
      where: { id },
      data: {
        status: MediaStatus.FAILED,
        errorMessage: "File asli sudah tidak tersedia. Silakan unggah ulang media ini.",
      },
    });
    await this.afterMutation("retry", id, actor);

    return this.present(updated);
  }

  private async processImage(
    file: Express.Multer.File,
    mimeType: string,
    extension: string,
    dto: UploadMediaDto,
    actor: Actor,
  ) {
    const base = sharp(file.buffer, {
      failOn: "warning",
      limitInputPixels: MAX_INPUT_PIXELS,
    }).rotate();
    const metadata = await base.metadata();
    const rootKey = this.createObjectRoot(dto.usage);

    // Store variants first; if anything below fails, delete what was written so
    // no orphaned objects accumulate in storage.
    const settled = await Promise.allSettled([
      this.createImageVariant(
        rootKey,
        "thumbnail",
        file.buffer,
        this.config.get("MEDIA_THUMBNAIL_MAX_WIDTH", { infer: true }),
      ),
      this.createImageVariant(
        rootKey,
        "medium",
        file.buffer,
        this.config.get("MEDIA_MEDIUM_MAX_WIDTH", { infer: true }),
      ),
      this.createImageVariant(
        rootKey,
        "large",
        file.buffer,
        this.config.get("MEDIA_LARGE_MAX_WIDTH", { infer: true }),
      ),
    ]);
    const stored = settled
      .filter((result): result is PromiseFulfilledResult<ImageVariant> => result.status === "fulfilled")
      .map((result) => result.value);
    const failed = settled.find((result) => result.status === "rejected");
    if (failed) {
      await this.cleanupObjects(stored.map((variant) => variant.objectKey));
      throw failed.reason;
    }
    const [thumbnail, medium, large] = stored;

    try {
      const media = await this.prisma.mediaFile.create({
        data: {
          kind: MediaKind.IMAGE,
          status: MediaStatus.COMPLETED,
          originalFilename: file.originalname,
          mimeType,
          extension,
          objectKey: large.objectKey,
          publicUrl: large.publicUrl,
          thumbnailUrl: thumbnail.publicUrl,
          mediumUrl: medium.publicUrl,
          largeUrl: large.publicUrl,
          sizeOriginalBytes: BigInt(file.size),
          sizeFinalBytes: BigInt(thumbnail.bytes + medium.bytes + large.bytes),
          width: metadata.width,
          height: metadata.height,
          createdById: actor.id,
          variants: {
            usage: dto.usage,
            alt_text: dto.alt_text,
            caption: dto.caption,
            thumbnail,
            medium,
            large,
          },
        },
      });
      await this.afterMutation("upload", media.id, actor);

      return this.present(media);
    } catch (error) {
      await this.cleanupObjects([thumbnail.objectKey, medium.objectKey, large.objectKey]);
      throw error;
    }
  }

  private async processVideo(
    file: Express.Multer.File,
    mimeType: string,
    extension: string,
    dto: UploadMediaDto,
    actor: Actor,
  ) {
    const rootKey = this.createObjectRoot(dto.usage);
    const stored = await this.storage.put(`${rootKey}-video.${extension}`, file.buffer, {
      cacheControl: CACHE_CONTROL_IMMUTABLE,
      contentType: mimeType,
    });
    try {
      const media = await this.prisma.mediaFile.create({
        data: {
          kind: MediaKind.VIDEO,
          status: MediaStatus.COMPLETED,
          originalFilename: file.originalname,
          mimeType,
          extension,
          objectKey: stored.objectKey,
          publicUrl: stored.publicUrl,
          videoUrl: stored.publicUrl,
          sizeOriginalBytes: BigInt(file.size),
          sizeFinalBytes: BigInt(file.size),
          createdById: actor.id,
          variants: {
            usage: dto.usage,
            alt_text: dto.alt_text,
            caption: dto.caption,
            note: "Video disimpan lewat adapter lokal. Transcoding FFmpeg/H.264 ditangani pada fase deployment yang memiliki FFmpeg.",
          },
        },
      });
      await this.afterMutation("upload", media.id, actor);

      return this.present(media);
    } catch (error) {
      await this.cleanupObjects([stored.objectKey]);
      throw error;
    }
  }

  /** Best-effort deletion of stored objects (used to undo a partial upload). */
  private async cleanupObjects(objectKeys: Array<string | undefined>): Promise<void> {
    await Promise.all(
      objectKeys
        .filter((key): key is string => Boolean(key))
        .map(async (key) => {
          try {
            await this.storage.delete(key);
          } catch {
            // Swallow cleanup failures: the original error is more important to surface.
          }
        }),
    );
  }

  private async createImageVariant(
    rootKey: string,
    variant: string,
    buffer: Buffer,
    width: number,
  ): Promise<ImageVariant> {
    const output = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const stored = await this.storage.put(`${rootKey}-${variant}.webp`, output, {
      cacheControl: CACHE_CONTROL_IMMUTABLE,
      contentType: "image/webp",
    });

    return {
      objectKey: stored.objectKey,
      publicUrl: stored.publicUrl,
      bytes: output.byteLength,
    };
  }

  private enforceSize(kind: "image" | "video", bytes: number): void {
    const maxMb =
      kind === "image"
        ? this.config.get("UPLOAD_IMAGE_MAX_MB", { infer: true })
        : this.config.get("UPLOAD_VIDEO_MAX_MB", { infer: true });
    const maxBytes = maxMb * 1024 * 1024;

    if (bytes > maxBytes) {
      throw new PayloadTooLargeException({
        code: "PAYLOAD_TOO_LARGE",
        message: `Ukuran ${kind === "image" ? "gambar" : "video"} melebihi batas ${maxMb} MB.`,
      });
    }
  }

  private createObjectRoot(usage: string): string {
    const now = new Date();
    const prefix = this.config.get("MEDIA_OBJECT_PREFIX", { infer: true });
    const envPrefix =
      this.config.get("MEDIA_STORAGE_ENV", { infer: true }) ??
      (this.config.get("NODE_ENV", { infer: true }) === "production" ? "prod" : "dev");
    const category = MEDIA_CATEGORY_BY_USAGE[usage] ?? "lainnya";
    const date = this.formatObjectDate(now);

    return `${prefix}/${envPrefix}/${category}/${date}/${randomUUID()}`;
  }

  private formatObjectDate(date: Date): string {
    const timeZone = this.config.get("MEDIA_PATH_TIME_ZONE", { infer: true });
    const parts = new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone,
      year: "numeric",
    }).formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
      throw new Error("MEDIA_PATH_TIME_ZONE tidak bisa dipakai untuk membuat tanggal media.");
    }

    return `${year}-${month}-${day}`;
  }

  private async countReferences(id: number): Promise<number> {
    const counts = await this.prisma.$transaction([
      this.prisma.siteSettings.count({
        where: {
          OR: [{ logoMediaFileId: id }, { ogMediaFileId: id }, { contactHeroMediaFileId: id }],
        },
      }),
      this.prisma.heroSlide.count({ where: { mediaFileId: id } }),
      this.prisma.partner.count({ where: { logoMediaId: id } }),
      this.prisma.portfolio.count({ where: { imageMediaId: id } }),
      this.prisma.machine.count({ where: { imageMediaId: id } }),
      this.prisma.printingCapacity.count({ where: { imageMediaId: id } }),
      this.prisma.galleryItem.count({
        where: { OR: [{ mediaFileId: id }, { posterMediaId: id }] },
      }),
      this.prisma.newsArticle.count({
        where: { OR: [{ thumbnailMediaId: id }, { ogMediaId: id }] },
      }),
    ]);

    return counts.reduce((sum, count) => sum + count, 0);
  }

  private async permanentlyDelete(
    id: number,
    actor: Actor,
    options: { failOnCleanupError: boolean; skipIfReferenced?: boolean },
  ): Promise<{ id: number; status: string } | "deleted" | "skipped" | "cleanup_failed"> {
    const media = await this.prisma.mediaFile.findUnique({ where: { id } });
    if (!media) {
      if (options.skipIfReferenced) {
        return "skipped";
      }
      throw this.notFound();
    }

    const references = await this.countReferences(id);
    if (references > 0) {
      if (options.skipIfReferenced) {
        return "skipped";
      }
      throw new ConflictException({
        code: "CONFLICT",
        message: "Media masih dipakai oleh konten website. Lepaskan dari konten terlebih dahulu.",
      });
    }

    const keys = this.mediaObjectKeys(media);
    await this.prisma.mediaFile.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: actor.id,
        status: MediaStatus.PENDING_DELETE,
      },
    });

    try {
      await Promise.all(keys.map((objectKey) => this.storage.delete(objectKey)));
    } catch (error) {
      const message = error instanceof Error ? error.message : "File media gagal dihapus.";
      await this.prisma.mediaFile.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: actor.id,
          errorMessage:
            "Media gagal dihapus dari penyimpanan. Sistem dapat mencoba ulang pembersihan.",
          status: MediaStatus.CLEANUP_FAILED,
        },
      });
      await this.audit.record({
        actorUserId: actor.id,
        action: "media.object_storage_delete_failed",
        resourceId: id,
        resourceType: "media",
        metadata: { message },
      });

      if (options.failOnCleanupError) {
        throw new ConflictException({
          code: "MEDIA_CLEANUP_FAILED",
          message:
            "Media belum berhasil dihapus dari penyimpanan. Coba lagi atau hubungi administrator.",
        });
      }

      return "cleanup_failed";
    }

    await this.prisma.mediaFile.delete({ where: { id } });
    await this.audit.record({
      actorUserId: actor.id,
      action: "media.object_storage_delete_success",
      resourceId: id,
      resourceType: "media",
      metadata: { object_count: keys.length },
    });
    await this.afterMutation("permanent_delete", id, actor);

    if (options.skipIfReferenced) {
      return "deleted";
    }

    return { id, status: "permanently_deleted" };
  }

  private mediaObjectKeys(media: Prisma.MediaFileGetPayload<object>): string[] {
    const keys = new Set<string>();
    const add = (value: unknown) => {
      if (typeof value === "string" && value.trim()) {
        keys.add(value);
      }
    };

    add(media.objectKey);
    this.collectVariantObjectKeys(media.variants, add);

    return [...keys];
  }

  private collectVariantObjectKeys(
    value: Prisma.JsonValue | undefined,
    add: (value: unknown) => void,
  ): void {
    if (!value || typeof value !== "object") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => this.collectVariantObjectKeys(item, add));
      return;
    }

    for (const [key, nested] of Object.entries(value)) {
      if (key === "objectKey") {
        add(nested);
      } else {
        this.collectVariantObjectKeys(nested, add);
      }
    }
  }

  private async afterMutation(action: string, mediaId: number, actor: Actor): Promise<void> {
    await this.audit.record({
      actorUserId: actor.id,
      action: `media.${action}`,
      resourceType: "media",
      resourceId: mediaId,
    });
    await this.revalidation.queue({
      resourceType: "media",
      resourceId: mediaId,
      cacheKeys: [
        "public:home",
        "public:portfolio:list",
        "public:gallery:list",
        "public:news:list",
        "seo:site",
      ],
    });
  }

  private present(media: Prisma.MediaFileGetPayload<object>) {
    return {
      id: media.id,
      media_type: PRISMA_TO_API_MEDIA_KIND[media.kind],
      mime_type: media.mimeType,
      original_file_name: media.originalFilename,
      compression_status: PRISMA_TO_API_MEDIA_STATUS[media.status],
      file_url: media.publicUrl,
      thumbnail_url: media.thumbnailUrl,
      medium_url: media.mediumUrl,
      large_url: media.largeUrl,
      poster_url: media.posterUrl,
      video_url: media.videoUrl,
      width: media.width,
      height: media.height,
      duration_seconds: media.durationSeconds,
      original_size: media.sizeOriginalBytes ? Number(media.sizeOriginalBytes) : null,
      optimized_size: media.sizeFinalBytes ? Number(media.sizeFinalBytes) : null,
      error: media.errorMessage,
      archived_at: media.archivedAt,
      deleted_at: media.deletedAt,
      created_at: media.createdAt,
      updated_at: media.updatedAt,
    };
  }

  private notFound(): NotFoundException {
    return new NotFoundException({
      code: "NOT_FOUND",
      message: "Media tidak ditemukan.",
    });
  }
}
