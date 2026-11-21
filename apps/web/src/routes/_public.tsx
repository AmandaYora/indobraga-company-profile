import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/public/PublicLayout";
import { fallbackSettings } from "@/components/public/site-settings";
import { publicContentApi } from "@/lib/api-services";

// Settings are loaded on the server so the very first HTML (and crawlers) already carry
// the real phone/WhatsApp/email instead of the built-in fallback values.
export const Route = createFileRoute("/_public")({
  loader: async () => {
    try {
      return await publicContentApi.siteSettings();
    } catch {
      return fallbackSettings;
    }
  },
  component: PublicShell,
});

function PublicShell() {
  return <PublicLayout initialSettings={Route.useLoaderData()} />;
}
