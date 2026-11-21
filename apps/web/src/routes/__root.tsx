import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { NotFound } from "@/components/NotFound";
import { Toaster } from "@/components/ui/sonner";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  organizationJsonLd,
  pageSeo,
  structuredDataScripts,
  websiteJsonLd,
} from "@/lib/seo";

export const Route = createRootRoute({
  head: () => {
    const defaultSeo = pageSeo({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      path: "/",
    });

    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "author", content: "PT. Braga Indonesia Perkasa" },
        ...defaultSeo.meta,
      ],
      links: [
        { rel: "icon", type: "image/png", href: "/favico.png" },
        { rel: "apple-touch-icon", href: "/favico.png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap",
        },
        {
          rel: "stylesheet",
          href: appCss,
        },
      ],
      scripts: structuredDataScripts([organizationJsonLd, websiteJsonLd]),
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => <NotFound fullScreen />,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
