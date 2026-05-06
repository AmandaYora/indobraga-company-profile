import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Plus, Trash2, Upload, Video, Image as ImageIcon } from "lucide-react";
import { Card, GhostButton, PageTitle, PrimaryButton, StatusBadge } from "@/components/admin/ui";
import { gallery } from "@/data/site";

export const Route = createFileRoute("/admin/gallery")({ component: GalleryAdminPage });

function GalleryAdminPage() {
  return (
    <>
      <PageTitle
        title="Galeri Perusahaan"
        desc="Kelola konten visual image/video dan caption singkat untuk feed galeri public website."
        action={
          <PrimaryButton>
            <Plus className="h-4 w-4" /> Tambah Konten
          </PrimaryButton>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Konten
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold text-primary-deep">
            {gallery.length}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Image
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold text-primary-deep">
            {gallery.filter((g) => g.type === "image").length}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Video
          </p>
          <p className="mt-2 font-display text-3xl font-extrabold text-primary-deep">
            {gallery.filter((g) => g.type === "video").length}
          </p>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="font-display text-lg font-bold text-primary-deep">Unggah Konten Baru</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih image atau video, tambahkan caption singkat, dan atur status publikasi.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary text-muted-foreground transition hover:border-primary hover:text-primary">
            <Upload className="h-8 w-8" />
            <span className="text-sm font-semibold">Unggah image / video</span>
            <span className="text-xs">JPG, PNG, MP4 — maks 1080p</span>
          </label>
          <div className="grid gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipe Media
              </label>
              <div className="mt-2 flex gap-2">
                <button className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">
                  <ImageIcon className="h-3.5 w-3.5" /> Image
                </button>
                <button className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold">
                  <Video className="h-3.5 w-3.5" /> Video
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Caption Singkat
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Lini sublimasi Atexco dalam operasi harian."
                className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Urutan Tampil
                </label>
                <input
                  type="number"
                  defaultValue={1}
                  className="mt-2 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </label>
                <select className="mt-2 w-full rounded-xl border border-border bg-background p-2.5 text-sm outline-none focus:border-primary">
                  <option value="draft">Draf</option>
                  <option value="published">Tayang</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <GhostButton>Simpan sebagai Draf</GhostButton>
              <PrimaryButton>Publikasikan</PrimaryButton>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-primary-deep">Daftar Konten Galeri</h2>
          <span className="text-xs text-muted-foreground">{gallery.length} item</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.map((g, idx) => (
            <div
              key={g.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-muted"
            >
              <div className="relative aspect-square">
                <img src={g.media} alt={g.caption} className="h-full w-full object-cover" />
                {g.type === "video" && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                    <Video className="h-3 w-3" /> Video
                  </span>
                )}
                <span className="absolute right-2 top-2">
                  <StatusBadge status={idx % 5 === 0 ? "draft" : "published"} />
                </span>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-xs text-foreground">{g.caption}</p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    {new Date(g.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span>#{idx + 1}</span>
                </div>
                <div className="mt-3 flex gap-1">
                  <button className="flex-1 rounded-md border border-border p-1.5 text-xs hover:bg-secondary">
                    <Edit2 className="mx-auto h-3.5 w-3.5" />
                  </button>
                  <button className="flex-1 rounded-md border border-border p-1.5 text-xs text-destructive hover:bg-destructive/10">
                    <Trash2 className="mx-auto h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}