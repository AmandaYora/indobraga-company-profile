import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, RefreshCw, Trash2, Mail, Server, ShieldCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import { TablePagination, usePagination } from "@/components/admin/Pagination";
import { ConfirmDialog, CrudModal, Field, Select, TextInput } from "@/components/admin/CrudModal";

export const Route = createFileRoute("/admin/email-accounts")({ component: E });

type Provider = "google" | "smtp";
type Account = {
  email: string;
  name: string;
  status: string;
  at: string;
  provider: Provider;
  host?: string;
};

const baseAccounts: Account[] = [
  { email: "marketing@indobraga.co.id", name: "Marketing", status: "connected", at: "Terhubung 2 minggu lalu", provider: "google" },
  { email: "info@indobraga.co.id", name: "Info", status: "connected", at: "Terhubung 1 bulan lalu", provider: "google" },
  { email: "promo@indobraga.co.id", name: "Promo", status: "expired", at: "Perlu dihubungkan ulang", provider: "google" },
  { email: "noreply@indobraga.co.id", name: "Notifikasi Sistem", status: "connected", at: "Terhubung 3 hari lalu", provider: "smtp", host: "smtp.hostinger.com" },
  { email: "newsletter@indobraga.co.id", name: "Newsletter", status: "connected", at: "Terhubung 5 hari lalu", provider: "smtp", host: "smtp.hostinger.com" },
];
const accounts: Account[] = [
  ...baseAccounts,
  ...Array.from({ length: 9 }).map((_, i): Account => ({
    email: `team${i + 1}@indobraga.co.id`,
    name: `Tim ${i + 1}`,
    status: i % 4 === 0 ? "expired" : "connected",
    at: `Terhubung ${i + 1} hari lalu`,
    provider: i % 3 === 0 ? "smtp" : "google",
    host: i % 3 === 0 ? "smtp.hostinger.com" : undefined,
  })),
];

