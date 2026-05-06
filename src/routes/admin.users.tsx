import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import {
  ConfirmDialog,
  CrudModal,
  Field,
  Select,
  TextInput,
} from "@/components/admin/CrudModal";

export const Route = createFileRoute("/admin/users")({ component: U });

type User = { name: string; email: string; role: string; status: string };

const initial: User[] = [
  { name: "Admin Indobraga", email: "admin@indobraga.co.id", role: "Admin Utama", status: "active" },
  { name: "Koordinator Marketing", email: "marketing@indobraga.co.id", role: "Editor Konten", status: "active" },
  { name: "Tim Sales", email: "sales@indobraga.co.id", role: "Editor Konten", status: "active" },
];

function U() {
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [target, setTarget] = useState<User | null>(null);

  const submit = () => {
    setOpenForm(false);
    toast.success(editing ? "Pengguna diperbarui" : "Pengguna ditambahkan", {
      description: "Undangan akan dikirim ke alamat email pengguna.",
    });
  };
  const confirmDel = () => {
    setOpenDel(false);
    toast.error("Pengguna dihapus", {
      description: target ? `Akses ${target.email} telah dicabut.` : undefined,
    });
  };

  return (
    <>
      <PageTitle
        title="Pengguna Admin"
        desc="Daftar pengguna panel admin."
        action={
          <PrimaryButton onClick={() => { setEditing(null); setOpenForm(true); }}>
            <Plus className="h-4 w-4" /> Tambah Pengguna
          </PrimaryButton>
        }
      />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4 text-left">Nama</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Peran</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {initial.map((u) => (
              <tr key={u.email}>
                <td className="p-4 font-semibold">{u.name}</td>
                <td className="p-4 text-muted-foreground">{u.email}</td>
                <td className="p-4">{u.role}</td>
                <td className="p-4"><StatusBadge status={u.status} /></td>
                <td className="p-4 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => { setEditing(u); setOpenForm(true); }} className="rounded-md p-2 hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => { setTarget(u); setOpenDel(true); }} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <CrudModal
        open={openForm}
        onOpenChange={setOpenForm}
        title={editing ? "Ubah Pengguna Admin" : "Tambah Pengguna Admin"}
        description="Tentukan akses panel admin untuk anggota tim Anda."
        onSubmit={submit}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama Lengkap" required>
            <TextInput defaultValue={editing?.name} placeholder="Nama pengguna" />
          </Field>
          <Field label="Email" required>
            <TextInput type="email" defaultValue={editing?.email} placeholder="nama@indobraga.co.id" />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Peran" required>
            <Select defaultValue={editing?.role ?? "Editor Konten"}>
              <option>Admin Utama</option>
              <option>Editor Konten</option>
              <option>Tim Marketing</option>
              <option>Tim Sales</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select defaultValue={editing?.status ?? "active"}>
              <option value="active">Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </Select>
          </Field>
        </div>
        {!editing && (
          <Field label="Kata Sandi Sementara" hint="Pengguna akan diminta mengganti saat login pertama.">
            <TextInput type="password" placeholder="Min. 8 karakter" />
          </Field>
        )}
      </CrudModal>

      <ConfirmDialog
        open={openDel}
        onOpenChange={setOpenDel}
        title={target ? `Cabut akses ${target.name}?` : "Hapus pengguna?"}
        description="Pengguna tidak akan bisa masuk ke panel admin lagi."
        confirmLabel="Cabut Akses"
        onConfirm={confirmDel}
      />
    </>
  );
}
