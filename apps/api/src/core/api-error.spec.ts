import { getDefaultErrorCode, getDefaultErrorMessage } from "@/core/api-error";

describe("api-error helpers", () => {
  it.each([
    [400, "BAD_REQUEST"],
    [401, "UNAUTHENTICATED"],
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
    [409, "CONFLICT"],
    [413, "PAYLOAD_TOO_LARGE"],
    [415, "UNSUPPORTED_MEDIA_TYPE"],
    [422, "UNPROCESSABLE_ENTITY"],
    [429, "RATE_LIMITED"],
    [502, "UPSTREAM_ERROR"],
    [503, "SERVICE_UNAVAILABLE"],
    [500, "INTERNAL_ERROR"],
    [418, "BAD_REQUEST"],
  ] as const)("maps HTTP %s to %s", (status, code) => {
    expect(getDefaultErrorCode(status)).toBe(code);
  });

  it("returns localized default messages", () => {
    expect(getDefaultErrorMessage("UNAUTHENTICATED")).toBe("Belum login atau session tidak valid.");
    expect(getDefaultErrorMessage("INTERNAL_ERROR")).toBe("Terjadi error server.");
    expect(getDefaultErrorMessage("BAD_REQUEST")).toBe("Request tidak valid.");
  });
});
