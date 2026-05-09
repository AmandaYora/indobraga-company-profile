import {
  MarketingConsentStatus,
  MarketingContactSource,
  MarketingContactStatus,
} from "@prisma/client";

export type ApiMarketingContactSource = "inquiry" | "whatsapp_lead" | "manual_import" | "manual";
export type ApiMarketingContactStatus = "active" | "unsubscribed" | "blocked";
export type ApiMarketingConsentStatus = "implied" | "explicit" | "unknown";

export const API_MARKETING_CONTACT_SOURCES: ApiMarketingContactSource[] = [
  "inquiry",
  "whatsapp_lead",
  "manual_import",
  "manual",
];

export const API_MARKETING_CONTACT_STATUSES: ApiMarketingContactStatus[] = [
  "active",
  "unsubscribed",
  "blocked",
];

export const API_TO_PRISMA_MARKETING_SOURCE: Record<
  ApiMarketingContactSource,
  MarketingContactSource
> = {
  inquiry: MarketingContactSource.INQUIRY,
  whatsapp_lead: MarketingContactSource.WHATSAPP_LEAD,
  manual_import: MarketingContactSource.MANUAL_IMPORT,
  manual: MarketingContactSource.MANUAL,
};

export const PRISMA_TO_API_MARKETING_SOURCE: Record<
  MarketingContactSource,
  ApiMarketingContactSource
> = {
  [MarketingContactSource.INQUIRY]: "inquiry",
  [MarketingContactSource.WHATSAPP_LEAD]: "whatsapp_lead",
  [MarketingContactSource.MANUAL_IMPORT]: "manual_import",
  [MarketingContactSource.MANUAL]: "manual",
};

export const API_TO_PRISMA_MARKETING_STATUS: Record<
  ApiMarketingContactStatus,
  MarketingContactStatus
> = {
  active: MarketingContactStatus.ACTIVE,
  unsubscribed: MarketingContactStatus.UNSUBSCRIBED,
  blocked: MarketingContactStatus.BLOCKED,
};

export const PRISMA_TO_API_MARKETING_STATUS: Record<
  MarketingContactStatus,
  ApiMarketingContactStatus
> = {
  [MarketingContactStatus.ACTIVE]: "active",
  [MarketingContactStatus.UNSUBSCRIBED]: "unsubscribed",
  [MarketingContactStatus.BLOCKED]: "blocked",
};

export const PRISMA_TO_API_MARKETING_CONSENT: Record<
  MarketingConsentStatus,
  ApiMarketingConsentStatus
> = {
  [MarketingConsentStatus.IMPLIED]: "implied",
  [MarketingConsentStatus.EXPLICIT]: "explicit",
  [MarketingConsentStatus.UNKNOWN]: "unknown",
};
