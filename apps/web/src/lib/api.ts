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

export type ApiClientErrorCode = ApiErrorCode | "NETWORK_ERROR" | "BAD_RESPONSE";

export type ApiErrorDetail = {
  field?: string;
  message: string;
};

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  details?: ApiErrorDetail[];
};

export type ApiResponseMeta = {
  request_id?: string;
  timestamp?: string;
  [key: string]: unknown;
};

export type ApiSuccessEnvelope<TData> = {
  success: true;
  data: TData;
  meta?: ApiResponseMeta;
};

export type ApiErrorEnvelope = {
  success: false;
  error: ApiErrorBody;
  meta?: ApiResponseMeta;
};

export type ApiEnvelope<TData> = ApiSuccessEnvelope<TData> | ApiErrorEnvelope;

export type ApiRequestOptions = Omit<RequestInit, "body" | "credentials" | "headers"> & {
  body?: unknown;
  credentials?: RequestCredentials;
  csrf?: boolean;
  headers?: HeadersInit;
};

type ApiClientErrorInput = {
  code: ApiClientErrorCode;
  message: string;
  status?: number;
  details?: ApiErrorDetail[];
  requestId?: string;
  raw?: unknown;
};

const DEFAULT_API_BASE_URL = import.meta.env.DEV ? "http://localhost:3001" : "";
const DEFAULT_API_PREFIX = "/api/v1";
const DEFAULT_CSRF_COOKIE_NAME = "indobraga_csrf";
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export class ApiClientError extends Error {
  code: ApiClientErrorCode;
  status?: number;
  details?: ApiErrorDetail[];
  requestId?: string;
  raw?: unknown;

  constructor(input: ApiClientErrorInput) {
    super(input.message);
    this.name = "ApiClientError";
    this.code = input.code;
    this.status = input.status;
    this.details = input.details;
    this.requestId = input.requestId;
    this.raw = input.raw;
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

export function getApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl);
  }

  if (import.meta.env.SSR && !import.meta.env.DEV) {
    return normalizeBaseUrl(getServerApiBaseUrl());
  }

  return normalizeBaseUrl(DEFAULT_API_BASE_URL);
}

export function getApiPrefix(): string {
  const prefix = import.meta.env.VITE_API_PREFIX ?? DEFAULT_API_PREFIX;
  const normalized = prefix.startsWith("/") ? prefix : `/${prefix}`;

  return normalized.replace(/\/+$/, "") || DEFAULT_API_PREFIX;
}

export function buildApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = getApiBaseUrl();
  const prefix = getApiPrefix();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrlIncludesPrefix = baseUrl.endsWith(prefix);

  if (normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)) {
    return baseUrlIncludesPrefix
      ? `${baseUrl}${normalizedPath.slice(prefix.length)}`
      : `${baseUrl}${normalizedPath}`;
  }

  return baseUrlIncludesPrefix
    ? `${baseUrl}${normalizedPath}`
    : `${baseUrl}${prefix}${normalizedPath}`;
}

export function getConfiguredCsrfCookieName(): string {
  return import.meta.env.VITE_CSRF_COOKIE_NAME ?? DEFAULT_CSRF_COOKIE_NAME;
}

export function getCookieValue(
  name: string,
  cookieSource = getDocumentCookie(),
): string | undefined {
  if (!cookieSource) {
    return undefined;
  }

  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = cookieSource
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  if (!cookie) {
    return undefined;
  }

  const rawValue = cookie.slice(prefix.length);

  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

export function getCsrfToken(): string | undefined {
  return getCookieValue(getConfiguredCsrfCookieName());
}

export async function apiRequest<TData>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TData> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  const body = serializeBody(options.body, headers);

  if (options.csrf && UNSAFE_METHODS.has(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers.set("x-csrf-token", csrfToken);
    }
  }

  let response: Response;
  try {
    response = await fetch(buildApiUrl(path), {
      ...options,
      body,
      credentials: options.credentials ?? "same-origin",
      headers,
      method,
    });
  } catch (error) {
    throw new ApiClientError({
      code: "NETWORK_ERROR",
      message: "Koneksi bermasalah. Periksa internet lalu coba lagi.",
      raw: error,
    });
  }

  const envelope = await readJsonEnvelope<TData>(response);

  if (!response.ok || !envelope.success) {
    throw toApiClientError(response, envelope);
  }

  return envelope.data;
}

