/**
 * Allow-list for link targets that come from admin-editable content.
 * Mirrors the API rule (QA IB-03): http(s), mailto:, tel: and internal "/paths".
 * Anything else - notably `javascript:` - is rejected, so it can never reach an
 * `href` even if a bad value was saved before server-side validation existed.
 */

const MAX_LINK_LENGTH = 500;
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function hasControlOrSpace(value: string): boolean {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0x20 || (code >= 0x7f && code <= 0x9f) || code === 0x2028 || code === 0x2029) {
      return true;
    }
  }

  return false;
}

export function isSafeHref(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const link = value.trim();
  if (!link || link.length > MAX_LINK_LENGTH || hasControlOrSpace(link)) {
    return false;
  }

  if (link.startsWith("/")) {
    return !link.startsWith("//") && !link.includes("\\");
  }

  try {
    const url = new URL(link);
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
      return false;
    }

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.hostname.length > 0
      : link.length > url.protocol.length;
  } catch {
    return false;
  }
}

/** The trimmed link when it is safe, otherwise `undefined` (render no link). */
export function safeHref(value: string | null | undefined): string | undefined {
  return isSafeHref(value) ? value.trim() : undefined;
}
