import { ContentStatus } from "@prisma/client";

export type ApiContentStatus = "draft" | "published" | "inactive";

export const API_CONTENT_STATUSES: ApiContentStatus[] = ["draft", "published", "inactive"];

export const API_TO_PRISMA_CONTENT_STATUS: Record<ApiContentStatus, ContentStatus> = {
  draft: ContentStatus.DRAFT,
  published: ContentStatus.PUBLISHED,
  inactive: ContentStatus.INACTIVE,
};

export const PRISMA_TO_API_CONTENT_STATUS: Record<ContentStatus, ApiContentStatus> = {
  [ContentStatus.DRAFT]: "draft",
  [ContentStatus.PUBLISHED]: "published",
  [ContentStatus.INACTIVE]: "inactive",
};
