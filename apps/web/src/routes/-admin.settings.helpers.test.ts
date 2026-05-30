import { describe, expect, it } from "vitest";
import {
  emptySettingsForm,
  settingsFieldNames,
  toSettingsUpdatePayload,
  type SettingsForm,
} from "./-admin.settings.helpers";

describe("admin settings helpers", () => {
  it("builds an empty form with every editable setting field", () => {
    expect(emptySettingsForm()).toEqual({
      ...Object.fromEntries(settingsFieldNames.map((name) => [name, ""])),
      show_brand_text: false,
    });
  });

  it("sends only editable settings fields and numeric media ids", () => {
    const form: SettingsForm = {
      ...emptySettingsForm(),
      brand: "Indobraga QA",
      email: "qa@example.com",
      show_brand_text: false,
      logo_media_file_id: 12,
      logo_url: "https://cdn.example.test/logo.webp",
      contact_hero_media_file_id: 24,
      contact_hero_image_url: "https://cdn.example.test/contact.webp",
      og_media_file_id: 42,
      og_image_url: "https://cdn.example.test/og.webp",
    };

    expect(toSettingsUpdatePayload(form)).toEqual({
      ...Object.fromEntries(settingsFieldNames.map((name) => [name, form[name]])),
      show_brand_text: false,
      logo_media_file_id: 12,
      contact_hero_media_file_id: 24,
      og_media_file_id: 42,
    });
    expect(toSettingsUpdatePayload(form)).not.toHaveProperty("logo_url");
    expect(toSettingsUpdatePayload(form)).not.toHaveProperty("contact_hero_image_url");
    expect(toSettingsUpdatePayload(form)).not.toHaveProperty("og_image_url");
  });

  it("omits media ids when the form only has preview URLs", () => {
    const form: SettingsForm = {
      ...emptySettingsForm(),
      logo_url: "https://cdn.example.test/current-logo.webp",
      contact_hero_image_url: "https://cdn.example.test/current-contact.webp",
      og_image_url: "https://cdn.example.test/current-og.webp",
    };

    expect(toSettingsUpdatePayload(form)).not.toHaveProperty("logo_media_file_id");
    expect(toSettingsUpdatePayload(form)).not.toHaveProperty("contact_hero_media_file_id");
    expect(toSettingsUpdatePayload(form)).not.toHaveProperty("og_media_file_id");
  });
});
