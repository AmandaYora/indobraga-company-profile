import { isApiClientError, type ApiClientError, type ApiClientErrorCode } from "@/lib/api";

export type ErrorAudience = "admin" | "public";
export type ErrorSurface = "page" | "toast";
export type ErrorAction = "login" | "save" | "upload" | "delete" | "send" | "load";

export type UserFacingErrorOptions = {
  action?: ErrorAction;
  audience?: ErrorAudience;
  surface?: ErrorSurface;
};

const ADMIN_MESSAGES: Record<ApiClientErrorCode, string> = {
  BAD_REQUEST: "Permintaan belum bisa diproses. Periksa kembali data yang diisi.",
  BAD_RESPONSE: "Data belum bisa dibaca. Muat ulang halaman lalu coba lagi.",
  CONFLICT: "Data yang sama sudah ada atau masih dipakai.",
  FORBIDDEN: "Akun Anda belum memiliki akses untuk tindakan ini.",
  INTERNAL_ERROR: "Sistem sedang mengalami kendala. Coba lagi nanti.",
  NETWORK_ERROR: "Koneksi bermasalah. Periksa internet lalu coba lagi.",
  NOT_FOUND: "Data tidak ditemukan.",
  PAYLOAD_TOO_LARGE: "File atau data yang dikirim terlalu besar.",
  RATE_LIMITED: "Terlalu banyak aktivitas dalam waktu singkat. Tunggu sebentar lalu coba lagi.",
  SERVICE_UNAVAILABLE: "Layanan sementara tidak tersedia. Coba lagi nanti.",
  UNAUTHENTICATED: "Sesi Anda sudah berakhir. Silakan masuk kembali.",
  UNPROCESSABLE_ENTITY: "Data belum bisa diproses. Periksa kembali isinya.",
  UNSUPPORTED_MEDIA_TYPE: "Format file belum didukung.",
  UPSTREAM_ERROR: "Layanan terhubung sedang bermasalah. Coba lagi nanti.",
  VALIDATION_ERROR: "Periksa kembali isian yang belum sesuai.",
};

const PUBLIC_MESSAGES: Record<ApiClientErrorCode, string> = {
  ...ADMIN_MESSAGES,
  BAD_RESPONSE: "Konten belum bisa ditampilkan. Muat ulang halaman atau coba lagi nanti.",
  FORBIDDEN: "Akses belum tersedia.",
  INTERNAL_ERROR: "Konten belum bisa ditampilkan. Coba lagi nanti.",
  NOT_FOUND: "Konten tidak ditemukan.",
  SERVICE_UNAVAILABLE: "Website sedang sulit diakses. Coba lagi nanti.",
  UNAUTHENTICATED: "Sesi Anda sudah berakhir. Muat ulang halaman lalu coba lagi.",
  UPSTREAM_ERROR: "Konten belum bisa ditampilkan. Coba lagi nanti.",
};

const FIELD_LABELS: Record<string, string> = {
  address: "Alamat",
  alt_text: "Teks gambar",
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
  new_password: "Kata sandi baru",
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

const TECHNICAL_COPY_PATTERN =
  /\b(request|response|backend|frontend|csrf|payload|resource|json|contract|kontrak|throttler|exception|stack|undefined|null|provider|oauth|internal worker secret|session cookie|http-only|derivative|revalidasi|reorder)\b|too many requests/i;

export function getUserFacingErrorMessage(
  error: unknown,
  options: UserFacingErrorOptions = {},
): string {
  const audience = options.audience ?? "admin";

  if (!isApiClientError(error)) {
    return fallbackForUnknown(error, audience);
  }

  if (audience === "public" && options.surface === "page") {
    return publicPageMessage(error);
  }

  if (options.action === "login") {
    return loginMessage(error);
  }

  if (error.code === "VALIDATION_ERROR") {
    return validationMessage(error);
  }

  const fallback = messageMap(audience)[error.code];
  const safeMessage = safeBackendMessage(error.message);

  return safeMessage ?? fallback;
}

export function getUserFacingErrorTitle(
  error: unknown,
  options: UserFacingErrorOptions = {},
): string {
  if (isApiClientError(error)) {
    if (error.code === "RATE_LIMITED") {
      return options.action === "login" ? "Tunggu sebentar" : "Aktivitas terlalu cepat";
    }

    if (error.code === "UNAUTHENTICATED") {
      return options.action === "login" ? "Masuk gagal" : "Sesi berakhir";
    }

    if (error.code === "VALIDATION_ERROR") {
      return "Periksa isian";
    }
  }

  return options.audience === "public" ? "Konten belum bisa ditampilkan" : "Data gagal dimuat";
}

function messageMap(audience: ErrorAudience): Record<ApiClientErrorCode, string> {
  return audience === "public" ? PUBLIC_MESSAGES : ADMIN_MESSAGES;
}

function loginMessage(error: ApiClientError): string {
  if (error.code === "RATE_LIMITED") {
    return "Terlalu banyak percobaan masuk. Tunggu sekitar 1 menit lalu coba lagi.";
  }

  if (error.code === "UNAUTHENTICATED") {
    return "Email atau kata sandi belum sesuai.";
  }

  return safeBackendMessage(error.message) ?? ADMIN_MESSAGES[error.code];
}

function publicPageMessage(error: ApiClientError): string {
  if (error.code === "RATE_LIMITED") {
    return "Terlalu banyak aktivitas dalam waktu singkat. Tunggu sebentar lalu muat ulang halaman.";
  }

  return PUBLIC_MESSAGES[error.code];
}

function validationMessage(error: ApiClientError): string {
  const details = error.details
    ?.map((detail) => {
      const message = safeBackendMessage(detail.message);
      if (!message) {
        return undefined;
      }

      const label = detail.field ? fieldLabel(detail.field) : undefined;
      return label && !message.toLowerCase().startsWith(label.toLowerCase())
        ? `${label}: ${message}`
        : message;
    })
    .filter((message): message is string => Boolean(message));

  if (!details?.length) {
    return ADMIN_MESSAGES.VALIDATION_ERROR;
  }

  return details.slice(0, 2).join(" ");
}

function fieldLabel(field: string): string {
  const parts = field.split(".");
  const key = parts[parts.length - 1] ?? field;
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ");
}

function fallbackForUnknown(error: unknown, audience: ErrorAudience): string {
  const message = error instanceof Error ? safeBackendMessage(error.message) : undefined;

  if (message) {
    return message;
  }

  return audience === "public"
    ? "Konten belum bisa ditampilkan. Coba lagi nanti."
    : "Terjadi kendala. Coba lagi nanti.";
}

function safeBackendMessage(message: string | undefined): string | undefined {
  const trimmed = message?.trim();

  if (!trimmed || TECHNICAL_COPY_PATTERN.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}
