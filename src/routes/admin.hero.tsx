import { createFileRoute } from "@tanstack/react-router";
import { ImagePlus, Save } from "lucide-react";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import heroGarment from "@/assets/hero-garment-slide.jpg";
import heroSublim from "@/assets/hero-sublim-slide.jpg";

export const Route = createFileRoute("/admin/hero")({ component: HeroAdmin });

function HeroAdmin() {
  return (
    <>
      <PageTitle
        title="Konten Beranda"
        desc="Atur judul utama, subjudul, visual, dan tombol di halaman beranda."
        action={
          <PrimaryButton>
            <Save className="h-4 w-4" /> Simpan Perubahan
          </PrimaryButton>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="space-y-4">
            <Field
              label="Judul Utama"
              value="Produksi Garment dan Sublim Skala Bisnis"
            />
            <Field
              label="Subjudul"
              textarea
              value="Indobraga membantu brand, komunitas, dan perusahaan memproduksi apparel siap pakai, mulai dari pattern, cutting, sewing, hingga sublimasi kain dengan output konsisten."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kicker" value="Garment & sublim specialist sejak 2010" />
              <Field label="Label Tombol Utama" value="Konsultasi Produksi" />
              <Field label="Tautan Tombol Utama" value="/kontak" />
              <Field label="Label Tombol Sekunder" value="Lihat Portofolio" />
              <Field label="Tautan Tombol Sekunder" value="/portfolio" />
            </div>
          </div>
        </Card>
        <Card>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Slider Visual Hero
          </p>
          <div className="space-y-3">
            {[
              { label: "Slide 1 - Garment", image: heroGarment, metric: "90K pcs/bulan" },
              { label: "Slide 2 - Sublim", image: heroSublim, metric: "5K meter/hari" },
            ].map((slide) => (
              <div key={slide.label} className="overflow-hidden rounded-xl border border-border bg-secondary">
                <img
                  src={slide.image}
                  alt={slide.label}
                  loading="lazy"
                  width={1344}
                  height={960}
                  className="aspect-video w-full object-cover"
                />
                <div className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{slide.label}</p>
                    <p className="text-xs text-muted-foreground">{slide.metric}</p>
                  </div>
                  <button className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-background">
                    <ImagePlus className="h-4 w-4" /> Ganti
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-3 w-full rounded-lg border border-dashed border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary">
            Tambah Slide Hero
          </button>
        </Card>
      </div>
    </>
  );
}

function Field({ label, value, textarea }: { label: string; value: string; textarea?: boolean }) {
  return (
    <div>
      <label className="text-xs font-semibold">{label}</label>
      {textarea ? (
        <textarea
          defaultValue={value}
          rows={3}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      ) : (
        <input
          defaultValue={value}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      )}
    </div>
  );
}
