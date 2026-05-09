import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { Env } from "@/config/env";
import { AUTH_REQUIRED_METADATA, SKIP_CSRF_METADATA } from "@/auth/auth.decorators";
import { getCookieValue } from "@/auth/cookie.utils";
import { PERMISSIONS_METADATA, Permission } from "@/core/permissions.decorator";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function isAdminMutation(request: Request): boolean {
  return request.originalUrl.startsWith("/api/v1/admin/") && !SAFE_METHODS.has(request.method);
}

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService<Env, true>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method)) {
      return true;
    }

    const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipCsrf) {
      return true;
    }

    const authRequired =
      this.reflector.getAllAndOverride<boolean>(AUTH_REQUIRED_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]) === true;
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (!authRequired && !requiredPermissions?.length && !isAdminMutation(request)) {
      return true;
    }

    const csrfCookieName = this.config.get("CSRF_COOKIE_NAME", { infer: true });
    const cookieToken = getCookieValue(request, csrfCookieName);
    const headerToken = request.header("x-csrf-token");

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "CSRF token tidak valid.",
      });
    }

    return true;
  }
}
