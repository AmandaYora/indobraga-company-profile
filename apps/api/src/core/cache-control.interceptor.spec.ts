import type { CallHandler, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { of } from "rxjs";
import { CacheControlInterceptor } from "@/core/cache-control.interceptor";

function context(response: { setHeader: jest.Mock }): ExecutionContext {
  return {
    getHandler: () => "handler",
    getClass: () => "class",
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

describe("CacheControlInterceptor", () => {
  it("sets Cache-Control header when metadata exists", () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => "no-store"),
    } as unknown as Reflector;
    const response = { setHeader: jest.fn() };
    const next: CallHandler = { handle: () => of({}) };

    new CacheControlInterceptor(reflector).intercept(context(response), next);

    expect(response.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
  });

  it("does not set header without metadata", () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => undefined),
    } as unknown as Reflector;
    const response = { setHeader: jest.fn() };
    const next: CallHandler = { handle: () => of({}) };

    new CacheControlInterceptor(reflector).intercept(context(response), next);

    expect(response.setHeader).not.toHaveBeenCalled();
  });
});
