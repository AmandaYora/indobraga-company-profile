/**
 * Helpers for contacting a lead (Pesan Kontak / Prospek WhatsApp) directly from
 * the admin dashboard. WhatsApp links target the lead's own phone number so the
 * admin can reach out to the prospect (not the company's public number).
 */

/**
 * Normalize an Indonesian phone number into the digits-only international form
 * expected by wa.me (e.g. "0812-3456-7890" / "+62 812 3456 7890" -> "62812...").
 * Returns null when the input has no usable phone number.
 */
export function normalizePhoneId(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }

  let digits = raw.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  if (digits.startsWith("62")) {
    // already international
  } else if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith("8")) {
    digits = `62${digits}`;
  }

  if (digits.length < 9 || digits.length > 15) {
    return null;
  }

  return digits;
}

/**
 * Strict validator for phone numbers typed by visitors on public forms. It mirrors
 * the API rule (QA IB-05) so the browser rejects the same inputs the server would,
 * and shows the error next to the field instead of failing after the fact.
 *
 * Accepts local ("0812...", "812..."), Indonesian international ("62812...",
 * "+62 812...") and explicit foreign ("+65 ...") numbers of 9-15 digits.
 */
export function isValidPhoneInput(raw: string | null | undefined): boolean {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed || !/^[0-9+()\-.\s]+$/.test(trimmed)) {
    return false;
  }

  const explicitInternational = trimmed.startsWith("+") || trimmed.startsWith("00");
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (explicitInternational) {
    if (digits.startsWith("620")) {
      digits = `62${digits.slice(3)}`;
    }
  } else if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  } else if (!digits.startsWith("62") && !digits.startsWith("8")) {
    return false;
  } else if (digits.startsWith("8")) {
    digits = `62${digits}`;
  }

  return !digits.startsWith("0") && digits.length >= 9 && digits.length <= 15;
}

export const PHONE_FORMAT_HINT = "Gunakan format seperti 0812xxxxxxxx atau +62812xxxxxxxx.";

/**
 * Build a wa.me chat URL for the given phone number, optionally pre-filling a
 * message (the admin can still edit it in WhatsApp before sending).
 * Returns null when the phone number is not valid.
 */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  message?: string,
): string | null {
  const number = normalizePhoneId(phone);
  if (!number) {
    return null;
  }

  const base = `https://wa.me/${number}`;
  const text = message?.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Default greeting prefilled when contacting a lead via WhatsApp. */
export function buildWhatsAppGreeting(name?: string | null): string {
  const safeName = name?.trim() || "Kak";
  return (
    `Halo ${safeName}, terima kasih telah menghubungi Indobraga. ` +
    `Perkenalkan, saya dari tim Indobraga. Ada yang bisa kami bantu terkait kebutuhan produksi Anda?`
  );
}

/**
 * Open a WhatsApp chat to the lead's number in a new tab with a default greeting.
 * Returns false when the lead has no valid phone number so the caller can warn.
 */
export function openWhatsAppLead(lead: { phone: string; name?: string | null }): boolean {
  const url = buildWhatsAppUrl(lead.phone, buildWhatsAppGreeting(lead.name));
  if (!url) {
    return false;
  }

  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
