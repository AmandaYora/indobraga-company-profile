import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState, type ReactNode, type RefObject } from "react";
import { AlertTriangle, CheckCircle2, Download, Eye, Save, Send, Upload } from "lucide-react";
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
import { getErrorMessage, useApiQuery } from "@/hooks/use-api-query";
import { adminEmailAccountsApi, adminEmailCampaignApi } from "@/lib/api-services";
import {
  EMPTY_IMPORT,
  RECIPIENT_LIMIT,
  RECIPIENT_TEMPLATE_HEADERS,
  RECIPIENT_TEMPLATE_SAMPLE,
  buildRecipientImport,
  buildSingleTitle,
  renderTemplate,
  selectedAccountLabel,
  textToHtml,
  validateBulk,
  validateSingle,
  type EmailContentForm,
  type EmailTab,
  type RecipientImportState,
  type RecipientVariables,
} from "./-admin.email-blast.helpers";

type EmailBlastSearch = { tab: EmailTab; email?: string; name?: string };

export const Route = createFileRoute("/admin/email-blast")({
  component: EmailBlastPage,
  validateSearch: (search: Record<string, unknown>): EmailBlastSearch => {
    const tab: EmailTab = search.tab === "bulk" ? "bulk" : "single";
    const email = typeof search.email === "string" ? search.email : undefined;
    const name = typeof search.name === "string" ? search.name : undefined;

    return { tab, ...(email ? { email } : {}), ...(name ? { name } : {}) };
  },
});

