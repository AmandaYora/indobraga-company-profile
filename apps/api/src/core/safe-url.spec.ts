import { isSafeLinkUrl, safeLinkOrNull } from "@/core/safe-url";

describe("isSafeLinkUrl (QA IB-03)", () => {
  it.each([
    "https://indobraga.com/kontak",
    "http://example.com",
    "mailto:support@indobraga.com",
    "tel:+6285223000039",
    "/kontak",
    "/portfolio/jersey?x=1#top",
  ])("accepts %s", (link) => {
    expect(isSafeLinkUrl(link)).toBe(true);
  });

  it.each([
    "javascript:window.__qaXss=1",
    "JaVaScRiPt:alert(1)",
    "  javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "data:text/html;base64,PHNjcmlwdD4=",
    "vbscript:msgbox(1)",
    "//evil.example.com",
    "/\\evil.example.com",
    "ftp://example.com",
    "file:///etc/passwd",
    "kontak",
    "https://",
    "mailto:",
    "",
    "   ",
    "https://exa mple.com",
  ])("rejects %j", (link) => {
    expect(isSafeLinkUrl(link)).toBe(false);
  });

  it("rejects non-strings and over-long values", () => {
    expect(isSafeLinkUrl(undefined)).toBe(false);
    expect(isSafeLinkUrl(42)).toBe(false);
    expect(isSafeLinkUrl(`https://example.com/${"a".repeat(600)}`)).toBe(false);
  });

  it("safeLinkOrNull trims safe links and drops unsafe ones", () => {
    expect(safeLinkOrNull("  /kontak  ")).toBe("/kontak");
    expect(safeLinkOrNull("javascript:alert(1)")).toBeNull();
    expect(safeLinkOrNull(null)).toBeNull();
    expect(safeLinkOrNull(undefined)).toBeNull();
  });
});
