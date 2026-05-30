import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (options: { component: () => ReactElement }) => ({
    options,
    path,
    useParams: () => ({ slug: "berita-1" }),
    useLoaderData: () => getLoaderDataForPath(path),
    useSearch: () => ({ page: 2 }),
  }),
  Link: ({ children, className, to }: { children: ReactNode; className?: string; to: string }) => (
    <a className={className} href={to}>
      {children}
    </a>
  ),
  Outlet: () => <div>Outlet detail</div>,
  useRouterState: () => false,
}));

const portfolioItems = Array.from({ length: 9 }, (_, index) => ({
  alt_text: `Produk ${index + 1}`,
  category: index % 2 === 0 ? "Jersey" : "Seragam",
  category_slug: index % 2 === 0 ? "jersey" : "seragam",
  id: index + 1,
  medium_url: `/portfolio-${index + 1}.jpg`,
  short_description: "Deskripsi produk",
  slug: `produk-${index + 1}`,
  thumbnail_url: `/portfolio-${index + 1}-thumb.jpg`,
  title: `Produk ${index + 1}`,
}));

const galleryItems = Array.from({ length: 9 }, (_, index) => ({
  caption: `Dokumentasi ${index + 1}`,
  id: index + 1,
  media_url: `/gallery-${index + 1}.jpg`,
  published_at: "2026-01-01T00:00:00.000Z",
  thumbnail_url: `/gallery-${index + 1}-thumb.jpg`,
  type: index === 1 ? "video" : "image",
}));

const newsItems = [
  {
    category: "Event",
    excerpt: "Ringkasan berita",
    id: 1,
    published_at: "2026-01-01T00:00:00.000Z",
    slug: "berita-1",
    thumbnail_url: "/news-1.jpg",
    title: "Berita Satu",
  },
  {
    category: "Produksi",
    excerpt: "Ringkasan berita dua",
    id: 2,
    published_at: "2026-01-02T00:00:00.000Z",
    slug: "berita-2",
    thumbnail_url: "/news-2.jpg",
    title: "Berita Dua",
  },
];

function getLoaderDataForPath(path: string) {
  if (path === "/_public/portfolio") {
    return {
      portfolio: { items: portfolioItems, next_cursor: null, has_more: false },
      categories: {
        items: [
          { count: 5, id: 1, name: "Jersey", slug: "jersey" },
          { count: 4, id: 2, name: "Seragam", slug: "seragam" },
        ],
      },
    };
  }

  if (path === "/_public/fasilitas") {
    return {
      machines: [
        {
          description: "Mesin jahit produksi",
          id: 1,
          image_url: "/machine.jpg",
          metric: "100 unit",
          name: "Mesin Jahit",
        },
      ],
      printing_capacities: [
        {
          description: "Sublimasi",
          image_url: "/printing.jpg",
          label: "Sublim",
          unit: "meter",
          value: "1.000",
        },
      ],
      production_capacities: [
        { product: "Jersey", unit: "pcs/bulan", value: "1.000" },
        { product: "Kaos", unit: "pcs/bulan", value: "2.000" },
      ],
      services: [{ name: "Cutting" }, { name: "Sewing" }],
      strengths: [{ label: "Kapasitas", suffix: "pcs/bulan", value: "3.000" }],
    };
  }

  if (path === "/_public/galeri") {
    return { items: galleryItems, next_cursor: null, has_more: false };
  }

  if (path === "/_public/berita") {
    return { items: newsItems, pagination: { page: 2, limit: 6, total: 12, total_pages: 3 } };
  }

  if (path === "/_public/berita/$slug") {
    return {
      category: "Event",
      content: ["Paragraf pertama", "Paragraf kedua"],
      excerpt: "Ringkasan detail berita",
      id: 1,
      published_at: "2026-01-01T00:00:00.000Z",
      seo: {
        title: "Detail Berita",
        description: "Ringkasan detail berita",
        canonical_url: null,
        og_image_url: "/news-detail.jpg",
      },
      slug: "berita-1",
      thumbnail_url: "/news-detail.jpg",
      title: "Detail Berita",
    };
  }

  if (path === "/_public/kontak") {
    return {
      address: "Bandung",
      brand: "Indobraga",
      contact_hero_image_url: "/contact-hero.jpg",
      contact_person: "Mahardika",
      contact_role: "Marketing",
      email: "support@example.com",
      instagram: "indobraga",
      legal_name: "PT Braga",
      phone: "0812",
      seo: {},
      show_brand_text: false,
      whatsapp: "62812",
    };
  }

  return null;
}

vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: (key: readonly unknown[]) => {
    const scope = String(key[1]);

    if (scope === "portfolio") {
      return {
        data: { items: portfolioItems, next_cursor: null, has_more: false },
        error: null,
        loading: false,
        reload: vi.fn(),
      };
    }

    if (scope === "portfolio-categories") {
      return {
        data: {
          items: [
            { count: 5, id: 1, name: "Jersey", slug: "jersey" },
            { count: 4, id: 2, name: "Seragam", slug: "seragam" },
          ],
        },
        error: null,
        loading: false,
        reload: vi.fn(),
      };
    }

    if (scope === "facilities") {
      return {
        data: {
          machines: [
            {
              description: "Mesin jahit produksi",
              id: 1,
              image_url: "/machine.jpg",
              metric: "100 unit",
              name: "Mesin Jahit",
            },
          ],
          printing_capacities: [
            {
              description: "Sublimasi",
              image_url: "/printing.jpg",
              label: "Sublim",
              unit: "meter",
              value: "1.000",
            },
          ],
          production_capacities: [
            { product: "Jersey", unit: "pcs/bulan", value: "1.000" },
            { product: "Kaos", unit: "pcs/bulan", value: "2.000" },
          ],
          services: [{ name: "Cutting" }, { name: "Sewing" }],
          strengths: [{ label: "Kapasitas", suffix: "pcs/bulan", value: "3.000" }],
        },
        error: null,
        loading: false,
        reload: vi.fn(),
      };
    }

    if (scope === "gallery") {
      return {
        data: { items: galleryItems, pagination: { total_pages: 1 } },
        error: null,
        loading: false,
        reload: vi.fn(),
      };
    }

    if (scope === "home") {
      return {
        data: null,
        error: null,
        loading: false,
        reload: vi.fn(),
      };
    }

    if (scope === "news-detail") {
      return {
        data: {
          category: "Event",
          content: ["Paragraf pertama", "Paragraf kedua"],
          excerpt: "Ringkasan detail berita",
          id: 1,
          published_at: "2026-01-01T00:00:00.000Z",
          slug: "berita-1",
          thumbnail_url: "/news-detail.jpg",
          title: "Detail Berita",
        },
        error: null,
        loading: false,
        reload: vi.fn(),
      };
    }

    return {
      data: { items: newsItems, pagination: { total_pages: 3 } },
      error: null,
      loading: false,
      reload: vi.fn(),
    };
  },
}));

type MockRoute = {
  options: {
    component: () => ReactElement;
    head?: (input: { matches: Array<{ routeId: string }> }) => unknown;
    validateSearch?: (search: Record<string, unknown>) => unknown;
  };
};

function renderRoute(route: MockRoute) {
  return renderToStaticMarkup(<route.options.component />);
}

describe("public route rendering", () => {
  it("renders portfolio, facilities, gallery, and news list data from API query state", async () => {
    const [home, portfolio, facilities, gallery, news, newsDetail, contact] = await Promise.all([
      import("./_public.index"),
      import("./_public.portfolio"),
      import("./_public.fasilitas"),
      import("./_public.galeri"),
      import("./_public.berita"),
      import("./_public.berita.$slug"),
      import("./_public.kontak"),
    ]);

    const output = [
      renderRoute(home.Route as MockRoute),
      renderRoute(portfolio.Route as MockRoute),
      renderRoute(facilities.Route as MockRoute),
      renderRoute(gallery.Route as MockRoute),
      renderRoute(news.Route as MockRoute),
      renderRoute(newsDetail.Route as MockRoute),
      renderRoute(contact.Route as MockRoute),
    ].join("\n");

    expect(output).toContain("Produksi");
    expect(output).toContain("Hasil produksi apparel");
    expect(output).toContain("Produk 1");
    expect(output).toContain("Muat lagi");
    expect(output).toContain("Total 3.000 pcs per bulan");
    expect(output).toContain("Mesin Jahit");
    expect(output).toContain("Cutting");
    expect(output).toContain("Dokumentasi Visual Indobraga");
    expect(output).toContain("Dokumentasi 2");
    expect(output).toContain("Berita Satu");
    expect(output).toContain("Sebelumnya");
    expect(output).toContain("Berikutnya");
    expect(output).toContain("Detail Berita");
    expect(output).toContain("Paragraf pertama");
    expect(output).toContain("Mari bicarakan kebutuhan produksi Anda");
    expect(output).toContain("Kirim Pesan");
  });

  it("keeps public news route search and head contracts stable", async () => {
    const news = await import("./_public.berita");
    const route = news.Route as MockRoute;

    expect(route.options.validateSearch?.({ page: "3.9" })).toEqual({ page: 3 });
    expect(route.options.validateSearch?.({ page: "-1" })).toEqual({ page: 1 });
    expect(route.options.head?.({ matches: [{ routeId: "/_public/berita/$slug" }] })).toEqual({});
    expect(route.options.head?.({ matches: [{ routeId: "/_public/berita" }] })).toMatchObject({
      meta: expect.any(Array),
    });
  });
});
