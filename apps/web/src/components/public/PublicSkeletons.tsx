import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SkeletonGridProps = {
  className?: string;
  count?: number;
};

function skeletonKeys(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => `${prefix}-${index}`);
}

function LoadingStatus({ label }: { label: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      {label}
    </span>
  );
}

function SectionHeadingSkeleton({ align = "left" }: { align?: "left" | "center" }) {
  return (
    <div
      className={cn(
        "space-y-3",
        align === "center" && "mx-auto flex max-w-2xl flex-col items-center",
      )}
    >
      <Skeleton className="h-3 w-28 rounded-full" />
      <Skeleton className="h-8 w-full max-w-xl" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  );
}

function PortfolioCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </article>
  );
}

function NewsCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-card">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </article>
  );
}

export function PortfolioGridSkeleton({ className, count = 8 }: SkeletonGridProps) {
  return (
    <div>
      <LoadingStatus label="Memuat portofolio." />
      <div
        aria-hidden="true"
        className={cn("mt-10 grid min-w-0 gap-6 sm:grid-cols-2 lg:grid-cols-4", className)}
      >
        {skeletonKeys("portfolio", count).map((key) => (
          <PortfolioCardSkeleton key={key} />
        ))}
      </div>
    </div>
  );
}

export function NewsGridSkeleton({ className, count = 6 }: SkeletonGridProps) {
  return (
    <div>
      <LoadingStatus label="Memuat berita." />
      <div aria-hidden="true" className={cn("grid gap-8 md:grid-cols-2 lg:grid-cols-3", className)}>
        {skeletonKeys("news", count).map((key) => (
          <NewsCardSkeleton key={key} />
        ))}
      </div>
    </div>
  );
}

export function GalleryGridSkeleton({ className, count = 8 }: SkeletonGridProps) {
  return (
    <div>
      <LoadingStatus label="Memuat galeri." />
      <div
        aria-hidden="true"
        className={cn(
          "grid min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
          className,
        )}
      >
        {skeletonKeys("gallery", count).map((key, index) => (
          <Skeleton
            key={key}
            className={cn(
              "w-full rounded-2xl shadow-card",
              index % 7 === 0 ? "row-span-2 aspect-[3/4] sm:col-span-2" : "aspect-square",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <LoadingStatus label="Memuat detail berita." />
      <div aria-hidden="true" className="space-y-6">
        <Skeleton className="h-5 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-4/5" />
        </div>
        <Skeleton className="aspect-[16/9] w-full rounded-2xl shadow-card" />
        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-11/12" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      </div>
    </article>
  );
}

export function FacilitiesContentSkeleton() {
  return (
    <div>
      <LoadingStatus label="Memuat fasilitas." />
      <div aria-hidden="true">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {skeletonKeys("strength", 4).map((key) => (
            <div key={key} className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="mt-3 h-3 w-20" />
              <Skeleton className="mt-5 h-4 w-4/5" />
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <SectionHeadingSkeleton />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {skeletonKeys("production", 4).map((key) => (
                <div key={key} className="rounded-2xl bg-secondary p-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-3 h-8 w-28" />
                  <Skeleton className="mt-2 h-3 w-20" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-hero p-6 shadow-elegant">
            <Skeleton className="h-3 w-36 bg-white/20" />
            <Skeleton className="mt-3 h-8 w-48 bg-white/20" />
            <Skeleton className="mt-4 h-4 w-full bg-white/20" />
            <Skeleton className="mt-2 h-4 w-4/5 bg-white/20" />
            <div className="mt-6 grid gap-3">
              {skeletonKeys("printing", 3).map((key) => (
                <div key={key} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                  <Skeleton className="h-16 w-16 shrink-0 rounded-xl bg-white/20" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3 w-28 bg-white/20" />
                    <Skeleton className="h-3 w-full bg-white/20" />
                    <Skeleton className="h-3 w-20 bg-white/20" />
                  </div>
                  <Skeleton className="h-7 w-14 bg-white/20" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {skeletonKeys("machine", 4).map((key) => (
            <article
              key={key}
              className="grid min-w-0 gap-5 overflow-hidden rounded-2xl bg-card shadow-card sm:grid-cols-[200px_1fr]"
            >
              <Skeleton className="h-full min-h-48 w-full rounded-none" />
              <div className="space-y-3 p-5 sm:pl-0">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-border bg-card p-6 shadow-card">
          <Skeleton className="h-3 w-48" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {skeletonKeys("service", 6).map((key) => (
              <Skeleton key={key} className="h-12 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeDynamicSectionsSkeleton() {
  return (
    <>
      <section className="border-y border-border bg-background py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <LoadingStatus label="Memuat partner." />
          <div aria-hidden="true">
            <SectionHeadingSkeleton align="center" />
            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {skeletonKeys("partner", 12).map((key) => (
                <Skeleton key={key} className="h-16 rounded-2xl sm:h-20" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeadingSkeleton align="center" />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {skeletonKeys("home-strength", 4).map((key) => (
              <div key={key} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="mt-3 h-3 w-20" />
                <Skeleton className="mt-6 h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-soft py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeadingSkeleton />
          <PortfolioGridSkeleton className="sm:grid-cols-2 lg:grid-cols-3" count={6} />
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FacilitiesSummarySkeleton />
        </div>
      </section>

      <section className="bg-gradient-soft py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeadingSkeleton />
          <NewsGridSkeleton className="mt-10" count={3} />
        </div>
      </section>
    </>
  );
}

function FacilitiesSummarySkeleton() {
  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
      <div>
        <SectionHeadingSkeleton />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {skeletonKeys("home-facility-copy", 4).map((key) => (
            <Skeleton key={key} className="h-16 rounded-xl" />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {skeletonKeys("home-service-chip", 5).map((key) => (
            <Skeleton key={key} className="h-7 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {skeletonKeys("home-printing", 3).map((key, index) => (
          <div
            key={key}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
          >
            <Skeleton
              className={cn("w-full rounded-none", index === 2 ? "aspect-square" : "aspect-[4/3]")}
            />
            <div className="space-y-3 p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
