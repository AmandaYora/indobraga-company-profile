import {
  buildWhatsappUrl,
  isValidInstagramHandle,
  isValidPhoneNumber,
  normalizeInstagramHandle,
  normalizePhoneNumber,
} from "@/core/phone";

describe("phone helpers", () => {
  it("converts the local number from QA IB-01 to the international form", () => {
    // wa.me/085223000039 opened a Hong Kong (+852) chat; this must become +62 852...
    expect(normalizePhoneNumber("085223000039")).toBe("6285223000039");
    expect(normalizePhoneNumber("0852-2300-0039")).toBe("6285223000039");
  });

  it("accepts the other common Indonesian notations", () => {
    expect(normalizePhoneNumber("+62 852 2300 0039")).toBe("6285223000039");
    expect(normalizePhoneNumber("6285223000039")).toBe("6285223000039");
    expect(normalizePhoneNumber("85223000039")).toBe("6285223000039");
    expect(normalizePhoneNumber("(0852) 2300-0039")).toBe("6285223000039");
    expect(normalizePhoneNumber("+62 (0) 852 2300 0039")).toBe("6285223000039");
    expect(normalizePhoneNumber("0062 852 2300 0039")).toBe("6285223000039");
  });

  it("keeps an explicit foreign country code", () => {
    expect(normalizePhoneNumber("+65 8123 4567")).toBe("6581234567");
  });

  it("rejects numbers that cannot be real (QA IB-05 cases)", () => {
    expect(normalizePhoneNumber("0812")).toBeNull();
    expect(normalizePhoneNumber("abcdefghij")).toBeNull();
    expect(normalizePhoneNumber("1234567")).toBeNull();
    expect(normalizePhoneNumber("")).toBeNull();
    expect(normalizePhoneNumber("   ")).toBeNull();
    expect(normalizePhoneNumber(null)).toBeNull();
    expect(normalizePhoneNumber(undefined)).toBeNull();
    expect(normalizePhoneNumber("0812345678901234567")).toBeNull();
    expect(isValidPhoneNumber(12345)).toBe(false);
    expect(isValidPhoneNumber("08123456789")).toBe(true);
  });

  it("builds wa.me links only from usable numbers", () => {
    expect(buildWhatsappUrl("085223000039")).toBe("https://wa.me/6285223000039");
    expect(buildWhatsappUrl("085223000039", "Halo Indobraga")).toBe(
      "https://wa.me/6285223000039?text=Halo%20Indobraga",
    );
    expect(buildWhatsappUrl("abc")).toBeNull();
  });

  it("normalises Instagram handles from @names and profile links", () => {
    expect(normalizeInstagramHandle("@indobraga")).toBe("indobraga");
    expect(normalizeInstagramHandle("https://www.instagram.com/indobraga/?hl=id")).toBe(
      "indobraga",
    );
    expect(normalizeInstagramHandle("  indobraga  ")).toBe("indobraga");
    expect(normalizeInstagramHandle(undefined)).toBe("");
    expect(isValidInstagramHandle("indo.braga_1")).toBe(true);
    expect(isValidInstagramHandle("bad handle")).toBe(false);
    expect(isValidInstagramHandle("")).toBe(false);
  });
});
