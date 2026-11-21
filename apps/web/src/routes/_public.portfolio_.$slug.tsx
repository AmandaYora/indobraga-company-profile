import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { NotFound } from "@/components/NotFound";
import { OptionalImage } from "@/components/public/MediaPlaceholder";
import { isApiClientError } from "@/lib/api";
import { publicContentApi } from "@/lib/api-services";
import type { PublicPortfolioDetail, PublicPortfolioImage } from "@/lib/api-models";
import { pageSeo } from "@/lib/seo";

/**
 * Portfolio detail page (QA IB-15). The admin "Alamat Halaman" (slug) and the
 * "Judul/Deskripsi Google" fields now have an effect: this page lives at
 * /portfolio/{slug} and uses those SEO values. `portfolio_` keeps it a sibling of
 * the /portfolio list route instead of nesting inside it.
 */
export const Route = createFileRoute("/_public/portfolio_/$slug")({
  component: PortfolioDetailPage,
  // Rendered inside the public layout (header/footer kept) with a real HTTP 404 (QA IB-14).
  notFoundComponent: () => <NotFound />,
  loader: async ({ params }) => {
    try {
      return await publicContentApi.portfolioDetail(params.slug);
    } catch (error) {
      // Unknown/unpublished slug: a real 404 (not a soft error page with HTTP 200).
      if (isApiClientError(error) && error.status === 404) {
        throw notFound();
      }
      throw error;
    }
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return pageSeo({
        title: "Portofolio tidak ditemukan - Indobraga",
        description: "Halaman portofolio Indobraga tidak ditemukan.",
        path: `/portfolio/${params.slug}`,
        noindex: true,
      });
    }

    return pageSeo({
      title: loaderData.seo.title ?? `${loaderData.title} - Portofolio Indobraga`,
      description:
        loaderData.seo.description ??
        loaderData.short_description ??
        `Portofolio produksi ${loaderData.title} dari Indobraga.`,
      path: `/portfolio/${loaderData.slug}`,
      image: loaderData.seo.og_image_url ?? loaderData.medium_url ?? undefined,
    });
  },
});

function imageSrc(image: PublicPortfolioImage): string | null {
  return image.large_url ?? image.medium_url ?? image.thumbnail_url ?? null;
}

function galleryImages(item: PublicPortfolioDetail): PublicPortfolioImage[] {
  const list = (item.images ?? []).filter((image) => Boolean(imageSrc(image)));
  if (list.length > 0) {
    return list;
  }

  return item.medium_url
    ? [
        {
          thumbnail_url: item.thumbnail_url,
          medium_url: item.medium_url,
          large_url: item.medium_url,
          alt_text: item.alt_text ?? item.title,
        },
      ]
    : [];
}

function PortfolioDetailPage() {
  const item = Route.useLoaderData();
  const images = useMemo(() => galleryImages(item), [item]);
  const [index, setIndex] = useState(0);
  const total = images.length;
  const active = images[index];
  const go = (direction: 1 | -1) =>
    setIndex((current) => (current + direction + total) % Math.max(total, 1));

  return (
    <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        to="/portfolio"
        className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Semua portofolio
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-neutral-950 shadow-card">
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
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Gambar berikutnya"
                  onClick={() => go(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-neutral-900 shadow-card transition hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
                <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
                  {index + 1} / {total}
                </div>
              </>
            )}
          </div>
          {total > 1 && (
            <ul className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
              {images.map((image, thumbIndex) => (
                <li key={thumbIndex}>
                  <button
                    type="button"
                    aria-label={`Lihat gambar ${thumbIndex + 1}`}
                    aria-current={thumbIndex === index}
                    onClick={() => setIndex(thumbIndex)}
                    className={`block aspect-square w-full overflow-hidden rounded-lg border-2 bg-muted transition ${
                      thumbIndex === index
                        ? "border-primary"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <OptionalImage
                      src={image.thumbnail_url ?? image.medium_url ?? image.large_url}
                      alt={image.alt_text ?? item.title}
                      className="h-full w-full object-cover"
                      placeholderClassName="h-full w-full"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {item.category}
          </span>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-primary-deep">
            {item.title}
          </h1>
          {item.short_description && (
            <p className="mt-4 text-base leading-relaxed text-foreground/80">
              {item.short_description}
            </p>
          )}
          <Link
            to="/kontak"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-accent px-5 py-3 text-sm font-bold text-accent-foreground shadow-card transition hover:-translate-y-0.5"
          >
            Konsultasi Produk Ini <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
