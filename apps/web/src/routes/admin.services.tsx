import { createFileRoute } from "@tanstack/react-router";
import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import type { AdminContentItem } from "@/lib/api-models";

export const Route = createFileRoute("/admin/services")({ component: ServicesAdminPage });

type ServiceItem = AdminContentItem & {
  name: string;
  sort_order?: number;
};

function ServicesAdminPage() {
  return (
    <AdminResourceManager<ServiceItem>
      resource="services"
      title="Layanan"
      description="Kelola daftar layanan yang ditampilkan pada website publik."
      addLabel="Tambah Layanan"
      itemLabel="layanan"
      searchPlaceholder="Cari layanan..."
      primaryText={(item) => item.name}
      columns={[
        {
          label: "Nama Layanan",
          value: (item) => <span className="font-semibold">{item.name}</span>,
        },
        { label: "Urutan", value: (item) => item.sort_order ?? 0 },
      ]}
      fields={[
        { name: "name", label: "Nama Layanan", required: true },
        { name: "sort_order", label: "Urutan", type: "number" },
      ]}
      defaultValues={{ sort_order: 0 }}
    />
  );
}
