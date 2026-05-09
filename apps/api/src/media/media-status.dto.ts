import { MediaKind, MediaStatus } from "@prisma/client";

export type ApiMediaKind = "image" | "video" | "document";
export type ApiMediaStatus = "processing" | "completed" | "failed" | "deleted";

export const API_TO_PRISMA_MEDIA_KIND: Record<ApiMediaKind, MediaKind> = {
  image: MediaKind.IMAGE,
  video: MediaKind.VIDEO,
  document: MediaKind.DOCUMENT,
};

export const PRISMA_TO_API_MEDIA_KIND: Record<MediaKind, ApiMediaKind> = {
  [MediaKind.IMAGE]: "image",
  [MediaKind.VIDEO]: "video",
  [MediaKind.DOCUMENT]: "document",
};

export const API_TO_PRISMA_MEDIA_STATUS: Record<ApiMediaStatus, MediaStatus> = {
  processing: MediaStatus.PROCESSING,
  completed: MediaStatus.COMPLETED,
  failed: MediaStatus.FAILED,
  deleted: MediaStatus.DELETED,
};

export const PRISMA_TO_API_MEDIA_STATUS: Record<MediaStatus, ApiMediaStatus> = {
  [MediaStatus.PROCESSING]: "processing",
  [MediaStatus.COMPLETED]: "completed",
  [MediaStatus.FAILED]: "failed",
  [MediaStatus.DELETED]: "deleted",
};
