import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useSiteSettings } from "./site-settings";

const nav = [
  { to: "/", label: "Beranda" },
  { to: "/portfolio", label: "Portofolio" },
  { to: "/fasilitas", label: "Fasilitas" },
  { to: "/galeri", label: "Galeri" },
  { to: "/berita", label: "Berita" },
  { to: "/kontak", label: "Kontak" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const settings = useSiteSettings();
  const showBrandText = !settings.logo_url || settings.show_brand_text !== false;
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <BrandLogo
            brand={settings.brand}
            logoUrl={settings.logo_url}
            showText={showBrandText}
            markClassName={showBrandText ? "h-9 w-9" : "h-9 w-auto max-w-[180px] sm:max-w-[220px]"}
            textClassName="font-display text-lg font-bold text-primary-deep"
          />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block">
          <Link
            to="/kontak"
            className="inline-flex items-center justify-center rounded-full bg-gradient-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-card transition-transform hover:scale-105"
          >
            Konsultasi Produksi
          </Link>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/kontak"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-gradient-accent px-4 py-2 text-center text-sm font-semibold text-accent-foreground"
            >
              Konsultasi Produksi
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
