import { describe, expect, it } from "vitest";
import {
  EMPTY_CSV_IMPORT,
  RECIPIENT_LIMIT,
  excludedRecipients,
  estimateRecipients,
  parseRecipientCsv,
  selectedAccountLabel,
  textToHtml,
  validateDraft,
  type CampaignForm,
  type CsvImportState,
  type InquiryPreviewState,
} from "./-admin.email-blast.helpers";

const validForm: CampaignForm = {
  body_text: "Halo",
  email_account_id: "3",
  subject: "Follow up",
  title: "Campaign Mei",
};

const validInquiryPreview: InquiryPreviewState = {
  data: {
    eligible_recipients: 2,
    over_limit: false,
    recipient_limit: 1000,
  },
  error: null,
  loading: false,
};

const csvImport = (overrides: Partial<CsvImportState> = {}): CsvImportState => ({
  ...EMPTY_CSV_IMPORT,
  fileName: "recipients.csv",
  rowsRead: 1,
  validRecipients: [{ email: "budi@example.com", name: "Budi" }],
  ...overrides,
});

describe("admin email blast helpers", () => {
  it("parses recipient CSV with BOM, quoted values, duplicates, and invalid rows", () => {
    const result = parseRecipientCsv(
      '\uFEFF"nama","email"\r\n"Budi, Santoso","BUDI@Example.com"\r\n"Dupe","budi@example.com"\r\n"Invalid","not-email"\r\n"Kosong",""\r\n',
      "recipients.csv",
    );

    expect(result).toMatchObject({
      duplicateCount: 1,
      fileName: "recipients.csv",
      rowsRead: 4,
      validRecipients: [{ email: "budi@example.com", name: "Budi, Santoso" }],
    });
    expect(result.invalidRows).toEqual([
      { email: "not-email", reason: "Format email tidak valid.", row: 4 },
      { reason: "Email kosong.", row: 5 },
    ]);
  });

  it("parses escaped quotes and reports missing email header", () => {
    expect(
      parseRecipientCsv('nama,email\n"Sari ""Design""",sari@example.com', "ok.csv")
        .validRecipients[0],
    ).toEqual({
      email: "sari@example.com",
      name: 'Sari "Design"',
    });
    expect(parseRecipientCsv("nama,telepon\nBudi,0812", "bad.csv")).toMatchObject({
      error: "Kolom email wajib ada. Download template jika format belum sesuai.",
      fileName: "bad.csv",
      validRecipients: [],
    });
  });

  it("validates inquiry and CSV draft requirements", () => {
    expect(
      validateDraft({
        csvImport: EMPTY_CSV_IMPORT,
        form: validForm,
        inquiryPreview: validInquiryPreview,
        recipientSource: "inquiries",
      }),
    ).toBeNull();

    expect(
      validateDraft({
        csvImport: EMPTY_CSV_IMPORT,
        form: { ...validForm, subject: "" },
        inquiryPreview: validInquiryPreview,
        recipientSource: "inquiries",
      }),
    ).toEqual({ title: "Subjek email wajib diisi" });

    expect(
      validateDraft({
        csvImport: EMPTY_CSV_IMPORT,
        form: validForm,
        inquiryPreview: { data: null, error: null, loading: true },
        recipientSource: "inquiries",
      }),
    ).toEqual({ title: "Preview Pesan Kontak masih dihitung" });

    expect(
      validateDraft({
        csvImport: EMPTY_CSV_IMPORT,
        form: validForm,
        inquiryPreview: {
          data: { eligible_recipients: 1001, over_limit: true, recipient_limit: 1000 },
          error: null,
          loading: false,
        },
        recipientSource: "inquiries",
      }),
    ).toMatchObject({ title: "Penerima terlalu banyak" });

    expect(
      validateDraft({
        csvImport: csvImport(),
        form: validForm,
        inquiryPreview: validInquiryPreview,
        recipientSource: "csv",
      }),
    ).toBeNull();

    expect(
      validateDraft({
        csvImport: csvImport({
          validRecipients: Array.from({ length: RECIPIENT_LIMIT + 1 }, (_, index) => ({
            email: `user${index}@example.com`,
          })),
        }),
        form: validForm,
        inquiryPreview: validInquiryPreview,
        recipientSource: "csv",
      }),
    ).toMatchObject({ title: "Penerima terlalu banyak" });
  });

  it("summarizes selected account, recipient estimates, exclusions, and body HTML", () => {
    expect(
      selectedAccountLabel("3", [
        { display_name: "Support", email_address: "support@indobraga.com", id: 3 },
      ]),
    ).toBe("Support - support@indobraga.com");
    expect(selectedAccountLabel("", [])).toBe("Belum dipilih");
    expect(estimateRecipients("inquiries", { eligible_recipients: 8 }, EMPTY_CSV_IMPORT)).toBe(8);
    expect(
      estimateRecipients("csv", null, csvImport({ validRecipients: [{ email: "a@b.co" }] })),
    ).toBe(1);
    expect(
      excludedRecipients("inquiries", { duplicate_emails: 2, invalid_emails: 3 }, EMPTY_CSV_IMPORT),
    ).toBe(5);
    expect(
      excludedRecipients(
        "csv",
        null,
        csvImport({ duplicateCount: 1, invalidRows: [{ row: 2, reason: "Email kosong." }] }),
      ),
    ).toBe(2);
    expect(textToHtml('Halo <Budi>\n\nQuote "test" & ok')).toBe(
      "<p>Halo &lt;Budi&gt;</p><p><br></p><p>Quote &quot;test&quot; &amp; ok</p>",
    );
  });
});
