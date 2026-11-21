/**
 * Allow-list check for admin-provided link targets (hero button, CTA, website).
 *
 * Only these destinations are accepted (QA IB-03):
 *   - http:// and https:// absolute URLs
 *   - mailto: and tel: links
 *   - internal paths that start with a single "/" (e.g. "/kontak")
 *
 * Everything else — notably `javascript:`, `data:` and `vbscript:` — is rejected,
 * including variants obfuscated with whitespace/control characters.
 */

const MAX_LINK_LENGTH = 500;
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
/** True for whitespace, ASCII/C1 control characters and Unicode line separators. */
function hasControlOrSpace(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0x20 || (code >= 0x7f && code <= 0x9f) || code === 0x2028 || code === 0x2029) {
      return true;
    }
  }

  return false;
}

export function isSafeLinkUrl(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const link = value.trim();
  if (!link || link.length > MAX_LINK_LENGTH) {
    return false;
  }

  if (link.startsWith("/")) {
    // Reject protocol-relative ("//evil.com") and backslash tricks ("/\evil.com").
    return !link.startsWith("//") && !link.includes("\\") && !hasControlOrSpace(link);
  }

  // Control characters/whitespace inside an absolute link are a classic filter
  // bypass ("java\tscript:"); mailto/tel values never legitimately contain them.
  if (hasControlOrSpace(link)) {
    return false;
  }

  try {
    const url = new URL(link);
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
      return false;
    }

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.hostname.length > 0;
    }

    return link.length > url.protocol.length;
  } catch {
    return false;
  }
}

/** Returns the trimmed link when safe, otherwise null (use for output hardening). */
export function safeLinkOrNull(value: string | null | undefined): string | null {
  return isSafeLinkUrl(value) ? value.trim() : null;
}
