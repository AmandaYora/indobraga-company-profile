import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { SiteSettingsUpdateDto } from "@/admin-content/dto/site-settings-update.dto";
import { AdminContentDto } from "@/admin-content/dto/admin-content.dto";
import { CreateInquiryDto } from "@/leads/dto/create-inquiry.dto";
import { CreateWhatsAppLeadDto } from "@/leads/dto/create-whatsapp-lead.dto";

async function errorsFor<T extends object>(cls: new () => T, plain: Record<string, unknown>) {
  const instance = plainToInstance(cls, plain);
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
  return { instance, fields: errors.map((error) => error.property) };
}

describe("DTO validators from the QA report", () => {
  describe("site settings WhatsApp number (IB-01)", () => {
    it("normalises the local number to the international form", async () => {
      const { instance, fields } = await errorsFor(SiteSettingsUpdateDto, {
        whatsapp: "085223000039",
      });

      expect(fields).toEqual([]);
      expect(instance.whatsapp).toBe("6285223000039");
    });

    it("accepts the number already in international form", async () => {
      const { instance, fields } = await errorsFor(SiteSettingsUpdateDto, {
        whatsapp: "+62 852-2300-0039",
      });

      expect(fields).toEqual([]);
      expect(instance.whatsapp).toBe("6285223000039");
    });

    it("rejects an unusable number", async () => {
      const { fields } = await errorsFor(SiteSettingsUpdateDto, { whatsapp: "abc" });

      expect(fields).toContain("whatsapp");
    });

    it("normalises Instagram input and rejects bad handles", async () => {
      const ok = await errorsFor(SiteSettingsUpdateDto, { instagram: "@indobraga" });
      expect(ok.fields).toEqual([]);
      expect(ok.instance.instagram).toBe("indobraga");

      const bad = await errorsFor(SiteSettingsUpdateDto, { instagram: "bad handle!" });
      expect(bad.fields).toContain("instagram");
    });
  });

  describe("button link (IB-03)", () => {
    it("rejects javascript: in cta_href", async () => {
      const { fields } = await errorsFor(AdminContentDto, {
        title: "Hero",
        cta_href: "javascript:window.__qaXss=1",
      });

      expect(fields).toContain("cta_href");
    });

    it.each(["https://indobraga.com", "mailto:support@indobraga.com", "tel:+6285223000039", "/kontak"])(
      "accepts %s",
      async (cta_href) => {
        const { fields } = await errorsFor(AdminContentDto, { title: "Hero", cta_href });

        expect(fields).toEqual([]);
      },
    );
  });

  describe("visitor phone numbers (IB-05)", () => {
    const base = { name: "QA-TEST WA" };

    it.each(["0812", "abcdefghij", "1234567"])("rejects %s for WhatsApp leads", async (phone) => {
      const { fields } = await errorsFor(CreateWhatsAppLeadDto, { ...base, phone });

      expect(fields).toContain("phone");
    });

    it("accepts a normal mobile number for WhatsApp leads and inquiries", async () => {
      const lead = await errorsFor(CreateWhatsAppLeadDto, { ...base, phone: "0812-3456-7890" });
      expect(lead.fields).toEqual([]);

      const inquiry = await errorsFor(CreateInquiryDto, {
        name: "Budi",
        email: "budi@example.com",
        phone: "+62 812 3456 7890",
        message: "Saya ingin konsultasi produksi seragam.",
      });
      expect(inquiry.fields).toEqual([]);
    });
  });
});
