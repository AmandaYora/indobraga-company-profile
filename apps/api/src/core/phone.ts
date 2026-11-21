/**
 * Phone / WhatsApp number helpers shared by DTO validation, the lead service and
 * the public site settings presenter.
 *
 * The recurring production bug (QA IB-01): a number stored in local format
 * ("085223000039") was dropped into `https://wa.me/...`. WhatsApp reads the
 * leading 0 as part of the country code, so chats opened to a Hong Kong number.
 * Everything that builds a wa.me link must go through `normalizeWhatsappNumber`.
 */

const MIN_DIGITS = 9;
const MAX_DIGITS = 15;
const DEFAULT_COUNTRY_CODE = "62";

/**
 * Normalises a phone number into the digits-only international form used by
 * wa.me (E.164 without "+"), assuming Indonesia (+62) for local numbers.
 *
 *   "0852-2300-0039"   -> "6285223000039"
 *   "+62 852 2300 0039" -> "6285223000039"
 *   "85223000039"       -> "6285223000039"
 *   "+65 8123 4567"     -> "6581234567"   (explicit foreign country code kept)
 *
 * Returns null when the input cannot be a real phone number.
 */
export function normalizePhoneNumber(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  if (!trimmed || !/^[0-9+()\-.\s]+$/.test(trimmed)) {
    return null;
  }

  const explicitInternational = trimmed.startsWith("+") || trimmed.startsWith("00");
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  if (trimmed.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (explicitInternational) {
    // "+62 (0) 852 ..." style: drop the redundant trunk zero after the country code.
    if (digits.startsWith(`${DEFAULT_COUNTRY_CODE}0`)) {
      digits = `${DEFAULT_COUNTRY_CODE}${digits.slice(DEFAULT_COUNTRY_CODE.length + 1)}`;
    }
  } else if (digits.startsWith("0")) {
    digits = `${DEFAULT_COUNTRY_CODE}${digits.slice(1)}`;
  } else if (digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    // already international
  } else if (digits.startsWith("8")) {
    digits = `${DEFAULT_COUNTRY_CODE}${digits}`;
  } else {
    return null;
  }

  if (digits.startsWith("0") || digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) {
    return null;
  }

  return digits;
}

/** Alias that reads better where the value is destined for a wa.me link. */
export const normalizeWhatsappNumber = normalizePhoneNumber;

export function isValidPhoneNumber(raw: unknown): boolean {
  return typeof raw === "string" && normalizePhoneNumber(raw) !== null;
}

/** Builds a wa.me URL, or null when the number is unusable. */
export function buildWhatsappUrl(rawNumber: string | null | undefined, text?: string): string | null {
  const number = normalizePhoneNumber(rawNumber);
  if (!number) {
    return null;
  }

  return text ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : `https://wa.me/${number}`;
}

/** Strips "@", profile URLs and whitespace down to a bare Instagram handle. */
export function normalizeInstagramHandle(raw: string | null | undefined): string {
  if (typeof raw !== "string") {
    return "";
  }

  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@+/, "")
    .replace(/[/?#].*$/, "")
    .trim();
}

export function isValidInstagramHandle(raw: unknown): boolean {
  return typeof raw === "string" && /^[A-Za-z0-9._]{1,30}$/.test(raw);
}
