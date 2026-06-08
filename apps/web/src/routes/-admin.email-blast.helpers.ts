import { formatDateId } from "@/lib/date";

export type EmailTab = "single" | "bulk";

export type ContentMode = "text" | "html";

export type EmailContentForm = {
  email_account_id: string;
  subject: string;
  content_mode: ContentMode;
  body_text: string;
  body_html: string;
};

export type BodyForm = {
  subject: string;
  content_mode: ContentMode;
  body_text: string;
  body_html: string;
};

export type SingleForm = EmailContentForm & {
  to_email: string;
  to_name: string;
};

export type BulkForm = EmailContentForm & {
  title: string;
};

export type RecipientVariables = Record<string, string>;

export type RecipientImportRow = {
  email: string;
  name?: string;
  variables: RecipientVariables;
};

export type RecipientInvalidRow = {
  row: number;
  email?: string;
  reason: string;
};

export type RecipientImportState = {
  fileName: string;
  rowsRead: number;
  validRecipients: RecipientImportRow[];
  duplicateCount: number;
  invalidRows: RecipientInvalidRow[];
  variableKeys: string[];
  error?: string;
};

export type ValidationError = { title: string; description?: string };

export const EMPTY_IMPORT: RecipientImportState = {
  fileName: "",
  rowsRead: 0,
  validRecipients: [],
  duplicateCount: 0,
  invalidRows: [],
  variableKeys: [],
};

export const RECIPIENT_LIMIT = 1000;

/** Required and example columns for the downloadable recipient template. */
export const RECIPIENT_TEMPLATE_HEADERS = ["nama", "email", "perusahaan"] as const;
export const RECIPIENT_TEMPLATE_SAMPLE: string[][] = [
  ["Budi Santoso", "budi@example.com", "PT Contoh Sejahtera"],
  ["Siti Rahma", "siti@example.com", "CV Maju Bersama"],
];

export function validateBody(form: BodyForm): ValidationError | null {
  if (!form.subject.trim()) {
    return { title: "Subjek email wajib diisi" };
  }
  if (form.content_mode === "html") {
    if (!form.body_html.trim()) {
      return { title: "Isi email (HTML) wajib diisi" };
    }
  } else if (!form.body_text.trim()) {
    return { title: "Isi email wajib diisi" };
  }

  return null;
}

export function validateEmailContent(form: EmailContentForm): ValidationError | null {
  if (!form.email_account_id) {
    return { title: "Pilih akun pengirim terlebih dahulu" };
  }

  return validateBody(form);
}

/** Build the email body payload from the authored content based on the chosen mode. */
export function resolveBodyPayload(form: {
  content_mode: ContentMode;
  body_text: string;
  body_html: string;
}): { body_text: string; body_html: string } {
  if (form.content_mode === "html") {
    const html = form.body_html.trim();
    return { body_text: htmlToText(html), body_html: html };
  }

  const text = form.body_text.trim();
  return { body_text: text, body_html: textToHtml(text) };
}

/** Best-effort plaintext extraction from HTML for the email text part. */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

export function validateSingle(form: SingleForm): ValidationError | null {
  const email = form.to_email.trim().toLowerCase();
  if (!email) {
    return { title: "Email tujuan wajib diisi" };
  }
  if (!isValidEmail(email)) {
    return { title: "Format email tujuan tidak valid" };
  }

  return validateEmailContent(form);
}

export function validateBulk(
  form: BulkForm,
  importState: RecipientImportState,
): ValidationError | null {
  if (!form.title.trim()) {
    return { title: "Nama pengiriman wajib diisi" };
  }

  const content = validateEmailContent(form);
  if (content) {
    return content;
  }

  if (!importState.fileName) {
    return { title: "Unggah daftar penerima terlebih dahulu" };
  }
  if (importState.error) {
    return { title: "File daftar penerima belum valid", description: importState.error };
  }
  if (importState.validRecipients.length <= 0) {
    return {
      title: "Daftar penerima tidak memiliki email valid",
      description: "Periksa kolom nama dan email pada file Excel.",
    };
  }
  if (importState.validRecipients.length > RECIPIENT_LIMIT) {
    return {
      title: "Penerima terlalu banyak",
      description: `Batas pengiriman adalah ${RECIPIENT_LIMIT} email. Kurangi daftar penerima pada file.`,
    };
  }

  return null;
}

export function buildSingleTitle(email: string, now: Date = new Date()): string {
  return `Email ke ${email.trim()} — ${formatDateId(now.toISOString(), "short")}`;
}

