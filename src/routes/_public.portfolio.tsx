import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/public/PageHero";
import { portfolios } from "@/data/site";

const PORTFOLIO_BATCH_SIZE = 8;

export const Route = createFileRoute("/_public/portfolio")({
  component: PortfolioPage,
  head: () => ({ meta: [{ title: "Portofolio Produk Garment - Indobraga" }] }),
});

function PortfolioPage() {
  const cats = ["Semua", ...Array.from(new Set(portfolios.map((p) => p.category)))];
  const [active, setActive] = useState("Semua");
  const [visibleCount, setVisibleCount] = useState(PORTFOLIO_BATCH_SIZE);
  const list = active === "Semua" ? portfolios : portfolios.filter((p) => p.category === active);
  const visibleList = list.slice(0, visibleCount);
  const hasMoreItems = visibleCount < list.length;
  const featuredPortfolio = portfolios[0];

  const selectCategory = (category: string) => {
    setActive(category);
    setVisibleCount(PORTFOLIO_BATCH_SIZE);
  };

  return (
    <>
      <PageHero
        kicker="Portofolio"
        title="Hasil produksi apparel dan merchandise multiproduk"
        subtitle="Jersey, polo, wearpack, windrunner, hoodie, corporate uniform, t-shirt, dan bag merchandise dari portfolio Indobraga."
        image={featuredPortfolio?.image}
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => selectCategory(c)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
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
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {visibleList.map((p) => (
                  <article
                    key={p.id}
                    className="group overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-1 hover:shadow-elegant"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={p.image}
                        alt={p.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {p.category}
                      </span>
                      <h3 className="mt-1 font-display text-lg font-bold">{p.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
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
