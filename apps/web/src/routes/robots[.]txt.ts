import { createFileRoute } from "@tanstack/react-router";
import { robotsText, seoAssetHeaders } from "@/lib/seo-assets";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await robotsText(), {
          headers: seoAssetHeaders.robots,
        }),
    },
  },
});
