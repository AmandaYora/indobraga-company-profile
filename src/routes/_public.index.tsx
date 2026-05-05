import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Factory, Sparkles, Truck, Users } from "lucide-react";
import hero from "@/assets/hero-factory.jpg";
import { partners, portfolios, strengths, news, machines } from "@/data/site";

export const Route = createFileRoute("/_public/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "Indobraga — Solusi Produksi Garment Profesional untuk Bisnis Anda" },
      { name: "description", content: "Custom apparel, uniform, merchandise, dan produksi garment skala bisnis. Dipercaya oleh 250+ perusahaan." },
    ],
  }),
});

function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
        <div className="absolute inset-0 opacity-30">
          <img src={hero} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-deep via-primary-deep/70 to-transparent" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 md:py-32 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent ring-1 ring-accent/30">
              <Sparkles className="h-3.5 w-3.5" /> Produsen Garment Terpercaya Sejak 2010
            </span>
            <h1 className="mt-5 text-balance font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl md:text-6xl">
              Solusi Produksi Garment <span className="text-accent">Profesional</span> untuk Bisnis Anda
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
              Custom apparel, uniform, merchandise, dan produksi skala bisnis dengan
              kualitas terbaik. Indobraga membantu brand & korporasi mewujudkan
              produk garment yang dibanggakan.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/kontak"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-accent px-7 py-3.5 text-sm font-bold text-accent-foreground shadow-elegant transition-transform hover:scale-105"
              >
                Konsultasi Produksi <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/portfolio"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-primary-foreground backdrop-blur transition hover:bg-white/10"
              >
                Lihat Portfolio
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-primary-foreground/80">
              {["Kualitas Premium", "MOQ Fleksibel", "Tepat Waktu"].map((t) => (
                <span key={t} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-accent" />{t}</span>
              ))}
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-3xl bg-accent/10 blur-2xl" />
            <img
              src={hero}
              alt="Lini produksi garment Indobraga"
              width={1920}
              height={1280}
              className="relative rounded-3xl object-cover shadow-elegant"
            />
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="border-y border-border bg-secondary py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-base font-semibold text-foreground sm:text-lg">
            Dipercaya oleh lebih dari <span className="text-primary">250+ bisnis</span> di berbagai industri.
          </p>
          <div className="mt-8 overflow-hidden">
            <div className="flex w-max animate-marquee gap-12">
              {[...partners, ...partners].map((p, i) => (
                <div key={i} className="flex h-14 w-36 shrink-0 items-center justify-center rounded-lg bg-card font-display text-lg font-bold tracking-tight text-primary-deep shadow-card">
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STRENGTH */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Kekuatan Produksi</span>
            <h2 className="mt-3 font-display text-3xl font-bold text-primary-deep sm:text-4xl">
              Skala produksi yang siap melayani kebutuhan bisnis Anda
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {strengths.map((s, i) => (
              <div key={s.label} className="group rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-elegant" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="font-display text-4xl font-extrabold text-primary">{s.value}</div>
                <div className="mt-1 text-xs font-medium text-muted-foreground">{s.suffix}</div>
                <div className="mt-4 border-t border-border pt-4 text-sm font-semibold text-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO PREVIEW */}
      <section className="bg-gradient-soft py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Portfolio Produk</span>
              <h2 className="mt-3 font-display text-3xl font-bold text-primary-deep sm:text-4xl">
                Beragam produk garment yang pernah kami buat
              </h2>
            </div>
            <Link to="/portfolio" className="hidden items-center gap-1 text-sm font-semibold text-primary hover:text-primary-deep sm:inline-flex">
              Lihat semua <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.slice(0, 6).map((p) => (
              <article key={p.id} className="group overflow-hidden rounded-2xl bg-card shadow-card transition hover:shadow-elegant">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">{p.category}</span>
                  <h3 className="mt-1 font-display text-lg font-bold text-foreground">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MACHINES PREVIEW */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Mesin & Fasilitas</span>
              <h2 className="mt-3 font-display text-3xl font-bold text-primary-deep sm:text-4xl">
                Teknologi produksi modern di setiap tahap
              </h2>
              <p className="mt-4 text-muted-foreground">
                Dari mesin potong, jahit, bordir, hingga press dan finishing — kami
                memiliki ekosistem mesin lengkap untuk menjaga kualitas dan ketepatan
                waktu produksi.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { i: Factory, t: "200+ unit mesin produksi" },
                  { i: Users, t: "850+ tenaga kerja terampil" },
                  { i: Truck, t: "Pengiriman ke seluruh Indonesia" },
                  { i: CheckCircle2, t: "QC bertingkat di setiap proses" },
                ].map(({ i: Icon, t }) => (
                  <div key={t} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary"><Icon className="h-5 w-5" /></div>
                    <span className="text-sm font-medium">{t}</span>
                  </div>
                ))}
              </div>
              <Link to="/fasilitas" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-card hover:bg-primary-deep">
                Jelajahi Fasilitas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {machines.map((m) => (
                <div key={m.id} className="overflow-hidden rounded-2xl bg-card shadow-card">
                  <img src={m.image} alt={m.name} loading="lazy" className="aspect-square w-full object-cover" />
                  <div className="p-3">
                    <p className="text-xs font-semibold text-primary">{m.qty} unit</p>
                    <p className="text-sm font-bold text-foreground">{m.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NEWS PREVIEW */}
      <section className="bg-gradient-soft py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Berita & Update</span>
              <h2 className="mt-3 font-display text-3xl font-bold text-primary-deep sm:text-4xl">Kabar terbaru dari Indobraga</h2>
            </div>
            <Link to="/berita" className="hidden text-sm font-semibold text-primary sm:inline-flex">Lihat semua →</Link>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {news.map((n) => (
              <article key={n.id} className="overflow-hidden rounded-2xl bg-card shadow-card transition hover:-translate-y-1 hover:shadow-elegant">
                <img src={n.thumb} alt={n.title} loading="lazy" className="aspect-[16/10] w-full object-cover" />
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-accent/20 px-2.5 py-0.5 font-semibold text-accent-foreground">{n.category}</span>
                    <span className="text-muted-foreground">{new Date(n.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold text-foreground">{n.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{n.excerpt}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 text-center text-primary-foreground shadow-elegant md:p-16">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Siap memproduksi garment untuk bisnis Anda?</h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Tim kami siap berdiskusi tentang kebutuhan produksi, kapasitas, dan timeline yang Anda perlukan.
            </p>
            <Link
              to="/kontak"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-accent px-8 py-4 text-sm font-bold text-accent-foreground shadow-elegant transition-transform hover:scale-105"
            >
              Mulai Konsultasi <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}