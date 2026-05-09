import { InquiryStatus, WhatsAppLeadStatus } from "@prisma/client";

export type ApiLeadStatus = "new" | "contacted" | "in_progress" | "closed" | "spam";

export const API_LEAD_STATUSES: ApiLeadStatus[] = [
  "new",
  "contacted",
  "in_progress",
  "closed",
  "spam",
];

export const API_TO_PRISMA_INQUIRY_STATUS: Record<ApiLeadStatus, InquiryStatus> = {
  new: InquiryStatus.NEW,
  contacted: InquiryStatus.CONTACTED,
  in_progress: InquiryStatus.IN_PROGRESS,
  closed: InquiryStatus.CLOSED,
  spam: InquiryStatus.SPAM,
};

export const PRISMA_TO_API_INQUIRY_STATUS: Record<InquiryStatus, ApiLeadStatus> = {
  [InquiryStatus.NEW]: "new",
  [InquiryStatus.CONTACTED]: "contacted",
  [InquiryStatus.IN_PROGRESS]: "in_progress",
  [InquiryStatus.CLOSED]: "closed",
  [InquiryStatus.SPAM]: "spam",
};

export const API_TO_PRISMA_WHATSAPP_STATUS: Record<ApiLeadStatus, WhatsAppLeadStatus> = {
  new: WhatsAppLeadStatus.NEW,
  contacted: WhatsAppLeadStatus.CONTACTED,
  in_progress: WhatsAppLeadStatus.IN_PROGRESS,
  closed: WhatsAppLeadStatus.CLOSED,
  spam: WhatsAppLeadStatus.SPAM,
};

export const PRISMA_TO_API_WHATSAPP_STATUS: Record<WhatsAppLeadStatus, ApiLeadStatus> = {
  [WhatsAppLeadStatus.NEW]: "new",
  [WhatsAppLeadStatus.CONTACTED]: "contacted",
  [WhatsAppLeadStatus.IN_PROGRESS]: "in_progress",
  [WhatsAppLeadStatus.CLOSED]: "closed",
  [WhatsAppLeadStatus.SPAM]: "spam",
};
