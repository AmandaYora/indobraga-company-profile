import { createFileRoute } from "@tanstack/react-router";
import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import { MediaLibraryPanel } from "@/components/admin/MediaLibraryPanel";
import type { AdminContentItem } from "@/lib/api-models";

export const Route = createFileRoute("/admin/gallery")({ component: GalleryAdminPage });

type GalleryItem = AdminContentItem & {
  media_type: "image" | "video";
  caption: string;
  media_file_id?: number | null;
  poster_media_id?: number | null;
};

function GalleryAdminPage() {
  return (
    <div className="space-y-10">
      <AdminResourceManager<GalleryItem>
        resource="gallery-items"
        title="Galeri Perusahaan"
        description="Kelola gambar dan video dokumentasi perusahaan."
        addLabel="Tambah Galeri"
        itemLabel="galeri"
        imageField="media_file_id"
        searchPlaceholder="Cari keterangan galeri..."
        primaryText={(item) => item.caption}
        secondaryText={(item) => (item.media_type === "video" ? "Video" : "Gambar")}
        columns={[
          {
            label: "Keterangan",
            value: (item) => <p className="line-clamp-2 font-semibold">{item.caption}</p>,
          },
          { label: "Tipe", value: (item) => (item.media_type === "video" ? "Video" : "Gambar") },
          { label: "Urutan", value: (item) => item.sort_order ?? 0 },
        ]}
        fields={[
          {
            name: "media_type",
            label: "Tipe Media",
            type: "select",
            required: true,
            options: [
              { value: "image", label: "Gambar" },
              { value: "video", label: "Video" },
            ],
          },
          { name: "sort_order", label: "Urutan", type: "number" },
          { name: "caption", label: "Keterangan", type: "textarea", required: true },
          { name: "media_file_id", label: "Media", type: "media", usage: "gallery" },
          { name: "poster_media_id", label: "Poster Video", type: "media", usage: "gallery" },
        ]}
        defaultValues={{ media_type: "image", sort_order: 0 }}
      />
      <MediaLibraryPanel />
    </div>
  );
}
