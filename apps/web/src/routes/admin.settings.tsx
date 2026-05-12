import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/admin/ApiState";
import { Field, TextArea, TextInput } from "@/components/admin/CrudModal";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { adminContentApi } from "@/lib/api-services";
import {
  emptySettingsForm,
  settingsFieldNames,
  toSettingsUpdatePayload,
  type SettingsForm,
} from "./-admin.settings.helpers";

export const Route = createFileRoute("/admin/settings")({ component: SettingsAdminPage });

function SettingsAdminPage() {
  const loadSettings = useCallback(() => adminContentApi.siteSettings(), []);
  const { data, error, loading, reload } = useApiQuery(["admin", "site-settings"], loadSettings);
  const [form, setForm] = useState<SettingsForm>(() => emptySettingsForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) {
      return;
    }

    setForm({
      ...emptySettingsForm(),
      ...Object.fromEntries(settingsFieldNames.map((name) => [name, String(data[name] ?? "")])),
      og_media_file_id:
        typeof data.og_media_file_id === "number" ? data.og_media_file_id : undefined,
      og_image_url: typeof data.og_image_url === "string" ? data.og_image_url : null,
    });
  }, [data]);

  const update = (name: keyof SettingsForm, value: string | number | null | undefined) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await adminContentApi.updateSiteSettings(toSettingsUpdatePayload(form));
      toast.success("Pengaturan disimpan");
      reload();
    } catch (caught) {
      toast.error("Pengaturan gagal disimpan", {
        description: caught instanceof Error ? caught.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Pengaturan Website"
        desc="Konfigurasi umum website, kontak, dan SEO default."
        action={
          <PrimaryButton onClick={save} disabled={saving || loading}>
            <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}
          </PrimaryButton>
        }
      />
      {loading && !data && <LoadingState label="Memuat pengaturan website..." />}
      {error && <ErrorState error={error} onRetry={reload} />}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 font-display text-lg font-bold text-primary-deep">
            Identitas Perusahaan
          </h3>
          <div className="space-y-4">
            <Field label="Nama Merek" required>
              <TextInput value={form.brand} onChange={(e) => update("brand", e.target.value)} />
            </Field>
            <Field label="Nama Legal">
              <TextInput
                value={form.legal_name}
                onChange={(e) => update("legal_name", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email Resmi">
                <TextInput
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field label="Telepon">
                <TextInput value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </Field>
              <Field label="Nomor WhatsApp" hint="Format internasional tanpa +.">
                <TextInput
                  value={form.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                />
              </Field>
              <Field label="Instagram">
                <TextInput
                  value={form.instagram}
                  onChange={(e) => update("instagram", e.target.value)}
                />
              </Field>
              <Field label="Narahubung">
                <TextInput
                  value={form.contact_person}
                  onChange={(e) => update("contact_person", e.target.value)}
                />
              </Field>
              <Field label="Jabatan">
                <TextInput
                  value={form.contact_role}
                  onChange={(e) => update("contact_role", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Alamat">
              <TextArea
                rows={2}
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </Field>
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 font-display text-lg font-bold text-primary-deep">Pengaturan SEO</h3>
          <div className="space-y-4">
            <Field label="Judul Default" hint="Maks 60 karakter.">
              <TextInput
                value={form.seo_title}
                onChange={(e) => update("seo_title", e.target.value)}
              />
            </Field>
            <Field label="Deskripsi" hint="Maks 160 karakter.">
              <TextArea
                rows={3}
                value={form.seo_description}
                onChange={(e) => update("seo_description", e.target.value)}
              />
            </Field>
            <MediaUploadField
              label="Gambar OG"
              usage="og"
              value={form.og_media_file_id}
              previewUrl={form.og_image_url}
              onUploaded={(media) => {
                update("og_media_file_id", media.id);
                update("og_image_url", media.large_url ?? media.file_url);
              }}
            />
          </div>
        </Card>
      </div>
    </>
  );
}
