import { ConfigService } from "@nestjs/config";
import {
  EmailAccount,
  EmailAccountStatus,
  EmailProviderType,
  SmtpSecurityMode,
} from "@prisma/client";
import type { Env } from "@/config/env";
import { EmailSendAdapter } from "@/email-campaigns/email-send.adapter";
import { SecretCryptoService } from "@/email-accounts/secret-crypto.service";

const config = (values: Record<string, unknown>): ConfigService<Env, true> =>
  ({
    get: jest.fn((key: string) => values[key]),
  }) as unknown as ConfigService<Env, true>;

const account = (overrides: Partial<EmailAccount> = {}): EmailAccount => ({
  id: 1,
  provider: EmailProviderType.SMTP_HOSTING,
  email: "marketing@indobraga.com",
  displayName: "Indobraga",
  status: EmailAccountStatus.CONNECTED,
  googleSubject: null,
  encryptedAccessToken: null,
  encryptedRefreshToken: null,
  tokenExpiresAt: null,
  smtpHost: "smtp.example.com",
  smtpPort: 587,
  smtpSecurity: SmtpSecurityMode.STARTTLS,
  smtpUsername: "marketing@indobraga.com",
  encryptedSmtpPassword: "encrypted-password",
  lastTestAt: null,
  connectedAt: null,
  lastError: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const input = (overrides: Partial<Parameters<EmailSendAdapter["send"]>[0]> = {}) => ({
  account: account(),
  to: "lead@example.com",
  name: "Lead",
  subject: "Halo",
  bodyHtml: "<p>Halo</p>",
  bodyText: "Halo",
  attempt: 1,
  ...overrides,
});

describe("EmailSendAdapter", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("sends successful mock emails", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    jest.spyOn(Math, "random").mockReturnValue(0.5);
    const adapter = new EmailSendAdapter(
      config({ EMAIL_PROVIDER_MODE: "mock", EMAIL_WORKER_MAX_ATTEMPTS: 3 }),
      {} as SecretCryptoService,
    );

    const result = await adapter.send(input());

    expect(result.status).toBe("sent");
    expect(result.messageId).toMatch(/^mock-/);
    expect(result.responseMeta).toEqual({ provider_mode: "mock" });
  });

  it("returns temporary and permanent failures in mock mode", async () => {
    const adapter = new EmailSendAdapter(
      config({ EMAIL_PROVIDER_MODE: "mock", EMAIL_WORKER_MAX_ATTEMPTS: 3 }),
      {} as SecretCryptoService,
    );

    await expect(adapter.send(input({ to: "tempfail@example.com", attempt: 1 }))).resolves.toEqual({
      status: "temporary_failed",
      errorCode: "MOCK_TEMPORARY_FAILURE",
      errorMessage: "Mock temporary failure.",
      responseMeta: { attempt: 1 },
    });

    await expect(adapter.send(input({ to: "fail@example.com", attempt: 3 }))).resolves.toEqual({
      status: "failed",
      errorCode: "MOCK_PERMANENT_FAILURE",
      errorMessage: "Mock permanent failure.",
      responseMeta: { attempt: 3 },
    });
  });

  it("fails incomplete SMTP account in live mode before network access", async () => {
    const adapter = new EmailSendAdapter(
      config({ EMAIL_PROVIDER_MODE: "live" }),
      {} as SecretCryptoService,
    );

    await expect(
      adapter.send(input({ account: account({ smtpHost: null, encryptedSmtpPassword: null }) })),
    ).resolves.toEqual({
      status: "failed",
      errorCode: "SMTP_ACCOUNT_INCOMPLETE",
      errorMessage: "Konfigurasi SMTP tidak lengkap.",
    });
  });

  it("fails Google account without access token in live mode before network access", async () => {
    const adapter = new EmailSendAdapter(
      config({ EMAIL_PROVIDER_MODE: "live" }),
      {} as SecretCryptoService,
    );

    await expect(
      adapter.send(
        input({
          account: account({
            provider: EmailProviderType.GOOGLE_OAUTH,
            encryptedAccessToken: null,
          }),
        }),
      ),
    ).resolves.toEqual({
      status: "failed",
      errorCode: "GOOGLE_TOKEN_MISSING",
      errorMessage: "Token Google tidak tersedia.",
    });
  });
});
