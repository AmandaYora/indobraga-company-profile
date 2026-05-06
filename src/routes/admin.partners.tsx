import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GripVertical, Plus, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { Card, PageTitle, PrimaryButton } from "@/components/admin/ui";
import {
  ConfirmDialog,
  CrudModal,
  Field,
  ImageUploadField,
  Select,
  TextInput,
} from "@/components/admin/CrudModal";
import { partners } from "@/data/site";

export const Route = createFileRoute("/admin/partners")({ component: PartnerAdminPage });

type Item = (typeof partners)[number];

function PartnerAdminPage() {
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [target, setTarget] = useState<Item | null>(null);

  const submit = () => {
    setOpenForm(false);
    toast.success(editing ? "Logo klien diperbarui" : "Logo klien ditambahkan");
  };
  const confirmDel = () => {
    setOpenDel(false);
    toast.error("Logo klien dihapus", {
      description: target ? `"${target.name}" telah dihapus.` : undefined,
    });
  };

  return (
    <>
      <PageTitle
        title="Logo Klien"
        desc="Logo dan nama klien untuk bagian dipercaya oleh di website publik."
        action={
          <PrimaryButton onClick={() => { setEditing(null); setOpenForm(true); }}>
            <Plus className="h-4 w-4" /> Tambah Logo
          </PrimaryButton>
        }
      />
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div className="flex min-w-0 items-center gap-3">
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex h-10 w-24 shrink-0 items-center justify-center rounded-md bg-secondary px-2 font-display text-xs font-bold text-primary-deep">
                  {p.name}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.segment}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(p); setOpenForm(true); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => { setTarget(p); setOpenDel(true); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <CrudModal
        open={openForm}
        onOpenChange={setOpenForm}
        title={editing ? "Ubah Logo Klien" : "Tambah Logo Klien"}
        description="Logo akan ditampilkan pada bagian Dipercaya Oleh di beranda."
        onSubmit={submit}
      >
        <Field label="Nama Klien" required>
          <TextInput defaultValue={editing?.name} placeholder="Contoh: Pertamina" />
        </Field>
        <Field label="Segmen" required>
          <Select defaultValue={editing?.segment ?? "Korporasi"}>
            {["Klub Sepak Bola","Klub Basket","Klub Olahraga","Tim Olahraga","Kebugaran","Merek Olahraga","Pakaian","Tas & Pakaian","Acara","Perhotelan","Korporasi","Transportasi","Perbankan","Energi","Pendidikan"].map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <ImageUploadField label="File Logo" hint="PNG transparan rekomendasi 240x120 px." />
        <Field label="Status">
          <Select defaultValue="active">
            <option value="active">Aktif (tampil)</option>
            <option value="inactive">Tidak Aktif</option>
          </Select>
        </Field>
      </CrudModal>

      <ConfirmDialog
        open={openDel}
        onOpenChange={setOpenDel}
        title={target ? `Hapus logo "${target.name}"?` : "Hapus logo?"}
        onConfirm={confirmDel}
      />
    </>
  );
}
