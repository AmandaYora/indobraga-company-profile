import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/public/PageHero";
import { portfolios } from "@/data/site";

export const Route = createFileRoute("/_public/portfolio")({
  component: PortfolioPage,
  head: () => ({ meta: [{ title: "Portofolio Produk Garment - Indobraga" }] }),
});

function PortfolioPage() {
  const cats = ["Semua", ...Array.from(new Set(portfolios.map((p) => p.category)))];
  const [active, setActive] = useState("Semua");
  const list = active === "Semua" ? portfolios : portfolios.filter((p) => p.category === active);

  return (
    <>
      <PageHero
        kicker="Portofolio"
        title="Hasil produksi apparel dan merchandise multiproduk"
        subtitle="Jersey, polo, wearpack, windrunner, hoodie, corporate uniform, t-shirt, dan bag merchandise dari portfolio Indobraga."
        image={portfolios[0].image}
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
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
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p) => (
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
        </div>
      </section>
    </>
  );
}
