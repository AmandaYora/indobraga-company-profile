export const settingsFieldNames = [
  "brand",
  "legal_name",
  "email",
  "phone",
  "whatsapp",
  "instagram",
  "contact_person",
  "contact_role",
  "address",
  "seo_title",
  "seo_description",
] as const;

export type SettingsForm = Record<(typeof settingsFieldNames)[number], string> & {
  og_media_file_id?: number;
  og_image_url?: string | null;
};

export type SettingsUpdatePayload = Record<(typeof settingsFieldNames)[number], string> & {
  og_media_file_id?: number;
};

export function emptySettingsForm(): SettingsForm {
  return {
    brand: "",
    legal_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    instagram: "",
    contact_person: "",
    contact_role: "",
    address: "",
    seo_title: "",
    seo_description: "",
  };
}

export function toSettingsUpdatePayload(form: SettingsForm): SettingsUpdatePayload {
  const payload = Object.fromEntries(
    settingsFieldNames.map((name) => [name, form[name]]),
  ) as SettingsUpdatePayload;

  if (typeof form.og_media_file_id === "number") {
    payload.og_media_file_id = form.og_media_file_id;
  }

  return payload;
}
