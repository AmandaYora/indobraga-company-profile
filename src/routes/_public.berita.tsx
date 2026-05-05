import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { PageHero } from "@/components/public/PageHero";
import { news } from "@/data/site";

export const Route = createFileRoute("/_public/berita")({
  component: NewsPage,
  head: () => ({ meta: [{ title: "Berita - Indobraga" }] }),
});

function NewsPage() {
  const isDetail = useRouterState({
    select: (state) => state.location.pathname !== "/berita",
  });

  if (isDetail) {
    return <Outlet />;
  }

  return (
    <>
      <PageHero
        kicker="Berita"
        title="Kabar terbaru dari Indobraga"
        subtitle="Update fasilitas, portfolio, kapasitas produksi, dan kegiatan perusahaan."
        image={news[0].thumb}
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {news.map((n) => (
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
        </div>
      </section>
    </>
  );
}
