import { createRequestId, createResponseMeta, getRequestId } from "@/core/request-context";
import type { Request } from "express";

describe("request-context helpers", () => {
  it("creates request IDs with the expected prefix", () => {
    expect(createRequestId()).toEqual(expect.stringMatching(/^req_/));
  });

  it("uses existing request ID when available", () => {
    const request = { requestId: "req_existing" } as Request;

    expect(getRequestId(request)).toBe("req_existing");
  });

  it("creates response metadata", () => {
    const meta = createResponseMeta({ requestId: "req_meta" } as Request);

    expect(meta.request_id).toBe("req_meta");
    expect(new Date(meta.timestamp).toString()).not.toBe("Invalid Date");
  });
});
