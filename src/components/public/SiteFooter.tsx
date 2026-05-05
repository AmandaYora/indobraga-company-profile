import { Link } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";
import { COMPANY } from "@/data/site";
import logo from "@/assets/logo-indobraga.png";

export function SiteFooter() {
  return (
    <footer className="bg-primary-deep text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Indobraga" className="h-10 w-10 rounded-md bg-white p-1" />
              <span className="font-display text-xl font-bold">Indobraga</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/70">
              {COMPANY.legal} — Mitra produksi garment terpercaya untuk bisnis, korporasi,
              komunitas, dan brand fashion di seluruh Indonesia.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">Jelajahi</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/portfolio" className="hover:text-accent">Portfolio Produk</Link></li>
              <li><Link to="/fasilitas" className="hover:text-accent">Mesin & Fasilitas</Link></li>
              <li><Link to="/berita" className="hover:text-accent">Berita Perusahaan</Link></li>
              <li><Link to="/kontak" className="hover:text-accent">Hubungi Kami</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-accent">Kontak</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex gap-2"><Mail className="h-4 w-4 mt-0.5 text-accent" />{COMPANY.email}</li>
              <li className="flex gap-2"><Phone className="h-4 w-4 mt-0.5 text-accent" />{COMPANY.phone}</li>
              <li className="flex gap-2"><MapPin className="h-4 w-4 mt-0.5 text-accent" />{COMPANY.address}</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} {COMPANY.legal}. Hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}