import { createFileRoute } from "@tanstack/react-router";
import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import type { AdminContentItem } from "@/lib/api-models";

export const Route = createFileRoute("/admin/portfolio-categories")({
  component: PortfolioCategoriesAdminPage,
});

type PortfolioCategoryItem = AdminContentItem & {
  name: string;
  slug: string;
  sort_order?: number;
};

function PortfolioCategoriesAdminPage() {
  return (
    <AdminResourceManager<PortfolioCategoryItem>
      resource="portfolio-categories"
      title="Kategori Portofolio"
      description="Kelola kelompok produk yang dipakai sebagai filter portofolio publik."
      addLabel="Tambah Kategori"
      itemLabel="kategori"
      searchPlaceholder="Cari nama kategori..."
      primaryText={(item) => item.name}
      secondaryText={(item) => item.slug}
      columns={[
        {
          label: "Kategori",
          value: (item) => (
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-xs text-muted-foreground">/{item.slug}</p>
            </div>
          ),
        },
        { label: "Urutan", value: (item) => item.sort_order ?? 0 },
      ]}
      fields={[
        {
          name: "name",
          label: "Nama Kategori",
          required: true,
          placeholder: "Contoh: Jersey",
        },
        {
          name: "slug",
          label: "Alamat Halaman Kategori",
          placeholder: "jersey",
          hint: "Opsional. Sistem akan membuat alamat halaman otomatis dari nama kategori.",
        },
        { name: "sort_order", label: "Urutan Tampil", type: "number" },
      ]}
      defaultValues={{ sort_order: 0, status: "published" }}
    />
  );
}
