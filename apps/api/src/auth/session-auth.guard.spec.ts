import { ForbiddenException, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { SessionAuthGuard } from "@/auth/session-auth.guard";
import type { Env } from "@/config/env";
import type { AuthService } from "@/auth/auth.service";

type RequestLike = {
  originalUrl: string;
  cookies?: Record<string, string>;
  adminUser?: { permissions: string[] };
};

function context(request: RequestLike): ExecutionContext {
  return {
    getHandler: () => "handler",
    getClass: () => "class",
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function config(): ConfigService<Env, true> {
  return { get: () => "session_cookie" } as unknown as ConfigService<Env, true>;
}

describe("SessionAuthGuard", () => {
  it("allows public routes while attaching session user when present", async () => {
    const request: RequestLike = {
      originalUrl: "/api/v1/public/home",
      cookies: { session_cookie: "token" },
    };
    const reflector = {
      getAllAndOverride: jest.fn((metadataKey: string) =>
        metadataKey.includes("public-route") ? true : undefined,
      ),
    } as unknown as Reflector;
    const authService = {
      validateSessionToken: jest.fn().mockResolvedValue({ permissions: ["dashboard.read"] }),
    } as unknown as AuthService;

    await expect(
      new SessionAuthGuard(reflector, authService, config()).canActivate(context(request)),
    ).resolves.toBe(true);
    expect(request.adminUser).toEqual({ permissions: ["dashboard.read"] });
  });

  it("throws unauthenticated for protected admin routes without user", async () => {
    const reflector = { getAllAndOverride: jest.fn(() => undefined) } as unknown as Reflector;
    const authService = {
      validateSessionToken: jest.fn().mockResolvedValue(null),
    } as unknown as AuthService;

    await expect(
      new SessionAuthGuard(reflector, authService, config()).canActivate(
        context({ originalUrl: "/api/v1/admin/users" }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("throws forbidden when admin user lacks required permission", async () => {
    const reflector = {
      getAllAndOverride: jest.fn((metadataKey: string) =>
        metadataKey.includes("permissions") ? ["users.manage"] : undefined,
      ),
    } as unknown as Reflector;
    const authService = {
      validateSessionToken: jest.fn().mockResolvedValue({ permissions: ["dashboard.read"] }),
    } as unknown as AuthService;

    await expect(
      new SessionAuthGuard(reflector, authService, config()).canActivate(
        context({ originalUrl: "/api/v1/admin/users", cookies: { session_cookie: "token" } }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it("allows protected route when permission is present", async () => {
    const reflector = {
      getAllAndOverride: jest.fn((metadataKey: string) =>
        metadataKey.includes("permissions") ? ["dashboard.read"] : undefined,
      ),
    } as unknown as Reflector;
    const authService = {
      validateSessionToken: jest.fn().mockResolvedValue({ permissions: ["dashboard.read"] }),
    } as unknown as AuthService;

    await expect(
      new SessionAuthGuard(reflector, authService, config()).canActivate(
        context({ originalUrl: "/api/v1/admin/dashboard", cookies: { session_cookie: "token" } }),
      ),
    ).resolves.toBe(true);
  });
});
