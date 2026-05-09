import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHero } from "@/components/public/PageHero";
import { PublicErrorState } from "@/components/admin/ApiState";
import { portfolios } from "@/data/site";
import { useApiQuery } from "@/hooks/use-api-query";
import { publicContentApi } from "@/lib/api-services";
import { pageSeo } from "@/lib/seo";

const PORTFOLIO_BATCH_SIZE = 8;

export const Route = createFileRoute("/_public/portfolio")({
  component: PortfolioPage,
  head: () =>
    pageSeo({
      title: "Portofolio Produk Garment - Indobraga",
      description:
        "Portofolio produksi Indobraga untuk jersey, polo, wearpack, jaket, hoodie, seragam, kaos, dan merchandise custom.",
      path: "/portfolio",
      image: portfolios[0]?.image,
    }),
});

function PortfolioPage() {
  const [active, setActive] = useState("Semua");
  const [visibleCount, setVisibleCount] = useState(PORTFOLIO_BATCH_SIZE);
  const [cats, setCats] = useState([
    "Semua",
    ...Array.from(new Set(portfolios.map((p) => p.category))),
  ]);
  const loadPortfolio = useCallback(
    () =>
      publicContentApi.portfolio({
        limit: 24,
        category: active === "Semua" ? undefined : active,
      }),
    [active],
  );
  const { data, error, loading, reload } = useApiQuery(
    ["public", "portfolio", active],
    loadPortfolio,
  );
  const list = useMemo(() => data?.items ?? [], [data?.items]);
  const visibleList = list.slice(0, visibleCount);
  const hasMoreItems = visibleCount < list.length;
  const featuredPortfolio = list[0];

  useEffect(() => {
    if (active === "Semua" && list.length > 0) {
      setCats(["Semua", ...Array.from(new Set(list.map((p) => p.category)))]);
    }
  }, [active, list]);

  const selectCategory = (category: string) => {
    setActive(category);
    setVisibleCount(PORTFOLIO_BATCH_SIZE);
  };

  return (
    <>
      <PageHero
        kicker="Portofolio"
        title="Hasil produksi apparel dan merchandise multiproduk"
        subtitle="Jersey, polo, wearpack, windrunner, hoodie, corporate uniform, t-shirt, dan bag merchandise dari portofolio Indobraga."
        image={
          featuredPortfolio?.medium_url ?? featuredPortfolio?.thumbnail_url ?? portfolios[0]?.image
        }
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {error && <PublicErrorState error={error} onRetry={reload} />}
          {loading && !data && (
            <div className="mb-4 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              Memuat portofolio dari backend...
            </div>
          )}
          <div className="flex min-w-0 flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => selectCategory(c)}
                className={`max-w-full rounded-full px-4 py-2 text-sm font-semibold leading-tight transition ${
                  active === c
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "bg-secondary text-secondary-foreground hover:bg-primary-soft"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Belum ada portofolio yang dipublikasikan untuk kategori ini.
            </div>
          ) : (
            <>
              <div className="mt-10 grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {visibleList.map((p) => (
                  <article
                    key={p.id}
                    className="group overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-1 hover:shadow-elegant"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={p.medium_url ?? p.thumbnail_url ?? portfolios[0]?.image}
                        alt={p.alt_text ?? p.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {p.category}
                      </span>
                      <h3 className="mt-1 font-display text-lg font-bold">{p.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{p.short_description}</p>
                    </div>
                  </article>
                ))}
              </div>
              {hasMoreItems && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((count) =>
                        Math.min(count + PORTFOLIO_BATCH_SIZE, list.length),
                      )
                    }
                    className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-primary shadow-card transition hover:border-primary/30 hover:bg-primary hover:text-primary-foreground"
                  >
                    Muat lagi
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
