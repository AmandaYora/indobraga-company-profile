import { ValidationOptions, registerDecorator } from "class-validator";
import { isValidInstagramHandle, isValidPhoneNumber } from "@/core/phone";
import { isSafeLinkUrl } from "@/core/safe-url";

function createValidator(
  name: string,
  test: (value: unknown) => boolean,
  defaultMessage: string,
) {
  return (validationOptions?: ValidationOptions): PropertyDecorator =>
    (object, propertyName) => {
      registerDecorator({
        name,
        target: object.constructor,
        propertyName: propertyName as string,
        options: { message: defaultMessage, ...validationOptions },
        validator: {
          validate: (value: unknown) => test(value),
        },
      });
    };
}

/** http(s)/mailto/tel URL or an internal "/path" (blocks javascript: etc). */
export const IsSafeLinkUrl = createValidator(
  "isSafeLinkUrl",
  isSafeLinkUrl,
  "Link harus diawali http://, https://, mailto:, tel:, atau alamat internal yang diawali /.",
);

/** Indonesian (or explicit international) phone number that normalises to 9-15 digits. */
export const IsPhoneNumberId = createValidator(
  "isPhoneNumberId",
  isValidPhoneNumber,
  "Nomor telepon belum valid. Gunakan format seperti 0812xxxxxxxx atau +62812xxxxxxxx.",
);

export const IsInstagramHandle = createValidator(
  "isInstagramHandle",
  isValidInstagramHandle,
  "Username Instagram hanya boleh berisi huruf, angka, titik, dan garis bawah (maks. 30 karakter).",
);