function E() {
  const [openForm, setOpenForm] = useState<null | Provider>(null);
  const [openChooser, setOpenChooser] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [active, setActive] = useState<Account | null>(null);
  const [filter, setFilter] = useState<"all" | Provider>("all");
  const [q, setQ] = useState("");
  const filtered = accounts.filter(
    (a) =>
      (filter === "all" || a.provider === filter) &&
      (q === "" || a.email.toLowerCase().includes(q.toLowerCase()) || a.name.toLowerCase().includes(q.toLowerCase())),
  );
  const pg = usePagination(filtered, 6, `${q}|${filter}`);

  return (
    <>
      <PageTitle
        title="Akun Pengirim Email"
        desc="Kelola akun pengirim email massal: Google Workspace/Gmail (OAuth) atau SMTP hosting (Hostinger, cPanel, dll)."
        action={
          <PrimaryButton onClick={() => { setActive(null); setOpenChooser(true); }}>
            <Plus className="h-4 w-4" /> Tambah Akun Pengirim
          </PrimaryButton>
        }
      />

      <Card className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari email atau label..."
            className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="inline-flex rounded-full border border-border bg-secondary p-1 text-xs font-semibold">
          {([
            { v: "all", label: "Semua" },
            { v: "google", label: "Google OAuth" },
            { v: "smtp", label: "SMTP" },
          ] as const).map((t) => (
            <button
              key={t.v}
              onClick={() => setFilter(t.v)}
              className={`rounded-full px-3 py-1.5 transition ${filter === t.v ? "bg-primary text-primary-foreground shadow-card" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {pg.slice.map((a) => (
          <Card key={a.email}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${a.provider === "google" ? "bg-primary-soft text-primary" : "bg-accent/20 text-accent-foreground"}`}>
                  {a.provider === "google" ? <Mail className="h-5 w-5" /> : <Server className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {a.name} • {a.provider === "google" ? "Google OAuth" : `SMTP ${a.host ?? ""}`}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{a.at}</p>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => toast.success(a.provider === "google" ? "Permintaan otorisasi ulang dibuka di tab baru" : "Pengujian koneksi SMTP berhasil")}
                aria-label={a.provider === "google" ? `Hubungkan ulang ${a.email}` : `Uji koneksi SMTP ${a.email}`}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                <RefreshCw className="h-3.5 w-3.5" /> {a.provider === "google" ? "Hubungkan Ulang" : "Uji Koneksi"}
              </button>
              <button
                onClick={() => { setActive(a); setOpenDel(true); }}
                aria-label={`Putuskan akun ${a.email}`}
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Putuskan
              </button>
            </div>
          </Card>
        ))}
      </div>
      <div className="mt-3">
        <TablePagination
          page={pg.page}
          pageCount={pg.pageCount}
          pageSize={pg.pageSize}
          total={pg.total}
          start={pg.start}
          end={pg.end}
          onPageChange={pg.setPage}
          onPageSizeChange={pg.setPageSize}
          itemLabel="akun"
          pageSizeOptions={[6, 12, 24]}
          className="rounded-xl border bg-card"
        />
      </div>

      {/* Chooser: pilih provider */}
      <CrudModal
        open={openChooser}
        onOpenChange={setOpenChooser}
        title="Pilih Jenis Akun Pengirim"
        description="Pilih cara menghubungkan email yang akan dipakai untuk mengirim email massal."
        size="md"
        submitLabel="Tutup"
        onSubmit={() => setOpenChooser(false)}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => { setOpenChooser(false); setOpenForm("google"); }}
            className="group rounded-xl border border-border p-4 text-left transition hover:border-primary hover:bg-primary-soft/40"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary"><Mail className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold">Google OAuth</p>
                <p className="text-xs text-muted-foreground">Gmail / Google Workspace</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Cocok untuk pengirim resmi yang sudah memakai Google Workspace. Otorisasi cepat tanpa kata sandi.</p>
          </button>
          <button
            type="button"
            onClick={() => { setOpenChooser(false); setOpenForm("smtp"); }}
            className="group rounded-xl border border-border p-4 text-left transition hover:border-primary hover:bg-primary-soft/40"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent-foreground"><Server className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold">SMTP Hosting</p>
                <p className="text-xs text-muted-foreground">Hostinger / cPanel / lainnya</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Pakai server email hosting sendiri. Cocok untuk domain perusahaan tanpa Google Workspace.</p>
          </button>
        </div>
      </CrudModal>

      {/* Form: Google OAuth */}
      <CrudModal
        open={openForm === "google"}
        onOpenChange={(v) => !v && setOpenForm(null)}
        title="Hubungkan Akun Google"
        description="Anda akan diarahkan ke Google untuk memberi izin pengiriman email."
        onSubmit={() => { setOpenForm(null); toast.success("Permintaan otorisasi dibuka di tab baru"); }}
        submitLabel="Lanjutkan ke Google"
      >
        <Field label="Alamat Email" required>
          <TextInput type="email" placeholder="nama@indobraga.co.id" />
        </Field>
        <Field label="Label Tampilan" required>
          <TextInput placeholder="Contoh: Marketing" />
        </Field>
        <div className="flex items-start gap-2 rounded-xl bg-primary-soft/60 p-3 text-xs text-primary-deep">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Indobraga hanya meminta izin <strong>kirim email</strong>. Anda dapat mencabut akses kapan saja melalui akun Google.</p>
        </div>
      </CrudModal>

      {/* Form: SMTP Hosting */}
      <CrudModal
        open={openForm === "smtp"}
        onOpenChange={(v) => !v && setOpenForm(null)}
        title="Hubungkan via SMTP Hosting"
        description="Isi detail SMTP dari panel hosting Anda (Hostinger, cPanel, dsb)."
        size="lg"
        onSubmit={() => { setOpenForm(null); toast.success("Akun SMTP berhasil terhubung", { description: "Pengujian koneksi sukses." }); }}
        submitLabel="Simpan & Uji Koneksi"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Alamat Email Pengirim" required>
            <TextInput type="email" placeholder="nama@domain.co.id" />
          </Field>
          <Field label="Label Tampilan" required>
            <TextInput placeholder="Contoh: Newsletter" />
          </Field>
          <Field label="SMTP Host" required>
            <TextInput placeholder="smtp.hostinger.com" />
          </Field>
          <Field label="Port" required>
            <TextInput type="number" placeholder="465" defaultValue={465} />
          </Field>
          <Field label="Username SMTP" required>
            <TextInput placeholder="nama@domain.co.id" />
          </Field>
          <Field label="Kata Sandi SMTP" required hint="Kata sandi akun email atau app password.">
            <TextInput type="password" placeholder="••••••••" />
          </Field>
          <Field label="Enkripsi">
            <Select defaultValue="ssl">
              <option value="ssl">SSL (port 465)</option>
              <option value="tls">STARTTLS (port 587)</option>
              <option value="none">Tanpa enkripsi</option>
            </Select>
          </Field>
          <Field label="Batas Kirim / Jam" hint="Sesuaikan dengan limit hosting Anda.">
            <TextInput type="number" defaultValue={300} />
          </Field>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-warning/10 p-3 text-xs text-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.45_0.15_75)]" />
          <p>Kredensial disimpan terenkripsi. Pastikan kata sandi sesuai dengan yang ada di panel hosting Anda.</p>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={openDel}
        onOpenChange={setOpenDel}
        title={active ? `Putuskan ${active.email}?` : "Putuskan akun?"}
        description="Akun ini tidak akan bisa digunakan untuk mengirim email massal."
        confirmLabel="Putuskan"
        onConfirm={() => { setOpenDel(false); toast.error("Akun email diputuskan"); }}
      />
    </>
  );
}
