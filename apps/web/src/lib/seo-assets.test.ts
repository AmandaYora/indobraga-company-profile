import { describe, expect, it } from "vitest";
import { fallbackRobotsText, fallbackSitemapXml, robotsText, sitemapXml } from "@/lib/seo-assets";

describe("seo assets", () => {
  it("builds production-safe fallback robots and sitemap assets", () => {
    expect(fallbackRobotsText()).toContain("Disallow: /admin");
    expect(fallbackRobotsText()).toContain("Disallow: /api/");
    expect(fallbackRobotsText()).toContain("Sitemap: https://indobraga.com/sitemap.xml");

    const sitemap = fallbackSitemapXml();

    expect(sitemap).toContain("<loc>https://indobraga.com/</loc>");
    expect(sitemap).toContain("<loc>https://indobraga.com/portfolio</loc>");
    expect(sitemap).toContain("<loc>https://indobraga.com/berita/atexco-model-x-plus</loc>");
  });

  it("prefers backend dynamic SEO assets when the API is reachable", async () => {
    const fetcher = async () =>
      new Response("dynamic sitemap", {
        status: 200,
      });

    await expect(sitemapXml(fetcher)).resolves.toBe("dynamic sitemap");
  });

  it("falls back when backend SEO asset fetch fails", async () => {
    const fetcher = async () => {
      throw new Error("api down");
    };

    await expect(robotsText(fetcher)).resolves.toContain("User-agent: *");
  });
});
