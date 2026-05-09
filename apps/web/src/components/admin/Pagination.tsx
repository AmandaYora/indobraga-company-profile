import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Hook paginator murni client-side.
 * Reset otomatis ke halaman 1 ketika `total` mengecil di bawah halaman aktif
 * atau ketika `resetKey` berubah (misal ada filter / pencarian baru).
 */
export function usePagination<T>(
  items: readonly T[],
  initialPageSize = 10,
  resetKey: unknown = null,
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [pageCount, page]);

  const start = (page - 1) * pageSize;
  const end = Math.min(total, start + pageSize);
  const slice = useMemo(() => items.slice(start, end), [items, start, end]);

  return {
    page,
    pageSize,
    pageCount,
    total,
    start,
    end,
    slice,
    setPage,
    setPageSize,
  };
}

function range(from: number, to: number) {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

/** Bangun array nomor halaman dengan ellipsis. */
function buildPages(current: number, pageCount: number): (number | "...")[] {
  if (pageCount <= 7) return range(1, pageCount);
  const pages: (number | "...")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(pageCount - 1, current + 1);
  if (left > 2) pages.push("...");
  pages.push(...range(left, right));
  if (right < pageCount - 1) pages.push("...");
  pages.push(pageCount);
  return pages;
}

export function TablePagination({
  page,
  pageCount,
  pageSize,
  total,
  start,
  end,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemLabel = "item",
  className = "",
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  start: number;
  end: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}) {
  if (total === 0) return null;
  const pages = buildPages(page, pageCount);

  return (
    <div
      className={`flex min-w-0 flex-col gap-3 border-t border-border bg-card/40 p-3 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-4 ${className}`}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-muted-foreground">
        <span className="text-anywhere">
          Menampilkan{" "}
          <span className="font-semibold text-foreground">{total === 0 ? 0 : start + 1}</span>-
          <span className="font-semibold text-foreground">{end}</span> dari{" "}
          <span className="font-semibold text-foreground">{total}</span> {itemLabel}
        </span>
        <span className="hidden text-border sm:inline">/</span>
        <label className="flex items-center gap-1">
          Per halaman
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:border-primary"
          >
            {pageSizeOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav
        className="flex min-w-0 flex-wrap items-center gap-1 sm:flex-nowrap"
        aria-label="Pagination"
      >
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Halaman sebelumnya"
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2 font-semibold transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Sebelumnya
        </button>
        <span className="px-2 font-semibold text-muted-foreground sm:hidden">
          Halaman {page}/{pageCount}
        </span>
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`e${i}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-current={page === p ? "page" : undefined}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 font-semibold transition ${
                  page === p
                    ? "border-primary bg-primary text-primary-foreground shadow-card"
                    : "border-border bg-background hover:bg-secondary"
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <button
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          aria-label="Halaman berikutnya"
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2 font-semibold transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Berikutnya <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </nav>
    </div>
  );
}

/** Empty state untuk daftar admin (digunakan saat hasil filter kosong). */
export function EmptyState({
  title = "Tidak ada data",
  description = "Belum ada data yang cocok dengan filter saat ini.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 p-10 text-center">
      <p className="font-display text-base font-bold text-foreground">{title}</p>
      <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
