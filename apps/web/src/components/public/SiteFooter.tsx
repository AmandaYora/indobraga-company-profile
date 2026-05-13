import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone, UserRound } from "lucide-react";
import logo from "@/assets/logo-indobraga.png";
import { useSiteSettings } from "./site-settings";

export function SiteFooter() {
  const settings = useSiteSettings();
  return (
    <footer className="bg-primary-deep text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Indobraga" className="h-10 w-auto" />
              <span className="font-display text-xl font-bold">{settings.brand}</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/70">
              {settings.legal_name} - mitra apparel manufacturing, garment production, cetak kain
              custom, dan multiproduct facility asal Indonesia.
            </p>
          </div>
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">
              Jelajahi
            </h2>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>
                <Link to="/portfolio" className="hover:text-accent">
                  Portofolio Produk
                </Link>
              </li>
              <li>
                <Link to="/fasilitas" className="hover:text-accent">
                  Mesin & Fasilitas
                </Link>
              </li>
              <li>
                <Link to="/berita" search={{ page: 1 }} className="hover:text-accent">
                  Berita Perusahaan
                </Link>
              </li>
              <li>
                <Link to="/kontak" className="hover:text-accent">
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">
              Kontak
            </h2>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-accent" />
                {settings.email}
              </li>
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 text-accent" />
                {settings.phone}
              </li>
              <li className="flex gap-2">
                <Instagram className="mt-0.5 h-4 w-4 text-accent" />@{settings.instagram}
              </li>
              <li className="flex gap-2">
                <UserRound className="mt-0.5 h-4 w-4 text-accent" />
                {settings.contact_person}, {settings.contact_role}
              </li>
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-accent" />
                {settings.address}
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-primary-foreground/50">
          Copyright {new Date().getFullYear()} {settings.legal_name}. Hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}
