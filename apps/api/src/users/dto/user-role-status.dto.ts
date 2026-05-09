import { UserRole, UserStatus } from "@prisma/client";

export type ApiUserRole = "super_admin" | "content_editor";
export type ApiUserStatus = "active" | "inactive";

export const API_USER_ROLES: ApiUserRole[] = ["super_admin", "content_editor"];
export const API_USER_STATUSES: ApiUserStatus[] = ["active", "inactive"];

export const API_TO_PRISMA_ROLE: Record<ApiUserRole, UserRole> = {
  super_admin: UserRole.SUPER_ADMIN,
  content_editor: UserRole.CONTENT_EDITOR,
};

export const API_TO_PRISMA_STATUS: Record<ApiUserStatus, UserStatus> = {
  active: UserStatus.ACTIVE,
  inactive: UserStatus.INACTIVE,
};

export const PRISMA_TO_API_STATUS: Record<UserStatus, ApiUserStatus> = {
  [UserStatus.ACTIVE]: "active",
  [UserStatus.INACTIVE]: "inactive",
};
