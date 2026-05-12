import { createFileRoute } from "@tanstack/react-router";
import { seoAssetHeaders, sitemapXml } from "@/lib/seo-assets";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await sitemapXml(), {
          headers: seoAssetHeaders.sitemap,
        }),
    },
  },
});
