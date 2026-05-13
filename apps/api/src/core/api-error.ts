export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "UNPROCESSABLE_ENTITY"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "UPSTREAM_ERROR"
  | "SERVICE_UNAVAILABLE";

export type ApiErrorDetail = {
  field?: string;
  message: string;
};

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  details?: ApiErrorDetail[];
};

export function getDefaultErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHENTICATED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 413:
      return "PAYLOAD_TOO_LARGE";
    case 415:
      return "UNSUPPORTED_MEDIA_TYPE";
    case 422:
      return "UNPROCESSABLE_ENTITY";
    case 429:
      return "RATE_LIMITED";
    case 502:
      return "UPSTREAM_ERROR";
    case 503:
      return "SERVICE_UNAVAILABLE";
    default:
      return status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST";
  }
}

export function getDefaultErrorMessage(code: ApiErrorCode): string {
  switch (code) {
    case "VALIDATION_ERROR":
      return "Periksa kembali data yang diisi.";
    case "UNAUTHENTICATED":
      return "Sesi Anda sudah berakhir. Silakan masuk kembali.";
    case "FORBIDDEN":
      return "Akun Anda belum memiliki akses untuk tindakan ini.";
    case "NOT_FOUND":
      return "Data tidak ditemukan.";
    case "CONFLICT":
      return "Data yang sama sudah ada.";
    case "PAYLOAD_TOO_LARGE":
      return "File atau data yang dikirim terlalu besar.";
    case "UNSUPPORTED_MEDIA_TYPE":
      return "Format file belum didukung.";
    case "UNPROCESSABLE_ENTITY":
      return "Data belum bisa diproses. Periksa kembali isinya.";
    case "RATE_LIMITED":
      return "Terlalu banyak aktivitas dalam waktu singkat. Tunggu sebentar lalu coba lagi.";
    case "UPSTREAM_ERROR":
      return "Layanan terhubung sedang bermasalah.";
    case "SERVICE_UNAVAILABLE":
      return "Layanan sementara tidak tersedia.";
    case "INTERNAL_ERROR":
      return "Sistem sedang mengalami kendala.";
    case "BAD_REQUEST":
    default:
      return "Permintaan belum bisa diproses.";
  }
}
