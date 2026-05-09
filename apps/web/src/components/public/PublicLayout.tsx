import { Outlet } from "@tanstack/react-router";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { WhatsAppFAB } from "./WhatsAppFAB";
import { SiteSettingsProvider } from "./SiteSettingsContext";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteSettingsProvider>
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
        <WhatsAppFAB />
      </SiteSettingsProvider>
    </div>
  );
}
