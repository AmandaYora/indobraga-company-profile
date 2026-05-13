import type { Request, Response } from "express";
import { RequestIdMiddleware } from "@/core/request-id.middleware";

function responseMock() {
  return {
    setHeader: jest.fn(),
  } as unknown as Response & { setHeader: jest.Mock };
}

describe("RequestIdMiddleware", () => {
  it("uses a valid incoming request id", () => {
    const middleware = new RequestIdMiddleware();
    const request = {
      headers: { "x-request-id": " request-123 " },
    } as unknown as Request;
    const response = responseMock();
    const next = jest.fn();

    middleware.use(request, response, next);

    expect(request.requestId).toBe("request-123");
    expect(response.setHeader).toHaveBeenCalledWith("X-Request-Id", "request-123");
    expect(next).toHaveBeenCalled();
  });

  it("uses the first request id value when the header is repeated", () => {
    const middleware = new RequestIdMiddleware();
    const request = {
      headers: { "x-request-id": ["request-abc", "request-def"] },
    } as unknown as Request;
    const response = responseMock();

    middleware.use(request, response, jest.fn());

    expect(request.requestId).toBe("request-abc");
  });

  it("generates a fresh request id when the incoming value is missing or unsafe", () => {
    const middleware = new RequestIdMiddleware();

    for (const value of [undefined, "   ", "bad id with spaces"]) {
      const request = { headers: { "x-request-id": value } } as unknown as Request;
      const response = responseMock();

      middleware.use(request, response, jest.fn());

      expect(request.requestId).toMatch(/^req_[0-9a-f-]{36}$/);
      expect(response.setHeader).toHaveBeenCalledWith("X-Request-Id", request.requestId);
    }
  });
});
