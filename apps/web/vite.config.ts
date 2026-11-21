// @lovable.dev/vite-tanstack-config already includes these. Do not add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config/dist/index.js";
import { nitro } from "nitro/vite";

// Security headers (QA IB-07) are only attached to production builds: the dev server talks
// to the API on another origin (localhost:3001), which a strict CSP would block.
const isProductionBuild = process.argv.includes("build") || process.env.NODE_ENV === "production";

// 'unsafe-inline' for scripts/styles is required today: TanStack Start inlines its
// hydration bootstrap and the UI uses inline style attributes. Everything else is
// locked down (no framing, no plugins, same-origin API/forms, https-only media).
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = {
  "content-security-policy": contentSecurityPolicy,
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "cross-origin-opener-policy": "same-origin",
  "strict-transport-security": "max-age=31536000",
};

export default defineConfig({
  cloudflare: false,
  plugins: [
    nitro(isProductionBuild ? { routeRules: { "/**": { headers: securityHeaders } } } : undefined),
  ],
});
