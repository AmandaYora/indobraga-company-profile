import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, className, to }: { children: ReactNode; className?: string; to: string }) => (
    <a className={className} href={to}>
      {children}
    </a>
  ),
  Outlet: () => <div>Public outlet</div>,
}));

vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: () => ({
    data: {
      address: "Bandung",
      brand: "Braga Shell",
      contact_person: "Mahardika",
      contact_role: "Marketing",
      email: "support@example.com",
      instagram: "indobraga",
      legal_name: "PT Braga Shell",
      phone: "0812",
      seo: {},
      show_brand_text: false,
      whatsapp: "62812",
    },
  }),
}));

import { PublicLayout } from "@/components/public/PublicLayout";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import { SiteSettingsContext, fallbackSettings } from "@/components/public/site-settings";

describe("public shell components", () => {
  it("renders header, footer, layout, and WhatsApp entry point with site settings", () => {
    const header = renderToStaticMarkup(
      <SiteSettingsContext.Provider value={{ ...fallbackSettings, brand: "Braga Header" }}>
        <SiteHeader />
      </SiteSettingsContext.Provider>,
    );
    expect(header).toContain("Braga Header");
    expect(header).toContain("Portofolio");
    expect(header).toContain("Konsultasi Produksi");

    const logoOnlyHeader = renderToStaticMarkup(
      <SiteSettingsContext.Provider
        value={{
          ...fallbackSettings,
          brand: "Logo Only Brand",
          logo_url: "/logo.svg",
          show_brand_text: false,
        }}
      >
        <SiteHeader />
      </SiteSettingsContext.Provider>,
    );
    expect(logoOnlyHeader).toContain('alt="Logo Only Brand"');
    expect(logoOnlyHeader).not.toContain(">Logo Only Brand</span>");

    const footer = renderToStaticMarkup(
      <SiteSettingsContext.Provider
        value={{
          ...fallbackSettings,
          brand: "Braga Footer",
          email: "footer@example.com",
          legal_name: "PT Footer",
        }}
      >
        <SiteFooter />
      </SiteSettingsContext.Provider>,
    );
    expect(footer).toContain("Braga Footer");
    expect(footer).toContain("footer@example.com");
    expect(footer).toContain("PT Footer");

    const layout = renderToStaticMarkup(<PublicLayout />);
    expect(layout).toContain("Braga Shell");
    expect(layout).toContain("Public outlet");
    expect(layout).toContain("Hubungi via WhatsApp");
  });
});
