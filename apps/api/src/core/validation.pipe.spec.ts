import { BadRequestException, type ValidationError } from "@nestjs/common";
import { createValidationPipe } from "@/core/validation.pipe";

function validationError(
  property: string,
  constraints?: Record<string, string>,
  children?: ValidationError[],
): ValidationError {
  return {
    children,
    constraints,
    property,
  };
}

function buildException(errors: ValidationError[]): BadRequestException {
  const pipe = createValidationPipe() as unknown as {
    exceptionFactory: (errors: ValidationError[]) => BadRequestException;
  };

  return pipe.exceptionFactory(errors);
}

describe("createValidationPipe", () => {
  it("returns user-facing messages for common validation constraints", () => {
    const exception = buildException([
      validationError("email", { isEmail: "email must be an email" }),
      validationError("name", { isNotEmpty: "name should not be empty" }),
      validationError("title", { isString: "title must be a string" }),
      validationError("sort_order", { isInt: "sort order must be an integer" }),
      validationError("smtp_port", { min: "smtp port must not be less than 1" }),
      validationError("smtp_port", { max: "smtp port must not be greater than 65535" }),
      validationError("password", { minLength: "password must be longer" }),
      validationError("seo_title", { maxLength: "seo title must be shorter" }),
      validationError("slug", { matches: "slug must match pattern" }),
      validationError("status", { isIn: "status must be one of allowed values" }),
      validationError("featured", { isBoolean: "featured must be boolean" }),
      validationError("items", { isArray: "items must be array" }),
      validationError("published_at", { isISO8601: "published at must be a valid date" }),
    ]);

    expect(exception).toBeInstanceOf(BadRequestException);
    expect(exception.getResponse()).toMatchObject({
      code: "VALIDATION_ERROR",
      details: [
        { field: "email", message: "Email harus berupa alamat email yang valid." },
        { field: "name", message: "Nama wajib diisi." },
        { field: "title", message: "Judul harus berupa teks." },
        { field: "sort_order", message: "Urutan tampil harus berupa angka bulat." },
        { field: "smtp_port", message: "Port email terlalu kecil." },
        { field: "smtp_port", message: "Port email terlalu besar." },
        { field: "password", message: "Kata sandi terlalu pendek." },
        { field: "seo_title", message: "Judul Google terlalu panjang." },
        { field: "slug", message: "Alamat halaman belum sesuai format yang diminta." },
        { field: "status", message: "Pilihan status tidak tersedia." },
        { field: "featured", message: "featured harus dipilih ya atau tidak." },
        { field: "items", message: "items harus berisi daftar." },
        { field: "published_at", message: "published at harus berupa tanggal yang valid." },
      ],
      message: "Periksa kembali data yang diisi.",
    });
  });

  it("keeps custom messages and reports nested or unknown validation paths", () => {
    const exception = buildException([
      validationError("profile", undefined, [
        validationError("contact_person", { isNotEmpty: "must not be empty" }),
      ]),
      validationError("custom_field", { custom: "Isi custom kurang tepat." }),
      validationError("unmapped_field", { custom: "unmapped_field must be valid" }),
      validationError("empty_constraints"),
    ]);

    expect(exception.getResponse()).toMatchObject({
      details: [
        { field: "profile.contact_person", message: "Narahubung wajib diisi." },
        { field: "custom_field", message: "Isi custom kurang tepat." },
        { field: "unmapped_field", message: "unmapped field belum valid." },
        { field: "empty_constraints", message: "empty constraints belum valid." },
      ],
    });
  });
});
