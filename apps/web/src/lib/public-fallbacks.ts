import {
  gallery,
  machines,
  news,
  portfolios,
  printingCapacity,
  productionCapacity,
  services,
  strengths,
} from "@/data/site";
import type {
  CursorList,
  PageList,
  PublicFacilities,
  PublicGalleryItem,
  PublicHome,
  PublicNewsDetail,
  PublicNewsItem,
  PublicPortfolioCategory,
  PublicPortfolioItem,
} from "@/lib/api-models";

const fallbackStrengths = strengths.map((item, index) => ({
  id: index + 1,
  label: item.label,
  value: item.value,
  suffix: item.suffix,
}));

const fallbackPortfolioItems: PublicPortfolioItem[] = portfolios.map((item) => ({
  id: item.id,
  title: item.title,
  slug: slugify(item.title),
  category: item.category,
  category_slug: slugify(item.category),
  thumbnail_url: item.image,
  medium_url: item.image,
  alt_text: item.title,
  short_description: item.desc,
}));

const fallbackMachines = machines.map((item) => ({
  id: item.id,
  name: item.name,
  slug: slugify(item.name),
  metric: item.metric,
  description: item.desc,
  image_url: item.image,
  alt_text: item.name,
}));

const fallbackPrintingCapacities = printingCapacity.map((item, index) => ({
  id: index + 1,
  label: item.label,
  value: item.value,
  unit: item.unit,
  description: item.desc,
  image_url: item.image,
  alt_text: item.label,
}));

const fallbackProductionCapacities = productionCapacity.map((item, index) => ({
  id: index + 1,
  product: item.product,
  value: item.value,
  unit: item.unit,
}));

const fallbackServices = services.map((name, index) => ({
  id: index + 1,
  name,
}));

const fallbackNewsItems: PublicNewsItem[] = news.map((item) => ({
  id: item.id,
  title: item.title,
  slug: item.slug,
  category: item.category,
  thumbnail_url: item.thumb,
  excerpt: item.excerpt,
  published_at: item.date,
}));

const fallbackGalleryItems: PublicGalleryItem[] = gallery.map((item) => ({
  id: item.id,
  type: item.type,
  thumbnail_url: "poster" in item ? item.poster : item.media,
  media_url: item.media,
  caption: item.caption,
  alt_text: item.caption,
  published_at: item.date,
}));

export const fallbackHome: PublicHome = {
  hero: {
    title: "Produksi Garment dan Sublim Skala Bisnis",
    subtitle:
      "Indobraga membantu brand, komunitas, dan perusahaan memproduksi apparel siap pakai, mulai dari pattern, cutting, sewing, hingga sublimasi kain dengan output konsisten.",
    primary_cta: { label: "Konsultasi Produksi", url: "/kontak" },
    slides: [],
  },
  partners: [],
  strengths: fallbackStrengths,
  featured_portfolios: fallbackPortfolioItems,
  facilities_summary: {
    machines: fallbackMachines,
    printing_capacities: fallbackPrintingCapacities,
    production_capacities: fallbackProductionCapacities,
    services: fallbackServices,
  },
  latest_news: fallbackNewsItems,
};

export const fallbackFacilities: PublicFacilities = {
  strengths: fallbackStrengths,
  machines: fallbackMachines,
  printing_capacities: fallbackPrintingCapacities,
  production_capacities: fallbackProductionCapacities,
  services: fallbackServices,
};

export function fallbackPortfolioList(
  category?: string,
  limit = 24,
): CursorList<PublicPortfolioItem> {
  const filtered =
    category && category !== "Semua"
      ? fallbackPortfolioItems.filter(
          (item) => item.category === category || item.category_slug === category,
        )
      : fallbackPortfolioItems;
  const items = filtered.slice(0, limit);

  return {
    items,
    next_cursor: null,
    has_more: filtered.length > items.length,
  };
}

export function fallbackPortfolioCategories(): { items: PublicPortfolioCategory[] } {
  const categories = new Map<string, PublicPortfolioCategory>();

  fallbackPortfolioItems.forEach((item) => {
    const slug = item.category_slug ?? slugify(item.category);
    const current = categories.get(slug);
    categories.set(slug, {
      id: current?.id ?? categories.size + 1,
      name: current?.name ?? item.category,
      slug,
      count: (current?.count ?? 0) + 1,
    });
  });

  return { items: Array.from(categories.values()) };
}

export function fallbackGalleryList(limit = 24): CursorList<PublicGalleryItem> {
  const items = fallbackGalleryItems.slice(0, limit);

  return {
    items,
    next_cursor: null,
    has_more: fallbackGalleryItems.length > items.length,
  };
}

export function fallbackNewsPage(page = 1, limit = 6): PageList<PublicNewsItem> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 6;
  const totalPages = Math.max(1, Math.ceil(fallbackNewsItems.length / safeLimit));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * safeLimit;

  return {
    items: fallbackNewsItems.slice(start, start + safeLimit),
    pagination: {
      page: currentPage,
      limit: safeLimit,
      total: fallbackNewsItems.length,
      total_pages: totalPages,
    },
  };
}

export function fallbackNewsDetail(slug: string): PublicNewsDetail | null {
  const item = news.find((candidate) => candidate.slug === slug);

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    title: item.title,
    slug: item.slug,
    category: item.category,
    thumbnail_url: item.thumb,
    excerpt: item.excerpt,
    published_at: item.date,
    content: [...item.content],
    seo: {
      title: item.title,
      description: item.excerpt,
      canonical_url: null,
      og_image_url: item.thumb,
    },
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
