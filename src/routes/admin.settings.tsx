import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { Field, Select, TextArea, TextInput } from "@/components/admin/CrudModal";
import { COMPANY } from "@/data/site";

export const Route = createFileRoute("/admin/settings")({ component: SettingsAdminPage });

function SettingsAdminPage() {
  return (
    <>
      <PageTitle
        title="Pengaturan Website"
        desc="Konfigurasi umum website."
        action={
          <PrimaryButton onClick={() => toast.success("Pengaturan disimpan", { description: "Perubahan diterapkan ke website publik." })}>
            <Save className="h-4 w-4" /> Simpan
          </PrimaryButton>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-display text-lg font-bold text-primary-deep">Identitas Perusahaan</h3>
          <div className="space-y-4">
            <Field label="Nama Merek" required><TextInput defaultValue={COMPANY.brand} /></Field>
            <Field label="Nama Legal"><TextInput defaultValue={COMPANY.legal} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email Resmi"><TextInput type="email" defaultValue={COMPANY.email} /></Field>
              <Field label="Telepon"><TextInput defaultValue={COMPANY.phone} /></Field>
              <Field label="Nomor WhatsApp" hint="Format internasional tanpa +."><TextInput defaultValue={COMPANY.whatsapp} /></Field>
              <Field label="Instagram"><TextInput defaultValue={COMPANY.instagram} /></Field>
              <Field label="Narahubung"><TextInput defaultValue={COMPANY.contactPerson} /></Field>
              <Field label="Jabatan"><TextInput defaultValue={COMPANY.contactRole} /></Field>
            </div>
            <Field label="Alamat"><TextArea rows={2} defaultValue={COMPANY.address} /></Field>
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 font-display text-lg font-bold text-primary-deep">Pengaturan SEO</h3>
          <div className="space-y-4">
            <Field label="Judul Default" hint="Maks 60 karakter."><TextInput defaultValue="Indobraga - Solusi Produksi Garment Profesional" /></Field>
            <Field label="Deskripsi" hint="Maks 160 karakter."><TextArea rows={3} defaultValue="Apparel manufacturing, garment production, custom fabric printing, dan multiproduct facility asal Indonesia." /></Field>
            <Field label="Kata Kunci"><TextInput defaultValue="garment, apparel manufacturing, jersey, sublim, DTF, corporate uniform" /></Field>
            <Field label="OG Image URL"><TextInput placeholder="https://..." /></Field>
            <Field label="Bahasa Default"><Select defaultValue="id"><option value="id">Bahasa Indonesia</option><option value="en">English</option></Select></Field>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-display text-lg font-bold text-primary-deep">Integrasi</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Google Analytics ID"><TextInput placeholder="G-XXXXXXX" /></Field>
            <Field label="Meta Pixel ID"><TextInput placeholder="000000000000000" /></Field>
            <Field label="Tag Manager ID"><TextInput placeholder="GTM-XXXXXX" /></Field>
          </div>
        </Card>
      </div>
    </>
  );
}
