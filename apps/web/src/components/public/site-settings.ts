import { createContext, useContext } from "react";
import type { PublicSiteSettings } from "@/lib/api-models";

export const fallbackSettings: PublicSiteSettings = {
  brand: "Indobraga",
  legal_name: "PT. Braga Indonesia Perkasa",
  email: "indobraga@gmail.com",
  phone: "0851-5870-0895",
  whatsapp: "6285158700895",
  instagram: "indobraga",
  contact_person: "Mahardika",
  contact_role: "Tim Marketing",
  address: "Jalan Babakan Tarogong No. 292, Kota Bandung",
  seo: {},
};

export const SiteSettingsContext = createContext<PublicSiteSettings>(fallbackSettings);

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
