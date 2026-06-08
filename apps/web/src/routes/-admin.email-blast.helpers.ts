import { formatDateId } from "@/lib/date";

export type EmailTab = "single" | "bulk";

export type EmailContentForm = {
  email_account_id: string;
  subject: string;
  body_text: string;
};

export type SingleForm = EmailContentForm & {
  to_email: string;
  to_name: string;
};

export type BulkForm = EmailContentForm & {
  title: string;
};

export type RecipientImportRow = {
  email: string;
  name?: string;
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
  error?: string;
};

export type ValidationError = { title: string; description?: string };

export const EMPTY_IMPORT: RecipientImportState = {
  fileName: "",
  rowsRead: 0,
  validRecipients: [],
  duplicateCount: 0,
  invalidRows: [],
};

export const RECIPIENT_LIMIT = 1000;

export function validateEmailContent(form: EmailContentForm): ValidationError | null {
  if (!form.email_account_id) {
    return { title: "Pilih akun pengirim terlebih dahulu" };
  }
  if (!form.subject.trim()) {
    return { title: "Subjek email wajib diisi" };
  }
  if (!form.body_text.trim()) {
    return { title: "Isi email wajib diisi" };
  }

  return null;
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
      description: "Periksa kolom email pada file Excel.",
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
 * row is treated as the header; an `email` column is required, `nama`/`name` is
 * optional. Pure function (no file IO) so it can be unit-tested directly.
 */
export function buildRecipientImport(rows: unknown[][], fileName: string): RecipientImportState {
  const cleanRows = rows.map((row) => (Array.isArray(row) ? row.map(cellToString) : []));
  if (cleanRows.length === 0) {
    return { ...EMPTY_IMPORT, fileName, error: "File daftar penerima kosong." };
  }

  const headers = cleanRows[0].map((cell) => normalizeHeader(cell));
  const emailIndex = headers.indexOf("email");
  if (emailIndex < 0) {
    return {
      ...EMPTY_IMPORT,
      fileName,
      error: "Kolom email wajib ada. Unduh template jika format belum sesuai.",
    };
  }

  const nameIndex = firstHeaderIndex(headers, ["nama", "name"]);
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
    const rawName = nameIndex >= 0 ? (row[nameIndex] ?? "").trim() : "";

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

    seen.add(rawEmail);
    validRecipients.push({ email: rawEmail, name: rawName || undefined });
  });

  return { fileName, rowsRead, validRecipients, duplicateCount, invalidRows };
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

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase();
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
