import { createFileRoute } from "@tanstack/react-router";
import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import type { AdminContentItem } from "@/lib/api-models";

export const Route = createFileRoute("/admin/strength")({ component: StrengthAdminPage });

type StrengthItem = AdminContentItem & {
  label: string;
  value: string;
  suffix?: string | null;
};

function StrengthAdminPage() {
  return (
    <AdminResourceManager<StrengthItem>
      resource="production-strengths"
      title="Kekuatan Produksi"
      description="Kelola angka utama seperti kapasitas produksi, pengalaman, dan kapasitas printing."
      addLabel="Tambah Kekuatan"
      itemLabel="kekuatan"
      searchPlaceholder="Cari label kekuatan..."
      primaryText={(item) => item.label}
      secondaryText={(item) => `${item.value} ${item.suffix ?? ""}`}
      columns={[
        { label: "Label", value: (item) => <span className="font-semibold">{item.label}</span> },
        { label: "Nilai", value: (item) => item.value },
        { label: "Satuan", value: (item) => item.suffix ?? "-" },
        { label: "Urutan", value: (item) => item.sort_order ?? 0 },
      ]}
      fields={[
        { name: "label", label: "Label", required: true },
        { name: "value", label: "Nilai", required: true },
        { name: "suffix", label: "Satuan / Keterangan" },
        { name: "sort_order", label: "Urutan", type: "number" },
      ]}
      defaultValues={{ sort_order: 0 }}
    />
  );
}
