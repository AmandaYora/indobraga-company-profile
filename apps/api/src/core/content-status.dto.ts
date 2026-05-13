import { ContentStatus } from "@prisma/client";

export type ApiContentStatus = "draft" | "published" | "inactive" | "archived";

export const API_CONTENT_STATUSES: ApiContentStatus[] = [
  "draft",
  "published",
  "inactive",
  "archived",
];
export const API_PUBLISHABLE_CONTENT_STATUSES = ["draft", "published", "inactive"] as const;
export type ApiPublishableContentStatus = (typeof API_PUBLISHABLE_CONTENT_STATUSES)[number];

export const API_TO_PRISMA_CONTENT_STATUS: Record<ApiContentStatus, ContentStatus> = {
  archived: ContentStatus.ARCHIVED,
  draft: ContentStatus.DRAFT,
  inactive: ContentStatus.INACTIVE,
  published: ContentStatus.PUBLISHED,
};

export const PRISMA_TO_API_CONTENT_STATUS: Record<ContentStatus, ApiContentStatus> = {
  [ContentStatus.ARCHIVED]: "archived",
  [ContentStatus.DRAFT]: "draft",
  [ContentStatus.INACTIVE]: "inactive",
  [ContentStatus.PUBLISHED]: "published",
};
