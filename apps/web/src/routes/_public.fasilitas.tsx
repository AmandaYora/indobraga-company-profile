import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import { PublicErrorState } from "@/components/admin/ApiState";
import { OptionalImage } from "@/components/public/MediaPlaceholder";
import { PageHero } from "@/components/public/PageHero";
import { FacilitiesContentSkeleton } from "@/components/public/PublicSkeletons";
import { machines, printingCapacity, productionCapacity, services, strengths } from "@/data/site";
import { useApiQuery } from "@/hooks/use-api-query";
import { publicContentApi } from "@/lib/api-services";
import { fallbackFacilities } from "@/lib/public-fallbacks";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/_public/fasilitas")({
  component: FacilitiesPage,
  pendingComponent: FacilitiesPendingPage,
  pendingMs: 300,
  pendingMinMs: 300,
  loader: async () => {
    try {
      return await publicContentApi.facilities();
    } catch {
      return fallbackFacilities;
    }
  },
  head: () =>
    pageSeo({
      title: "Fasilitas Produksi - Indobraga",
      description:
        "Fasilitas produksi Indobraga mencakup garment, sublimation, press, DTF, pattern making, sample, QC, finishing, dan packing.",
      path: "/fasilitas",
    }),
});

function FacilitiesPendingPage() {
  return (
    <>
      <PageHero
        kicker="Fasilitas"
        title="Kapasitas produksi dan cetak kain custom"
        subtitle="Fasilitas Indobraga mendukung produksi garment, sublimation, press, DTF, pattern making, sample, QC, finishing, dan packing."
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FacilitiesContentSkeleton />
        </div>
      </section>
    </>
  );
}

function FacilitiesPage() {
  const initialFacilities = Route.useLoaderData();
  const loadFacilities = useCallback(() => publicContentApi.facilities(), []);
  const { data, error, loading, reload } = useApiQuery(["public", "facilities"], loadFacilities, {
    initialData: initialFacilities,
    refetchOnMount: false,
  });
  const displayedStrengths = data?.strengths ?? strengths;
  const displayedMachines = data?.machines ?? machines;
  const displayedPrinting = data?.printing_capacities ?? printingCapacity;
  const displayedProduction = data?.production_capacities ?? productionCapacity;
  const displayedServices = data?.services ?? services.map((name) => ({ name }));
  const totalProduction = displayedProduction.reduce(
    (sum, item) => sum + Number(item.value.replace(".", "")),
    0,
  );

  return (
    <>
      <PageHero
        kicker="Fasilitas"
        title="Kapasitas produksi dan cetak kain custom"
        subtitle="Fasilitas Indobraga mendukung produksi garment, sublimation, press, DTF, pattern making, sample, QC, finishing, dan packing."
        image={
          displayedMachines[0] && "image_url" in displayedMachines[0]
            ? (displayedMachines[0].image_url ?? undefined)
            : undefined
        }
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {error && <PublicErrorState error={error} onRetry={reload} />}
          {loading && !data ? (
            <FacilitiesContentSkeleton />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {displayedStrengths.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-border bg-card p-6 shadow-card"
                  >
                    <div className="font-display text-3xl font-extrabold text-primary">
                      {s.value}
                    </div>
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
                    {displayedProduction.map((item) => (
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
                    {displayedPrinting.map((item) => (
                      <div
                        key={item.label}
                        className="flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 sm:gap-4"
                      >
                        <OptionalImage
                          src={"image_url" in item ? item.image_url : null}
                          alt={item.label}
                          className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-white/15"
                          placeholderClassName="h-16 w-16 shrink-0 rounded-xl ring-1 ring-white/15"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                            {item.label}
                          </p>
                          <p className="truncate text-[11px] text-primary-foreground/70">
                            {"desc" in item ? item.desc : item.description}
                          </p>
                          <p className="text-[11px] text-primary-foreground/60">{item.unit}</p>
                        </div>
                        <p className="shrink-0 font-display text-xl font-extrabold leading-none sm:text-2xl">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-14 grid gap-8 md:grid-cols-2">
                {displayedMachines.map((m) => (
                  <article
                    key={m.id}
                    className="grid min-w-0 gap-5 overflow-hidden rounded-2xl bg-card shadow-card sm:grid-cols-[200px_1fr]"
                  >
                    <OptionalImage
                      src={"image_url" in m ? m.image_url : null}
                      alt={m.name}
                      className="h-full min-h-48 w-full object-cover"
                      placeholderClassName="h-full min-h-48 w-full"
                    />
                    <div className="p-5 sm:pl-0">
                      <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">
                        {m.metric}
                      </span>
                      <h3 className="mt-2 font-display text-xl font-bold">{m.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {"desc" in m ? m.desc : m.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-14 rounded-3xl border border-border bg-card p-6 shadow-card">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Apparel Manufacturing Services
                </span>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedServices.map((service) => (
                    <div
                      key={typeof service === "string" ? service : service.name}
                      className="rounded-2xl bg-secondary px-4 py-3 text-sm font-semibold"
                    >
                      {typeof service === "string" ? service : service.name}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
