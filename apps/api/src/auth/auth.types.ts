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
  "seo.manage",
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: ADMIN_PERMISSIONS,
  [UserRole.CONTENT_EDITOR]: ADMIN_PERMISSIONS,
};

export const API_ROLE: Record<UserRole, AdminRole> = {
  [UserRole.SUPER_ADMIN]: "super_admin",
  [UserRole.CONTENT_EDITOR]: "content_editor",
};
