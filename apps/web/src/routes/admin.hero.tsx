import { createFileRoute } from "@tanstack/react-router";
import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import type { AdminContentItem } from "@/lib/api-models";

export const Route = createFileRoute("/admin/hero")({ component: HeroAdminPage });

type HeroItem = AdminContentItem & {
  title: string;
  subtitle?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
};

type HeroSlideItem = AdminContentItem & {
  hero_section_id: number;
  label?: string | null;
  title: string;
  metric?: string | null;
  media_file_id?: number | null;
};

function HeroAdminPage() {
  return (
    <div className="space-y-10">
      <AdminResourceManager<HeroItem>
        resource="hero"
        title="Konten Utama Beranda"
        description="Kelola judul, deskripsi, dan tombol utama halaman beranda."
        addLabel="Tambah Konten Utama"
        itemLabel="konten utama"
        primaryText={(item) => item.title}
        secondaryText={(item) => item.subtitle}
        columns={[
          {
            label: "Konten Utama",
            value: (item) => (
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
            ),
          },
          { label: "Tombol", value: (item) => item.cta_label ?? "-" },
        ]}
        fields={[
          { name: "title", label: "Judul", required: true },
          { name: "subtitle", label: "Deskripsi Pendek", type: "textarea" },
          { name: "cta_label", label: "Teks Tombol" },
          { name: "cta_href", label: "Alamat Tujuan Tombol" },
        ]}
        defaultValues={{ status: "published" }}
      />

      <AdminResourceManager<HeroSlideItem>
        resource="hero-slides"
        title="Gambar Utama Beranda"
        description="Kelola gambar pendukung, label, dan angka utama pada area atas beranda."
        addLabel="Tambah Gambar Utama"
        itemLabel="gambar utama"
        imageField="media_file_id"
        primaryText={(item) => item.title}
        secondaryText={(item) => item.metric}
        columns={[
          {
            label: "Gambar Utama",
            value: (item) => (
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ),
          },
          { label: "Metrik", value: (item) => item.metric ?? "-" },
          { label: "Urutan", value: (item) => item.sort_order ?? 0 },
        ]}
        fields={[
          { name: "hero_section_id", label: "Bagian Beranda", type: "hidden", required: true },
          { name: "label", label: "Label" },
          { name: "title", label: "Judul Gambar", required: true },
          { name: "metric", label: "Angka Sorotan" },
          { name: "alt_text", label: "Teks Gambar" },
          { name: "sort_order", label: "Urutan", type: "number" },
          { name: "media_file_id", label: "Gambar", type: "media", usage: "hero" },
        ]}
        defaultValues={{ hero_section_id: 0, sort_order: 0, status: "published" }}
      />
    </div>
  );
}
