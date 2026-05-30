import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_METADATA = "indobraga:permissions";

export type Permission =
  | "dashboard.read"
  | "site_settings.manage"
  | "content.read"
  | "content.manage"
  | "media.manage"
  | "leads.read"
  | "leads.manage"
  | "audience.read"
  | "audience.export"
  | "notifications.read"
  | "email_accounts.read"
  | "email_accounts.manage"
  | "email_campaigns.read"
  | "email_campaigns.manage"
  | "email_campaigns.send"
  | "email_campaign_logs.read"
  | "users.manage"
  | "seo.manage"
  | "activity.read";

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_METADATA, permissions);
