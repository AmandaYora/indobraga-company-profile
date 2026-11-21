/**
 * Builders for clickable contact links (email, phone, WhatsApp, Instagram, map).
 * They only ever return `https:`, `mailto:` or `tel:` URLs and never throw, so they
 * are safe to use directly with admin-editable site settings (QA IB-16).
 */

export function mailtoHref(email: string | null | undefined): string | undefined {
  const value = email?.trim();
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? `mailto:${value}` : undefined;
}

export function telHref(phone: string | null | undefined): string | undefined {
  const digits = phone?.replace(/[^\d+]/g, "");
  return digits && digits.replace(/\D/g, "").length >= 6 ? `tel:${digits}` : undefined;
}

/** wa.me link for the company number. Expects the international digits ("62852..."). */
export function whatsappHref(number: string | null | undefined): string | undefined {
  const digits = number?.replace(/\D/g, "");
  return digits && digits.length >= 9 && !digits.startsWith("0")
    ? `https://wa.me/${digits}`
    : undefined;
}

/** Accepts "@indobraga", "indobraga" or a pasted profile URL. */
export function instagramHandle(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@+/, "")
    .replace(/[/?#].*$/, "");
}

export function instagramHref(value: string | null | undefined): string | undefined {
  const handle = instagramHandle(value);
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? `https://instagram.com/${handle}` : undefined;
}

export function mapsHref(address: string | null | undefined): string | undefined {
  const value = address?.trim();
  return value
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`
    : undefined;
}
