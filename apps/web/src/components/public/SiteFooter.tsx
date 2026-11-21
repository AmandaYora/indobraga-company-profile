import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, MessageCircle, Phone, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import {
  instagramHandle,
  instagramHref,
  mailtoHref,
  mapsHref,
  telHref,
  whatsappHref,
} from "@/lib/contact-links";
import { useSiteSettings } from "./site-settings";

export function SiteFooter() {
  const settings = useSiteSettings();
  const footerLogoUrl = settings.footer_logo_url ?? settings.logo_url;
  const showBrandText = !footerLogoUrl || settings.show_brand_text !== false;
  return (
    <footer className="bg-primary-deep text-primary-foreground">
      {/* Bottom padding keeps the last lines clear of the floating WhatsApp button (QA IB-16). */}
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-16 sm:px-6 sm:pb-24 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <BrandLogo
                brand={settings.brand}
                logoUrl={footerLogoUrl}
                showText={showBrandText}
                markClassName={
                  showBrandText
                    ? "h-10 w-10 bg-white text-primary-deep"
                    : "h-10 w-auto max-w-[220px]"
                }
                textClassName="font-display text-xl font-bold"
              />
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
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <ContactLink href={mailtoHref(settings.email)}>{settings.email}</ContactLink>
              </li>
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <ContactLink href={telHref(settings.phone)}>{settings.phone}</ContactLink>
              </li>
              <li className="flex gap-2">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <ContactLink href={whatsappHref(settings.whatsapp)} external>
                  WhatsApp +{settings.whatsapp}
                </ContactLink>
              </li>
              <li className="flex gap-2">
                <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <ContactLink href={instagramHref(settings.instagram)} external>
                  @{instagramHandle(settings.instagram)}
                </ContactLink>
              </li>
              <li className="flex gap-2">
                <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                {settings.contact_person}, {settings.contact_role}
              </li>
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <ContactLink href={mapsHref(settings.address)} external>
                  {settings.address}
                </ContactLink>
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

function ContactLink({
  href,
  external,
  children,
}: {
  href?: string;
  external?: boolean;
  children: ReactNode;
}) {
  if (!href) {
    return <span>{children}</span>;
  }

  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="text-anywhere underline-offset-2 transition-colors hover:text-accent hover:underline"
    >
      {children}
    </a>
  );
}
