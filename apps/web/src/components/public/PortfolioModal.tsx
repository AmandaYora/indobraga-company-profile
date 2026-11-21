import { useEffect, useMemo, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { OptionalImage } from "@/components/public/MediaPlaceholder";
import { cn } from "@/lib/utils";
import type { PublicPortfolioImage, PublicPortfolioItem } from "@/lib/api-models";

const SWIPE_THRESHOLD = 40;

function imageSrc(image: PublicPortfolioImage): string | null {
  return image.large_url ?? image.medium_url ?? image.thumbnail_url ?? null;
}

export function PortfolioModal({
  item,
  onClose,
}: {
  item: PublicPortfolioItem | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const images = useMemo<PublicPortfolioImage[]>(() => {
    if (!item) {
      return [];
    }
    const list = (item.images ?? []).filter((image) => Boolean(imageSrc(image)));
    if (list.length > 0) {
      return list;
    }
    if (item.medium_url ?? item.thumbnail_url) {
      return [
        {
          thumbnail_url: item.thumbnail_url,
          medium_url: item.medium_url,
          large_url: item.medium_url,
          alt_text: item.alt_text ?? item.title,
        },
      ];
    }
    return [];
  }, [item]);

  const total = images.length;
  const itemId = item?.id;

  useEffect(() => {
    setIndex(0);
  }, [itemId]);

  useEffect(() => {
    if (!item || total <= 1) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        setIndex((current) => (current - 1 + total) % total);
      } else if (event.key === "ArrowRight") {
        setIndex((current) => (current + 1) % total);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, total]);

  const go = (direction: 1 | -1) => {
    if (total <= 1) {
      return;
    }
    setIndex((current) => (current + direction + total) % total);
  };

  const active = images[index];

  return (
    <DialogPrimitive.Root
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[calc(100vw-2rem)] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl border bg-card shadow-elegant duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-3xl",
          )}
        >
          {item && (
            <>
              <div
                className="relative aspect-[4/3] bg-neutral-950 sm:aspect-[16/10]"
                onTouchStart={(event) => {
                  touchStartX.current = event.touches[0]?.clientX ?? null;
                }}
                onTouchEnd={(event) => {
                  if (touchStartX.current === null) {
                    return;
                  }
                  const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
                  if (Math.abs(delta) > SWIPE_THRESHOLD) {
                    go(delta < 0 ? 1 : -1);
                  }
                  touchStartX.current = null;
                }}
              >
                <OptionalImage
                  key={index}
                  src={active ? imageSrc(active) : null}
                  alt={active?.alt_text ?? item.title}
                  loading="eager"
                  className="h-full w-full object-contain"
                  placeholderClassName="h-full w-full"
                />

                {total > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Gambar sebelumnya"
                      onClick={() => go(-1)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-neutral-900 shadow-card transition hover:bg-white"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Gambar berikutnya"
                      onClick={() => go(1)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-neutral-900 shadow-card transition hover:bg-white"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
                      {index + 1} / {total}
                    </div>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {images.map((image, dotIndex) => (
                        <button
                          key={dotIndex}
                          type="button"
                          aria-label={`Ke gambar ${dotIndex + 1}`}
                          aria-current={dotIndex === index}
                          onClick={() => setIndex(dotIndex)}
                          className={cn(
                            "h-2 w-2 rounded-full transition",
                            dotIndex === index ? "bg-white" : "bg-white/50 hover:bg-white/80",
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="p-5 sm:p-6">
                <DialogPrimitive.Title asChild>
                  <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                    {item.title}
                  </h2>
                </DialogPrimitive.Title>
                <DialogPrimitive.Description asChild>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-primary">
                    {item.category}
                  </p>
                </DialogPrimitive.Description>
                {item.short_description && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.short_description}
                  </p>
                )}
                {item.slug && (
                  // Plain anchor: the detail page is server-rendered, so a full navigation is
                  // fine and the modal stays usable without a router context.
                  <a
                    href={`/portfolio/${encodeURIComponent(item.slug)}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                  >
                    Buka halaman detail <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            </>
          )}

          <DialogPrimitive.Close
            aria-label="Tutup"
            className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white transition hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/70"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
