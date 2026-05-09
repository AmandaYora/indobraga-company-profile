import { EmailCampaignStatus, EmailRecipientStatus } from "@prisma/client";

export type ApiEmailCampaignStatus =
  | "draft"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";
export type ApiEmailRecipientStatus = "queued" | "sending" | "sent" | "failed" | "skipped";

export const API_EMAIL_CAMPAIGN_STATUSES: ApiEmailCampaignStatus[] = [
  "draft",
  "pending",
  "processing",
  "completed",
  "failed",
  "cancelled",
];
export const API_EMAIL_RECIPIENT_STATUSES: ApiEmailRecipientStatus[] = [
  "queued",
  "sending",
  "sent",
  "failed",
  "skipped",
];

export const API_TO_PRISMA_CAMPAIGN_STATUS: Record<ApiEmailCampaignStatus, EmailCampaignStatus> = {
  draft: EmailCampaignStatus.DRAFT,
  pending: EmailCampaignStatus.PENDING,
  processing: EmailCampaignStatus.SENDING,
  completed: EmailCampaignStatus.COMPLETED,
  failed: EmailCampaignStatus.FAILED,
  cancelled: EmailCampaignStatus.CANCELLED,
};

export const PRISMA_TO_API_CAMPAIGN_STATUS: Record<EmailCampaignStatus, ApiEmailCampaignStatus> = {
  [EmailCampaignStatus.DRAFT]: "draft",
  [EmailCampaignStatus.PENDING]: "pending",
  [EmailCampaignStatus.SENDING]: "processing",
  [EmailCampaignStatus.COMPLETED]: "completed",
  [EmailCampaignStatus.FAILED]: "failed",
  [EmailCampaignStatus.CANCELLED]: "cancelled",
};

export const API_TO_PRISMA_RECIPIENT_STATUS: Record<ApiEmailRecipientStatus, EmailRecipientStatus> =
  {
    queued: EmailRecipientStatus.QUEUED,
    sending: EmailRecipientStatus.SENDING,
    sent: EmailRecipientStatus.SENT,
    failed: EmailRecipientStatus.FAILED,
    skipped: EmailRecipientStatus.SKIPPED,
  };

export const PRISMA_TO_API_RECIPIENT_STATUS: Record<EmailRecipientStatus, ApiEmailRecipientStatus> =
  {
    [EmailRecipientStatus.QUEUED]: "queued",
    [EmailRecipientStatus.SENDING]: "sending",
    [EmailRecipientStatus.SENT]: "sent",
    [EmailRecipientStatus.FAILED]: "failed",
    [EmailRecipientStatus.SKIPPED]: "skipped",
  };
