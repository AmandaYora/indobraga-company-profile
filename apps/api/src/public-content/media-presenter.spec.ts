import { MediaKind, MediaStatus, type MediaFile } from "@prisma/client";
import {
  getBestImageUrl,
  getMediumUrl,
  getPublicMediaUrls,
  getThumbnailUrl,
} from "@/media/media-presenter";

function media(overrides: Partial<MediaFile> = {}): MediaFile {
  return {
    id: 1,
    kind: MediaKind.IMAGE,
    status: MediaStatus.COMPLETED,
    originalFilename: "image.webp",
    mimeType: "image/webp",
    extension: "webp",
    objectKey: null,
    publicUrl: "public.webp",
    thumbnailUrl: "thumb.webp",
    mediumUrl: "medium.webp",
    largeUrl: "large.webp",
    posterUrl: null,
    videoUrl: null,
    sizeOriginalBytes: null,
    sizeFinalBytes: null,
    width: null,
    height: null,
    durationSeconds: null,
    checksum: null,
    variants: null,
    errorMessage: null,
    createdById: null,
    previousStatus: null,
    archivedAt: null,
    archivedById: null,
    deletedAt: null,
    deletedById: null,
    createdAt: new Date("2026-05-09T00:00:00.000Z"),
    updatedAt: new Date("2026-05-09T00:00:00.000Z"),
    ...overrides,
  };
}

describe("media presenter", () => {
  it("returns null URLs for missing or incomplete media", () => {
    expect(getPublicMediaUrls(null)).toEqual({
      public_url: null,
      thumbnail_url: null,
      medium_url: null,
      large_url: null,
      poster_url: null,
      video_url: null,
    });
    expect(getBestImageUrl(media({ status: MediaStatus.FAILED }))).toBeNull();
  });

  it("returns completed media URLs and selects best variants", () => {
    const item = media();

    expect(getPublicMediaUrls(item)).toMatchObject({
      public_url: "public.webp",
      thumbnail_url: "thumb.webp",
      medium_url: "medium.webp",
      large_url: "large.webp",
    });
    expect(getBestImageUrl(item)).toBe("large.webp");
    expect(getThumbnailUrl(item)).toBe("thumb.webp");
    expect(getMediumUrl(item)).toBe("medium.webp");
  });

  it("falls back when preferred variants are missing", () => {
    const item = media({ largeUrl: null, mediumUrl: null, thumbnailUrl: "thumb.webp" });

    expect(getBestImageUrl(item)).toBe("public.webp");
    expect(getMediumUrl(item)).toBe("public.webp");
  });
});