export function publicApiRequest<TData>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TData> {
  return apiRequest<TData>(path, {
    ...options,
    credentials: options.credentials ?? "omit",
    csrf: false,
  });
}

export function adminApiRequest<TData>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TData> {
  const method = (options.method ?? "GET").toUpperCase();

  return apiRequest<TData>(path, {
    ...options,
    credentials: "include",
    csrf: options.csrf ?? UNSAFE_METHODS.has(method),
  });
}

export function authApiRequest<TData>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TData> {
  const method = (options.method ?? "GET").toUpperCase();

  return apiRequest<TData>(path, {
    ...options,
    credentials: "include",
    csrf: options.csrf ?? UNSAFE_METHODS.has(method),
  });
}

function getDocumentCookie(): string {
  return typeof document === "undefined" ? "" : document.cookie;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function getServerApiBaseUrl(): string {
  const runtime = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };

  return (
    runtime.process?.env?.API_INTERNAL_BASE_URL ??
    runtime.process?.env?.VITE_API_BASE_URL ??
    "http://127.0.0.1:3001"
  );
}

function serializeBody(body: unknown, headers: Headers): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (isBodyInit(body)) {
    return body;
  }

  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  return JSON.stringify(body);
}

function isBodyInit(value: unknown): value is BodyInit {
  return (
    typeof value === "string" ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer
  );
}

async function readJsonEnvelope<TData>(response: Response): Promise<ApiEnvelope<TData>> {
  const requestId = response.headers.get("x-request-id") ?? undefined;
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return {
      success: false,
      error: {
        code: response.ok ? "INTERNAL_ERROR" : statusToErrorCode(response.status),
        message: response.ok ? "Data belum bisa dibaca." : friendlyStatusMessage(response.status),
      },
      meta: { request_id: requestId },
    };
  }

  const payload: unknown = await response.json();

  if (isApiEnvelope<TData>(payload)) {
    return payload;
  }

  return {
    success: false,
    error: {
      code: response.ok ? "INTERNAL_ERROR" : statusToErrorCode(response.status),
      message: "Data belum bisa dibaca.",
    },
    meta: { request_id: requestId },
  };
}

function toApiClientError<TData>(response: Response, envelope: ApiEnvelope<TData>): ApiClientError {
  if (envelope.success) {
    return new ApiClientError({
      code: "BAD_RESPONSE",
      message: "Data belum bisa dibaca.",
      requestId: envelope.meta?.request_id,
      status: response.status,
      raw: envelope,
    });
  }

  return new ApiClientError({
    code: envelope.error.code,
    details: envelope.error.details,
    message: envelope.error.message,
    requestId: envelope.meta?.request_id,
    status: response.status,
    raw: envelope,
  });
}

function isApiEnvelope<TData>(value: unknown): value is ApiEnvelope<TData> {
  if (!isRecord(value) || typeof value.success !== "boolean") {
    return false;
  }

  if (value.success) {
    return "data" in value;
  }

  return isRecord(value.error) && typeof value.error.code === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function statusToErrorCode(status: number): ApiErrorCode {
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

function friendlyStatusMessage(status: number): string {
  switch (statusToErrorCode(status)) {
    case "RATE_LIMITED":
      return "Terlalu banyak aktivitas dalam waktu singkat. Tunggu sebentar lalu coba lagi.";
    case "UNAUTHENTICATED":
      return "Sesi Anda sudah berakhir. Silakan masuk kembali.";
    case "FORBIDDEN":
      return "Akun Anda belum memiliki akses untuk tindakan ini.";
    case "NOT_FOUND":
      return "Data tidak ditemukan.";
    case "SERVICE_UNAVAILABLE":
      return "Layanan sementara tidak tersedia. Coba lagi nanti.";
    case "UPSTREAM_ERROR":
    case "INTERNAL_ERROR":
      return "Sistem sedang mengalami kendala. Coba lagi nanti.";
    default:
      return "Permintaan belum bisa diproses.";
  }
}
