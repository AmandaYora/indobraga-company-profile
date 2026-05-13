export type RecipientSource = "inquiries" | "csv";
export type InquiryStatusFilter = "all" | "new" | "contacted" | "in_progress" | "closed";

export type CampaignForm = {
  title: string;
  email_account_id: string;
  subject: string;
  body_text: string;
};

export type CsvRecipient = {
  email: string;
  name?: string;
};

export type CsvInvalidRow = {
  row: number;
  email?: string;
  reason: string;
};

export type CsvImportState = {
  fileName: string;
  rowsRead: number;
  validRecipients: CsvRecipient[];
  duplicateCount: number;
  invalidRows: CsvInvalidRow[];
  error?: string;
};

export type InquiryPreviewState = {
  loading: boolean;
  error: Error | null;
  data: {
    eligible_recipients: number;
    over_limit: boolean;
    recipient_limit: number;
  } | null;
};

export const EMPTY_CSV_IMPORT: CsvImportState = {
  fileName: "",
  rowsRead: 0,
  validRecipients: [],
  duplicateCount: 0,
  invalidRows: [],
};

export const RECIPIENT_LIMIT = 1000;

export function validateDraft({
  form,
  recipientSource,
  inquiryPreview,
  csvImport,
}: {
  form: CampaignForm;
  recipientSource: RecipientSource;
  inquiryPreview: InquiryPreviewState;
  csvImport: CsvImportState;
}): { title: string; description?: string } | null {
  if (!form.title.trim()) {
    return { title: "Nama pengiriman wajib diisi" };
  }
  if (!form.email_account_id) {
    return { title: "Pilih akun pengirim terlebih dahulu" };
  }
  if (!form.subject.trim()) {
    return { title: "Subjek email wajib diisi" };
  }
  if (!form.body_text.trim()) {
    return { title: "Isi email wajib diisi" };
  }

  if (recipientSource === "inquiries") {
    if (inquiryPreview.loading) {
      return { title: "Preview Pesan Kontak masih dihitung" };
    }
    if (inquiryPreview.error) {
      return {
        title: "Preview Pesan Kontak gagal dimuat",
        description: "Coba muat ulang sebelum menyimpan draf.",
      };
    }
    if (!inquiryPreview.data || inquiryPreview.data.eligible_recipients <= 0) {
      return {
        title: "Tidak ada email valid dari Pesan Kontak",
        description: "Ubah filter atau unggah daftar penerima.",
      };
    }
    if (inquiryPreview.data.over_limit) {
      return {
        title: "Penerima terlalu banyak",
        description: `Batas pengiriman adalah ${inquiryPreview.data.recipient_limit} email. Persempit filter terlebih dahulu.`,
      };
    }
  }

  if (recipientSource === "csv") {
    if (!csvImport.fileName) {
      return { title: "Unggah daftar penerima terlebih dahulu" };
    }
    if (csvImport.error) {
      return { title: "File daftar penerima belum valid", description: csvImport.error };
    }
    if (csvImport.validRecipients.length <= 0) {
      return {
        title: "Daftar penerima tidak memiliki email valid",
        description: "Periksa kolom email pada file daftar penerima.",
      };
    }
    if (csvImport.validRecipients.length > RECIPIENT_LIMIT) {
      return {
        title: "Penerima terlalu banyak",
        description: `Batas pengiriman adalah ${RECIPIENT_LIMIT} email. Kurangi daftar penerima pada file.`,
      };
    }
  }

  return null;
}

export function parseRecipientCsv(text: string, fileName: string): CsvImportState {
  const rows = parseCsvRows(text);
  if (rows.length === 0) {
    return { ...EMPTY_CSV_IMPORT, fileName, error: "File daftar penerima kosong." };
  }

  const headers = rows[0].map((cell) => normalizeCsvHeader(cell));
  const emailIndex = headers.indexOf("email");
  if (emailIndex < 0) {
    return {
      ...EMPTY_CSV_IMPORT,
      fileName,
      error: "Kolom email wajib ada. Unduh template jika format belum sesuai.",
    };
  }

  const nameIndex = firstHeaderIndex(headers, ["nama", "name"]);
  const seen = new Set<string>();
  let duplicateCount = 0;
  const invalidRows: CsvInvalidRow[] = [];
  const validRecipients: CsvRecipient[] = [];
  let rowsRead = 0;

  rows.slice(1).forEach((row, index) => {
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
    validRecipients.push({
      email: rawEmail,
      name: rawName || undefined,
    });
  });

  return {
    fileName,
    rowsRead,
    validRecipients,
    duplicateCount,
    invalidRows,
  };
}

export function selectedAccountLabel(
  value: string,
  accounts: { id: number; display_name: string; email_address: string }[],
) {
  const account = accounts.find((item) => String(item.id) === value);
  return account ? `${account.display_name} - ${account.email_address}` : "Belum dipilih";
}

export function estimateRecipients(
  source: RecipientSource,
  inquiryPreview: { eligible_recipients: number } | null,
  csvImport: CsvImportState,
) {
  return source === "inquiries"
    ? (inquiryPreview?.eligible_recipients ?? 0)
    : csvImport.validRecipients.length;
}

export function excludedRecipients(
  source: RecipientSource,
  inquiryPreview: { duplicate_emails: number; invalid_emails: number } | null,
  csvImport: CsvImportState,
) {
  return source === "inquiries"
    ? (inquiryPreview?.duplicate_emails ?? 0) + (inquiryPreview?.invalid_emails ?? 0)
    : csvImport.duplicateCount + csvImport.invalidRows.length;
}

export function textToHtml(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => `<p>${escapeHtml(line) || "<br>"}</p>`)
    .join("");
}

function parseCsvRows(value: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const next = value[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((item) => item.trim())) {
    rows.push(row);
  }

  return rows;
}

function firstHeaderIndex(headers: string[], names: string[]) {
  return names.map((name) => headers.indexOf(name)).find((index) => index >= 0) ?? -1;
}

function normalizeCsvHeader(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase();
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
