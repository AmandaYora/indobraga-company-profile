import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { Permission, PERMISSIONS_METADATA } from "@/core/permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const adminUser = request.adminUser;

    if (!adminUser) {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Belum login atau session tidak valid.",
      });
    }

    const permissionSet = new Set(adminUser.permissions);
    const hasPermissions = requiredPermissions.every((permission) => permissionSet.has(permission));

    if (!hasPermissions) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Role tidak memiliki izin.",
      });
    }

    return true;
  }
}
