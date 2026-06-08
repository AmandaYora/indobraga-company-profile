import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Play, X } from "lucide-react";
import { PublicErrorState } from "@/components/admin/ApiState";
import { MediaPlaceholder, OptionalImage } from "@/components/public/MediaPlaceholder";
import { PageHero } from "@/components/public/PageHero";
import { GalleryGridSkeleton } from "@/components/public/PublicSkeletons";
import { useApiQuery } from "@/hooks/use-api-query";
import { publicContentApi } from "@/lib/api-services";
import { fallbackGalleryList } from "@/lib/public-fallbacks";
import { formatDateId } from "@/lib/date";
import { pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/_public/galeri")({
  component: GalleryPage,
  pendingComponent: GalleryPendingPage,
  pendingMs: 300,
  pendingMinMs: 300,
  loader: async () => {
    try {
      return await publicContentApi.gallery({ limit: 24 });
    } catch {
      return fallbackGalleryList(24);
    }
  },
  head: () =>
    pageSeo({
      title: "Galeri Perusahaan - Indobraga",
      description:
        "Dokumentasi visual aktivitas produksi, fasilitas, dan event Indobraga dalam format galeri perusahaan.",
      path: "/galeri",
    }),
});

function GalleryPendingPage() {
  return (
    <>
      <PageHero
        kicker="Galeri Perusahaan"
        title="Dokumentasi Visual Indobraga"
        subtitle="Aktivitas produksi, fasilitas, hasil produk, dan momen perusahaan dalam satu feed visual."
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <GalleryGridSkeleton />
      </section>
    </>
  );
}

type GalleryItem = {
  id: number;
  type: "image" | "video";
  media_url?: string | null;
  thumbnail_url?: string | null;
  caption: string;
  published_at?: string | null;
};
const GALLERY_BATCH_SIZE = 8;

function GalleryPage() {
  const initialGallery = Route.useLoaderData();
  const [active, setActive] = useState<GalleryItem | null>(null);
  const [visibleCount, setVisibleCount] = useState(GALLERY_BATCH_SIZE);
  const loadGallery = useCallback(() => publicContentApi.gallery({ limit: 24 }), []);
  const { data, error, loading, reload, setData } = useApiQuery(
    ["public", "gallery"],
    loadGallery,
    {
      initialData: initialGallery,
      refetchOnMount: false,
    },
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const items = data?.items ?? [];
  const visibleItems = items.slice(0, visibleCount);
  const hasMoreItems = visibleCount < items.length || Boolean(data?.has_more);

  const loadMore = useCallback(async () => {
    if (visibleCount < items.length) {
      setVisibleCount((count) => Math.min(count + GALLERY_BATCH_SIZE, items.length));
      return;
    }
    if (!data?.next_cursor || loadingMore) {
      return;
    }
    setLoadingMore(true);
    try {
      const page = await publicContentApi.gallery({ limit: 24, cursor: data.next_cursor });
      setData((prev) =>
        prev
          ? {
              items: [...prev.items, ...page.items],
              next_cursor: page.next_cursor,
              has_more: page.has_more,
            }
          : page,
      );
      setVisibleCount((count) => count + GALLERY_BATCH_SIZE);
    } finally {
      setLoadingMore(false);
    }
  }, [data?.next_cursor, items.length, loadingMore, setData, visibleCount]);

  return (
    <>
      <PageHero
        kicker="Galeri Perusahaan"
        title="Dokumentasi Visual Indobraga"
        subtitle="Aktivitas produksi, fasilitas, hasil produk, dan momen perusahaan dalam satu feed visual."
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {error && <PublicErrorState error={error} onRetry={reload} />}
        {loading && !data ? (
          <GalleryGridSkeleton />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Belum ada konten galeri yang dipublikasikan.
          </div>
        ) : (
          <>
            <div className="grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {visibleItems.map((item, i) => {
                const previewSrc = item.thumbnail_url ?? item.media_url ?? null;

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setActive(item)}
                    className={`group relative min-w-0 overflow-hidden rounded-2xl bg-muted shadow-card transition hover:shadow-elegant ${
                      i % 7 === 0 ? "row-span-2 aspect-[3/4] sm:col-span-2" : "aspect-square"
                    }`}
                  >
                    <OptionalImage
                      src={previewSrc}
                      alt={item.caption}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      placeholderClassName="h-full w-full"
                    />
                    {item.type === "video" && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-primary-deep shadow-elegant">
                          <Play className="h-6 w-6 fill-current" />
                        </span>
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-3 text-left opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="line-clamp-2 text-xs font-medium text-white sm:text-sm">
                        {item.caption}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {hasMoreItems && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-primary shadow-card transition hover:border-primary/30 hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMore ? "Memuat..." : "Muat lagi"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setActive(null)}
        >
          <button
            onClick={() => setActive(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Tutup"
            title="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative max-h-[90vh] w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-card sm:max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {active.type === "video" ? (
              <div className="relative flex aspect-video items-center justify-center bg-black text-white">
                {(active.thumbnail_url ?? active.media_url) ? (
                  <img
                    src={active.thumbnail_url ?? active.media_url ?? ""}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                  />
                ) : (
                  <MediaPlaceholder
                    label="Pratinjau video belum tersedia"
                    className="absolute inset-0 bg-black text-white/75"
                  />
                )}
                <div className="relative flex flex-col items-center gap-2 text-center">
                  <Play className="h-12 w-12" />
                  <p className="text-sm text-white/80">Pratinjau video galeri</p>
                </div>
              </div>
            ) : (
              <OptionalImage
                src={active.media_url ?? active.thumbnail_url}
                alt={active.caption}
                className="max-h-[70vh] w-full object-contain"
                placeholderClassName="h-[50vh] w-full"
              />
            )}
            <div className="border-t border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {formatDateId(active.published_at ?? "", "long")}
              </p>
              <p className="mt-1 text-sm text-foreground">{active.caption}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
