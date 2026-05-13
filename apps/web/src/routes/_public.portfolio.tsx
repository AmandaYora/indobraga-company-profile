import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OptionalImage } from "@/components/public/MediaPlaceholder";
import { PageHero } from "@/components/public/PageHero";
import { PortfolioGridSkeleton } from "@/components/public/PublicSkeletons";
import { PublicErrorState } from "@/components/admin/ApiState";
import { useApiQuery } from "@/hooks/use-api-query";
import { publicContentApi } from "@/lib/api-services";
import { fallbackPortfolioCategories, fallbackPortfolioList } from "@/lib/public-fallbacks";
import { pageSeo } from "@/lib/seo";

const PORTFOLIO_BATCH_SIZE = 8;
const ALL_CATEGORIES = "all";

export const Route = createFileRoute("/_public/portfolio")({
  component: PortfolioPage,
  pendingComponent: PortfolioPendingPage,
  pendingMs: 300,
  pendingMinMs: 300,
  loader: async () => {
    try {
      const [portfolio, categories] = await Promise.all([
        publicContentApi.portfolio({ limit: 24 }),
        publicContentApi.portfolioCategories(),
      ]);
      return { portfolio, categories };
    } catch {
      return {
        portfolio: fallbackPortfolioList(undefined, 24),
        categories: fallbackPortfolioCategories(),
      };
    }
  },
  head: () =>
    pageSeo({
      title: "Portofolio Produk Garment - Indobraga",
      description:
        "Portofolio produksi Indobraga untuk jersey, polo, wearpack, jaket, hoodie, seragam, kaos, dan merchandise custom.",
      path: "/portfolio",
    }),
});

function PortfolioPendingPage() {
  return (
    <>
      <PageHero
        kicker="Portofolio"
        title="Hasil produksi apparel dan merchandise multiproduk"
        subtitle="Jersey, polo, wearpack, windrunner, hoodie, corporate uniform, t-shirt, dan bag merchandise dari portofolio Indobraga."
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <PortfolioGridSkeleton />
        </div>
      </section>
    </>
  );
}

function PortfolioPage() {
  const initialData = Route.useLoaderData();
  const [activeSlug, setActiveSlug] = useState(ALL_CATEGORIES);
  const [visibleCount, setVisibleCount] = useState(PORTFOLIO_BATCH_SIZE);
  const loadCategories = useCallback(() => publicContentApi.portfolioCategories(), []);
  const categoriesQuery = useApiQuery(["public", "portfolio-categories"], loadCategories, {
    initialData: initialData.categories,
    refetchOnMount: false,
  });
  const categories = useMemo(
    () => categoriesQuery.data?.items ?? [],
    [categoriesQuery.data?.items],
  );
  const loadPortfolio = useCallback(
    () =>
      publicContentApi.portfolio({
        limit: 24,
        category_slug: activeSlug === ALL_CATEGORIES ? undefined : activeSlug,
      }),
    [activeSlug],
  );
  const { data, error, loading, reload } = useApiQuery(
    ["public", "portfolio", activeSlug],
    loadPortfolio,
    {
      initialData: activeSlug === ALL_CATEGORIES ? initialData.portfolio : null,
      refetchOnMount: false,
    },
  );
  const list = useMemo(() => data?.items ?? [], [data?.items]);
  const visibleList = list.slice(0, visibleCount);
  const hasMoreItems = visibleCount < list.length;
  const featuredPortfolio = list[0];
  const categoryError = categoriesQuery.error;
  const filterOptions = useMemo(
    () =>
      categories.length > 0
        ? [{ slug: ALL_CATEGORIES, name: "Semua" }, ...categories.map((item) => item)]
        : [],
    [categories],
  );

  useEffect(() => {
    if (
      activeSlug !== ALL_CATEGORIES &&
      categories.length > 0 &&
      !categories.some((category) => category.slug === activeSlug)
    ) {
      setActiveSlug(ALL_CATEGORIES);
    }
  }, [activeSlug, categories]);

  const selectCategory = (categorySlug: string) => {
    setActiveSlug(categorySlug);
    setVisibleCount(PORTFOLIO_BATCH_SIZE);
  };

  const retry = () => {
    reload();
    categoriesQuery.reload();
  };

  return (
    <>
      <PageHero
        kicker="Portofolio"
        title="Hasil produksi apparel dan merchandise multiproduk"
        subtitle="Jersey, polo, wearpack, windrunner, hoodie, corporate uniform, t-shirt, dan bag merchandise dari portofolio Indobraga."
        image={featuredPortfolio?.medium_url ?? featuredPortfolio?.thumbnail_url ?? undefined}
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {(error || categoryError) && (
            <PublicErrorState error={error ?? categoryError} onRetry={retry} />
          )}
          {filterOptions.length > 0 && (
            <div className="flex min-w-0 flex-wrap gap-2">
              {filterOptions.map((category) => (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => selectCategory(category.slug)}
                  className={`max-w-full rounded-full px-4 py-2 text-sm font-semibold leading-tight transition ${
                    activeSlug === category.slug
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "bg-secondary text-secondary-foreground hover:bg-primary-soft"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
          {loading && !data ? (
            <PortfolioGridSkeleton />
          ) : list.length === 0 ? (
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
                      <OptionalImage
                        src={p.medium_url ?? p.thumbnail_url}
                        alt={p.alt_text ?? p.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        placeholderClassName="h-full w-full"
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
