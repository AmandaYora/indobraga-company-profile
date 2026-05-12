import { news } from "@/data/site";
import { SITE_URL } from "@/lib/seo";

type Fetcher = typeof fetch;

type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: string;
};

const FALLBACK_PAGE_LASTMOD = "2026-05-12";
const SEO_ASSET_CACHE_CONTROL = "public, max-age=300, s-maxage=300, stale-while-revalidate=86400";

const staticSitemapEntries: SitemapEntry[] = [
  { loc: "/", lastmod: FALLBACK_PAGE_LASTMOD, changefreq: "weekly", priority: "1.0" },
  { loc: "/portfolio", lastmod: FALLBACK_PAGE_LASTMOD, changefreq: "weekly", priority: "0.9" },
  { loc: "/fasilitas", lastmod: FALLBACK_PAGE_LASTMOD, changefreq: "monthly", priority: "0.8" },
  { loc: "/galeri", lastmod: FALLBACK_PAGE_LASTMOD, changefreq: "weekly", priority: "0.8" },
  { loc: "/berita", lastmod: FALLBACK_PAGE_LASTMOD, changefreq: "weekly", priority: "0.8" },
  { loc: "/kontak", lastmod: FALLBACK_PAGE_LASTMOD, changefreq: "monthly", priority: "0.8" },
];

export const seoAssetHeaders = {
  sitemap: {
    "content-type": "application/xml; charset=utf-8",
    "cache-control": SEO_ASSET_CACHE_CONTROL,
  },
  robots: {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": SEO_ASSET_CACHE_CONTROL,
  },
} as const;

export async function sitemapXml(fetcher: Fetcher = fetch): Promise<string> {
  return fetchBackendSeoAsset("/sitemap.xml", fallbackSitemapXml(), fetcher);
}

export async function robotsText(fetcher: Fetcher = fetch): Promise<string> {
  return fetchBackendSeoAsset("/robots.txt", fallbackRobotsText(), fetcher);
}

export function fallbackSitemapXml(): string {
  const articleEntries: SitemapEntry[] = news.map((article) => ({
    loc: `/berita/${article.slug}`,
    lastmod: article.date,
    changefreq: "monthly",
    priority: "0.7",
  }));

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...staticSitemapEntries, ...articleEntries].map(sitemapEntryXml),
    "</urlset>",
    "",
  ].join("\n");
}

export function fallbackRobotsText(): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /login",
    "Disallow: /api/",
    "Disallow: /internal/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}

async function fetchBackendSeoAsset(
  assetPath: "/sitemap.xml" | "/robots.txt",
  fallback: string,
  fetcher: Fetcher,
): Promise<string> {
  const urls = backendSeoAssetUrls(assetPath);

  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(fetcher, url, 2500);

      if (!response.ok) {
        continue;
      }

      const body = await response.text();

      if (body.trim()) {
        return body;
      }
    } catch {
      continue;
    }
  }

  return fallback;
}

function backendSeoAssetUrls(assetPath: "/sitemap.xml" | "/robots.txt"): string[] {
  const baseUrl = getInternalApiBaseUrl();

  return [`${baseUrl}${assetPath}`, `${baseUrl}/api/v1${assetPath}`];
}

async function fetchWithTimeout(fetcher: Fetcher, url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetcher(url, {
      headers: { accept: url.endsWith(".xml") ? "application/xml" : "text/plain" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function getInternalApiBaseUrl(): string {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  const configuredBaseUrl = runtime.process?.env?.API_INTERNAL_BASE_URL ?? "http://127.0.0.1:3001";

  return configuredBaseUrl.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}

function sitemapEntryXml(entry: SitemapEntry): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(absoluteSitemapUrl(entry.loc))}</loc>`,
    entry.lastmod ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : null,
    entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
    entry.priority ? `    <priority>${entry.priority}</priority>` : null,
    "  </url>",
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

function absoluteSitemapUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
