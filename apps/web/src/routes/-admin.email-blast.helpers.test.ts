import { describe, expect, it } from "vitest";
import {
  EMPTY_IMPORT,
  RECIPIENT_LIMIT,
  RECIPIENT_TEMPLATE_HEADERS,
  buildRecipientImport,
  buildSingleTitle,
  findMissingTemplateVariables,
  htmlToText,
  renderTemplate,
  resolveBodyPayload,
  selectedAccountLabel,
  textToHtml,
  validateBody,
  validateBulk,
  validateSingle,
  type BulkForm,
  type RecipientImportState,
  type SingleForm,
} from "./-admin.email-blast.helpers";

const content = {
  body_text: "Halo {{nama}}",
  body_html: "",
  content_mode: "text" as const,
  email_account_id: "3",
  subject: "Follow up {{perusahaan}}",
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
  validRecipients: [
    { email: "budi@example.com", name: "Budi", variables: { nama: "Budi", email: "budi@example.com" } },
  ],
  variableKeys: ["nama", "email"],
  ...overrides,
});

describe("admin email blast helpers", () => {
  it("captures all columns as normalized variables and dedupes", () => {
    const result = buildRecipientImport(
      [
        ["Nama", "Email", "Nama Perusahaan"],
        ["Budi, Santoso", "BUDI@Example.com", "PT Contoh"],
        ["Dupe", "budi@example.com", "PT Lain"],
        ["Invalid", "not-email", ""],
        ["Kosong", "", ""],
      ],
      "recipients.xlsx",
    );

    expect(result.variableKeys).toEqual(["nama", "email", "nama_perusahaan"]);
    expect(result.duplicateCount).toBe(1);
    expect(result.rowsRead).toBe(4);
    expect(result.validRecipients).toEqual([
      {
        email: "budi@example.com",
        name: "Budi, Santoso",
        variables: {
          nama: "Budi, Santoso",
          email: "budi@example.com",
          nama_perusahaan: "PT Contoh",
        },
      },
    ]);
    expect(result.invalidRows).toEqual([
      { email: "not-email", reason: "Format email tidak valid.", row: 4 },
      { reason: "Email kosong.", row: 5 },
    ]);
  });

  it("requires both nama and email columns and reports empty files", () => {
    expect(buildRecipientImport([["nama", "telepon"], ["Budi", "0812"]], "bad.xlsx")).toMatchObject({
      error: "Kolom email wajib ada. Unduh template jika format belum sesuai.",
      validRecipients: [],
    });
    expect(buildRecipientImport([["email"], ["a@b.co"]], "bad2.xlsx")).toMatchObject({
      error: "Kolom nama wajib ada. Unduh template jika format belum sesuai.",
    });
    expect(buildRecipientImport([], "empty.xlsx")).toMatchObject({
      error: "File daftar penerima kosong.",
    });
  });

  it("renders template variables, leaving unknown/missing keys empty", () => {
    expect(renderTemplate("Halo {{nama}} dari {{perusahaan}}", { nama: "Budi", perusahaan: "PT X" })).toBe(
      "Halo Budi dari PT X",
    );
    expect(renderTemplate("Hai {{nama}}, {{tidakada}}", { nama: "Budi" })).toBe("Hai Budi, ");
    expect(renderTemplate("{{NAMA}}", { nama: "Budi" })).toBe("Budi");
  });

  it("flags template variables missing from the uploaded recipient columns", () => {
    // nama & email are always populated per recipient, so never flagged.
    expect(
      findMissingTemplateVariables(["Halo {{nama}}", "Diskon untuk {{email}}"], ["perusahaan"]),
    ).toEqual([]);
    // perusahaan present as a column -> not missing; kota absent -> flagged once, case-insensitive.
    expect(
      findMissingTemplateVariables(
        ["Halo {{nama}} dari {{perusahaan}}", "Kota {{kota}} dan {{KOTA}}"],
        ["perusahaan"],
      ),
    ).toEqual(["kota"]);
  });

  it("exposes a template header set with nama and email", () => {
    expect(RECIPIENT_TEMPLATE_HEADERS).toContain("nama");
    expect(RECIPIENT_TEMPLATE_HEADERS).toContain("email");
  });

  it("validates single email requirements", () => {
    expect(validateSingle(validSingle)).toBeNull();
    expect(validateSingle({ ...validSingle, to_email: "" })).toEqual({
      title: "Email tujuan wajib diisi",
    });
    expect(validateSingle({ ...validSingle, to_email: "not-email" })).toEqual({
      title: "Format email tujuan tidak valid",
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
      validateBulk(validBulk, importState({ validRecipients: [] })),
    ).toMatchObject({ title: "Daftar penerima tidak memiliki email valid" });
    expect(
      validateBulk(
        validBulk,
        importState({
          validRecipients: Array.from({ length: RECIPIENT_LIMIT + 1 }, (_, index) => ({
            email: `user${index}@example.com`,
            variables: { nama: "", email: `user${index}@example.com` },
          })),
        }),
      ),
    ).toMatchObject({ title: "Penerima terlalu banyak" });
  });

  it("validates body per content mode", () => {
    expect(validateBody({ subject: "S", content_mode: "text", body_text: "Halo", body_html: "" })).toBeNull();
    expect(
      validateBody({ subject: "S", content_mode: "text", body_text: "", body_html: "<p>x</p>" }),
    ).toEqual({ title: "Isi email wajib diisi" });
    expect(
      validateBody({ subject: "S", content_mode: "html", body_text: "Halo", body_html: "" }),
    ).toEqual({ title: "Isi email (HTML) wajib diisi" });
    expect(
      validateBody({ subject: "", content_mode: "html", body_text: "", body_html: "<p>x</p>" }),
    ).toEqual({ title: "Subjek email wajib diisi" });
  });

  it("resolves body payload from the chosen mode", () => {
    expect(resolveBodyPayload({ content_mode: "text", body_text: "Halo\nDunia", body_html: "" })).toEqual(
      { body_text: "Halo\nDunia", body_html: "<p>Halo</p><p>Dunia</p>" },
    );
    const html = resolveBodyPayload({
      content_mode: "html",
      body_text: "",
      body_html: "<p>Halo {{nama}}</p>",
    });
    expect(html.body_html).toBe("<p>Halo {{nama}}</p>");
    expect(html.body_text).toBe("Halo {{nama}}");
  });

  it("extracts plain text from HTML", () => {
    expect(htmlToText("<p>Halo <b>Budi</b></p><p>Salam &amp; hormat</p>")).toBe(
      "Halo Budi\nSalam & hormat",
    );
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
