import { useCallback, type ReactNode } from "react";
import type { PublicSiteSettings } from "@/lib/api-models";
import { publicContentApi } from "@/lib/api-services";
import { useApiQuery } from "@/hooks/use-api-query";
import { fallbackSettings, SiteSettingsContext } from "./site-settings";

export function SiteSettingsProvider({
  children,
  initialSettings = fallbackSettings,
}: {
  children: ReactNode;
  /** Settings fetched on the server so the first HTML already has the real contact details. */
  initialSettings?: PublicSiteSettings;
}) {
  const loadSettings = useCallback(() => publicContentApi.siteSettings(), []);
  const settings = useApiQuery(["public", "site-settings"], loadSettings, {
    initialData: initialSettings,
  });

  return (
    <SiteSettingsContext.Provider value={settings.data ?? fallbackSettings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
