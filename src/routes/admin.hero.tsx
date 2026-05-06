import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, GhostButton, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { ConfirmDialog, CrudModal, Field, ImageUploadField, TextArea, TextInput } from "@/components/admin/CrudModal";
import heroGarment from "@/assets/hero-garment-slide.jpg";
import heroSublim from "@/assets/hero-sublim-slide.jpg";

export const Route = createFileRoute("/admin/hero")({ component: HeroAdmin });

type Slide = { label: string; image: string; metric: string; kicker?: string };
const initial: Slide[] = [
  { label: "Slide 1 - Garment", image: heroGarment, metric: "90K pcs/bulan", kicker: "Garment Manufacturing" },
  { label: "Slide 2 - Sublim", image: heroSublim, metric: "5K meter/hari", kicker: "Custom Fabric Printing" },
];

function HeroAdmin() {
  const [slideForm, setSlideForm] = useState(false);
  const [slideDel, setSlideDel] = useState<Slide | null>(null);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);

  return (
    <>
      <PageTitle
        title="Konten Beranda"
        desc="Atur judul utama, subjudul, visual, dan tombol di halaman beranda."
        action={
          <PrimaryButton onClick={() => toast.success("Konten beranda disimpan")}>
            <Save className="h-4 w-4" /> Simpan Perubahan
          </PrimaryButton>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4">
          <Field label="Kicker"><TextInput defaultValue="Garment & sublim specialist sejak 2010" /></Field>
          <Field label="Judul Utama" required><TextInput defaultValue="Produksi Garment dan Sublim Skala Bisnis" /></Field>
          <Field label="Subjudul">
            <TextArea rows={3} defaultValue="Indobraga membantu brand, komunitas, dan perusahaan memproduksi apparel siap pakai, mulai dari pattern, cutting, sewing, hingga sublimasi kain dengan output konsisten." />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Label Tombol Utama"><TextInput defaultValue="Konsultasi Produksi" /></Field>
            <Field label="Tautan Tombol Utama"><TextInput defaultValue="/kontak" /></Field>
            <Field label="Label Tombol Sekunder"><TextInput defaultValue="Lihat Portofolio" /></Field>
            <Field label="Tautan Tombol Sekunder"><TextInput defaultValue="/portfolio" /></Field>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slider Visual Hero</p>
            <GhostButton onClick={() => { setEditingSlide(null); setSlideForm(true); }} className="!px-3 !py-1.5 !text-xs">
              <Plus className="h-3.5 w-3.5" /> Slide
            </GhostButton>
          </div>
          <div className="space-y-3">
            {initial.map((slide) => (
              <div key={slide.label} className="overflow-hidden rounded-xl border border-border bg-secondary">
                <img src={slide.image} alt={slide.label} loading="lazy" width={1344} height={960} className="aspect-video w-full object-cover" />
                <div className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">{slide.label}</p>
                    <p className="text-xs text-muted-foreground">{slide.metric}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingSlide(slide); setSlideForm(true); }} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-background">
                      <ImagePlus className="h-4 w-4" /> Ubah
                    </button>
                    <button onClick={() => setSlideDel(slide)} className="rounded-lg border border-dashed border-border p-2 text-xs font-semibold text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <CrudModal
        open={slideForm}
        onOpenChange={setSlideForm}
        title={editingSlide ? "Ubah Slide Hero" : "Tambah Slide Hero"}
        onSubmit={() => { setSlideForm(false); toast.success(editingSlide ? "Slide diperbarui" : "Slide ditambahkan"); }}
      >
        <ImageUploadField preview={editingSlide?.image} hint="Rasio 16:9, ideal 1920x1080." />
        <Field label="Label Slide" required><TextInput defaultValue={editingSlide?.label} placeholder="Slide 1 - Garment" /></Field>
        <Field label="Kicker / Layanan"><TextInput defaultValue={editingSlide?.kicker} placeholder="Garment Manufacturing" /></Field>
        <Field label="Metric"><TextInput defaultValue={editingSlide?.metric} placeholder="90K pcs/bulan" /></Field>
      </CrudModal>

      <ConfirmDialog
        open={!!slideDel}
        onOpenChange={(v) => !v && setSlideDel(null)}
        title={slideDel ? `Hapus "${slideDel.label}"?` : "Hapus slide?"}
        onConfirm={() => { setSlideDel(null); toast.error("Slide dihapus"); }}
      />
    </>
  );
}
