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
      return "Input tidak valid.";
    case "UNAUTHENTICATED":
      return "Belum login atau session tidak valid.";
    case "FORBIDDEN":
      return "Role tidak memiliki izin.";
    case "NOT_FOUND":
      return "Resource tidak ditemukan.";
    case "CONFLICT":
      return "Data konflik dengan resource lain.";
    case "PAYLOAD_TOO_LARGE":
      return "Ukuran payload melebihi batas.";
    case "UNSUPPORTED_MEDIA_TYPE":
      return "Tipe media tidak didukung.";
    case "UNPROCESSABLE_ENTITY":
      return "Data gagal memenuhi aturan bisnis.";
    case "RATE_LIMITED":
      return "Terlalu banyak request.";
    case "UPSTREAM_ERROR":
      return "Provider eksternal gagal.";
    case "SERVICE_UNAVAILABLE":
      return "Layanan sementara tidak tersedia.";
    case "INTERNAL_ERROR":
      return "Terjadi error server.";
    case "BAD_REQUEST":
    default:
      return "Request tidak valid.";
  }
}
