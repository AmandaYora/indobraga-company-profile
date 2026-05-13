import { MediaKind, MediaStatus } from "@prisma/client";

export type ApiMediaKind = "image" | "video" | "document";
export type ApiMediaStatus =
  | "processing"
  | "completed"
  | "failed"
  | "archived"
  | "pending_delete"
  | "deleted"
  | "cleanup_failed";

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
  archived: MediaStatus.ARCHIVED,
  cleanup_failed: MediaStatus.CLEANUP_FAILED,
  completed: MediaStatus.COMPLETED,
  deleted: MediaStatus.DELETED,
  failed: MediaStatus.FAILED,
  pending_delete: MediaStatus.PENDING_DELETE,
  processing: MediaStatus.PROCESSING,
};

export const PRISMA_TO_API_MEDIA_STATUS: Record<MediaStatus, ApiMediaStatus> = {
  [MediaStatus.ARCHIVED]: "archived",
  [MediaStatus.CLEANUP_FAILED]: "cleanup_failed",
  [MediaStatus.COMPLETED]: "completed",
  [MediaStatus.DELETED]: "deleted",
  [MediaStatus.FAILED]: "failed",
  [MediaStatus.PENDING_DELETE]: "pending_delete",
  [MediaStatus.PROCESSING]: "processing",
};
