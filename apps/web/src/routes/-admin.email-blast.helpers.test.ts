import { describe, expect, it } from "vitest";
import {
  EMPTY_IMPORT,
  RECIPIENT_LIMIT,
  buildRecipientImport,
  buildSingleTitle,
  selectedAccountLabel,
  textToHtml,
  validateBulk,
  validateSingle,
  type BulkForm,
  type RecipientImportState,
  type SingleForm,
} from "./-admin.email-blast.helpers";

const content = {
  body_text: "Halo",
  email_account_id: "3",
  subject: "Follow up",
};

const validSingle: SingleForm = {
  ...content,
  to_email: "budi@example.com",
  to_name: "Budi",
};

const validBulk: BulkForm = {
  ...content,
  title: "Campaign Mei",
};

const importState = (overrides: Partial<RecipientImportState> = {}): RecipientImportState => ({
  ...EMPTY_IMPORT,
  fileName: "recipients.xlsx",
  rowsRead: 1,
  validRecipients: [{ email: "budi@example.com", name: "Budi" }],
  ...overrides,
});

describe("admin email blast helpers", () => {
  it("builds recipient import from rows with duplicates and invalid rows", () => {
    const result = buildRecipientImport(
      [
        ["nama", "email"],
        ["Budi, Santoso", "BUDI@Example.com"],
        ["Dupe", "budi@example.com"],
        ["Invalid", "not-email"],
        ["Kosong", ""],
      ],
      "recipients.xlsx",
    );

    expect(result).toMatchObject({
      duplicateCount: 1,
      fileName: "recipients.xlsx",
      rowsRead: 4,
      validRecipients: [{ email: "budi@example.com", name: "Budi, Santoso" }],
    });
    expect(result.invalidRows).toEqual([
      { email: "not-email", reason: "Format email tidak valid.", row: 4 },
      { reason: "Email kosong.", row: 5 },
    ]);
  });

  it("coerces non-string cells and works without a name column", () => {
    const result = buildRecipientImport([["email"], [" sari@example.com "]], "ok.xlsx");
    expect(result.validRecipients).toEqual([{ email: "sari@example.com" }]);
  });

  it("reports missing email header and empty files", () => {
    expect(buildRecipientImport([["nama", "telepon"], ["Budi", "0812"]], "bad.xlsx")).toMatchObject({
      error: "Kolom email wajib ada. Unduh template jika format belum sesuai.",
      fileName: "bad.xlsx",
      validRecipients: [],
    });
    expect(buildRecipientImport([], "empty.xlsx")).toMatchObject({
      error: "File daftar penerima kosong.",
      validRecipients: [],
    });
  });

  it("validates single email requirements", () => {
    expect(validateSingle(validSingle)).toBeNull();
    expect(validateSingle({ ...validSingle, to_email: "" })).toEqual({
      title: "Email tujuan wajib diisi",
    });
    expect(validateSingle({ ...validSingle, to_email: "not-email" })).toEqual({
      title: "Format email tujuan tidak valid",
    });
    expect(validateSingle({ ...validSingle, email_account_id: "" })).toEqual({
      title: "Pilih akun pengirim terlebih dahulu",
    });
    expect(validateSingle({ ...validSingle, subject: "" })).toEqual({
      title: "Subjek email wajib diisi",
    });
  });

  it("validates bulk requirements", () => {
    expect(validateBulk(validBulk, importState())).toBeNull();
    expect(validateBulk({ ...validBulk, title: "" }, importState())).toEqual({
      title: "Nama pengiriman wajib diisi",
    });
    expect(validateBulk(validBulk, EMPTY_IMPORT)).toEqual({
      title: "Unggah daftar penerima terlebih dahulu",
    });
    expect(
      validateBulk(
        validBulk,
        importState({
          validRecipients: Array.from({ length: RECIPIENT_LIMIT + 1 }, (_, index) => ({
            email: `user${index}@example.com`,
          })),
        }),
      ),
    ).toMatchObject({ title: "Penerima terlalu banyak" });
  });

  it("formats single title, account label, and body HTML", () => {
    expect(buildSingleTitle("a@b.co", new Date("2026-06-08T00:00:00Z"))).toBe(
      "Email ke a@b.co — 8 Jun 2026",
    );
    expect(
      selectedAccountLabel("3", [
        { display_name: "Support", email_address: "support@indobraga.com", id: 3 },
      ]),
    ).toBe("Support - support@indobraga.com");
    expect(selectedAccountLabel("", [])).toBe("Belum dipilih");
    expect(textToHtml('Halo <Budi>\n\nQuote "test" & ok')).toBe(
      "<p>Halo &lt;Budi&gt;</p><p><br></p><p>Quote &quot;test&quot; &amp; ok</p>",
    );
  });
});
