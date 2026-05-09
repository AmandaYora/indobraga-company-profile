import { createFileRoute } from "@tanstack/react-router";
import { AdminResourceManager } from "@/components/admin/AdminResourceManager";
import type { AdminContentItem } from "@/lib/api-models";
import { formatDateId } from "@/lib/date";

export const Route = createFileRoute("/admin/news")({ component: NewsAdminPage });

type NewsItem = AdminContentItem & {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content?: string[];
  thumbnail_media_file_id?: number | null;
  published_at?: string | null;
};

function NewsAdminPage() {
  return (
    <AdminResourceManager<NewsItem>
      resource="news"
      title="Berita"
      description="Kelola artikel dan update perusahaan untuk website publik."
      addLabel="Tambah Berita"
      itemLabel="berita"
      imageField="thumbnail_media_file_id"
      searchPlaceholder="Cari judul, slug, atau ringkasan..."
      primaryText={(item) => item.title}
      secondaryText={(item) => item.excerpt}
      columns={[
        {
          label: "Artikel",
          value: (item) => (
            <div>
              <p className="font-semibold">{item.title}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{item.excerpt}</p>
            </div>
          ),
        },
        { label: "Kategori", value: (item) => item.category },
        {
          label: "Publikasi",
          value: (item) => (item.published_at ? formatDateId(item.published_at, "short") : "-"),
        },
      ]}
      fields={[
        { name: "title", label: "Judul", required: true },
        { name: "slug", label: "Slug", placeholder: "judul-berita" },
        { name: "category", label: "Kategori", required: true },
        { name: "excerpt", label: "Ringkasan", type: "textarea", required: true },
        { name: "content", label: "Konten Paragraf", type: "paragraphs" },
        { name: "thumbnail_media_file_id", label: "Thumbnail", type: "media", usage: "news" },
        { name: "og_image_media_file_id", label: "OG Image", type: "media", usage: "og" },
        { name: "seo_title", label: "SEO Title" },
        { name: "seo_description", label: "SEO Description", type: "textarea" },
      ]}
    />
  );
}
