import { describe, expect, it } from "vitest";
import {
  instagramHandle,
  instagramHref,
  mailtoHref,
  mapsHref,
  telHref,
  whatsappHref,
} from "./contact-links";

describe("contact-links (QA IB-16)", () => {
  it("builds mailto and tel links only from usable values", () => {
    expect(mailtoHref("support@indobraga.com")).toBe("mailto:support@indobraga.com");
    expect(mailtoHref("bukan-email")).toBeUndefined();
    expect(telHref("0852-2300-0039")).toBe("tel:085223000039");
    expect(telHref("+62 852 2300 0039")).toBe("tel:+6285223000039");
    expect(telHref("-")).toBeUndefined();
  });

  it("builds a wa.me link that never starts with a local 0 (QA IB-01)", () => {
    expect(whatsappHref("6285223000039")).toBe("https://wa.me/6285223000039");
    expect(whatsappHref("085223000039")).toBeUndefined();
    expect(whatsappHref(null)).toBeUndefined();
  });

  it("handles Instagram handles, @-prefixes and pasted profile URLs", () => {
    expect(instagramHandle("@indobraga")).toBe("indobraga");
    expect(instagramHandle("https://www.instagram.com/indobraga/")).toBe("indobraga");
    expect(instagramHref("indobraga")).toBe("https://instagram.com/indobraga");
    expect(instagramHref("bad handle")).toBeUndefined();
  });

  it("builds an encoded maps search link", () => {
    expect(mapsHref("Jalan Babakan Tarogong No. 292, Bandung")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Jalan%20Babakan%20Tarogong%20No.%20292%2C%20Bandung",
    );
    expect(mapsHref("  ")).toBeUndefined();
  });
});
