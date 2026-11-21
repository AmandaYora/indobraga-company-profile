import { EmailAccountStatus, EmailProviderType, SmtpSecurityMode } from "@prisma/client";

export type ApiEmailProvider = "google" | "smtp";
export type ApiEmailAccountStatus = "connected" | "invalid" | "disabled" | "needs_reconnect";
export type ApiSmtpSecurity = "ssl_tls" | "starttls" | "none";

export const API_EMAIL_PROVIDERS: ApiEmailProvider[] = ["google", "smtp"];
export const API_EMAIL_ACCOUNT_STATUSES: ApiEmailAccountStatus[] = [
  "connected",
  "invalid",
  "disabled",
  "needs_reconnect",
];
/**
 * Security modes accepted when creating/updating a sender account (QA IB-07).
 * "none" (plaintext SMTP) stays in `ApiSmtpSecurity` so legacy rows can still be
 * presented, but it can no longer be selected for new or updated accounts.
 */
export const API_SMTP_SECURITY_MODES: ApiSmtpSecurity[] = ["ssl_tls", "starttls"];

export const API_TO_PRISMA_EMAIL_PROVIDER: Record<ApiEmailProvider, EmailProviderType> = {
  google: EmailProviderType.GOOGLE_OAUTH,
  smtp: EmailProviderType.SMTP_HOSTING,
};

export const PRISMA_TO_API_EMAIL_PROVIDER: Record<EmailProviderType, ApiEmailProvider> = {
  [EmailProviderType.GOOGLE_OAUTH]: "google",
  [EmailProviderType.SMTP_HOSTING]: "smtp",
};

export const API_TO_PRISMA_EMAIL_STATUS: Record<ApiEmailAccountStatus, EmailAccountStatus> = {
  connected: EmailAccountStatus.CONNECTED,
  invalid: EmailAccountStatus.INVALID,
  disabled: EmailAccountStatus.DISABLED,
  needs_reconnect: EmailAccountStatus.NEEDS_RECONNECT,
};

export const PRISMA_TO_API_EMAIL_STATUS: Record<EmailAccountStatus, ApiEmailAccountStatus> = {
  [EmailAccountStatus.CONNECTED]: "connected",
  [EmailAccountStatus.INVALID]: "invalid",
  [EmailAccountStatus.DISABLED]: "disabled",
  [EmailAccountStatus.NEEDS_RECONNECT]: "needs_reconnect",
};

export const API_TO_PRISMA_SMTP_SECURITY: Record<ApiSmtpSecurity, SmtpSecurityMode> = {
  ssl_tls: SmtpSecurityMode.SSL_TLS,
  starttls: SmtpSecurityMode.STARTTLS,
  none: SmtpSecurityMode.NONE,
};

export const PRISMA_TO_API_SMTP_SECURITY: Record<SmtpSecurityMode, ApiSmtpSecurity> = {
  [SmtpSecurityMode.SSL_TLS]: "ssl_tls",
  [SmtpSecurityMode.STARTTLS]: "starttls",
  [SmtpSecurityMode.NONE]: "none",
};
