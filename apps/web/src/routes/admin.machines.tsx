import { createFileRoute } from "@tanstack/react-router";
import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import type { AdminContentItem } from "@/lib/api-models";

export const Route = createFileRoute("/admin/machines")({ component: MachinesAdminPage });

type MachineItem = AdminContentItem & {
  name: string;
  slug: string;
  metric?: string | null;
  description?: string | null;
  media_file_id?: number | null;
};

type PrintingCapacityItem = AdminContentItem & {
  label: string;
  value: string;
  unit: string;
  description?: string | null;
  media_file_id?: number | null;
};

type ProductionCapacityItem = AdminContentItem & {
  product: string;
  value: string;
  unit: string;
};

function MachinesAdminPage() {
  return (
    <div className="space-y-10">
      <AdminResourceManager<MachineItem>
        resource="machines"
        title="Mesin & Fasilitas"
        description="Kelola fasilitas produksi utama yang tampil di website publik."
        addLabel="Tambah Mesin"
        itemLabel="mesin"
        imageField="media_file_id"
        primaryText={(item) => item.name}
        secondaryText={(item) => item.description}
        columns={[
          {
            label: "Mesin",
            value: (item) => (
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{item.description}</p>
              </div>
            ),
          },
          { label: "Metrik", value: (item) => item.metric ?? "-" },
          { label: "Urutan", value: (item) => item.sort_order ?? 0 },
        ]}
        fields={[
          { name: "name", label: "Nama Mesin", required: true },
          { name: "slug", label: "Slug" },
          { name: "metric", label: "Metrik" },
          { name: "sort_order", label: "Urutan", type: "number" },
          { name: "description", label: "Deskripsi", type: "textarea" },
          { name: "media_file_id", label: "Gambar", type: "media", usage: "machine" },
        ]}
        defaultValues={{ sort_order: 0 }}
      />

      <AdminResourceManager<PrintingCapacityItem>
        resource="printing-capacities"
        title="Kapasitas Printing"
        description="Kelola data sublim, press, DTF, dan kapasitas cetak lain."
        addLabel="Tambah Kapasitas Printing"
        itemLabel="kapasitas printing"
        imageField="media_file_id"
        primaryText={(item) => item.label}
        secondaryText={(item) => item.description}
        columns={[
          { label: "Label", value: (item) => <span className="font-semibold">{item.label}</span> },
          { label: "Nilai", value: (item) => item.value },
          { label: "Unit", value: (item) => item.unit },
        ]}
        fields={[
          { name: "label", label: "Label", required: true },
          { name: "value", label: "Nilai", required: true },
          { name: "unit", label: "Unit", required: true },
          { name: "sort_order", label: "Urutan", type: "number" },
          { name: "description", label: "Deskripsi", type: "textarea" },
          { name: "media_file_id", label: "Gambar", type: "media", usage: "machine" },
        ]}
        defaultValues={{ sort_order: 0 }}
      />

      <AdminResourceManager<ProductionCapacityItem>
        resource="production-capacities"
        title="Kapasitas Produksi"
        description="Kelola angka kapasitas produksi bulanan per kategori produk."
        addLabel="Tambah Kapasitas Produksi"
        itemLabel="kapasitas produksi"
        primaryText={(item) => item.product}
        secondaryText={(item) => `${item.value} ${item.unit}`}
        columns={[
          {
            label: "Produk",
            value: (item) => <span className="font-semibold">{item.product}</span>,
          },
          { label: "Nilai", value: (item) => item.value },
          { label: "Unit", value: (item) => item.unit },
        ]}
        fields={[
          { name: "product", label: "Produk", required: true },
          { name: "value", label: "Nilai", required: true },
          { name: "unit", label: "Unit", required: true },
          { name: "sort_order", label: "Urutan", type: "number" },
        ]}
        defaultValues={{ sort_order: 0 }}
      />
    </div>
  );
}
