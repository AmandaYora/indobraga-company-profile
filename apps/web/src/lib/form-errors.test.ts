import { describe, expect, it } from "vitest";
import { ApiClientError } from "@/lib/api";
import { clearFieldError, fieldErrorsFromError, hasFieldErrors } from "./form-errors";

describe("form-errors (QA IB-10)", () => {
  it("maps API validation details to per-field messages", () => {
    const error = new ApiClientError({
      code: "VALIDATION_ERROR",
      message: "Periksa kembali data yang diisi.",
      status: 400,
      details: [
        { field: "name", message: "Nama wajib diisi." },
        { field: "recipients.0.email", message: "Email harus berupa alamat email yang valid." },
        { field: "name", message: "Pesan kedua diabaikan." },
        { message: "tanpa field" },
      ],
    });

    expect(fieldErrorsFromError(error)).toEqual({
      name: "Nama wajib diisi.",
      email: "Email harus berupa alamat email yang valid.",
    });
  });

  it("returns nothing for errors without details or non-API errors", () => {
    expect(fieldErrorsFromError(new Error("boom"))).toEqual({});
    expect(
      fieldErrorsFromError(new ApiClientError({ code: "INTERNAL_ERROR", message: "x" })),
    ).toEqual({});
    expect(hasFieldErrors({})).toBe(false);
    expect(hasFieldErrors({ name: "x" })).toBe(true);
  });

  it("clears a single field without mutating the original", () => {
    const original = { name: "a", email: "b" };

    expect(clearFieldError(original, "name")).toEqual({ email: "b" });
    expect(original).toEqual({ name: "a", email: "b" });
    expect(clearFieldError(original, "missing")).toBe(original);
  });
});
