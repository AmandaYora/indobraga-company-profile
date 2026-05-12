import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Inbox,
  Save,
  Send,
  Upload,
} from "lucide-react";
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
import { Card, GhostButton, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import { useApiQuery } from "@/hooks/use-api-query";
import { adminEmailAccountsApi, adminEmailCampaignApi } from "@/lib/api-services";
import {
  EMPTY_CSV_IMPORT,
  RECIPIENT_LIMIT,
  excludedRecipients,
  estimateRecipients,
  parseRecipientCsv,
  selectedAccountLabel,
  textToHtml,
  validateDraft,
  type CampaignForm,
  type CsvImportState,
  type InquiryStatusFilter,
  type RecipientSource,
} from "./-admin.email-blast.helpers";

export const Route = createFileRoute("/admin/email-blast")({ component: EmailBlastPage });

function EmailBlastPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [recipientSource, setRecipientSource] = useState<RecipientSource>("inquiries");
  const [inquiryFilter, setInquiryFilter] = useState<{
    q: string;
    status: InquiryStatusFilter;
    date_from: string;
    date_to: string;
  }>({
    q: "",
    status: "all",
    date_from: "",
    date_to: "",
  });
  const [csvImport, setCsvImport] = useState<CsvImportState>(EMPTY_CSV_IMPORT);
  const [form, setForm] = useState<CampaignForm>({
    title: "",
    email_account_id: "",
    subject: "",
    body_text: "",
  });

  const updateForm = (patch: Partial<CampaignForm>) => {
    setDraftId(null);
    setForm((current) => ({ ...current, ...patch }));
  };
  const updateInquiryFilter = (patch: Partial<typeof inquiryFilter>) => {
    setDraftId(null);
    setInquiryFilter((current) => ({ ...current, ...patch }));
  };
  const switchSource = (source: RecipientSource) => {
    setDraftId(null);
    setRecipientSource(source);
  };

  const loadAccounts = useCallback(
    () => adminEmailAccountsApi.list({ status: "connected", limit: 100 }),
    [],
  );
  const accounts = useApiQuery(["admin", "email-accounts", "connected"], loadAccounts);
  const selectedInquiryFilter = useMemo(
    () => ({
      q: inquiryFilter.q.trim() || undefined,
      status: inquiryFilter.status === "all" ? undefined : inquiryFilter.status,
      date_from: inquiryFilter.date_from || undefined,
      date_to: inquiryFilter.date_to || undefined,
    }),
    [inquiryFilter.date_from, inquiryFilter.date_to, inquiryFilter.q, inquiryFilter.status],
  );
  const loadInquiryPreview = useCallback(
    () => adminEmailCampaignApi.previewInquiryRecipients(selectedInquiryFilter),
    [selectedInquiryFilter],
  );
  const inquiryPreview = useApiQuery(
    ["admin", "email-campaigns", "inquiry-preview", selectedInquiryFilter],
    loadInquiryPreview,
    { enabled: recipientSource === "inquiries" },
  );

  const saveDraft = async () => {
    const validationError = validateDraft({
      form,
      recipientSource,
      inquiryPreview,
      csvImport,
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
        recipientSource === "inquiries"
          ? await adminEmailCampaignApi.createDraftFromInquiries({
              ...basePayload,
              inquiry_filter: selectedInquiryFilter,
            })
          : await adminEmailCampaignApi.createDraft({
              ...basePayload,
              recipients: csvImport.validRecipients,
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

  const sendCampaign = async () => {
    const id = draftId ?? (await saveDraft());
    if (!id) {
      return;
    }

    try {
      await adminEmailCampaignApi.send(id);
      toast.success("Email massal mulai dikirim");
      setOpenConfirm(false);
    } catch (error) {
      toast.error("Email massal gagal dikirim", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const handleCsvFile = async (file: File | undefined) => {
    setDraftId(null);
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvImport({
        ...EMPTY_CSV_IMPORT,
        fileName: file.name,
        error: "File harus berformat CSV.",
      });
      return;
    }

    try {
      const text = await file.text();
      setCsvImport(parseRecipientCsv(text, file.name));
    } catch {
      setCsvImport({
        ...EMPTY_CSV_IMPORT,
        fileName: file.name,
        error: "File tidak dapat dibaca. Coba upload ulang dengan format CSV.",
      });
    }
  };

  return (
    <>
      <PageTitle
        title="Kirim Email Massal"
        desc="Pilih penerima dari Pesan Kontak atau upload CSV, lalu kirim follow-up dengan akun pengirim yang terhubung."
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
              placeholder="Follow-up permintaan produksi seragam"
            />
          </Field>
          <Field label="Akun Pengirim" required>
            <Select
              value={form.email_account_id}
              onChange={(e) => updateForm({ email_account_id: e.target.value })}
            >
              <option value="">Pilih akun pengirim</option>
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
          <Field
            label="Isi Email"
            required
            hint="Gunakan {{nama}} jika ingin menyapa penerima dengan namanya."
          >
            <TextArea
              rows={8}
              value={form.body_text}
              onChange={(e) => updateForm({ body_text: e.target.value })}
              placeholder="Halo {{nama}}, terima kasih sudah menghubungi Indobraga..."
            />
          </Field>
          <Field label="Penerima Email" required>
            <div className="grid gap-2 sm:grid-cols-2">
              <SourceButton
                active={recipientSource === "inquiries"}
                icon={<Inbox className="h-4 w-4 shrink-0" />}
                title="Pesan Kontak"
                description="Gunakan email dari form kontak website."
                onClick={() => switchSource("inquiries")}
              />
              <SourceButton
                active={recipientSource === "csv"}
                icon={<FileText className="h-4 w-4 shrink-0" />}
                title="Upload CSV"
                description="Gunakan daftar penerima dari file."
                onClick={() => switchSource("csv")}
              />
            </div>
          </Field>

          {recipientSource === "inquiries" ? (
            <InquiryRecipientPanel
              filter={inquiryFilter}
              onFilterChange={updateInquiryFilter}
              preview={inquiryPreview}
            />
          ) : (
            <CsvRecipientPanel
              csvImport={csvImport}
              fileInputRef={fileInputRef}
              onDownloadTemplate={downloadCsvTemplate}
              onFileChange={handleCsvFile}
            />
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
              v={recipientSource === "inquiries" ? "Pesan Kontak" : "Upload CSV"}
            />
            <R
              k="Email valid"
              v={`${estimateRecipients(recipientSource, inquiryPreview.data, csvImport)} alamat`}
            />
            <R
              k="Dikecualikan"
              v={`${excludedRecipients(recipientSource, inquiryPreview.data, csvImport)} data`}
            />
            <R k="Status draf" v={draftId ? `Draf #${draftId}` : "Belum tersimpan"} />
          </ul>
          <RecipientSamples
            recipientSource={recipientSource}
            inquiryPreview={inquiryPreview.data}
            csvImport={csvImport}
          />
          <p className="mt-4 rounded-lg bg-warning/10 p-3 text-xs">
            Pengiriman dilakukan bertahap agar reputasi email tetap terjaga.
          </p>
        </Card>
      </div>

      <ConfirmDialog
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        title="Kirim email massal sekarang?"
        description="Email akan mulai dikirim ke penerima valid. Pengiriman yang sudah berjalan tidak dapat dibatalkan."
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

function SourceButton({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-secondary text-foreground hover:bg-secondary/80"
      }`}
    >
      {icon}
      <span className="min-w-0">
        <span className="block font-semibold">{title}</span>
        <span className="text-anywhere mt-0.5 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

function InquiryRecipientPanel({
  filter,
  onFilterChange,
  preview,
}: {
  filter: {
    q: string;
    status: InquiryStatusFilter;
    date_from: string;
    date_to: string;
  };
  onFilterChange: (patch: Partial<typeof filter>) => void;
  preview: {
    loading: boolean;
    error: Error | null;
    data: {
      total_inquiries: number;
      eligible_recipients: number;
      duplicate_emails: number;
      invalid_emails: number;
      recipient_limit: number;
      over_limit: boolean;
    } | null;
    reload: () => void;
  };
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/50 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Cari Pesan">
          <TextInput
            value={filter.q}
            onChange={(e) => onFilterChange({ q: e.target.value })}
            placeholder="Nama, email, telepon, perusahaan, atau isi pesan"
          />
        </Field>
        <Field label="Status Pesan">
          <Select
            value={filter.status}
            onChange={(e) => onFilterChange({ status: e.target.value as InquiryStatusFilter })}
          >
            <option value="all">Semua kecuali spam</option>
            <option value="new">Baru</option>
            <option value="contacted">Sudah Dihubungi</option>
            <option value="in_progress">Dalam Proses</option>
            <option value="closed">Selesai</option>
          </Select>
        </Field>
        <Field label="Dari Tanggal">
          <TextInput
            type="date"
            value={filter.date_from}
            onChange={(e) => onFilterChange({ date_from: e.target.value })}
          />
        </Field>
        <Field label="Sampai Tanggal">
          <TextInput
            type="date"
            value={filter.date_to}
            onChange={(e) => onFilterChange({ date_to: e.target.value })}
          />
        </Field>
      </div>
      <div className="mt-4 rounded-lg bg-card p-3">
        {preview.error ? (
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-destructive">Preview penerima gagal dimuat.</p>
            <GhostButton type="button" onClick={preview.reload}>
              Coba Lagi
            </GhostButton>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric
              label="Pesan cocok"
              value={preview.loading ? "..." : String(preview.data?.total_inquiries ?? 0)}
            />
            <Metric
              label="Email valid"
              value={preview.loading ? "..." : String(preview.data?.eligible_recipients ?? 0)}
            />
            <Metric
              label="Duplikat"
              value={preview.loading ? "..." : String(preview.data?.duplicate_emails ?? 0)}
            />
            <Metric
              label="Tidak valid"
              value={preview.loading ? "..." : String(preview.data?.invalid_emails ?? 0)}
            />
          </div>
        )}
      </div>
      {preview.data?.over_limit ? (
        <p className="text-anywhere mt-3 flex gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Hasil filter melebihi batas {preview.data.recipient_limit} email. Persempit filter sebelum
          menyimpan draf.
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Hanya Pesan Kontak dengan email valid yang akan menjadi penerima.
        </p>
      )}
    </div>
  );
}

function CsvRecipientPanel({
  csvImport,
  fileInputRef,
  onDownloadTemplate,
  onFileChange,
}: {
  csvImport: CsvImportState;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDownloadTemplate: () => void;
  onFileChange: (file: File | undefined) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/50 p-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Upload daftar penerima dari CSV</p>
          <p className="text-anywhere text-xs text-muted-foreground">
            Gunakan template agar kolom email, nama, dan perusahaan terbaca dengan benar.
          </p>
        </div>
        <GhostButton type="button" onClick={onDownloadTemplate}>
          <Download className="h-4 w-4" /> Download Template CSV
        </GhostButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => onFileChange(event.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mt-4 flex w-full min-w-0 flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-card px-4 py-8 text-center transition hover:bg-primary/5"
      >
        <Upload className="mb-2 h-6 w-6 text-primary" />
        <span className="text-sm font-semibold">{csvImport.fileName || "Pilih file CSV"}</span>
        <span className="text-xs text-muted-foreground">
          Maksimal {RECIPIENT_LIMIT} email valid.
        </span>
      </button>

      {csvImport.fileName ? (
        <div className="mt-4 rounded-lg bg-card p-3">
          {csvImport.error ? (
            <p className="text-anywhere flex gap-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {csvImport.error}
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label="Baris dibaca" value={String(csvImport.rowsRead)} />
                <Metric label="Email valid" value={String(csvImport.validRecipients.length)} />
                <Metric label="Duplikat" value={String(csvImport.duplicateCount)} />
                <Metric label="Tidak valid" value={String(csvImport.invalidRows.length)} />
              </div>
              {csvImport.invalidRows.length > 0 ? (
                <div className="mt-3 rounded-lg bg-warning/10 p-3 text-xs">
                  <p className="mb-2 flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    Beberapa baris tidak akan dipakai
                  </p>
                  <div className="space-y-1">
                    {csvImport.invalidRows.slice(0, 3).map((row) => (
                      <p key={`${row.row}-${row.reason}`} className="text-anywhere">
                        Baris {row.row}: {row.reason}
                      </p>
                    ))}
                    {csvImport.invalidRows.length > 3 ? (
                      <p>{csvImport.invalidRows.length - 3} baris lain tidak ditampilkan.</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-xs text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  File siap digunakan.
                </p>
              )}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function RecipientSamples({
  recipientSource,
  inquiryPreview,
  csvImport,
}: {
  recipientSource: RecipientSource;
  inquiryPreview: {
    sample_recipients: {
      id: number;
      name: string;
      email: string;
      status: string;
      created_at: string;
    }[];
  } | null;
  csvImport: CsvImportState;
}) {
  const samples =
    recipientSource === "inquiries"
      ? (inquiryPreview?.sample_recipients.map((item) => ({
          key: String(item.id),
          name: item.name,
          email: item.email,
          meta: formatDate(item.created_at),
          status: item.status,
        })) ?? [])
      : csvImport.validRecipients.slice(0, 5).map((item) => ({
          key: item.email,
          name: item.name || item.email,
          email: item.email,
          meta: "CSV",
          status: undefined,
        }));

  if (samples.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg bg-secondary p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Contoh Penerima
      </p>
      <div className="space-y-2 text-xs">
        {samples.map((recipient) => (
          <div key={recipient.key} className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="text-anywhere font-semibold">{recipient.name}</p>
              {recipient.status ? <StatusBadge status={recipient.status} /> : null}
            </div>
            <p className="text-anywhere text-muted-foreground">{recipient.email}</p>
            <p className="text-muted-foreground">{recipient.meta}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-anywhere text-lg font-bold text-primary-deep">{value}</p>
      <p className="text-anywhere text-xs text-muted-foreground">{label}</p>
    </div>
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

function downloadCsvTemplate() {
  const csv = [
    ["nama", "email", "perusahaan", "telepon", "catatan"],
    ["Budi Santoso", "budi@example.com", "PT Contoh", "08123456789", "Prospek seragam kantor"],
  ]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob([`\uFEFF${csv}\r\n`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "template-penerima-email-indobraga.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
