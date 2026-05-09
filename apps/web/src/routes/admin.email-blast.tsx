import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { Eye, Save, Send } from "lucide-react";
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
import { adminEmailAccountsApi, adminEmailCampaignApi } from "@/lib/api-services";

export const Route = createFileRoute("/admin/email-blast")({ component: EmailBlastPage });

function EmailBlastPage() {
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [draftId, setDraftId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "",
    email_account_id: "",
    subject: "",
    body_text: "",
    recipients: "",
  });
  const loadAccounts = useCallback(
    () => adminEmailAccountsApi.list({ status: "connected", limit: 100 }),
    [],
  );
  const accounts = useApiQuery(["admin", "email-accounts", "connected"], loadAccounts);
  const recipientList = useMemo(() => parseRecipients(form.recipients), [form.recipients]);

  const saveDraft = async () => {
    if (!form.email_account_id) {
      toast.error("Pilih akun pengirim terlebih dahulu");
      return null;
    }

    try {
      const draft = await adminEmailCampaignApi.createDraft({
        email_account_id: Number(form.email_account_id),
        title: form.title,
        subject: form.subject,
        body_text: form.body_text,
        recipients: recipientList,
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
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Promo Kuartal 2 2026"
            />
          </Field>
          <Field label="Akun Pengirim" required>
            <Select
              value={form.email_account_id}
              onChange={(e) => setForm({ ...form, email_account_id: e.target.value })}
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
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Tulis subjek email..."
            />
          </Field>
          <Field label="Isi Email" required hint="Mendukung penanda {{nama}} untuk personalisasi.">
            <TextArea
              rows={8}
              value={form.body_text}
              onChange={(e) => setForm({ ...form, body_text: e.target.value })}
            />
          </Field>
          <Field
            label="Daftar Penerima"
            hint="Pisahkan dengan koma atau baris baru. Format: email atau Nama <email>."
          >
            <TextArea
              rows={4}
              className="font-mono text-xs"
              value={form.recipients}
              onChange={(e) => setForm({ ...form, recipients: e.target.value })}
            />
          </Field>
        </Card>
        <Card>
          <h3 className="mb-3 font-display text-lg font-bold">Ringkasan</h3>
          <ul className="space-y-3 text-sm">
            <R
              k="Akun pengirim"
              v={selectedAccountLabel(form.email_account_id, accounts.data?.items ?? [])}
            />
            <R k="Estimasi penerima" v={`${recipientList.length} alamat`} />
            <R k="Status awal" v={draftId ? `Draf #${draftId}` : "Belum tersimpan"} />
          </ul>
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

function selectedAccountLabel(
  value: string,
  accounts: { id: number; display_name: string; email_address: string }[],
) {
  const account = accounts.find((item) => String(item.id) === value);
  return account ? `${account.display_name} - ${account.email_address}` : "-";
}
