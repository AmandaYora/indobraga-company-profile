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
    expect(getDefaultErrorMessage("VALIDATION_ERROR")).toBe("Periksa kembali data yang diisi.");
    expect(getDefaultErrorMessage("UNAUTHENTICATED")).toBe(
      "Sesi Anda sudah berakhir. Silakan masuk kembali.",
    );
    expect(getDefaultErrorMessage("FORBIDDEN")).toBe(
      "Akun Anda belum memiliki akses untuk tindakan ini.",
    );
    expect(getDefaultErrorMessage("NOT_FOUND")).toBe("Data tidak ditemukan.");
    expect(getDefaultErrorMessage("CONFLICT")).toBe("Data yang sama sudah ada.");
    expect(getDefaultErrorMessage("PAYLOAD_TOO_LARGE")).toBe(
      "File atau data yang dikirim terlalu besar.",
    );
    expect(getDefaultErrorMessage("UNSUPPORTED_MEDIA_TYPE")).toBe("Format file belum didukung.");
    expect(getDefaultErrorMessage("UNPROCESSABLE_ENTITY")).toBe(
      "Data belum bisa diproses. Periksa kembali isinya.",
    );
    expect(getDefaultErrorMessage("RATE_LIMITED")).toBe(
      "Terlalu banyak aktivitas dalam waktu singkat. Tunggu sebentar lalu coba lagi.",
    );
    expect(getDefaultErrorMessage("UPSTREAM_ERROR")).toBe(
      "Layanan terhubung sedang bermasalah.",
    );
    expect(getDefaultErrorMessage("SERVICE_UNAVAILABLE")).toBe(
      "Layanan sementara tidak tersedia.",
    );
    expect(getDefaultErrorMessage("INTERNAL_ERROR")).toBe("Sistem sedang mengalami kendala.");
    expect(getDefaultErrorMessage("BAD_REQUEST")).toBe("Permintaan belum bisa diproses.");
  });
});
