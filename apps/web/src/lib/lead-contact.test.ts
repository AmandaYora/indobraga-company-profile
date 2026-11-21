// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildWhatsAppGreeting,
  buildWhatsAppUrl,
  isValidPhoneInput,
  normalizePhoneId,
  openWhatsAppLead,
} from "./lead-contact";

describe("lead-contact helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("normalizes Indonesian phone numbers to wa.me format", () => {
    expect(normalizePhoneId("08123456789")).toBe("628123456789");
    expect(normalizePhoneId("+62 812-3456-789")).toBe("628123456789");
    expect(normalizePhoneId("628123456789")).toBe("628123456789");
    expect(normalizePhoneId("8123456789")).toBe("628123456789");
  });

  it("returns null for empty or invalid phone numbers", () => {
    expect(normalizePhoneId("")).toBeNull();
    expect(normalizePhoneId(null)).toBeNull();
    expect(normalizePhoneId("abc")).toBeNull();
    expect(normalizePhoneId("0812")).toBeNull();
  });

  it("builds wa.me url with and without a message", () => {
    expect(buildWhatsAppUrl("08123456789")).toBe("https://wa.me/628123456789");
    expect(buildWhatsAppUrl("08123456789", "Halo Budi")).toBe(
      "https://wa.me/628123456789?text=Halo%20Budi",
    );
    expect(buildWhatsAppUrl("not-a-phone")).toBeNull();
  });

  it("builds a greeting with the name or a fallback", () => {
    expect(buildWhatsAppGreeting("Budi")).toContain("Halo Budi,");
    expect(buildWhatsAppGreeting("")).toContain("Halo Kak,");
  });

  it("opens WhatsApp for a valid phone and reports failure otherwise", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);

    expect(openWhatsAppLead({ phone: "08123456789", name: "Budi" })).toBe(true);
    expect(open).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/628123456789?text="),
      "_blank",
      "noopener,noreferrer",
    );

    open.mockClear();
    expect(openWhatsAppLead({ phone: "abc" })).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });

  it("validates visitor phone input like the API does (QA IB-05)", () => {
    expect(isValidPhoneInput("0812-3456-7890")).toBe(true);
    expect(isValidPhoneInput("+62 812 3456 7890")).toBe(true);
    expect(isValidPhoneInput("6285223000039")).toBe(true);
    expect(isValidPhoneInput("+65 8123 4567")).toBe(true);
    expect(isValidPhoneInput("0812")).toBe(false);
    expect(isValidPhoneInput("abcdefghij")).toBe(false);
    expect(isValidPhoneInput("1234567")).toBe(false);
    expect(isValidPhoneInput("")).toBe(false);
    expect(isValidPhoneInput(null)).toBe(false);
  });
});
