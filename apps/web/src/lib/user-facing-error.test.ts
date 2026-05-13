import { describe, expect, it } from "vitest";
import { ApiClientError } from "@/lib/api";
import { getUserFacingErrorMessage, getUserFacingErrorTitle } from "./user-facing-error";

describe("user-facing error copy", () => {
  it("translates rate limit errors for login without technical wording", () => {
    const error = new ApiClientError({
      code: "RATE_LIMITED",
      message: "ThrottlerException: Too Many Requests",
      status: 429,
    });

    expect(getUserFacingErrorTitle(error, { action: "login" })).toBe("Tunggu sebentar");
    expect(getUserFacingErrorMessage(error, { action: "login" })).toBe(
      "Terlalu banyak percobaan masuk. Tunggu sekitar 1 menit lalu coba lagi.",
    );
  });

  it("hides technical transport messages on public page errors", () => {
    const error = new ApiClientError({
      code: "BAD_RESPONSE",
      message: "Response server tidak sesuai kontrak API.",
      status: 500,
    });

    expect(getUserFacingErrorMessage(error, { audience: "public", surface: "page" })).toBe(
      "Konten belum bisa ditampilkan. Muat ulang halaman atau coba lagi nanti.",
    );
  });

  it("keeps friendly validation details with readable field labels", () => {
    const error = new ApiClientError({
      code: "VALIDATION_ERROR",
      message: "Input tidak valid.",
      details: [{ field: "og_image_media_file_id", message: "Gambar wajib dipilih." }],
      status: 400,
    });

    expect(getUserFacingErrorMessage(error)).toBe(
      "Gambar saat dibagikan: Gambar wajib dipilih.",
    );
  });
});
