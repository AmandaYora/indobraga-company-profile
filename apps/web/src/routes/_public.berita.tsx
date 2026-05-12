import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useCallback } from "react";
import { PublicErrorState } from "@/components/admin/ApiState";
import { PageHero } from "@/components/public/PageHero";
import { news } from "@/data/site";
import { useApiQuery } from "@/hooks/use-api-query";
import { publicContentApi } from "@/lib/api-services";
import { fallbackNewsPage } from "@/lib/public-fallbacks";
import { formatDateId } from "@/lib/date";
import { pageSeo } from "@/lib/seo";

const NEWS_PAGE_SIZE = 6;

export const Route = createFileRoute("/_public/berita")({
  component: NewsPage,
  validateSearch: (search: Record<string, unknown>) => {
    const page = Number(search.page ?? 1);

    return {
      page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    };
  },
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ deps }) => {
    try {
      return await publicContentApi.news({ page: deps.page, limit: NEWS_PAGE_SIZE });
    } catch {
      return fallbackNewsPage(deps.page, NEWS_PAGE_SIZE);
    }
  },
  head: ({ matches }) => {
    const isNewsDetail = matches.some((match) => match.routeId === "/_public/berita/$slug");

    if (isNewsDetail) {
      return {};
    }

    return pageSeo({
      title: "Berita - Indobraga",
      description:
        "Kabar terbaru Indobraga seputar fasilitas produksi, portofolio apparel, kapasitas manufaktur, dan kegiatan perusahaan.",
      path: "/berita",
      image: news[0]?.thumb,
    });
  },
});

function NewsPage() {
  const isDetail = useRouterState({
    select: (state) => state.location.pathname !== "/berita",
  });
  const { page } = Route.useSearch();
  const initialNews = Route.useLoaderData();
  const loadNews = useCallback(
    () => publicContentApi.news({ page, limit: NEWS_PAGE_SIZE }),
    [page],
  );
  const { data, error, loading, reload } = useApiQuery(["public", "news", page], loadNews, {
    initialData: initialNews,
  });
  const totalPages = data?.pagination.total_pages ?? 1;
  const currentPage = Math.min(page, totalPages);
  const visibleNews = data?.items ?? [];
  const featuredNews = visibleNews[0] ?? news[0];

  if (isDetail) {
    return <Outlet />;
  }

  return (
    <>
      <PageHero
        kicker="Berita"
        title="Kabar terbaru dari Indobraga"
        subtitle="Update fasilitas, portofolio, kapasitas produksi, dan kegiatan perusahaan."
        image={"thumb" in featuredNews ? featuredNews.thumb : featuredNews?.thumbnail_url}
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {error && <PublicErrorState error={error} onRetry={reload} />}
          {loading && !data && (
            <div className="mb-4 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Memuat berita dari backend...
            </div>
          )}
          {visibleNews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Belum ada berita yang dipublikasikan.
            </div>
          ) : (
            <>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {visibleNews.map((n) => (
                  <Link
                    key={n.id}
                    to="/berita/$slug"
                    params={{ slug: n.slug }}
                    search={{ page: currentPage }}
                    className="group overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-1 hover:shadow-elegant"
                  >
                    <img
                      src={n.thumbnail_url ?? news[0]?.thumb}
                      alt={n.title}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover"
                    />
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded-full bg-accent/20 px-2.5 py-0.5 font-semibold text-accent-foreground">
                          {n.category}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDateId(n.published_at ?? "")}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-lg font-bold">{n.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{n.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {totalPages > 1 && (
                <nav
                  aria-label="Pagination berita"
                  className="mt-10 flex flex-wrap items-center justify-center gap-2"
                >
                  {currentPage > 1 ? (
                    <Link
                      to="/berita"
                      search={{ page: currentPage - 1 }}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-primary hover:text-primary-foreground"
                    >
                      Sebelumnya
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground/60">
                      Sebelumnya
                    </span>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                    <Link
                      key={pageNumber}
                      to="/berita"
                      search={{ page: pageNumber }}
                      aria-current={currentPage === pageNumber ? "page" : undefined}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-semibold transition ${
                        currentPage === pageNumber
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-primary hover:border-primary/30 hover:bg-primary hover:text-primary-foreground"
                      }`}
                    >
                      {pageNumber}
                    </Link>
                  ))}
                  {currentPage < totalPages ? (
                    <Link
                      to="/berita"
                      search={{ page: currentPage + 1 }}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary transition hover:border-primary/30 hover:bg-primary hover:text-primary-foreground"
                    >
                      Berikutnya
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground/60">
                      Berikutnya
                    </span>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
