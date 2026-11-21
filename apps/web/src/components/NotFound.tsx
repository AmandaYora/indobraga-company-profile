import { Link } from "@tanstack/react-router";

/**
 * Single site-styled 404 used everywhere (QA IB-14): the root route, the public
 * layout and the router default all render this, so an unknown URL never falls back
 * to the framework's bare "Not Found" text. The HTTP status is 404 because the
 * router renders it through its not-found handling.
 */
export function NotFound({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center bg-background px-4 ${
        fullScreen ? "min-h-screen" : "min-h-[60vh] py-16"
      }`}
    >
      <div className="max-w-md text-center">
        <p className="text-7xl font-bold text-foreground">404</p>
        <h1 className="mt-4 text-xl font-semibold text-foreground">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kembali ke beranda
          </Link>
          <Link
            to="/portfolio"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Lihat portofolio
          </Link>
        </div>
      </div>
    </div>
  );
}
