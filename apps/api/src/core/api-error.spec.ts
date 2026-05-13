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
    expect(getDefaultErrorMessage("UNAUTHENTICATED")).toBe(
      "Sesi Anda sudah berakhir. Silakan masuk kembali.",
    );
    expect(getDefaultErrorMessage("INTERNAL_ERROR")).toBe("Sistem sedang mengalami kendala.");
    expect(getDefaultErrorMessage("BAD_REQUEST")).toBe("Permintaan belum bisa diproses.");
    expect(getDefaultErrorMessage("RATE_LIMITED")).toBe(
      "Terlalu banyak aktivitas dalam waktu singkat. Tunggu sebentar lalu coba lagi.",
    );
  });
});
