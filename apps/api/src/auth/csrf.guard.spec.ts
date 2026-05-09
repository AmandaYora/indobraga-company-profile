import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { CsrfGuard } from "@/auth/csrf.guard";
import type { Env } from "@/config/env";

type RequestLike = {
  method: string;
  originalUrl: string;
  cookies?: Record<string, string>;
  header: (name: string) => string | undefined;
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
  return { get: () => "csrf_token" } as unknown as ConfigService<Env, true>;
}

describe("CsrfGuard", () => {
  it("allows safe methods", () => {
    const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
    const guard = new CsrfGuard(reflector, config());

    expect(
      guard.canActivate(
        context({ method: "GET", originalUrl: "/api/v1/admin/users", header: jest.fn() }),
      ),
    ).toBe(true);
  });

  it("allows public non-admin mutations without auth metadata", () => {
    const reflector = { getAllAndOverride: jest.fn(() => undefined) } as unknown as Reflector;
    const guard = new CsrfGuard(reflector, config());

    expect(
      guard.canActivate(
        context({ method: "POST", originalUrl: "/api/v1/public/inquiries", header: jest.fn() }),
      ),
    ).toBe(true);
  });

  it("rejects admin mutation when CSRF token is missing", () => {
    const reflector = { getAllAndOverride: jest.fn(() => undefined) } as unknown as Reflector;
    const guard = new CsrfGuard(reflector, config());

    expect(() =>
      guard.canActivate(
        context({ method: "POST", originalUrl: "/api/v1/admin/users", header: jest.fn() }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("allows admin mutation with matching cookie and header token", () => {
    const reflector = { getAllAndOverride: jest.fn(() => undefined) } as unknown as Reflector;
    const guard = new CsrfGuard(reflector, config());

    expect(
      guard.canActivate(
        context({
          method: "POST",
          originalUrl: "/api/v1/admin/users",
          cookies: { csrf_token: "token" },
          header: () => "token",
        }),
      ),
    ).toBe(true);
  });
});
