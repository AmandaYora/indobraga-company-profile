import { BadRequestException, ValidationError, ValidationPipe } from "@nestjs/common";
import { ApiErrorDetail } from "@/core/api-error";

const FIELD_LABELS: Record<string, string> = {
  address: "Alamat",
  alt_text: "Teks gambar",
  body_text: "Isi email",
  brand: "Nama merek",
  caption: "Caption",
  category: "Kategori",
  category_id: "Kategori",
  company: "Perusahaan",
  contact_hero_media_file_id: "Gambar hero kontak",
  contact_person: "Narahubung",
  contact_role: "Jabatan narahubung",
  content: "Isi konten",
  cta_href: "Link tombol",
  cta_label: "Teks tombol",
  description: "Deskripsi",
  display_name: "Label tampilan",
  email: "Email",
  email_account_id: "Akun pengirim",
  email_address: "Alamat email",
  email_hint: "Alamat email",
  excerpt: "Ringkasan",
  hero_section_id: "Bagian hero",
  instagram: "Instagram",
  label: "Label",
  legal_name: "Nama legal",
  logo_media_id: "Logo",
  logo_media_file_id: "Logo website",
  media_file_id: "Gambar",
  media_type: "Tipe media",
  message: "Pesan",
  metric: "Metrik",
  name: "Nama",
  og_image_media_file_id: "Gambar saat dibagikan",
  og_media_file_id: "Gambar saat dibagikan",
  password: "Kata sandi",
  phone: "Nomor telepon",
  poster_media_id: "Poster video",
  product: "Produk",
  role: "Akses",
  seo_description: "Deskripsi Google",
  seo_title: "Judul Google",
  short_description: "Deskripsi singkat",
  slug: "Alamat halaman",
  smtp_host: "Host email",
  smtp_password: "Kata sandi email",
  smtp_port: "Port email",
  smtp_security: "Keamanan email",
  smtp_username: "Username email",
  sort_order: "Urutan tampil",
  status: "Status",
  subject: "Subjek email",
  subtitle: "Subtitle",
  suffix: "Satuan",
  temporary_password: "Kata sandi sementara",
  thumbnail_media_file_id: "Thumbnail",
  title: "Judul",
  unit: "Unit",
  usage: "Kegunaan media",
  value: "Nilai",
  whatsapp: "WhatsApp",
};

function fieldLabel(path: string): string {
  const key = path.split(".").at(-1) ?? path;
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ");
}

function readableValidationMessage(
  field: string,
  constraint: string,
  originalMessage: string,
): string {
  const label = fieldLabel(field);

  switch (constraint) {
    case "isEmail":
      return `${label} harus berupa alamat email yang valid.`;
    case "isNotEmpty":
      return `${label} wajib diisi.`;
    case "isString":
      return `${label} harus berupa teks.`;
    case "isInt":
      return `${label} harus berupa angka bulat.`;
    case "min":
      return `${label} terlalu kecil.`;
    case "max":
      return `${label} terlalu besar.`;
    case "minLength":
      return `${label} terlalu pendek.`;
    case "maxLength":
      return `${label} terlalu panjang.`;
    case "matches":
      return `${label} belum sesuai format yang diminta.`;
    case "isIn":
      return `Pilihan ${label.toLowerCase()} tidak tersedia.`;
    case "isBoolean":
      return `${label} harus dipilih ya atau tidak.`;
    case "isArray":
      return `${label} harus berisi daftar.`;
    case "isIso8601":
    case "isISO8601":
      return `${label} harus berupa tanggal yang valid.`;
    default:
      return originalMessage.includes("must be") || originalMessage.includes("should be")
        ? `${label} belum valid.`
        : originalMessage;
  }
}

function collectValidationErrors(errors: ValidationError[], parentPath = ""): ApiErrorDetail[] {
  return errors.flatMap((error) => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const ownErrors = Object.entries(error.constraints ?? {}).map(([constraint, message]) => ({
      field: path,
      message: readableValidationMessage(path, constraint, message),
    }));
    const childErrors = collectValidationErrors(error.children ?? [], path);

    if (ownErrors.length === 0 && childErrors.length === 0) {
      return [
        {
          field: path,
          message: `${fieldLabel(path)} belum valid.`,
        },
      ];
    }

    return [...ownErrors, ...childErrors];
  });
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: (errors: ValidationError[]) =>
      new BadRequestException({
        code: "VALIDATION_ERROR",
        message: "Periksa kembali data yang diisi.",
        details: collectValidationErrors(errors),
      }),
  });
}
