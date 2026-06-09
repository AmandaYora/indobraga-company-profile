import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Trash2,
  Unplug,
} from "lucide-react";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "@/components/admin/ApiState";
import { ConfirmDialog, CrudModal, Field, Select, TextInput } from "@/components/admin/CrudModal";
import { EmptyState, TablePagination } from "@/components/admin/Pagination";
import {
  ActionButtonGroup,
  Card,
  IconActionButton,
  PageTitle,
  PrimaryButton,
  StatusBadge,
} from "@/components/admin/ui";
import { getErrorMessage, useApiQuery } from "@/hooks/use-api-query";
import type { EmailAccount } from "@/lib/api-models";
import { adminEmailAccountsApi, type SmtpAccountPayload } from "@/lib/api-services";

export const Route = createFileRoute("/admin/email-accounts")({ component: EmailAccountsPage });

type Provider = "google" | "smtp";

function EmailAccountsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState<"all" | Provider>("all");
  const [openChooser, setOpenChooser] = useState(false);
  const [openForm, setOpenForm] = useState<Provider | null>(null);
  const [target, setTarget] = useState<EmailAccount | null>(null);
  const [googleForm, setGoogleForm] = useState({ email_hint: "", display_name: "" });
  const [smtpForm, setSmtpForm] = useState<SmtpAccountPayload>({
    email_address: "",
    display_name: "",
    smtp_host: "smtp.hostinger.com",
    smtp_port: 465,
    smtp_security: "ssl_tls",
    smtp_username: "",
    smtp_password: "",
  });
  const [editTarget, setEditTarget] = useState<EmailAccount | null>(null);
  const [editForm, setEditForm] = useState<SmtpAccountPayload>({
    email_address: "",
    display_name: "",
    smtp_host: "smtp.hostinger.com",
    smtp_port: 465,
    smtp_security: "ssl_tls",
    smtp_username: "",
    smtp_password: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<EmailAccount | null>(null);
  const [deleting, setDeleting] = useState(false);
  const loadAccounts = useCallback(
    () =>
      adminEmailAccountsApi.list({
        page,
        limit: pageSize,
        q: query,
        provider: provider === "all" ? undefined : provider,
      }),
    [page, pageSize, provider, query],
  );
  const accounts = useApiQuery(
    ["admin", "email-accounts", page, pageSize, provider, query],
    loadAccounts,
  );
  const list = accounts.data?.items ?? [];
  const pagination = accounts.data?.pagination;
  const start =
    pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const end = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

  useEffect(() => {
    setPage(1);
  }, [pageSize, provider, query]);

  const openGoogleOAuth = async () => {
    try {
      const result = await adminEmailAccountsApi.googleOAuthUrl(googleForm);
      window.open(result.authorization_url, "_blank", "noopener,noreferrer");
      toast.success("Halaman izin Google dibuka");
      setOpenForm(null);
    } catch (error) {
      toast.error("Hubungkan Google gagal dimulai", {
        description: getErrorMessage(error, { action: "save" }),
      });
    }
  };

  const saveSmtp = async () => {
    try {
      await adminEmailAccountsApi.createSmtp(smtpForm);
      toast.success("Akun email hosting (SMTP) berhasil disimpan dan dicek");
      setOpenForm(null);
      accounts.reload();
    } catch (error) {
      toast.error("Akun email hosting (SMTP) gagal disimpan", {
        description: getErrorMessage(error, { action: "save" }),
      });
    }
  };

  const reconnect = async (account: EmailAccount) => {
    try {
      const result = await adminEmailAccountsApi.reconnect(account.id);
      if ("authorization_url" in result) {
        window.open(result.authorization_url, "_blank", "noopener,noreferrer");
        toast.success("Halaman izin ulang Google dibuka");
      } else {
        toast.info(result.message);
      }
    } catch (error) {
      toast.error("Hubungkan ulang gagal", {
        description: getErrorMessage(error, { action: "save" }),
      });
    }
  };

  const disable = async () => {
    if (!target) {
      return;
    }
    try {
      await adminEmailAccountsApi.disable(target.id);
      toast.success("Akun email diputuskan");
      setTarget(null);
      accounts.reload();
    } catch (error) {
      toast.error("Akun gagal diputuskan", {
        description: getErrorMessage(error, { action: "delete" }),
      });
    }
  };

  const openEdit = (account: EmailAccount) => {
    setEditTarget(account);
    setEditForm({
      email_address: account.email_address,
      display_name: account.display_name ?? "",
      smtp_host: account.smtp_host ?? "smtp.hostinger.com",
      smtp_port: account.smtp_port ?? 465,
      smtp_security: (account.smtp_security as SmtpAccountPayload["smtp_security"]) ?? "ssl_tls",
      smtp_username: account.smtp_username ?? account.email_address,
      smtp_password: "",
    });
  };

  const saveEdit = async () => {
    if (!editTarget) {
      return;
    }
    const body: Partial<SmtpAccountPayload> = { display_name: editForm.display_name };
    if (editTarget.provider === "smtp") {
      body.smtp_host = editForm.smtp_host;
      body.smtp_port = editForm.smtp_port;
      body.smtp_security = editForm.smtp_security;
      body.smtp_username = editForm.smtp_username;
      if (editForm.smtp_password.trim()) {
        body.smtp_password = editForm.smtp_password;
      }
    }
    try {
      await adminEmailAccountsApi.update(editTarget.id, body);
      toast.success("Akun email diperbarui");
      setEditTarget(null);
      accounts.reload();
    } catch (error) {
      toast.error("Akun gagal diperbarui", {
        description: getErrorMessage(error, { action: "save" }),
      });
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    try {
      await adminEmailAccountsApi.remove(deleteTarget.id);
      toast.success("Akun email dihapus");
      setDeleteTarget(null);
      accounts.reload();
    } catch (error) {
      toast.error("Akun gagal dihapus", {
        description: getErrorMessage(error, { action: "delete" }),
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageTitle
        title="Akun Pengirim Email"
        desc="Kelola akun yang dipakai untuk mengirim email massal dari dashboard."
        action={
          <PrimaryButton
            onClick={() => {
              setOpenChooser(true);
              setGoogleForm({ email_hint: "", display_name: "" });
            }}
          >
            <Plus className="h-4 w-4" /> Tambah Akun Pengirim
          </PrimaryButton>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-full sm:basis-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari email, label, atau server..."
            className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex max-w-full overflow-x-auto rounded-full border border-border bg-secondary p-1 text-xs font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { value: "all", label: "Semua" },
            { value: "google", label: "Google / Gmail" },
            { value: "smtp", label: "Email Hosting (SMTP)" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setProvider(option.value as typeof provider)}
              className={`shrink-0 rounded-full px-3 py-1.5 transition ${
                provider === option.value
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Card>

      {accounts.loading && !accounts.data && <LoadingState label="Memuat akun pengirim email..." />}
      {accounts.error && <ErrorState error={accounts.error} onRetry={accounts.reload} />}

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        {list.length === 0 && !accounts.loading && (
          <Card className="md:col-span-2">
            <EmptyState title="Tidak ada akun" description="Coba kata kunci atau filter lain." />
          </Card>
        )}
        {list.map((account) => (
          <Card key={account.id}>
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
                    account.provider === "google"
                      ? "bg-primary-soft text-primary"
                      : "bg-accent/20 text-accent-foreground"
                  }`}
                >
                  {account.provider === "google" ? (
                    <Mail className="h-5 w-5" />
                  ) : (
                    <Server className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-anywhere font-semibold">{account.email_address}</p>
                  <p className="text-anywhere text-xs text-muted-foreground">
                    {account.display_name} -{" "}
                    {account.provider === "google"
                      ? "Google / Gmail"
                      : `Email Hosting (SMTP): ${account.smtp_host ?? ""}`}
                  </p>
                  {account.last_error && (
                    <p className="text-anywhere mt-0.5 text-[11px] text-destructive">
                      Perlu dicek ulang sebelum dipakai: {account.last_error}
                    </p>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                <StatusBadge status={account.status} />
              </div>
            </div>
            <ActionButtonGroup className="mt-4 justify-start">
              <IconActionButton
                onClick={() => openEdit(account)}
                label={`Ubah akun ${account.email_address}`}
                tooltip="Ubah"
                icon={<Pencil className="h-4 w-4" />}
                tone="default"
              />
              <IconActionButton
                onClick={() => reconnect(account)}
                label={
                  account.provider === "google"
                    ? `Hubungkan ulang ${account.email_address}`
                    : `Perbarui koneksi email hosting (SMTP) ${account.email_address}`
                }
                tooltip={account.provider === "google" ? "Hubungkan ulang" : "Perbarui koneksi"}
                icon={<RefreshCw className="h-4 w-4" />}
                tone="primary"
              />
              <IconActionButton
                onClick={() => setTarget(account)}
                label={`Putuskan akun ${account.email_address}`}
                tooltip="Putuskan (nonaktifkan)"
                icon={<Unplug className="h-4 w-4" />}
                tone="warning"
              />
              <IconActionButton
                onClick={() => setDeleteTarget(account)}
                label={`Hapus akun ${account.email_address}`}
                tooltip="Hapus permanen"
                icon={<Trash2 className="h-4 w-4" />}
                tone="danger"
              />
            </ActionButtonGroup>
          </Card>
        ))}
      </div>
      {pagination && (
        <div className="mt-3">
          <TablePagination
            page={pagination.page}
            pageCount={pagination.total_pages}
            pageSize={pagination.limit}
            total={pagination.total}
            start={start}
            end={end}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="akun"
            pageSizeOptions={[6, 12, 24]}
            className="rounded-xl border bg-card"
          />
        </div>
      )}

      <CrudModal
        open={openChooser}
        onOpenChange={setOpenChooser}
        title="Pilih Jenis Akun Pengirim"
        description="Pilih cara menghubungkan email yang akan dipakai untuk mengirim email massal."
        submitLabel="Tutup"
        onSubmit={() => setOpenChooser(false)}
      >
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <ProviderCard
            title="Google / Gmail"
            subtitle="Gmail / Google Workspace"
            icon={<Mail className="h-5 w-5" />}
            onClick={() => {
              setOpenChooser(false);
              setOpenForm("google");
            }}
          />
          <ProviderCard
            title="Email Hosting (SMTP)"
            subtitle="Hostinger / cPanel / SMTP"
            icon={<Server className="h-5 w-5" />}
            onClick={() => {
              setOpenChooser(false);
              setOpenForm("smtp");
            }}
          />
        </div>
      </CrudModal>

      <CrudModal
        open={openForm === "google"}
        onOpenChange={(open) => !open && setOpenForm(null)}
        title="Hubungkan Akun Google"
        description="Anda akan diarahkan ke Google untuk memberi izin pengiriman email."
        onSubmit={openGoogleOAuth}
        submitLabel="Lanjutkan ke Google"
      >
        <Field label="Alamat Email">
          <TextInput
            type="email"
            value={googleForm.email_hint}
            onChange={(e) => setGoogleForm({ ...googleForm, email_hint: e.target.value })}
            placeholder="nama@indobraga.com"
          />
        </Field>
        <Field label="Label Tampilan">
          <TextInput
            value={googleForm.display_name}
            onChange={(e) => setGoogleForm({ ...googleForm, display_name: e.target.value })}
            placeholder="Marketing"
          />
        </Field>
        <div className="flex items-start gap-2 rounded-xl bg-primary-soft/60 p-3 text-xs text-primary-deep">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-anywhere">
            Setelah izin diberikan, akun ini bisa dipilih saat mengirim email massal.
          </p>
        </div>
      </CrudModal>

      <CrudModal
        open={openForm === "smtp"}
        onOpenChange={(open) => !open && setOpenForm(null)}
        title="Hubungkan Email Hosting (SMTP)"
        description="Isi detail dari panel hosting email. Istilah dalam kurung mengikuti nama yang biasanya dipakai di dokumentasi penyedia hosting."
        size="lg"
        onSubmit={saveSmtp}
        submitLabel="Simpan & Cek Koneksi"
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <SmtpInput
            label="Alamat Email Pengirim"
            value={smtpForm.email_address}
            onChange={(value) =>
              setSmtpForm({ ...smtpForm, email_address: value, smtp_username: value })
            }
            type="email"
          />
          <SmtpInput
            label="Label Tampilan"
            value={smtpForm.display_name}
            onChange={(value) => setSmtpForm({ ...smtpForm, display_name: value })}
          />
          <SmtpInput
            label="Server Email (SMTP Host)"
            value={smtpForm.smtp_host}
            onChange={(value) => setSmtpForm({ ...smtpForm, smtp_host: value })}
          />
          <SmtpInput
            label="Port Email (SMTP Port)"
            value={String(smtpForm.smtp_port)}
            onChange={(value) => setSmtpForm({ ...smtpForm, smtp_port: Number(value) })}
            type="number"
          />
          <SmtpInput
            label="Username Email (SMTP Username)"
            value={smtpForm.smtp_username}
            onChange={(value) => setSmtpForm({ ...smtpForm, smtp_username: value })}
          />
          <SmtpInput
            label="Kata Sandi Email (SMTP Password)"
            value={smtpForm.smtp_password}
            onChange={(value) => setSmtpForm({ ...smtpForm, smtp_password: value })}
            type="password"
          />
          <Field label="Keamanan Koneksi (SMTP Security)">
            <Select
              value={smtpForm.smtp_security}
              onChange={(e) =>
                setSmtpForm({
                  ...smtpForm,
                  smtp_security: e.target.value as SmtpAccountPayload["smtp_security"],
                })
              }
            >
              <option value="ssl_tls">SSL/TLS (465)</option>
              <option value="starttls">STARTTLS (587)</option>
              <option value="none">Tanpa enkripsi</option>
            </Select>
          </Field>
        </div>
      </CrudModal>

      <CrudModal
        open={Boolean(editTarget)}
        onOpenChange={(open) => !open && setEditTarget(null)}
        title={editTarget ? `Ubah ${editTarget.email_address}` : "Ubah Akun"}
        description={
          editTarget?.provider === "google"
            ? "Akun Google: hanya label tampilan yang bisa diubah dari sini."
            : "Perbarui detail akun. Koneksi SMTP akan dites ulang otomatis saat disimpan."
        }
        size="lg"
        onSubmit={saveEdit}
        submitLabel="Simpan Perubahan"
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          <SmtpInput
            label="Label Tampilan"
            value={editForm.display_name}
            onChange={(value) => setEditForm({ ...editForm, display_name: value })}
          />
          {editTarget?.provider === "smtp" && (
            <>
              <SmtpInput
                label="Server Email (SMTP Host)"
                value={editForm.smtp_host}
                onChange={(value) => setEditForm({ ...editForm, smtp_host: value })}
              />
              <SmtpInput
                label="Port Email (SMTP Port)"
                value={String(editForm.smtp_port)}
                onChange={(value) => setEditForm({ ...editForm, smtp_port: Number(value) })}
                type="number"
              />
              <SmtpInput
                label="Username Email (SMTP Username)"
                value={editForm.smtp_username}
                onChange={(value) => setEditForm({ ...editForm, smtp_username: value })}
              />
              <Field label="Kata Sandi Email (SMTP Password)">
                <TextInput
                  type="password"
                  value={editForm.smtp_password}
                  onChange={(e) => setEditForm({ ...editForm, smtp_password: e.target.value })}
                  placeholder="Biarkan kosong jika tidak diubah"
                />
              </Field>
              <Field label="Keamanan Koneksi (SMTP Security)">
                <Select
                  value={editForm.smtp_security}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      smtp_security: e.target.value as SmtpAccountPayload["smtp_security"],
                    })
                  }
                >
                  <option value="ssl_tls">SSL/TLS (465)</option>
                  <option value="starttls">STARTTLS (587)</option>
                  <option value="none">Tanpa enkripsi</option>
                </Select>
              </Field>
            </>
          )}
        </div>
      </CrudModal>

      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        title={target ? `Putuskan ${target.email_address}?` : "Putuskan akun?"}
        description="Akun ini tidak dapat digunakan untuk pengiriman sampai dihubungkan kembali."
        confirmLabel="Putuskan"
        onConfirm={disable}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}
        title={deleteTarget ? `Hapus permanen ${deleteTarget.email_address}?` : "Hapus akun?"}
        description="Akun akan dihapus permanen. Jika sudah pernah dipakai untuk pengiriman email, penghapusan akan ditolak demi menjaga riwayat — gunakan Putuskan untuk menonaktifkannya."
        confirmLabel={deleting ? "Menghapus..." : "Hapus"}
        onConfirm={doDelete}
      />
    </>
  );
}

function ProviderCard({
  title,
  subtitle,
  icon,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group min-w-0 rounded-xl border border-border p-4 text-left transition hover:border-primary hover:bg-primary-soft/40"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
          {icon}
        </div>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

function SmtpInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <Field label={label} required>
      <TextInput type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}
