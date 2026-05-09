import { SetMetadata } from "@nestjs/common";

export const CACHE_CONTROL_METADATA = "indobraga:cache-control";

export const CacheControl = (value: string) => SetMetadata(CACHE_CONTROL_METADATA, value);

export const NoStore = () => CacheControl("no-store");

export const PublicListCache = () => CacheControl("public, max-age=60, stale-while-revalidate=300");

export const PublicDetailCache = () =>
  CacheControl("public, max-age=300, stale-while-revalidate=600");

export const SeoAssetCache = () => CacheControl("public, max-age=300, stale-while-revalidate=600");
