import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  adminApiRequest,
  apiRequest,
  authApiRequest,
  buildApiUrl,
  getApiPrefix,
  getCookieValue,
  isApiClientError,
  publicApiRequest,
} from "./api";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  headers.set("x-request-id", "req-test");

  return new Response(JSON.stringify(body), { ...init, headers });
}

describe("API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("normalizes API paths against base URL and prefix", () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.example.test/api/v1/");
    vi.stubEnv("VITE_API_PREFIX", "api/v1/");

    expect(getApiPrefix()).toBe("/api/v1");
    expect(buildApiUrl("/health")).toBe("https://api.example.test/api/v1/health");
    expect(buildApiUrl("/api/v1/health")).toBe("https://api.example.test/api/v1/health");
    expect(buildApiUrl("https://other.example.test/health")).toBe(
      "https://other.example.test/health",
    );
  });

  it("reads encoded cookie values and tolerates malformed encoding", () => {
    expect(getCookieValue("csrf", "theme=dark; csrf=token%20123")).toBe("token 123");
    expect(getCookieValue("csrf", "theme=dark; csrf=%E0%A4%A")).toBe("%E0%A4%A");
    expect(getCookieValue("missing", "theme=dark")).toBeUndefined();
    expect(getCookieValue("csrf", "")).toBeUndefined();
  });

  it("serializes JSON request bodies and unwraps success envelopes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ success: true, data: { ok: true } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/ping", { method: "post", body: { ping: true } })).resolves.toEqual({
      ok: true,
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    expect(init.body).toBe('{"ping":true}');
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
  });

  it("passes through FormData bodies without forcing JSON headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: "uploaded" }));
    const form = new FormData();
    form.set("file", new Blob(["a"]), "a.txt");
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/media", { body: form })).resolves.toBe("uploaded");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(form);
    expect(new Headers(init.headers).has("content-type")).toBe(false);
  });

  it("applies public, admin, and auth request credential defaults", async () => {
    const fetchMock = vi.fn().mockImplementation(() => {
      return Promise.resolve(jsonResponse({ success: true, data: null }));
    });
    vi.stubGlobal("fetch", fetchMock);

    await publicApiRequest("/public");
    await adminApiRequest("/admin", { method: "patch" });
    await authApiRequest("/auth", { method: "delete" });

    expect((fetchMock.mock.calls[0][1] as RequestInit).credentials).toBe("omit");
    expect((fetchMock.mock.calls[1][1] as RequestInit).credentials).toBe("include");
    expect((fetchMock.mock.calls[2][1] as RequestInit).credentials).toBe("include");
  });

  it("throws typed API errors for error envelopes and malformed responses", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Tidak ditemukan" },
            meta: { request_id: "req-json" },
          },
          { status: 404 },
        ),
      )
      .mockResolvedValueOnce(new Response("not-json", { status: 503, statusText: "Unavailable" }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: null }, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest("/missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Tidak ditemukan",
      requestId: "req-json",
      status: 404,
    });
    await expect(apiRequest("/unavailable")).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message: "Layanan sementara tidak tersedia. Coba lagi nanti.",
      status: 503,
    });
    await expect(apiRequest("/bad-success")).rejects.toMatchObject({
      code: "BAD_RESPONSE",
      status: 500,
    });
  });

  it("wraps network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(apiRequest("/offline")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message: "Koneksi bermasalah. Periksa internet lalu coba lagi.",
    });
  });

  it("detects ApiClientError instances", () => {
    const error = new ApiClientError({ code: "BAD_REQUEST", message: "Request gagal" });

    expect(isApiClientError(error)).toBe(true);
    expect(isApiClientError(new Error("plain"))).toBe(false);
  });
});
