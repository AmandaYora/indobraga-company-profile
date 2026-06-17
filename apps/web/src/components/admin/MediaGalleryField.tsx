import { useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Star, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/admin/CrudModal";
import { getErrorMessage } from "@/hooks/use-api-query";
import { adminMediaApi } from "@/lib/api-services";
import type { AdminMedia } from "@/lib/api-models";
import { prepareImageForUpload } from "@/lib/image-compression";

type GalleryPreview = AdminMedia | null;

type MediaGalleryFieldProps = {
  label?: string;
  hint?: string;
  usage: "hero" | "partner" | "portfolio" | "machine" | "gallery" | "news" | "og" | "other";
  max?: number;
  accept?: string;
  ids: number[];
  previews: GalleryPreview[];
  onChange: (ids: number[], previews: GalleryPreview[]) => void;
};

function previewUrl(media: GalleryPreview): string | null {
  return media?.thumbnail_url ?? media?.medium_url ?? media?.file_url ?? null;
}

export function MediaGalleryField({
  label = "Gambar",
  hint,
  usage,
  max = 10,
  accept = "image/*",
  ids,
  previews,
  onChange,
}: MediaGalleryFieldProps) {
  const [uploading, setUploading] = useState(false);
  const remaining = Math.max(0, max - ids.length);

  const upload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList).slice(0, remaining);
    if (files.length === 0) {
      toast.error(`Maksimal ${max} gambar per portofolio.`);
      return;
    }

    setUploading(true);
    const nextIds = [...ids];
    const nextPreviews = [...previews];
    try {
      for (const file of files) {
        try {
          const prepared = await prepareImageForUpload(file);
          const media = await adminMediaApi.upload(prepared.file, { usage, alt_text: file.name });
          if (!nextIds.includes(media.id)) {
            nextIds.push(media.id);
            nextPreviews.push(media);
          }
        } catch (error) {
          toast.error(`Gagal mengunggah ${file.name}`, {
            description: getErrorMessage(error, { action: "upload" }),
          });
        }
      }
      onChange(nextIds, nextPreviews);
      if (nextIds.length > ids.length) {
        toast.success("Media berhasil diunggah");
      }
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (index: number) => {
    onChange(
      ids.filter((_, i) => i !== index),
      previews.filter((_, i) => i !== index),
    );
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= ids.length) {
      return;
    }
    const nextIds = [...ids];
    const nextPreviews = [...previews];
    [nextIds[index], nextIds[target]] = [nextIds[target], nextIds[index]];
    [nextPreviews[index], nextPreviews[target]] = [nextPreviews[target], nextPreviews[index]];
    onChange(nextIds, nextPreviews);
  };

  return (
    <Field
      label={label}
      hint={hint ?? "Gambar pertama menjadi sampul. Atur urutan dengan tombol panah."}
      className="md:col-span-2"
    >
      <div className="space-y-3">
        {ids.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ids.map((id, index) => {
              const src = previewUrl(previews[index] ?? null);
              return (
                <li
                  key={id}
                  className="group relative overflow-hidden rounded-xl border border-border bg-secondary"
                >
                  <div className="flex aspect-[4/3] items-center justify-center bg-background">
                    {src ? (
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  {index === 0 && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-card">
                      <Star className="h-3 w-3" /> Sampul
                    </span>
                  )}
                  <div className="flex items-center justify-between gap-1 p-1.5">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Geser ke kiri"
                        aria-label="Geser ke kiri"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        className="rounded-md border border-border bg-background p-1 text-muted-foreground transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Geser ke kanan"
                        aria-label="Geser ke kanan"
                        disabled={index === ids.length - 1}
                        onClick={() => move(index, 1)}
                        className="rounded-md border border-border bg-background p-1 text-muted-foreground transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      title="Hapus gambar"
                      aria-label="Hapus gambar"
                      onClick={() => removeAt(index)}
                      className="rounded-md border border-border bg-background p-1 text-destructive transition hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {remaining > 0 ? (
          <label className="group flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary p-3 transition hover:border-primary">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-background">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-foreground">
                {uploading ? "Mengunggah..." : "Klik untuk menambah gambar"}
              </p>
              <p className="text-xs text-muted-foreground">
                Bisa pilih beberapa sekaligus. Sisa {remaining} dari {max} gambar.
              </p>
            </div>
            <input
              type="file"
              accept={accept}
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(event) => {
                void upload(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        ) : (
          <p className="rounded-xl border border-border bg-secondary px-3 py-2 text-xs text-muted-foreground">
            Batas maksimal {max} gambar tercapai. Hapus salah satu untuk menambah yang lain.
          </p>
        )}
      </div>
    </Field>
  );
}
