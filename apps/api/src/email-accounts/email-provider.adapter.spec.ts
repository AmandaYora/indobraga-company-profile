import { BadGatewayException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "@/config/env";
import { EmailProviderAdapter } from "@/email-accounts/email-provider.adapter";

const config = (values: Record<string, unknown>): ConfigService<Env, true> =>
  ({
    get: jest.fn((key: string) => values[key]),
  }) as unknown as ConfigService<Env, true>;

describe("EmailProviderAdapter", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("exchanges Google code using mock provider mode", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    const adapter = new EmailProviderAdapter(config({ EMAIL_PROVIDER_MODE: "mock" }));

    const result = await adapter.exchangeGoogleCode("code-1", " Marketing@Indobraga.COM ");

    expect(result.email).toBe("marketing@indobraga.com");
    expect(result.subject).toMatch(/^mock-google-/);
    expect(result.accessToken).toBe("mock-access-code-1");
    expect(result.refreshToken).toBe("mock-refresh-code-1");
    expect(result.expiresAt).toEqual(new Date("2026-01-01T01:00:00.000Z"));
  });

  it("rejects insecure SMTP verification in production", async () => {
    const adapter = new EmailProviderAdapter(
      config({ NODE_ENV: "production", EMAIL_PROVIDER_MODE: "mock" }),
    );

    await expect(
      adapter.verifySmtp({
        host: "smtp.example.com",
        port: 25,
        security: "none",
        username: "user",
        password: "secret",
      }),
    ).resolves.toEqual({
      valid: false,
      message: "SMTP tanpa enkripsi tidak boleh digunakan di production.",
      error: "SMTP_INSECURE",
    });
  });

  it("simulates SMTP verification in mock provider mode", async () => {
    const adapter = new EmailProviderAdapter(
      config({ NODE_ENV: "development", EMAIL_PROVIDER_MODE: "mock" }),
    );

    await expect(
      adapter.verifySmtp({
        host: "smtp.example.com",
        port: 587,
        security: "starttls",
        username: "user",
        password: "secret",
      }),
    ).resolves.toEqual({ valid: true, message: "Koneksi SMTP berhasil." });

    await expect(
      adapter.verifySmtp({
        host: "fail.example.com",
        port: 587,
        security: "starttls",
        username: "user",
        password: "secret",
      }),
    ).resolves.toEqual({
      valid: false,
      message: "Koneksi SMTP gagal pada adapter mock.",
      error: "SMTP_MOCK_FAILED",
    });
  });

  it("throws upstream error when Google token exchange fails", async () => {
    const adapter = new EmailProviderAdapter(
      config({
        EMAIL_PROVIDER_MODE: "live",
        GOOGLE_OAUTH_CLIENT_ID: "client",
        GOOGLE_OAUTH_CLIENT_SECRET: "secret",
        GOOGLE_OAUTH_REDIRECT_URI: "https://example.com/callback",
      }),
    );
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "invalid_grant" }),
    }) as typeof fetch;

    await expect(adapter.exchangeGoogleCode("bad-code")).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