/**
 * Build a recipient import summary from rows read out of an XLSX file. The first
 * row is treated as the header; columns `nama` and `email` are required. Every
 * column header becomes a normalized variable key (e.g. "Nama Perusahaan" ->
 * `nama_perusahaan`) whose per-row value can be merged into the message via
 * `{{key}}`. Pure function (no file IO) so it can be unit-tested directly.
 */
export function buildRecipientImport(rows: unknown[][], fileName: string): RecipientImportState {
  const cleanRows = rows.map((row) => (Array.isArray(row) ? row.map(cellToString) : []));
  if (cleanRows.length === 0) {
    return { ...EMPTY_IMPORT, fileName, error: "File daftar penerima kosong." };
  }

  const headers = cleanRows[0].map((cell) => normalizeVariableKey(cell));
  const emailIndex = headers.indexOf("email");
  const nameIndex = firstHeaderIndex(headers, ["nama", "name"]);

  const missing: string[] = [];
  if (nameIndex < 0) {
    missing.push("nama");
  }
  if (emailIndex < 0) {
    missing.push("email");
  }
  if (missing.length > 0) {
    return {
      ...EMPTY_IMPORT,
      fileName,
      error: `Kolom ${missing.join(" dan ")} wajib ada. Unduh template jika format belum sesuai.`,
    };
  }

  const variableKeys = uniqueKeys(headers);
  const seen = new Set<string>();
  let duplicateCount = 0;
  let rowsRead = 0;
  const invalidRows: RecipientInvalidRow[] = [];
  const validRecipients: RecipientImportRow[] = [];

  cleanRows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    if (row.every((cell) => !cell.trim())) {
      return;
    }
    rowsRead += 1;

    const rawEmail = (row[emailIndex] ?? "").trim().toLowerCase();
    const rawName = (row[nameIndex] ?? "").trim();

    if (!rawEmail) {
      invalidRows.push({ row: rowNumber, reason: "Email kosong." });
      return;
    }
    if (!isValidEmail(rawEmail)) {
      invalidRows.push({ row: rowNumber, email: rawEmail, reason: "Format email tidak valid." });
      return;
    }
    if (seen.has(rawEmail)) {
      duplicateCount += 1;
      return;
    }

    const variables: RecipientVariables = {};
    headers.forEach((key, columnIndex) => {
      if (key) {
        variables[key] = (row[columnIndex] ?? "").trim();
      }
    });
    variables.email = rawEmail;
    variables.nama = rawName;

    seen.add(rawEmail);
    validRecipients.push({ email: rawEmail, name: rawName || undefined, variables });
  });

  return { fileName, rowsRead, validRecipients, duplicateCount, invalidRows, variableKeys };
}

/** Distinct `{{key}}` variable names referenced in the given text(s), lowercased. */
export function extractTemplateVariables(...texts: string[]): string[] {
  const found = new Set<string>();
  for (const text of texts) {
    for (const match of text.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)) {
      found.add(match[1].toLowerCase());
    }
  }

  return [...found];
}

/**
 * Variables referenced in the message but not provided by the uploaded recipient
 * list, so they would render blank for every recipient. `email` and `nama` are
 * always populated per recipient and never count as missing.
 */
export function findMissingTemplateVariables(texts: string[], availableKeys: string[]): string[] {
  const available = new Set(availableKeys.map((key) => key.toLowerCase()));
  available.add("email");
  available.add("nama");

  return extractTemplateVariables(...texts).filter((key) => !available.has(key));
}

/** Replace `{{key}}` placeholders using the given variables; missing keys become empty. */
export function renderTemplate(text: string, variables: RecipientVariables): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key.toLowerCase()];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function selectedAccountLabel(
  value: string,
  accounts: { id: number; display_name: string; email_address: string }[],
) {
  const account = accounts.find((item) => String(item.id) === value);
  return account ? `${account.display_name} - ${account.email_address}` : "Belum dipilih";
}

export function textToHtml(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
}

function cellToString(cell: unknown): string {
  if (cell === null || cell === undefined) {
    return "";
  }
  if (cell instanceof Date) {
    return cell.toISOString();
  }

  return String(cell);
}

/** Normalize a column header into a variable key: lowercase, non-alphanumeric -> underscore. */
function normalizeVariableKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function uniqueKeys(headers: string[]): string[] {
  const result: string[] = [];
  for (const key of headers) {
    if (key && !result.includes(key)) {
      result.push(key);
    }
  }

  return result;
}

function firstHeaderIndex(headers: string[], names: string[]) {
  return names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
