import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import type { Env } from "@/config/env";
import { PERMISSIONS_METADATA, Permission } from "@/core/permissions.decorator";
import { AUTH_REQUIRED_METADATA, PUBLIC_ROUTE_METADATA } from "@/auth/auth.decorators";
import { AuthService } from "@/auth/auth.service";
import { getCookieValue } from "@/auth/cookie.utils";

function isAdminRoute(request: Request): boolean {
  return request.originalUrl.startsWith("/api/v1/admin/");
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    await this.attachSessionUser(request);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_METADATA,
      [context.getHandler(), context.getClass()],
    );
    const isAuthRequired =
      this.reflector.getAllAndOverride<boolean>(AUTH_REQUIRED_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]) === true ||
      isAdminRoute(request) ||
      Boolean(requiredPermissions?.length);

    if (!isAuthRequired) {
      return true;
    }

    if (!request.adminUser) {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Sesi Anda sudah berakhir. Silakan masuk kembali.",
      });
    }

    if (requiredPermissions?.length) {
      const permissionSet = new Set(request.adminUser.permissions);
      const hasPermissions = requiredPermissions.every((permission) =>
        permissionSet.has(permission),
      );

      if (!hasPermissions) {
        throw new ForbiddenException({
          code: "FORBIDDEN",
          message: "Akun Anda belum memiliki akses untuk tindakan ini.",
        });
      }
    }

    return true;
  }

  private async attachSessionUser(request: Request): Promise<void> {
    const sessionCookieName = this.config.get("SESSION_COOKIE_NAME", { infer: true });
    const sessionToken = getCookieValue(request, sessionCookieName);
    const adminUser = await this.authService.validateSessionToken(sessionToken);

    if (adminUser) {
      request.adminUser = adminUser;
    }
  }
}
