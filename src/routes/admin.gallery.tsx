import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Edit2, Plus, Trash2, Video } from "lucide-react";
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
import { gallery } from "@/data/site";
import { formatDateId } from "@/lib/date";

export const Route = createFileRoute("/admin/gallery")({ component: GalleryAdminPage });

type Item = (typeof gallery)[number];

function GalleryAdminPage() {
  const [openForm, setOpenForm] = useState(false);
  const [openDel, setOpenDel] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [target, setTarget] = useState<Item | null>(null);

  const submit = () => {
    setOpenForm(false);
    toast.success(editing ? "Konten galeri diperbarui" : "Konten galeri ditambahkan", {
      description: "Konten visual sudah diperbarui pada feed galeri publik.",
    });
  };
  const confirmDel = () => {
    setOpenDel(false);
    toast.error("Konten galeri dihapus");
  };

  return (
    <>
      <PageTitle
        title="Galeri Perusahaan"
        desc="Kelola konten visual image/video dan caption singkat untuk feed galeri public website."
        action={
          <PrimaryButton onClick={() => { setEditing(null); setOpenForm(true); }}>
            <Plus className="h-4 w-4" /> Tambah Konten
          </PrimaryButton>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Konten</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-primary-deep">{gallery.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Image</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-primary-deep">{gallery.filter((g) => g.type === "image").length}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Video</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-primary-deep">{gallery.filter((g) => g.type === "video").length}</p>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-primary-deep">Daftar Konten Galeri</h2>
          <span className="text-xs text-muted-foreground">{gallery.length} item</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.map((g, idx) => (
            <div key={g.id} className="group relative overflow-hidden rounded-xl border border-border bg-muted">
              <div className="relative aspect-square">
                <img src={g.media} alt={g.caption} className="h-full w-full object-cover" />
                {g.type === "video" && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Video className="h-3 w-3" /> Video
                  </span>
                )}
                <span className="absolute right-2 top-2"><StatusBadge status={idx % 5 === 0 ? "draft" : "published"} /></span>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-xs text-foreground">{g.caption}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{formatDateId(g.date, "short")}</span>
                  <span>#{idx + 1}</span>
                </div>
                <div className="mt-3 flex gap-1">
                  <button onClick={() => { setEditing(g); setOpenForm(true); }} className="flex-1 rounded-md border border-border p-1.5 text-xs hover:bg-secondary">
                    <Edit2 className="mx-auto h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { setTarget(g); setOpenDel(true); }} className="flex-1 rounded-md border border-border p-1.5 text-xs text-destructive hover:bg-destructive/10">
                    <Trash2 className="mx-auto h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <CrudModal
        open={openForm}
        onOpenChange={setOpenForm}
        title={editing ? "Ubah Konten Galeri" : "Tambah Konten Galeri"}
        description="Unggah image / video dan tambahkan caption singkat."
        onSubmit={submit}
        size="lg"
      >
        <ImageUploadField label="Berkas Media" preview={editing?.media} hint="JPG, PNG, atau MP4 — maks 1080p." />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tipe Media">
            <Select defaultValue={editing?.type ?? "image"}>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </Select>
          </Field>
          <Field label="Tanggal">
            <TextInput type="date" defaultValue={editing?.date} />
          </Field>
        </div>
        <Field label="Caption" required>
          <TextArea rows={3} defaultValue={editing?.caption} placeholder="Deskripsi singkat konten." />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Urutan Tampil">
            <TextInput type="number" defaultValue={editing?.id ?? 1} />
          </Field>
          <Field label="Status">
            <Select defaultValue="published">
              <option value="published">Tayang</option>
              <option value="draft">Draf</option>
              <option value="inactive">Tidak Aktif</option>
            </Select>
          </Field>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={openDel}
        onOpenChange={setOpenDel}
        title="Hapus konten galeri ini?"
        description="Konten tidak akan tampil lagi pada feed galeri publik."
        onConfirm={confirmDel}
      />
    </>
  );
}
