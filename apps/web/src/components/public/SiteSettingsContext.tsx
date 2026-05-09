import { useCallback, type ReactNode } from "react";
import { publicContentApi } from "@/lib/api-services";
import { useApiQuery } from "@/hooks/use-api-query";
import { fallbackSettings, SiteSettingsContext } from "./site-settings";

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const loadSettings = useCallback(() => publicContentApi.siteSettings(), []);
  const settings = useApiQuery(["public", "site-settings"], loadSettings, {
    initialData: fallbackSettings,
  });

  return (
    <SiteSettingsContext.Provider value={settings.data ?? fallbackSettings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
