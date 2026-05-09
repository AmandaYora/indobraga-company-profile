import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { PublicErrorState } from "@/components/admin/ApiState";
import { news } from "@/data/site";
import { useApiQuery } from "@/hooks/use-api-query";
import { publicContentApi } from "@/lib/api-services";
import { formatDateId } from "@/lib/date";
import { articleJsonLd, pageSeo, structuredDataScripts } from "@/lib/seo";

export const Route = createFileRoute("/_public/berita/$slug")({
  component: NewsDetailPage,
  head: ({ params }) => {
    const item = news.find((n) => n.slug === params.slug);

    if (!item) {
      return pageSeo({
        title: "Berita tidak ditemukan - Indobraga",
        description: "Halaman berita Indobraga tidak ditemukan.",
        path: "/berita",
        noindex: true,
      });
    }

    const seo = pageSeo({
      title: item.title,
      description: item.excerpt,
      path: `/berita/${item.slug}`,
      image: item.thumb,
      type: "article",
    });

    return {
      ...seo,
      meta: [
        ...seo.meta,
        { property: "article:published_time", content: item.date },
        { property: "article:modified_time", content: item.date },
        { property: "article:section", content: item.category },
      ],
      scripts: structuredDataScripts([articleJsonLd(item)]),
    };
  },
});

function NewsDetailPage() {
  const { slug } = Route.useParams();
  const loadDetail = useCallback(() => publicContentApi.newsDetail(slug), [slug]);
  const {
    data: item,
    error,
    loading,
    reload,
  } = useApiQuery(["public", "news-detail", slug], loadDetail);

  if (loading && !item) {
    return (
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Memuat detail berita dari backend...
        </p>
      </article>
    );
  }

  if (error || !item) {
    return (
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <PublicErrorState error={error ?? new Error("Berita tidak ditemukan.")} onRetry={reload} />
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        to="/berita"
        search={{ page: 1 }}
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>
      <div className="mt-6 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-accent/20 px-2.5 py-0.5 font-semibold text-accent-foreground">
          {item.category}
        </span>
        <span className="text-muted-foreground">{formatDateId(item.published_at ?? "")}</span>
      </div>
      <h1 className="mt-4 font-display text-3xl font-extrabold text-primary-deep sm:text-4xl">
        {item.title}
      </h1>
      <img
        src={item.thumbnail_url ?? news[0]?.thumb}
        alt={item.title}
        className="mt-8 aspect-[16/9] w-full rounded-2xl object-cover shadow-card"
      />
      <p className="mt-8 text-lg leading-relaxed text-foreground/80">{item.excerpt}</p>
      <div className="mt-6 space-y-4 text-foreground/80">
        {item.content.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
