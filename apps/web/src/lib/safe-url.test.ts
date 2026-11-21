import { describe, expect, it } from "vitest";
import { isSafeHref, safeHref } from "./safe-url";

describe("safe-url (QA IB-03)", () => {
  it.each([
    "https://indobraga.com",
    "http://example.com/a?b=1",
    "mailto:support@indobraga.com",
    "tel:+6285223000039",
    "/kontak",
  ])("accepts %s", (value) => {
    expect(isSafeHref(value)).toBe(true);
  });

  it.each([
    "javascript:window.__qaXss=1",
    "JAVASCRIPT:alert(1)",
    "java\tscript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:x",
    "//evil.example.com",
    "/\\evil.example.com",
    "kontak",
    "",
    "https://",
  ])("rejects %j", (value) => {
    expect(isSafeHref(value)).toBe(false);
  });

  it("safeHref returns the trimmed link or undefined", () => {
    expect(safeHref("  /kontak ")).toBe("/kontak");
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHref(null)).toBeUndefined();
    expect(safeHref(undefined)).toBeUndefined();
  });
});
