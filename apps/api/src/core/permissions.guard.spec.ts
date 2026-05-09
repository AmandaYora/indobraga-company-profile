import { ForbiddenException, UnauthorizedException, type ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PermissionsGuard } from "@/core/permissions.guard";

function context(request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => "handler",
    getClass: () => "class",
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe("PermissionsGuard", () => {
  it("allows requests without permission metadata", () => {
    const reflector = { getAllAndOverride: jest.fn(() => undefined) } as unknown as Reflector;

    expect(new PermissionsGuard(reflector).canActivate(context({}))).toBe(true);
  });

  it("throws unauthenticated when permission is required without admin user", () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => ["users.manage"]),
    } as unknown as Reflector;

    expect(() => new PermissionsGuard(reflector).canActivate(context({}))).toThrow(
      UnauthorizedException,
    );
  });

  it("throws forbidden when admin lacks permission", () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => ["users.manage"]),
    } as unknown as Reflector;

    expect(() =>
      new PermissionsGuard(reflector).canActivate(
        context({ adminUser: { permissions: ["dashboard.read"] } }),
      ),
    ).toThrow(ForbiddenException);
  });

  it("allows admin with all required permissions", () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => ["dashboard.read", "content.manage"]),
    } as unknown as Reflector;

    expect(
      new PermissionsGuard(reflector).canActivate(
        context({ adminUser: { permissions: ["dashboard.read", "content.manage"] } }),
      ),
    ).toBe(true);
  });
});
