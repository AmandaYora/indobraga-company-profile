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
  show_brand_text: boolean;
  logo_media_file_id?: number;
  logo_url?: string | null;
  og_media_file_id?: number;
  og_image_url?: string | null;
  contact_hero_media_file_id?: number;
  contact_hero_image_url?: string | null;
};

export type SettingsUpdatePayload = Record<(typeof settingsFieldNames)[number], string> & {
  show_brand_text: boolean;
  logo_media_file_id?: number;
  og_media_file_id?: number;
  contact_hero_media_file_id?: number;
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
    show_brand_text: false,
  };
}

export function toSettingsUpdatePayload(form: SettingsForm): SettingsUpdatePayload {
  const payload = Object.fromEntries(
    settingsFieldNames.map((name) => [name, form[name]]),
  ) as SettingsUpdatePayload;

  payload.show_brand_text = form.show_brand_text;

  if (typeof form.logo_media_file_id === "number") {
    payload.logo_media_file_id = form.logo_media_file_id;
  }
  if (typeof form.og_media_file_id === "number") {
    payload.og_media_file_id = form.og_media_file_id;
  }
  if (typeof form.contact_hero_media_file_id === "number") {
    payload.contact_hero_media_file_id = form.contact_hero_media_file_id;
  }

  return payload;
}
