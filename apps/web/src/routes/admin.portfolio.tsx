import { createFileRoute } from "@tanstack/react-router";
import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import type { AdminContentItem } from "@/lib/api-models";

export const Route = createFileRoute("/admin/portfolio")({ component: PortfolioAdminPage });

type PortfolioItem = AdminContentItem & {
  title: string;
  slug: string;
  category: string;
  short_description?: string | null;
  media_file_id?: number | null;
  is_featured?: boolean;
};

function PortfolioAdminPage() {
  return (
    <AdminResourceManager<PortfolioItem>
      resource="portfolios"
      title="Portofolio Produk"
      description="Kelola katalog hasil produksi untuk website publik."
      addLabel="Tambah Portofolio"
      itemLabel="portofolio"
      imageField="media_file_id"
      searchPlaceholder="Cari judul, kategori, atau deskripsi..."
      primaryText={(item) => item.title}
      secondaryText={(item) => (
        <>
          <span className="font-semibold text-primary">{item.category}</span>
          {item.short_description && <span> - {item.short_description}</span>}
        </>
      )}
      columns={[
        {
          label: "Produk",
          value: (item) => (
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{item.short_description}</p>
            </div>
          ),
        },
        { label: "Kategori", value: (item) => item.category },
        { label: "Slug", value: (item) => <span className="text-xs">{item.slug}</span> },
      ]}
      fields={[
        { name: "title", label: "Judul Produk", required: true },
        { name: "slug", label: "Slug", placeholder: "training-jersey-klub" },
        { name: "category", label: "Kategori", required: true },
        { name: "sort_order", label: "Urutan", type: "number" },
        {
          name: "short_description",
          label: "Deskripsi Singkat",
          type: "textarea",
          required: true,
        },
        { name: "media_file_id", label: "Gambar", type: "media", usage: "portfolio" },
        { name: "is_featured", label: "Tampilkan di Beranda", type: "checkbox" },
        { name: "seo_title", label: "SEO Title" },
        { name: "seo_description", label: "SEO Description", type: "textarea" },
      ]}
      defaultValues={{ sort_order: 0, is_featured: false }}
    />
  );
}
