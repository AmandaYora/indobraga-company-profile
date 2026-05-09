import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Download, Eye, Keyboard, Save, Send, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/admin/ApiState";
import {
  ConfirmDialog,
  CrudModal,
  Field,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/CrudModal";
import { Card, GhostButton, PageTitle, PrimaryButton } from "@/components/admin/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { adminAudienceApi, adminEmailAccountsApi, adminEmailCampaignApi } from "@/lib/api-services";

export const Route = createFileRoute("/admin/email-blast")({ component: EmailBlastPage });

type RecipientMode = "manual" | "audience";
type AudienceSourceFilter = "all" | "inquiry" | "whatsapp_lead" | "manual_import" | "manual";

function EmailBlastPage() {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("manual");
  const [audienceFilter, setAudienceFilter] = useState<{
    q: string;
    source: AudienceSourceFilter;
  }>({
    q: "",
    source: "inquiry",
  });
  const [form, setForm] = useState({
    title: "",
    email_account_id: "",
    subject: "",
    body_text: "",
    recipients: "",
  });
  const updateForm = (patch: Partial<typeof form>) => {
    setDraftId(null);
    setForm((current) => ({ ...current, ...patch }));
  };
  const loadAccounts = useCallback(
    () => adminEmailAccountsApi.list({ status: "connected", limit: 100 }),
    [],
  );
  const accounts = useApiQuery(["admin", "email-accounts", "connected"], loadAccounts);
  const recipientList = useMemo(() => parseRecipients(form.recipients), [form.recipients]);
  const manualRecipientSummary = useMemo(() => summarizeRecipients(recipientList), [recipientList]);
  const selectedAudienceFilter = useMemo(
    () => ({
      q: audienceFilter.q.trim() || undefined,
      source: audienceFilter.source === "all" ? undefined : audienceFilter.source,
      status: "active" as const,
    }),
    [audienceFilter.q, audienceFilter.source],
  );
  const loadAudiencePreview = useCallback(
    () => adminAudienceApi.preview(selectedAudienceFilter),
    [selectedAudienceFilter],
  );
  const audiencePreview = useApiQuery(
    ["admin", "audience", "preview", selectedAudienceFilter],
    loadAudiencePreview,
    { enabled: recipientMode === "audience" },
  );

  const saveDraft = async () => {
    const validationError = validateDraft({
      form,
      recipientMode,
      manualRecipientSummary,
      audiencePreview,
    });
    if (validationError) {
      toast.error(validationError.title, { description: validationError.description });
      return null;
    }

    try {
      const basePayload = {
        email_account_id: Number(form.email_account_id),
        title: form.title.trim(),
        subject: form.subject.trim(),
        body_text: form.body_text.trim(),
        body_html: textToHtml(form.body_text.trim()),
      };
      const draft =
        recipientMode === "audience"
          ? await adminEmailCampaignApi.createDraftFromAudience({
              ...basePayload,
              audience_filter: selectedAudienceFilter,
            })
          : await adminEmailCampaignApi.createDraft({
              ...basePayload,
              recipients: manualRecipientSummary.uniqueRecipients,
            });
      setDraftId(draft.id);
      toast.success("Draf email massal tersimpan");
      return draft.id;
    } catch (error) {
      toast.error("Draf gagal disimpan", {
        description: error instanceof Error ? error.message : undefined,
      });
      return null;
    }
  };

  const exportAudience = () => {
    window.open(
      adminAudienceApi.exportUrl(selectedAudienceFilter),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const sendCampaign = async () => {
    const id = draftId ?? (await saveDraft());
    if (!id) {
      return;
    }

    try {
      await adminEmailCampaignApi.send(id);
      toast.success("Email massal masuk antrean worker");
      setOpenConfirm(false);
    } catch (error) {
      toast.error("Email massal gagal dikirim", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <>
      <PageTitle
        title="Kirim Email Massal"
        desc="Buat draf email massal dan kirim ke antrean worker backend."
        action={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <GhostButton onClick={saveDraft}>
              <Save className="h-4 w-4" /> Simpan Draf
            </GhostButton>
            <GhostButton onClick={() => setOpenPreview(true)}>
              <Eye className="h-4 w-4" /> Pratinjau
            </GhostButton>
            <PrimaryButton onClick={() => setOpenConfirm(true)}>
              <Send className="h-4 w-4" /> Kirim Email
            </PrimaryButton>
          </div>
        }
      />
      {accounts.loading && !accounts.data && <LoadingState label="Memuat akun pengirim..." />}
      {accounts.error && <ErrorState error={accounts.error} onRetry={accounts.reload} />}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4 lg:col-span-2">
          <Field label="Nama Pengiriman" required>
            <TextInput
              value={form.title}
              onChange={(e) => updateForm({ title: e.target.value })}
              placeholder="Promo Kuartal 2 2026"
            />
          </Field>
          <Field label="Akun Pengirim" required>
            <Select
              value={form.email_account_id}
              onChange={(e) => updateForm({ email_account_id: e.target.value })}
            >
              <option value="">Pilih akun connected</option>
              {accounts.data?.items.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.display_name} - {account.email_address}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subjek Email" required>
            <TextInput
              value={form.subject}
              onChange={(e) => updateForm({ subject: e.target.value })}
              placeholder="Tulis subjek email..."
            />
          </Field>
          <Field label="Isi Email" required hint="Mendukung penanda {{nama}} untuk personalisasi.">
            <TextArea
              rows={8}
              value={form.body_text}
              onChange={(e) => updateForm({ body_text: e.target.value })}
            />
          </Field>
          <Field label="Sumber Penerima" required>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setDraftId(null);
                  setRecipientMode("manual");
                }}
                className={`flex min-w-0 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                  recipientMode === "manual"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                <Keyboard className="h-4 w-4 shrink-0" />
                <span className="min-w-0 font-semibold">Input Manual</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftId(null);
                  setRecipientMode("audience");
                }}
                className={`flex min-w-0 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                  recipientMode === "audience"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                <UsersRound className="h-4 w-4 shrink-0" />
                <span className="min-w-0 font-semibold">Kontak Marketing</span>
              </button>
            </div>
          </Field>

          {recipientMode === "manual" ? (
            <Field
              label="Daftar Penerima"
              hint="Pisahkan dengan koma atau baris baru. Format: email atau Nama <email>."
            >
              <TextArea
                rows={4}
                className="font-mono text-xs"
                value={form.recipients}
                onChange={(e) => updateForm({ recipients: e.target.value })}
              />
              {form.recipients.trim() ? (
                <p className="text-anywhere mt-2 text-xs text-muted-foreground">
                  {manualRecipientSummary.uniqueRecipients.length} alamat unik
                  {manualRecipientSummary.duplicateCount > 0
                    ? `, ${manualRecipientSummary.duplicateCount} duplikat`
                    : ""}
                  {manualRecipientSummary.invalidEmails.length > 0
                    ? `, ${manualRecipientSummary.invalidEmails.length} tidak valid`
                    : ""}
                </p>
              ) : null}
            </Field>
          ) : (
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_220px]">
                <Field label="Cari Kontak">
                  <TextInput
                    value={audienceFilter.q}
                    onChange={(e) => {
                      setDraftId(null);
                      setAudienceFilter((current) => ({ ...current, q: e.target.value }));
                    }}
                    placeholder="Nama, email, telepon, atau perusahaan"
                  />
                </Field>
                <Field label="Sumber">
                  <Select
                    value={audienceFilter.source}
                    onChange={(e) => {
                      setDraftId(null);
                      setAudienceFilter((current) => ({
                        ...current,
                        source: e.target.value as AudienceSourceFilter,
                      }));
                    }}
                  >
                    <option value="all">Semua sumber</option>
                    <option value="inquiry">Pesan Kontak</option>
                    <option value="whatsapp_lead">Prospek WhatsApp</option>
                    <option value="manual_import">Import Manual</option>
                    <option value="manual">Input Manual</option>
                  </Select>
                </Field>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {audiencePreview.loading
                      ? "Menghitung penerima..."
                      : `${audiencePreview.data?.eligible_recipients ?? 0} penerima aktif`}
                  </p>
                  <p className="text-anywhere text-xs text-muted-foreground">
                    {audiencePreview.data
                      ? `${audiencePreview.data.total_contacts} kontak cocok, ${audiencePreview.data.excluded_unsubscribed + audiencePreview.data.excluded_blocked} dikecualikan`
                      : "Kontak nonaktif otomatis tidak masuk campaign."}
                  </p>
                </div>
                <GhostButton type="button" onClick={exportAudience}>
                  <Download className="h-4 w-4" /> Export CSV
                </GhostButton>
              </div>
            </div>
          )}
        </Card>
        <Card>
          <h3 className="mb-3 font-display text-lg font-bold">Ringkasan</h3>
          <ul className="space-y-3 text-sm">
            <R
              k="Akun pengirim"
              v={selectedAccountLabel(form.email_account_id, accounts.data?.items ?? [])}
            />
            <R
              k="Sumber penerima"
              v={recipientMode === "audience" ? "Kontak Marketing" : "Input Manual"}
            />
            <R
              k="Estimasi penerima"
              v={
                recipientMode === "audience"
                  ? `${audiencePreview.data?.eligible_recipients ?? 0} alamat`
                  : `${manualRecipientSummary.uniqueRecipients.length} alamat`
              }
            />
            <R k="Status awal" v={draftId ? `Draf #${draftId}` : "Belum tersimpan"} />
          </ul>
          {recipientMode === "audience" && audiencePreview.data?.sample_recipients.length ? (
            <div className="mt-4 rounded-lg bg-secondary p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contoh Penerima
              </p>
              <div className="space-y-2 text-xs">
                {audiencePreview.data.sample_recipients.map((recipient) => (
                  <div key={recipient.id} className="min-w-0">
                    <p className="text-anywhere font-semibold">
                      {recipient.name ?? recipient.email}
                    </p>
                    <p className="text-anywhere text-muted-foreground">{recipient.email}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <p className="mt-4 rounded-lg bg-warning/10 p-3 text-xs">
            Email dikirim bertahap oleh worker backend untuk menghindari rate limit.
          </p>
        </Card>
      </div>

      <ConfirmDialog
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        title="Kirim email massal sekarang?"
        description="Campaign akan masuk antrean worker. Pengiriman yang sudah diproses tidak dapat dibatalkan."
        confirmLabel="Kirim"
        destructive={false}
        onConfirm={sendCampaign}
      />

      <CrudModal
        open={openPreview}
        onOpenChange={setOpenPreview}
        title="Pratinjau Email"
        size="md"
        onSubmit={() => setOpenPreview(false)}
        submitLabel="Tutup"
      >
        <div className="rounded-xl border border-border bg-secondary p-4">
          <p className="text-xs text-muted-foreground">
            Dari: {selectedAccountLabel(form.email_account_id, accounts.data?.items ?? [])}
          </p>
          <p className="text-xs text-muted-foreground">Subjek: {form.subject || "-"}</p>
          <hr className="my-3 border-border" />
          <p className="whitespace-pre-wrap text-sm">
            {form.body_text || "Isi email belum diisi."}
          </p>
        </div>
      </CrudModal>
    </>
  );
}

function R({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex min-w-0 flex-wrap justify-between gap-2 border-b border-border pb-2 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-anywhere font-semibold">{v}</span>
    </li>
  );
}

function parseRecipients(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      const match = raw.match(/^(.*?)<([^>]+)>$/);
      if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
      }
      return { email: raw };
    });
}

type ManualRecipientSummary = {
  uniqueRecipients: { email: string; name?: string }[];
  invalidEmails: string[];
  duplicateCount: number;
};

function summarizeRecipients(
  recipients: { email: string; name?: string }[],
): ManualRecipientSummary {
  const seen = new Set<string>();
  const uniqueRecipients: { email: string; name?: string }[] = [];
  const invalidEmails: string[] = [];
  let duplicateCount = 0;

  recipients.forEach((recipient) => {
    const email = recipient.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      invalidEmails.push(recipient.email);
      return;
    }
    if (seen.has(email)) {
      duplicateCount += 1;
      return;
    }
    seen.add(email);
    uniqueRecipients.push({
      email,
      name: recipient.name?.trim() || undefined,
    });
  });

  return { uniqueRecipients, invalidEmails, duplicateCount };
}

function validateDraft({
  form,
  recipientMode,
  manualRecipientSummary,
  audiencePreview,
}: {
  form: {
    title: string;
    email_account_id: string;
    subject: string;
    body_text: string;
  };
  recipientMode: RecipientMode;
  manualRecipientSummary: ManualRecipientSummary;
  audiencePreview: {
    data: { eligible_recipients: number } | null;
    error: unknown;
    loading: boolean;
  };
}) {
  if (!form.title.trim()) {
    return { title: "Nama pengiriman wajib diisi" };
  }
  if (!form.email_account_id) {
    return { title: "Pilih akun pengirim terlebih dahulu" };
  }
  if (!form.subject.trim()) {
    return { title: "Subjek email wajib diisi" };
  }
  if (!form.body_text.trim()) {
    return { title: "Isi email wajib diisi" };
  }

  if (recipientMode === "manual") {
    if (manualRecipientSummary.invalidEmails.length > 0) {
      return {
        title: "Daftar penerima belum valid",
        description: `${manualRecipientSummary.invalidEmails.length} alamat email perlu diperbaiki.`,
      };
    }
    if (manualRecipientSummary.uniqueRecipients.length === 0) {
      return { title: "Minimal satu penerima wajib diisi" };
    }
  }

  if (recipientMode === "audience") {
    if (audiencePreview.loading) {
      return { title: "Tunggu preview penerima selesai" };
    }
    if (audiencePreview.error) {
      return { title: "Preview penerima gagal dimuat" };
    }
    if (!audiencePreview.data || audiencePreview.data.eligible_recipients <= 0) {
      return {
        title: "Tidak ada penerima aktif",
        description: "Persempit atau ubah filter Kontak Marketing.",
      };
    }
  }

  return null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function textToHtml(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function selectedAccountLabel(
  value: string,
  accounts: { id: number; display_name: string; email_address: string }[],
) {
  const account = accounts.find((item) => String(item.id) === value);
  return account ? `${account.display_name} - ${account.email_address}` : "-";
}
