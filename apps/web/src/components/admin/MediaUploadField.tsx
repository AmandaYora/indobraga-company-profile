import { useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/admin/CrudModal";
import { getErrorMessage } from "@/hooks/use-api-query";
import { adminMediaApi } from "@/lib/api-services";
import type { AdminMedia } from "@/lib/api-models";
import { prepareImageForUpload } from "@/lib/image-compression";

type MediaUploadFieldProps = {
  label?: string;
  usage: "hero" | "partner" | "portfolio" | "machine" | "gallery" | "news" | "og" | "other";
  value?: number | null;
  previewUrl?: string | null;
  accept?: string;
  onUploaded: (media: AdminMedia) => void;
};

export function MediaUploadField({
  label = "Gambar",
  usage,
  value,
  previewUrl,
  accept = "image/*",
  onUploaded,
}: MediaUploadFieldProps) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      const prepared = await prepareImageForUpload(file);
      const media = await adminMediaApi.upload(prepared.file, {
        usage,
        alt_text: file.name,
      });
      onUploaded(media);
      toast.success("Media berhasil diunggah");
    } catch (error) {
      toast.error("Media gagal diunggah", {
        description: getErrorMessage(error, { action: "upload" }),
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field
      label={label}
      hint={
        value
          ? "Media sudah dipilih dan siap dipakai."
          : "Unggah file agar konten bisa dipublikasikan."
      }
    >
      <label className="group flex cursor-pointer flex-col gap-3 rounded-xl border-2 border-dashed border-border bg-secondary p-3 transition hover:border-primary sm:flex-row sm:items-center sm:gap-4">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 text-center text-sm sm:text-left">
          <p className="font-semibold text-foreground">
            {uploading ? "Mengunggah..." : "Klik untuk unggah / ganti"}
          </p>
          <p className="text-xs text-muted-foreground">
            Gambar akan otomatis disiapkan dalam ukuran yang sesuai untuk website.
          </p>
        </div>
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={uploading}
          onChange={(event) => upload(event.target.files?.[0])}
        />
      </label>
    </Field>
  );
}
