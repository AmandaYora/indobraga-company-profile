import type { CallHandler, ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { of, firstValueFrom } from "rxjs";
import { ResponseEnvelopeInterceptor } from "@/core/response-envelope.interceptor";

function context(request: Record<string, unknown>): ExecutionContext {
  return {
    getClass: () => class TestContext {},
    getHandler: () => function testHandler() {},
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function handler(value: unknown): CallHandler {
  return {
    handle: () => of(value),
  };
}

describe("ResponseEnvelopeInterceptor", () => {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(false),
  };
  const interceptor = new ResponseEnvelopeInterceptor(reflector as unknown as Reflector);

  it("wraps plain data in success envelope", async () => {
    const response = await firstValueFrom(
      interceptor.intercept(context({ requestId: "req_wrap" }), handler({ ok: true })),
    );

    expect(response).toMatchObject({
      success: true,
      data: { ok: true },
      meta: { request_id: "req_wrap" },
    });
  });

  it("preserves existing success envelope and merges meta", async () => {
    const response = await firstValueFrom(
      interceptor.intercept(
        context({ requestId: "req_existing" }),
        handler({ success: true, data: { id: 1 }, meta: { page: 2 } }),
      ),
    );

    expect(response).toMatchObject({
      success: true,
      data: { id: 1 },
      meta: { request_id: "req_existing", page: 2 },
    });
  });
});
