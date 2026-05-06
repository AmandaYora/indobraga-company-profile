import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import {
  ConfirmDialog,
  CrudModal,
  Field,
  ImageUploadField,
  Select,
  TextArea,
  TextInput,
} from "@/components/admin/CrudModal";
import { news } from "@/data/site";
import { formatDateId } from "@/lib/date";

export const Route = createFileRoute("/admin/news")({ component: NewsAdminPage });

type Item = (typeof news)[number];

function NewsAdminPage() {
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [target, setTarget] = useState<Item | null>(null);

  const submit = () => {
    setOpenForm(false);
    toast.success(editing ? "Berita diperbarui" : "Berita dibuat", {
      description: "Berita siap tampil di halaman publik.",
    });
  };
  const confirmDel = () => {
    setOpenDel(false);
    toast.error("Berita dihapus", {
      description: target ? `"${target.title}" telah dihapus.` : undefined,
    });
  };

  return (
    <>
      <PageTitle
        title="Berita"
        desc="Kelola berita dan pembaruan perusahaan."
        action={
          <PrimaryButton onClick={() => { setEditing(null); setOpenForm(true); }}>
            <Plus className="h-4 w-4" /> Buat Berita
          </PrimaryButton>
        }
      />

      <Card className="hidden overflow-hidden p-0 lg:block">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4 text-left">Judul</th>
              <th className="p-4 text-left">Kategori</th>
              <th className="p-4 text-left">Tanggal</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {news.map((n) => (
              <tr key={n.id} className="hover:bg-secondary/40">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={n.thumb} alt="" className="h-12 w-16 rounded-md object-cover" />
                    <p className="font-semibold">{n.title}</p>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{n.category}</td>
                <td className="p-4 text-muted-foreground">{formatDateId(n.date)}</td>
                <td className="p-4"><StatusBadge status="published" /></td>
                <td className="p-4 text-right">
                  <div className="inline-flex gap-1">
                    <button onClick={() => { setEditing(n); setOpenForm(true); }} className="rounded-md p-2 hover:bg-secondary">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setTarget(n); setOpenDel(true); }} className="rounded-md p-2 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid gap-4 lg:hidden">
        {news.map((n) => (
          <Card key={n.id} className="p-4">
            <div className="flex gap-3">
              <img src={n.thumb} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{n.category}</p>
                <p className="font-semibold">{n.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateId(n.date)}</p>
                <div className="mt-3 flex gap-1">
                  <button onClick={() => { setEditing(n); setOpenForm(true); }} className="rounded-md p-2 hover:bg-secondary"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => { setTarget(n); setOpenDel(true); }} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <CrudModal
        open={openForm}
        onOpenChange={setOpenForm}
        title={editing ? "Ubah Berita" : "Buat Berita Baru"}
        description="Tulis judul, ringkasan, dan isi berita untuk diterbitkan ke halaman publik."
        onSubmit={submit}
        size="lg"
        submitLabel={editing ? "Simpan Perubahan" : "Terbitkan"}
      >
        <Field label="Judul Berita" required>
          <TextInput defaultValue={editing?.title} placeholder="Contoh: Indobraga Perkuat Lini Sublimasi" />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Kategori" required>
            <Select defaultValue={editing?.category ?? "Fasilitas"}>
              {["Fasilitas","Portofolio","Produksi","Pengumuman","Acara"].map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Slug URL">
            <TextInput defaultValue={editing?.slug} placeholder="judul-berita" />
          </Field>
          <Field label="Tanggal Terbit">
            <TextInput type="date" defaultValue={editing?.date} />
          </Field>
        </div>
        <Field label="Ringkasan / Excerpt" hint="Tampil di kartu daftar berita.">
          <TextArea rows={2} defaultValue={editing?.excerpt} />
        </Field>
        <ImageUploadField label="Gambar Sampul" preview={editing?.thumb} />
        <Field label="Isi Berita" required hint="Pisahkan paragraf dengan baris kosong.">
          <TextArea rows={8} defaultValue={editing?.content?.join("\n\n")} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Status">
            <Select defaultValue="published">
              <option value="published">Tayang</option>
              <option value="draft">Draf</option>
            </Select>
          </Field>
          <Field label="Penulis">
            <TextInput defaultValue="Tim Marketing Indobraga" />
          </Field>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={openDel}
        onOpenChange={setOpenDel}
        title={target ? `Hapus berita "${target.title}"?` : "Hapus berita?"}
        description="Berita tidak akan tampil lagi di website publik."
        onConfirm={confirmDel}
      />
    </>
  );
}
