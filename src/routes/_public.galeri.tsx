import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Play, X } from "lucide-react";
import { PageHero } from "@/components/public/PageHero";
import { gallery } from "@/data/site";

export const Route = createFileRoute("/_public/galeri")({
  component: GalleryPage,
  head: () => ({
    meta: [
      { title: "Galeri Perusahaan - Indobraga" },
      {
        name: "description",
        content:
          "Dokumentasi visual aktivitas produksi, fasilitas, dan event Indobraga dalam format galeri perusahaan.",
      },
    ],
  }),
});

type GalleryItem = (typeof gallery)[number];

function GalleryPage() {
  const [active, setActive] = useState<GalleryItem | null>(null);

  return (
    <>
      <PageHero
        kicker="Galeri Perusahaan"
        title="Dokumentasi Visual Indobraga"
        subtitle="Aktivitas produksi, fasilitas, hasil produk, dan momen perusahaan dalam satu feed visual."
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {gallery.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Belum ada konten galeri yang dipublikasikan.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setActive(item)}
                className={`group relative overflow-hidden rounded-2xl bg-muted shadow-card transition hover:shadow-elegant ${
                  i % 7 === 0 ? "row-span-2 aspect-[3/4] sm:col-span-2" : "aspect-square"
                }`}
              >
                <img
                  src={item.media}
                  alt={item.caption}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
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
            ))}
          </div>
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
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            {active.type === "video" ? (
              <div className="relative flex aspect-video items-center justify-center bg-black text-white">
                <img
                  src={"poster" in active ? active.poster : active.media}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-60"
                />
                <div className="relative flex flex-col items-center gap-2 text-center">
                  <Play className="h-12 w-12" />
                  <p className="text-sm text-white/80">Pratinjau video galeri</p>
                </div>
              </div>
            ) : (
              <img
                src={active.media}
                alt={active.caption}
                className="max-h-[70vh] w-full object-contain"
              />
            )}
            <div className="border-t border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {new Date(active.date).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="mt-1 text-sm text-foreground">{active.caption}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}