function EmailBlastPage() {
  const search = Route.useSearch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<EmailTab>(search.tab);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [content, setContent] = useState<EmailContentForm>({
    email_account_id: "",
    subject: "",
    body_text: "",
  });
  const [single, setSingle] = useState({
    to_email: search.email ?? "",
    to_name: search.name ?? "",
  });
  const [bulkTitle, setBulkTitle] = useState("");
  const [importState, setImportState] = useState<RecipientImportState>(EMPTY_IMPORT);

  const updateContent = (patch: Partial<EmailContentForm>) => {
    setDraftId(null);
    setContent((current) => ({ ...current, ...patch }));
  };
  const updateSingle = (patch: Partial<typeof single>) => {
    setDraftId(null);
    setSingle((current) => ({ ...current, ...patch }));
  };
  const updateBulkTitle = (value: string) => {
    setDraftId(null);
    setBulkTitle(value);
  };
  const switchTab = (next: EmailTab) => {
    setDraftId(null);
    setTab(next);
  };

  const loadAccounts = useCallback(
    () => adminEmailAccountsApi.list({ status: "connected", limit: 100 }),
    [],
  );
  const accounts = useApiQuery(["admin", "email-accounts", "connected"], loadAccounts);
  const accountItems = accounts.data?.items ?? [];

  const contentPayload = () => ({
    email_account_id: Number(content.email_account_id),
    subject: content.subject.trim(),
    body_text: content.body_text.trim(),
    body_html: textToHtml(content.body_text.trim()),
  });

  const saveDraft = async (): Promise<number | null> => {
    if (tab === "single") {
      const validationError = validateSingle({ ...content, ...single });
      if (validationError) {
        toast.error(validationError.title, { description: validationError.description });
        return null;
      }

      const email = single.to_email.trim();
      const name = single.to_name.trim();
      try {
        const draft = await adminEmailCampaignApi.createDraft({
          ...contentPayload(),
          title: buildSingleTitle(email),
          recipients: [
            {
              email,
              name: name || undefined,
              variables: { nama: name, email: email.toLowerCase() },
            },
          ],
        });
        setDraftId(draft.id);
        return draft.id;
      } catch (error) {
        toast.error("Email gagal disiapkan", {
          description: getErrorMessage(error, { action: "save" }),
        });
        return null;
      }
    }

    const validationError = validateBulk({ ...content, title: bulkTitle }, importState);
    if (validationError) {
      toast.error(validationError.title, { description: validationError.description });
      return null;
    }

    try {
      const draft = await adminEmailCampaignApi.createDraft({
        ...contentPayload(),
        title: bulkTitle.trim(),
        recipients: importState.validRecipients,
      });
      setDraftId(draft.id);
      toast.success("Draf email massal tersimpan");
      return draft.id;
    } catch (error) {
      toast.error("Draf gagal disimpan", {
        description: getErrorMessage(error, { action: "save" }),
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
      toast.success(tab === "single" ? "Email mulai dikirim" : "Email massal mulai dikirim");
      setOpenConfirm(false);
    } catch (error) {
      toast.error("Email gagal dikirim", {
        description: getErrorMessage(error, { action: "send" }),
      });
    }
  };

  const downloadTemplate = async () => {
    try {
      const { default: writeXlsxFile } = await import("write-excel-file/browser");
      const header = RECIPIENT_TEMPLATE_HEADERS.map((label) => ({
        value: label,
        fontWeight: "bold",
        type: String,
      }));
      const sampleRows = RECIPIENT_TEMPLATE_SAMPLE.map((row) =>
        row.map((cell) => ({ value: cell, type: String })),
      );
      // write-excel-file's published types omit the browser `fileName` download option.
      const writeTemplate = writeXlsxFile as unknown as (
        rows: unknown,
        options: { fileName: string },
      ) => Promise<void>;
      await writeTemplate([header, ...sampleRows], {
        fileName: "template-penerima-email-indobraga.xlsx",
      });
    } catch {
      toast.error("Template gagal diunduh", { description: "Coba ulangi sebentar lagi." });
    }
  };

  const handleRecipientFile = async (file: File | undefined) => {
    setDraftId(null);
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setImportState({
        ...EMPTY_IMPORT,
        fileName: file.name,
        error: "File daftar penerima harus berformat Excel (.xlsx).",
      });
      return;
    }

    try {
      const { default: readXlsxFile } = await import("read-excel-file/browser");
      const rows = await readXlsxFile(file);
      setImportState(buildRecipientImport(rows as unknown as unknown[][], file.name));
    } catch {
      setImportState({
        ...EMPTY_IMPORT,
        fileName: file.name,
        error: "File daftar penerima tidak dapat dibaca. Pastikan formatnya Excel (.xlsx).",
      });
    }
  };

  const validCount = importState.validRecipients.length;
  const excludedCount = importState.duplicateCount + importState.invalidRows.length;
  const availableVariables = tab === "single" ? ["nama", "email"] : importState.variableKeys;
  const previewVariables: RecipientVariables =
    tab === "single"
      ? { nama: single.to_name.trim(), email: single.to_email.trim().toLowerCase() }
      : (importState.validRecipients[0]?.variables ?? {});

  return (
    <>
      <PageTitle
        title="Kirim Email"
        desc="Kirim email ke satu penerima (Single) atau ke banyak penerima sekaligus dari file Excel (Massal) dengan akun pengirim yang terhubung."
        action={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            {tab === "bulk" && (
              <GhostButton onClick={saveDraft}>
                <Save className="h-4 w-4" /> Simpan Draf
              </GhostButton>
            )}
            <GhostButton onClick={() => setOpenPreview(true)}>
              <Eye className="h-4 w-4" /> Pratinjau
            </GhostButton>
            <PrimaryButton onClick={() => setOpenConfirm(true)}>
              <Send className="h-4 w-4" /> Kirim Email
            </PrimaryButton>
          </div>
        }
      />

      <div className="mb-6 inline-flex rounded-full border border-border bg-card p-1">
        <TabButton active={tab === "single"} onClick={() => switchTab("single")}>
          Single
        </TabButton>
        <TabButton active={tab === "bulk"} onClick={() => switchTab("bulk")}>
          Massal
        </TabButton>
      </div>

      {accounts.loading && !accounts.data && <LoadingState label="Memuat akun pengirim..." />}
      {accounts.error && <ErrorState error={accounts.error} onRetry={accounts.reload} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4 lg:col-span-2">
          {tab === "single" ? (
            <>
              <Field label="Email Tujuan" required>
                <TextInput
                  type="email"
                  value={single.to_email}
                  onChange={(e) => updateSingle({ to_email: e.target.value })}
                  placeholder="penerima@email.com"
                />
              </Field>
              <Field label="Nama Penerima" hint="Opsional, dipakai untuk menyapa dengan {{nama}}.">
                <TextInput
                  value={single.to_name}
                  onChange={(e) => updateSingle({ to_name: e.target.value })}
                  placeholder="Nama penerima"
                />
              </Field>
            </>
          ) : (
            <Field label="Nama Pengiriman" required>
              <TextInput
                value={bulkTitle}
                onChange={(e) => updateBulkTitle(e.target.value)}
                placeholder="Follow-up permintaan produksi seragam"
              />
            </Field>
          )}

          <Field label="Akun Pengirim" required>
            <Select
              value={content.email_account_id}
              onChange={(e) => updateContent({ email_account_id: e.target.value })}
            >
              <option value="">Pilih akun pengirim</option>
              {accountItems.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.display_name} - {account.email_address}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subjek Email" required>
            <TextInput
              value={content.subject}
              onChange={(e) => updateContent({ subject: e.target.value })}
              placeholder="Tulis subjek email..."
            />
          </Field>
          <Field
            label="Isi Email"
            required
            hint="Sisipkan variabel seperti {{nama}} agar subjek/isi dipersonalisasi per penerima."
          >
            <TextArea
              rows={8}
              value={content.body_text}
              onChange={(e) => updateContent({ body_text: e.target.value })}
              placeholder="Halo {{nama}}, terima kasih sudah menghubungi Indobraga..."
            />
            <VariableHints variables={availableVariables} />
          </Field>

          {tab === "bulk" && (
            <Field label="Daftar Penerima (Excel)" required>
              <XlsxRecipientPanel
                importState={importState}
                fileInputRef={fileInputRef}
                onFileChange={handleRecipientFile}
                onDownloadTemplate={downloadTemplate}
              />
            </Field>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-lg font-bold">Ringkasan</h3>
          <ul className="space-y-3 text-sm">
            <R k="Mode" v={tab === "single" ? "Single" : "Massal"} />
            <R k="Akun pengirim" v={selectedAccountLabel(content.email_account_id, accountItems)} />
            {tab === "single" ? (
              <R k="Email tujuan" v={single.to_email.trim() || "Belum diisi"} />
            ) : (
              <>
                <R k="Email valid" v={`${validCount} alamat`} />
                <R k="Dikecualikan" v={`${excludedCount} data`} />
              </>
            )}
            <R k="Status draf" v={draftId ? `Draf #${draftId}` : "Belum tersimpan"} />
          </ul>
          {tab === "bulk" && (
            <p className="mt-4 rounded-lg bg-warning/10 p-3 text-xs">
              Pengiriman dilakukan bertahap agar reputasi email tetap terjaga.
            </p>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        title={tab === "single" ? "Kirim email sekarang?" : "Kirim email massal sekarang?"}
        description={
          tab === "single"
            ? `Email akan dikirim ke ${single.to_email.trim() || "penerima"}.`
            : "Email akan mulai dikirim ke penerima valid. Pengiriman yang sudah berjalan tidak dapat dibatalkan."
        }
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
            Dari: {selectedAccountLabel(content.email_account_id, accountItems)}
          </p>
          {tab === "single" ? (
            <p className="text-xs text-muted-foreground">Kepada: {single.to_email.trim() || "-"}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Kepada: {importState.validRecipients[0]?.email ?? "penerima pertama"}
              {validCount > 1 ? ` (+${validCount - 1} lainnya)` : ""}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Subjek: {renderTemplate(content.subject, previewVariables) || "-"}
          </p>
          <hr className="my-3 border-border" />
          <p className="whitespace-pre-wrap text-sm">
            {renderTemplate(content.body_text, previewVariables) || "Isi email belum diisi."}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Pratinjau memakai data {tab === "single" ? "yang Anda isi" : "penerima pertama"};
            variabel {"{{...}}"} diisi otomatis per penerima saat dikirim.
          </p>
        </div>
      </CrudModal>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-1.5 text-sm font-semibold transition ${
        active
          ? "bg-primary text-primary-foreground shadow-card"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function XlsxRecipientPanel({
  importState,
  fileInputRef,
  onFileChange,
  onDownloadTemplate,
}: {
  importState: RecipientImportState;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | undefined) => void;
  onDownloadTemplate: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/50 p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <p className="text-anywhere min-w-0 flex-1 text-xs text-muted-foreground">
          Format Excel (.xlsx). Baris pertama adalah header. Kolom wajib:{" "}
          <span className="font-semibold">nama</span> dan{" "}
          <span className="font-semibold">email</span>. Tambahkan kolom lain sesuka Anda — setiap
          header menjadi variabel (mis. <span className="font-semibold">perusahaan</span> ={" "}
          <code className="rounded bg-card px-1">{"{{perusahaan}}"}</code>).
        </p>
        <GhostButton type="button" onClick={onDownloadTemplate}>
          <Download className="h-4 w-4" /> Unduh Template
        </GhostButton>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(event) => onFileChange(event.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mt-4 flex w-full min-w-0 flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-card px-4 py-8 text-center transition hover:bg-primary/5"
      >
        <Upload className="mb-2 h-6 w-6 text-primary" />
        <span className="text-sm font-semibold">
          {importState.fileName || "Pilih file Excel (.xlsx)"}
        </span>
        <span className="text-xs text-muted-foreground">
          Maksimal {RECIPIENT_LIMIT} email valid.
        </span>
      </button>

      {importState.fileName ? (
        <div className="mt-4 rounded-lg bg-card p-3">
          {importState.error ? (
            <p className="text-anywhere flex gap-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {importState.error}
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label="Baris dibaca" value={String(importState.rowsRead)} />
                <Metric label="Email valid" value={String(importState.validRecipients.length)} />
                <Metric label="Duplikat" value={String(importState.duplicateCount)} />
                <Metric label="Tidak valid" value={String(importState.invalidRows.length)} />
              </div>
              {importState.invalidRows.length > 0 ? (
                <div className="mt-3 rounded-lg bg-warning/10 p-3 text-xs">
                  <p className="mb-2 flex items-center gap-2 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    Beberapa baris tidak akan dipakai
                  </p>
                  <div className="space-y-1">
                    {importState.invalidRows.slice(0, 3).map((row) => (
                      <p key={`${row.row}-${row.reason}`} className="text-anywhere">
                        Baris {row.row}: {row.reason}
                      </p>
                    ))}
                    {importState.invalidRows.length > 3 ? (
                      <p>{importState.invalidRows.length - 3} baris lain tidak ditampilkan.</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="mt-3 flex items-center gap-2 text-xs text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  File siap digunakan.
                </p>
              )}
              <VariableHints variables={importState.variableKeys} />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function VariableHints({ variables }: { variables: readonly string[] }) {
  if (variables.length === 0) {
    return null;
  }

  return (
    <div className="text-anywhere mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span className="font-semibold">Variabel tersedia:</span>
      {variables.map((key) => (
        <code key={key} className="rounded bg-secondary px-1.5 py-0.5 text-primary-deep">
          {`{{${key}}}`}
        </code>
      ))}
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
