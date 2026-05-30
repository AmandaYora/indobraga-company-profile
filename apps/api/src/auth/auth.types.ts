import { UserRole } from "@prisma/client";
import { Permission } from "@/core/permissions.decorator";

export type AdminRole = "super_admin" | "content_editor";

export type AuthenticatedAdmin = {
  id: number;
  name: string;
  email: string;
  role: AdminRole;
  permissions: Permission[];
};

const ADMIN_PERMISSIONS: Permission[] = [
  "dashboard.read",
  "users.manage",
  "site_settings.manage",
  "content.read",
  "content.manage",
  "media.manage",
  "leads.read",
  "leads.manage",
  "audience.read",
  "audience.export",
  "notifications.read",
  "email_accounts.read",
  "email_accounts.manage",
  "email_campaigns.read",
  "email_campaigns.manage",
  "email_campaigns.send",
  "email_campaign_logs.read",
  "seo.manage",
  "activity.read",
];

const CONTENT_EDITOR_EXCLUDED_PERMISSIONS = new Set<Permission>([
  "email_campaign_logs.read",
  "activity.read",
]);

const CONTENT_EDITOR_PERMISSIONS: Permission[] = ADMIN_PERMISSIONS.filter(
  (permission) => !CONTENT_EDITOR_EXCLUDED_PERMISSIONS.has(permission),
);

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: ADMIN_PERMISSIONS,
  [UserRole.CONTENT_EDITOR]: CONTENT_EDITOR_PERMISSIONS,
};

export const API_ROLE: Record<UserRole, AdminRole> = {
  [UserRole.SUPER_ADMIN]: "super_admin",
  [UserRole.CONTENT_EDITOR]: "content_editor",
};
