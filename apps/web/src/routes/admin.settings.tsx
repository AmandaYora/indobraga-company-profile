import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Image, Save, Type } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/admin/ApiState";
import { Field, TextArea, TextInput } from "@/components/admin/CrudModal";
import { MediaUploadField } from "@/components/admin/MediaUploadField";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { getErrorMessage, useApiQuery } from "@/hooks/use-api-query";
import { collectNumericIds, useSessionUploads } from "@/hooks/use-session-uploads";
import { adminContentApi } from "@/lib/api-services";
import {
  clearFieldError,
  fieldErrorsFromError,
  hasFieldErrors,
  type FieldErrors,
} from "@/lib/form-errors";
import { isValidPhoneInput } from "@/lib/lead-contact";
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const uploads = useSessionUploads();

  // Leaving the page with files uploaded but never saved: remove them (QA IB-09).
  useEffect(() => {
    return () => {
      void uploads.discard();
    };
  }, [uploads]);

  useEffect(() => {
    if (!data) {
      return;
    }

    setForm({
      ...emptySettingsForm(),
      ...Object.fromEntries(settingsFieldNames.map((name) => [name, String(data[name] ?? "")])),
      show_brand_text: typeof data.show_brand_text === "boolean" ? data.show_brand_text : false,
      logo_media_file_id:
        typeof data.logo_media_file_id === "number" ? data.logo_media_file_id : undefined,
      logo_url: typeof data.logo_url === "string" ? data.logo_url : null,
      footer_logo_media_file_id:
        typeof data.footer_logo_media_file_id === "number"
          ? data.footer_logo_media_file_id
          : undefined,
      footer_logo_url: typeof data.footer_logo_url === "string" ? data.footer_logo_url : null,
      og_media_file_id:
        typeof data.og_media_file_id === "number" ? data.og_media_file_id : undefined,
      og_image_url: typeof data.og_image_url === "string" ? data.og_image_url : null,
      contact_hero_media_file_id:
        typeof data.contact_hero_media_file_id === "number"
          ? data.contact_hero_media_file_id
          : undefined,
      contact_hero_image_url:
        typeof data.contact_hero_image_url === "string" ? data.contact_hero_image_url : null,
    });
  }, [data]);

  const update = (
    name: keyof SettingsForm,
    value: string | number | boolean | null | undefined,
  ) => {
    setErrors((current) => clearFieldError(current, name));
    setForm((current) => ({ ...current, [name]: value }));
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!form.brand.trim()) {
      next.brand = "Nama merek wajib diisi.";
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Format email belum valid.";
    }
    if (!form.whatsapp.trim()) {
      next.whatsapp = "Nomor WhatsApp wajib diisi.";
    } else if (!isValidPhoneInput(form.whatsapp)) {
      next.whatsapp =
        "Nomor WhatsApp belum valid. Gunakan format seperti 0852xxxxxxxx atau 62852xxxxxxxx.";
    }
    const instagram = form.instagram.trim().replace(/^@+/, "");
    if (
      instagram &&
      !/^[A-Za-z0-9._]{1,30}$/.test(instagram) &&
      !/instagram\.com\//i.test(instagram)
    ) {
      next.instagram =
        "Username Instagram hanya boleh berisi huruf, angka, titik, dan garis bawah.";
    }
    return next;
  };

  const save = async () => {
    const clientErrors = validate();
    if (hasFieldErrors(clientErrors)) {
      setErrors(clientErrors);
      toast.error("Pengaturan belum bisa disimpan", {
        description: "Periksa isian yang ditandai merah.",
      });
      window.setTimeout(
        () => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
        0,
      );
      return;
    }

    setSaving(true);
    try {
      const payload = toSettingsUpdatePayload(form);
      await adminContentApi.updateSiteSettings(payload);
      // Logos that were replaced before saving are no longer needed.
      void uploads.discard(collectNumericIds(payload as Record<string, unknown>));
      setErrors({});
      toast.success("Pengaturan disimpan");
      reload();
    } catch (caught) {
      const serverErrors = fieldErrorsFromError(caught);
      setErrors(serverErrors);
      toast.error("Pengaturan gagal disimpan", {
        description: hasFieldErrors(serverErrors)
          ? "Periksa isian yang ditandai merah."
          : getErrorMessage(caught, { action: "save" }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Pengaturan Website"
        desc="Atur identitas perusahaan, kontak, gambar halaman, dan tampilan saat dibagikan."
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
            <Field label="Nama Merek" required error={errors.brand}>
              <TextInput value={form.brand} onChange={(e) => update("brand", e.target.value)} />
            </Field>
            <Field label="Nama Legal">
              <TextInput
                value={form.legal_name}
                onChange={(e) => update("legal_name", e.target.value)}
              />
            </Field>
            <Field
              label="Tampilan Logo"
              hint="Pilih Logo Saja jika gambar logo sudah memuat nama merek."
            >
              <div
                role="radiogroup"
                aria-label="Tampilan logo"
                className="inline-grid w-full max-w-md grid-cols-2 rounded-lg border border-input bg-background p-1"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.show_brand_text}
                  onClick={() => update("show_brand_text", true)}
                  className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                    form.show_brand_text
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Type className="h-4 w-4 shrink-0" />
                  <span className="truncate">Logo + Nama</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!form.show_brand_text}
                  onClick={() => update("show_brand_text", false)}
                  className={`inline-flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                    !form.show_brand_text
                      ? "bg-primary text-primary-foreground shadow-card"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Image className="h-4 w-4 shrink-0" />
                  <span className="truncate">Logo Saja</span>
                </button>
              </div>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Email Resmi" error={errors.email}>
                <TextInput
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field label="Telepon">
                <TextInput value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </Field>
              <Field
                label="Nomor WhatsApp"
                required
                error={errors.whatsapp}
                hint="Boleh diisi 0852xxxxxxxx atau 62852xxxxxxxx; otomatis disimpan dalam format internasional (62...) agar tautan WhatsApp benar."
              >
                <TextInput
                  value={form.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                />
              </Field>
              <Field label="Instagram" error={errors.instagram}>
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
          <h3 className="mb-4 font-display text-lg font-bold text-primary-deep">
            Tampilan di Google & Media Sosial
          </h3>
          <div className="space-y-4">
            <Field label="Judul Google" hint="Disarankan maksimal 60 karakter.">
              <TextInput
                value={form.seo_title}
                onChange={(e) => update("seo_title", e.target.value)}
              />
            </Field>
            <Field label="Deskripsi Google" hint="Disarankan maksimal 160 karakter.">
              <TextArea
                rows={3}
                value={form.seo_description}
                onChange={(e) => update("seo_description", e.target.value)}
              />
            </Field>
          </div>
        </Card>
        <Card>
          <h3 className="mb-4 font-display text-lg font-bold text-primary-deep">Media Halaman</h3>
          <div className="space-y-4">
            <MediaUploadField
              label="Logo Navbar"
              hint="Tampil di header/navigasi atas."
              usage="other"
              value={form.logo_media_file_id}
              previewUrl={form.logo_url}
              onUploaded={(media) => {
                uploads.track(media.id);
                update("logo_media_file_id", media.id);
                update("logo_url", media.large_url ?? media.medium_url ?? media.file_url);
              }}
            />
            <MediaUploadField
              label="Logo Footer"
              hint="Khusus footer (latar gelap). Kosongkan untuk memakai Logo Navbar."
              usage="other"
              value={form.footer_logo_media_file_id}
              previewUrl={form.footer_logo_url}
              onUploaded={(media) => {
                uploads.track(media.id);
                update("footer_logo_media_file_id", media.id);
                update("footer_logo_url", media.large_url ?? media.medium_url ?? media.file_url);
              }}
            />
            <MediaUploadField
              label="Gambar Utama Kontak"
              usage="hero"
              value={form.contact_hero_media_file_id}
              previewUrl={form.contact_hero_image_url}
              onUploaded={(media) => {
                uploads.track(media.id);
                update("contact_hero_media_file_id", media.id);
                update(
                  "contact_hero_image_url",
                  media.large_url ?? media.medium_url ?? media.file_url,
                );
              }}
            />
            <MediaUploadField
              label="Gambar Saat Dibagikan"
              usage="og"
              value={form.og_media_file_id}
              previewUrl={form.og_image_url}
              onUploaded={(media) => {
                uploads.track(media.id);
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
