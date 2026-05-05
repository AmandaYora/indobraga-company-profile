import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/public/PageHero";
import { machines, printingCapacity, productionCapacity, services, strengths } from "@/data/site";

export const Route = createFileRoute("/_public/fasilitas")({
  component: FacilitiesPage,
  head: () => ({ meta: [{ title: "Fasilitas Produksi - Indobraga" }] }),
});

function FacilitiesPage() {
  const totalProduction = productionCapacity.reduce(
    (sum, item) => sum + Number(item.value.replace(".", "")),
    0,
  );

  return (
    <>
      <PageHero
        kicker="Fasilitas"
        title="Kapasitas produksi dan custom fabric printing"
        subtitle="Fasilitas Indobraga mendukung produksi garment, sublimation, press, DTF, pattern making, sample, QC, finishing, dan packing."
        image={machines[0].image}
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {strengths.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <div className="font-display text-3xl font-extrabold text-primary">{s.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{s.suffix}</p>
                <p className="mt-3 text-sm font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    Kapasitas Produksi
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold text-primary-deep">
                    Total {totalProduction.toLocaleString("id-ID")} pcs per bulan
                  </h2>
                </div>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                  Data CP Indobraga
                </span>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {productionCapacity.map((item) => (
                  <div key={item.product} className="rounded-2xl bg-secondary p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.product}
                    </p>
                    <p className="mt-2 font-display text-3xl font-extrabold text-primary-deep">
                      {item.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.unit}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-elegant">
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                Printing, Sublimation, DTF
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold">Atexco Model X Plus</h2>
              <p className="mt-3 text-sm text-primary-foreground/75">
                Mesin sublimasi berkapasitas besar untuk certified ink, consistent output, dan
                kebutuhan produksi apparel skala bisnis.
              </p>
              <div className="mt-6 grid gap-3">
                {printingCapacity.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl bg-white/10 p-4"
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                        {item.label}
                      </p>
                      <p className="text-xs text-primary-foreground/60">{item.unit}</p>
                    </div>
                    <p className="font-display text-3xl font-extrabold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {machines.map((m) => (
              <article
                key={m.id}
                className="grid gap-5 overflow-hidden rounded-2xl bg-card shadow-card sm:grid-cols-[200px_1fr]"
              >
                <img
                  src={m.image}
                  alt={m.name}
                  loading="lazy"
                  className="h-full min-h-48 w-full object-cover"
                />
                <div className="p-5 sm:pl-0">
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">
                    {m.metric}
                  </span>
                  <h3 className="mt-2 font-display text-xl font-bold">{m.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{m.desc}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-14 rounded-3xl border border-border bg-card p-6 shadow-card">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Apparel Manufacturing Services
            </span>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service}
                  className="rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold"
                >
                  {service}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
