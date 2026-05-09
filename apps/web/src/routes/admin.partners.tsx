import { createFileRoute } from "@tanstack/react-router";
import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import type { AdminContentItem } from "@/lib/api-models";

export const Route = createFileRoute("/admin/partners")({ component: PartnersAdminPage });

type PartnerItem = AdminContentItem & {
  name: string;
  segment?: string | null;
  logo_media_id?: number | null;
};

function PartnersAdminPage() {
  return (
    <AdminResourceManager<PartnerItem>
      resource="partners"
      title="Logo Klien"
      description="Kelola logo dan nama klien yang tampil pada section trusted client."
      addLabel="Tambah Logo Klien"
      itemLabel="klien"
      imageField="logo_media_id"
      searchPlaceholder="Cari nama atau segmen klien..."
      primaryText={(item) => item.name}
      secondaryText={(item) => item.segment}
      columns={[
        { label: "Nama", value: (item) => <span className="font-semibold">{item.name}</span> },
        { label: "Segmen", value: (item) => item.segment ?? "-" },
        { label: "Urutan", value: (item) => item.sort_order ?? 0 },
      ]}
      fields={[
        { name: "name", label: "Nama Klien", required: true },
        { name: "segment", label: "Segmen" },
        { name: "sort_order", label: "Urutan", type: "number" },
        { name: "logo_media_id", label: "Logo", type: "media", usage: "partner" },
      ]}
      defaultValues={{ sort_order: 0 }}
    />
  );
}
