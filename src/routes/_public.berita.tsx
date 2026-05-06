import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { PageHero } from "@/components/public/PageHero";
import { news } from "@/data/site";

const NEWS_PAGE_SIZE = 6;

export const Route = createFileRoute("/_public/berita")({
  component: NewsPage,
  validateSearch: (search: Record<string, unknown>) => {
    const page = Number(search.page ?? 1);

    return {
      page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    };
  },
  head: () => ({ meta: [{ title: "Berita - Indobraga" }] }),
});

function NewsPage() {
  const isDetail = useRouterState({
    select: (state) => state.location.pathname !== "/berita",
  });
  const { page } = Route.useSearch();
  const totalPages = Math.max(1, Math.ceil(news.length / NEWS_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * NEWS_PAGE_SIZE;
  const visibleNews = news.slice(pageStart, pageStart + NEWS_PAGE_SIZE);
  const featuredNews = news[0];

  if (isDetail) {
    return <Outlet />;
  }

  return (
    <>
      <PageHero
        kicker="Berita"
        title="Kabar terbaru dari Indobraga"
        subtitle="Update fasilitas, portfolio, kapasitas produksi, dan kegiatan perusahaan."
        image={featuredNews?.thumb}
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {news.length === 0 ? (
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
                    className="group overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-1 hover:shadow-elegant"
                  >
                    <img
                      src={n.thumb}
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
                          {new Date(n.date).toLocaleDateString("id-ID")}
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
