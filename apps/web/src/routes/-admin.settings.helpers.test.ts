import { describe, expect, it } from "vitest";
import {
  emptySettingsForm,
  settingsFieldNames,
  toSettingsUpdatePayload,
  type SettingsForm,
} from "./-admin.settings.helpers";

describe("admin settings helpers", () => {
  it("builds an empty form with every editable setting field", () => {
    expect(emptySettingsForm()).toEqual(
      Object.fromEntries(settingsFieldNames.map((name) => [name, ""])),
    );
  });

  it("sends only editable settings fields and the numeric OG media id", () => {
    const form: SettingsForm = {
      ...emptySettingsForm(),
      brand: "Indobraga QA",
      email: "qa@example.com",
      og_media_file_id: 42,
      og_image_url: "https://cdn.example.test/og.webp",
    };

    expect(toSettingsUpdatePayload(form)).toEqual({
      ...Object.fromEntries(settingsFieldNames.map((name) => [name, form[name]])),
      og_media_file_id: 42,
    });
    expect(toSettingsUpdatePayload(form)).not.toHaveProperty("og_image_url");
  });

  it("omits OG media id when the form only has a preview URL", () => {
    const form: SettingsForm = {
      ...emptySettingsForm(),
      og_image_url: "https://cdn.example.test/current-og.webp",
    };

    expect(toSettingsUpdatePayload(form)).not.toHaveProperty("og_media_file_id");
  });
});
