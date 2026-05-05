import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/public/PageHero";
import { machines, strengths } from "@/data/site";
export const Route = createFileRoute("/_public/fasilitas")({ component: F, head: () => ({ meta: [{ title: "Fasilitas — Indobraga" }] }) });
function F() {
  return (
    <>
      <PageHero kicker="Fasilitas" title="Mesin & fasilitas produksi modern" subtitle="Ekosistem produksi lengkap dari potong, jahit, bordir, hingga finishing." />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {strengths.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="font-display text-3xl font-extrabold text-primary">{s.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{s.suffix}</p>
                <p className="mt-3 text-sm font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {machines.map((m) => (
              <article key={m.id} className="grid grid-cols-[160px_1fr] gap-5 overflow-hidden rounded-2xl bg-card shadow-card sm:grid-cols-[200px_1fr]">
                <img src={m.image} alt={m.name} loading="lazy" className="h-full w-full object-cover" />
                <div className="py-5 pr-5">
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">{m.qty} unit</span>
                  <h3 className="mt-2 font-display text-xl font-bold">{m.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
