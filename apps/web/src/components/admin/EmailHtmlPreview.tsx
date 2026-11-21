import { useMemo } from "react";

/**
 * Renders admin-authored email HTML for preview inside a fully sandboxed iframe
 * (QA IB-02). With an empty `sandbox` attribute the document gets a unique origin
 * and cannot run scripts, event handlers (`onerror=`), forms or navigations, so a
 * malicious or stored payload can never touch the admin session. A restrictive CSP
 * inside the document is a second layer: no scripts, no network except https images.
 *
 * Never replace this with `dangerouslySetInnerHTML`.
 */
const CSP =
  "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; font-src https: data:; base-uri 'none'; form-action 'none'";

const BASE_STYLE =
  "body{margin:0;padding:16px;font:14px/1.6 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111827;word-wrap:break-word}" +
  "img{max-width:100%;height:auto}table{max-width:100%}a{color:#1d4ed8}";

function buildEmailPreviewDocument(html: string): string {
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<meta http-equiv="Content-Security-Policy" content="${CSP}">` +
    `<base target="_blank"><style>${BASE_STYLE}</style></head><body>${html}</body></html>`
  );
}

export function EmailHtmlPreview({
  html,
  title = "Pratinjau isi email",
  className = "",
  height = 320,
}: {
  html: string;
  title?: string;
  className?: string;
  height?: number;
}) {
  const srcDoc = useMemo(
    () =>
      buildEmailPreviewDocument(html.trim() || "<p style='color:#9ca3af'>Belum ada isi HTML.</p>"),
    [html],
  );

  return (
    <iframe
      title={title}
      sandbox=""
      srcDoc={srcDoc}
      referrerPolicy="no-referrer"
      loading="lazy"
      style={{ height }}
      className={`block w-full rounded-lg border border-input bg-white ${className}`}
    />
  );
}
