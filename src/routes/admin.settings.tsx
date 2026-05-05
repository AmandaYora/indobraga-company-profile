import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { COMPANY } from "@/data/site";

export const Route = createFileRoute("/admin/settings")({ component: SettingsAdminPage });

function SettingsAdminPage() {
  return (
    <>
      <PageTitle
        title="Pengaturan Website"
        desc="Konfigurasi umum website."
        action={
          <PrimaryButton>
            <Save className="h-4 w-4" /> Simpan
          </PrimaryButton>
        }
      />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-display text-lg font-bold">Identitas Perusahaan</h3>
          <div className="space-y-4">
            <Field label="Nama Merek" value={COMPANY.brand} />
            <Field label="Nama Legal" value={COMPANY.legal} />
            <Field label="Email Resmi" value={COMPANY.email} />
            <Field label="Telepon" value={COMPANY.phone} />
            <Field label="Nomor WhatsApp" value={COMPANY.whatsapp} />
            <Field label="Instagram" value={COMPANY.instagram} />
            <Field label="Narahubung" value={COMPANY.contactPerson} />
            <Field label="Jabatan" value={COMPANY.contactRole} />
            <Field label="Alamat" value={COMPANY.address} textarea />
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 font-display text-lg font-bold">Pengaturan SEO</h3>
          <div className="space-y-4">
            <Field label="Judul Default" value="Indobraga - Solusi Produksi Garment Profesional" />
            <Field
              label="Deskripsi"
              textarea
              value="Apparel manufacturing, garment production, custom fabric printing, dan multiproduct facility asal Indonesia."
            />
            <Field
              label="Kata Kunci"
              value="garment, apparel manufacturing, jersey, sublim, DTF, corporate uniform"
            />
          </div>
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
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
        />
      ) : (
        <input
          defaultValue={value}
          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
        />
      )}
    </div>
  );
}
