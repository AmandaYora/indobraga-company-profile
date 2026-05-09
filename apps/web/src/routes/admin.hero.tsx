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
        title="Konten Beranda"
        description="Kelola headline, subtitle, dan CTA utama homepage."
        addLabel="Tambah Hero"
        itemLabel="hero"
        primaryText={(item) => item.title}
        secondaryText={(item) => item.subtitle}
        columns={[
          {
            label: "Hero",
            value: (item) => (
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
            ),
          },
          { label: "CTA", value: (item) => item.cta_label ?? "-" },
        ]}
        fields={[
          { name: "title", label: "Judul", required: true },
          { name: "subtitle", label: "Subtitle", type: "textarea" },
          { name: "cta_label", label: "Label CTA" },
          { name: "cta_href", label: "URL CTA" },
        ]}
      />

      <AdminResourceManager<HeroSlideItem>
        resource="hero-slides"
        title="Slide Hero"
        description="Kelola gambar, label, dan metrik pada hero homepage."
        addLabel="Tambah Slide"
        itemLabel="slide"
        imageField="media_file_id"
        primaryText={(item) => item.title}
        secondaryText={(item) => item.metric}
        columns={[
          {
            label: "Slide",
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
          { name: "hero_section_id", label: "Hero Section ID", type: "number", required: true },
          { name: "label", label: "Label" },
          { name: "title", label: "Judul Slide", required: true },
          { name: "metric", label: "Metrik" },
          { name: "alt_text", label: "Alt Text" },
          { name: "sort_order", label: "Urutan", type: "number" },
          { name: "media_file_id", label: "Gambar", type: "media", usage: "hero" },
        ]}
        defaultValues={{ hero_section_id: 1, sort_order: 0 }}
      />
    </div>
  );
}
