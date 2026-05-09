import heroGarmentImage from "@/assets/hero-garment-slide.jpg";
import logoImage from "@/assets/logo-indobraga.png";

export const SITE_URL = "https://indobraga.com";
export const SITE_NAME = "Indobraga";
export const COMPANY_NAME = "PT. Braga Indonesia Perkasa";
export const DEFAULT_TITLE = "Indobraga - Solusi Produksi Garment Profesional";
export const DEFAULT_DESCRIPTION =
  "Dipercaya oleh lebih dari 250+ bisnis. Indobraga melayani produksi jersey, polo, jaket, wearpack, seragam, bag merchandise, dan cetak kain custom.";

type PageSeoOptions = {
  title: string;
  description?: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
};

type ArticleSeoInput = {
  title: string;
  excerpt: string;
  slug: string;
  date: string;
  thumb: string;
  category: string;
};

export function absoluteUrl(pathOrUrl = "/") {
  if (/^(https?:|data:)/.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const normalizedPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${normalizedPath}`;
}

export function withSiteName(title: string) {
  return title.includes(SITE_NAME) ? title : `${title} - ${SITE_NAME}`;
}

export function pageSeo({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = heroGarmentImage,
  type = "website",
  noindex = false,
}: PageSeoOptions) {
  const pageTitle = withSiteName(title);
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    meta: [
      { title: pageTitle },
      { name: "description", content: description },
      {
        name: "robots",
        content: noindex
          ? "noindex, nofollow"
          : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { property: "og:image", content: imageUrl },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: pageTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: imageUrl },
    ],
    links: noindex ? [] : [{ rel: "canonical", href: url }],
  };
}

export function structuredDataScripts(items: Array<Record<string, unknown>>) {
  return items.map((item) => ({
    type: "application/ld+json",
    children: JSON.stringify(item),
  }));
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: COMPANY_NAME,
  alternateName: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl(logoImage),
  description: DEFAULT_DESCRIPTION,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    email: "indobraga@gmail.com",
    telephone: "+62-851-5870-0895",
    areaServed: "ID",
    availableLanguage: ["id"],
  },
  sameAs: ["https://www.instagram.com/indobraga"],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  publisher: {
    "@type": "Organization",
    name: COMPANY_NAME,
  },
  inLanguage: "id-ID",
};

export function articleJsonLd(article: ArticleSeoInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: absoluteUrl(article.thumb),
    datePublished: article.date,
    dateModified: article.date,
    articleSection: article.category,
    mainEntityOfPage: absoluteUrl(`/berita/${article.slug}`),
    author: {
      "@type": "Organization",
      name: COMPANY_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: COMPANY_NAME,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(logoImage),
      },
    },
    inLanguage: "id-ID",
  };
}
