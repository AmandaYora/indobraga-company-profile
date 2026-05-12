import { describe, expect, it } from "vitest";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  articleJsonLd,
  pageSeo,
  structuredDataScripts,
  withSiteName,
} from "./seo";

describe("SEO helpers", () => {
  it("normalizes relative URLs and preserves absolute or data URLs", () => {
    expect(absoluteUrl("berita/test")).toBe("https://indobraga.com/berita/test");
    expect(absoluteUrl("/kontak")).toBe("https://indobraga.com/kontak");
    expect(absoluteUrl("https://cdn.example.test/image.webp")).toBe(
      "https://cdn.example.test/image.webp",
    );
    expect(absoluteUrl("data:image/png;base64,abc")).toBe("data:image/png;base64,abc");
  });

  it("adds the site name only once", () => {
    expect(withSiteName("Fasilitas")).toBe(`Fasilitas - ${SITE_NAME}`);
    expect(withSiteName(`Fasilitas - ${SITE_NAME}`)).toBe(`Fasilitas - ${SITE_NAME}`);
  });

  it("builds canonical metadata for indexable pages", () => {
    const seo = pageSeo({
      title: "Kontak",
      description: "Hubungi Indobraga",
      path: "/kontak",
      image: "/og.webp",
    });

    expect(seo.links).toEqual([{ rel: "canonical", href: "https://indobraga.com/kontak" }]);
    expect(seo.meta).toContainEqual({
      property: "og:image",
      content: "https://indobraga.com/og.webp",
    });
    expect(seo.meta).toContainEqual({
      name: "robots",
      content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    });
  });

  it("builds noindex metadata with default description", () => {
    const seo = pageSeo({ title: "Admin", path: "/admin", noindex: true });

    expect(seo.links).toEqual([]);
    expect(seo.meta).toContainEqual({ name: "description", content: DEFAULT_DESCRIPTION });
    expect(seo.meta).toContainEqual({ name: "robots", content: "noindex, nofollow" });
  });

  it("serializes JSON-LD script payloads", () => {
    expect(structuredDataScripts([{ name: "Indobraga" }])).toEqual([
      { type: "application/ld+json", children: '{"name":"Indobraga"}' },
    ]);
  });

  it("builds article JSON-LD with canonical article URL and image", () => {
    expect(
      articleJsonLd({
        title: "Berita QA",
        excerpt: "Ringkasan",
        slug: "berita-qa",
        date: "2026-05-11",
        thumb: "/thumb.webp",
        category: "Company",
      }),
    ).toMatchObject({
      "@type": "Article",
      headline: "Berita QA",
      image: "https://indobraga.com/thumb.webp",
      mainEntityOfPage: "https://indobraga.com/berita/berita-qa",
      inLanguage: "id-ID",
    });
  });
});
