import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import { ConfirmDialog, CrudModal, Field, Select, TextInput } from "@/components/admin/CrudModal";

export const Route = createFileRoute("/admin/email-accounts")({ component: E });

const accounts = [
  { email: "marketing@indobraga.co.id", name: "Marketing", status: "connected", at: "Terhubung 2 minggu lalu" },
  { email: "info@indobraga.co.id", name: "Info", status: "connected", at: "Terhubung 1 bulan lalu" },
  { email: "promo@indobraga.co.id", name: "Promo", status: "expired", at: "Perlu dihubungkan ulang" },
];

function E() {
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [active, setActive] = useState<(typeof accounts)[number] | null>(null);

  return (
    <>
      <PageTitle
        title="Akun Email"
        desc="Akun Google yang digunakan sebagai pengirim email massal."
        action={
          <PrimaryButton onClick={() => { setActive(null); setOpenForm(true); }}>
            <Plus className="h-4 w-4" /> Hubungkan Akun Google
          </PrimaryButton>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map((a) => (
          <Card key={a.email}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">{a.name[0]}</div>
                <div>
                  <p className="font-semibold">{a.email}</p>
                  <p className="text-xs text-muted-foreground">{a.name} - {a.at}</p>
                </div>
              </div>
              <StatusBadge status={a.status} />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => toast.success("Permintaan otorisasi ulang dikirim")} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
                <RefreshCw className="h-3.5 w-3.5" /> Hubungkan Ulang
              </button>
              <button onClick={() => { setActive(a); setOpenDel(true); }} className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" /> Putuskan
              </button>
            </div>
          </Card>
        ))}
      </div>

      <CrudModal
        open={openForm}
        onOpenChange={setOpenForm}
        title="Hubungkan Akun Google"
        description="Akun yang dihubungkan akan tampil sebagai pilihan pengirim email massal."
        onSubmit={() => { setOpenForm(false); toast.success("Permintaan otorisasi dibuka di tab baru"); }}
        submitLabel="Lanjutkan ke Google"
      >
        <Field label="Alamat Email" required>
          <TextInput type="email" placeholder="nama@indobraga.co.id" />
        </Field>
        <Field label="Label Tampilan" required>
          <TextInput placeholder="Contoh: Marketing" />
        </Field>
        <Field label="Mode Pengiriman">
          <Select defaultValue="oauth">
            <option value="oauth">OAuth Google (rekomendasi)</option>
            <option value="smtp">SMTP App Password</option>
          </Select>
        </Field>
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
