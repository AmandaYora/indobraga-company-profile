import {
  BadRequestException,
  ConflictException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { EmailAccountStatus, EmailProviderType, Prisma, SmtpSecurityMode } from "@prisma/client";
import type { AuditService } from "@/audit/audit.service";
import { EmailAccountsService } from "@/email-accounts/email-accounts.service";
import type { EmailProviderAdapter } from "@/email-accounts/email-provider.adapter";
import type { SecretCryptoService } from "@/email-accounts/secret-crypto.service";

const now = new Date("2026-05-11T00:00:00.000Z");

const firstMockArg = <T>(mock: jest.Mock): T => {
  const calls = mock.mock.calls as unknown[][];
  return calls[0]?.[0] as T;
};

const prismaMock = () => ({
  $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
  emailAccount: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  emailOAuthState: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
});

const configMock = () => ({
  get: jest.fn((key: string) => {
    const values: Record<string, string> = {
      GOOGLE_OAUTH_CLIENT_ID: "google-client-id",
      GOOGLE_OAUTH_REDIRECT_URI: "https://indobraga.example.test/api/v1/oauth/google/callback",
      PUBLIC_SITE_URL: "https://indobraga.example.test",
      SESSION_SECRET: "test-session-secret",
    };

    return values[key];
  }),
});

const auditMock = () => ({
  record: jest.fn().mockResolvedValue(undefined),
});

const providerMock = () => ({
  exchangeGoogleCode: jest.fn(),
  verifySmtp: jest.fn(),
});

const secretsMock = () => ({
  decrypt: jest.fn((value: string) => `decrypted:${value}`),
  encrypt: jest.fn((value: string) => `encrypted:${value}`),
});

const emailAccount = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  provider: EmailProviderType.SMTP_HOSTING,
  email: "support@indobraga.com",
  displayName: "Support Indobraga",
  status: EmailAccountStatus.CONNECTED,
  googleSubject: null,
  encryptedAccessToken: null,
  encryptedRefreshToken: null,
  tokenExpiresAt: null,
  smtpHost: "smtp.indobraga.com",
  smtpPort: 465,
  smtpSecurity: SmtpSecurityMode.SSL_TLS,
  smtpUsername: "support@indobraga.com",
  encryptedSmtpPassword: "secret",
  lastTestAt: now,
  connectedAt: now,
  lastError: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const buildService = () => {
  const prisma = prismaMock();
  const config = configMock();
  const audit = auditMock();
  const provider = providerMock();
  const secrets = secretsMock();
  const service = new EmailAccountsService(
    prisma as never,
    config as never,
    audit as unknown as AuditService,
    provider as unknown as EmailProviderAdapter,
    secrets as unknown as SecretCryptoService,
  );

  return { audit, config, prisma, provider, secrets, service };
};

describe("EmailAccountsService", () => {
  it("lists email accounts with provider, status, search filters, and API field mapping", async () => {
    const { prisma, service } = buildService();
    prisma.emailAccount.findMany.mockResolvedValue([
      emailAccount({
        id: 11,
        smtpSecurity: SmtpSecurityMode.STARTTLS,
        status: EmailAccountStatus.NEEDS_RECONNECT,
      }),
    ]);
    prisma.emailAccount.count.mockResolvedValue(1);

    await expect(
      service.list({
        limit: 5,
        page: 2,
        provider: "smtp",
        q: "support",
        status: "needs_reconnect",
      }),
    ).resolves.toEqual({
      items: [
        {
          id: 11,
          provider: "smtp",
          auth_type: "smtp",
          email_address: "support@indobraga.com",
          display_name: "Support Indobraga",
          status: "needs_reconnect",
          smtp_host: "smtp.indobraga.com",
          smtp_port: 465,
          smtp_security: "starttls",
          smtp_username: "support@indobraga.com",
          last_validated_at: now,
          connected_at: now,
          last_error: null,
          created_at: now,
          updated_at: now,
        },
      ],
      pagination: {
        limit: 5,
        page: 2,
        total: 1,
        total_pages: 1,
      },
    });

    const findManyArg = firstMockArg<{
      skip: number;
      take: number;
      where: Record<string, unknown>;
    }>(prisma.emailAccount.findMany);
    expect(findManyArg.skip).toBe(5);
    expect(findManyArg.take).toBe(5);
    expect(findManyArg.where).toMatchObject({
      provider: EmailProviderType.SMTP_HOSTING,
      status: EmailAccountStatus.NEEDS_RECONNECT,
      OR: [
        { email: { contains: "support" } },
        { displayName: { contains: "support" } },
        { smtpHost: { contains: "support" } },
        { smtpUsername: { contains: "support" } },
      ],
    });
  });

  it("creates SMTP accounts after provider verification and records audit metadata", async () => {
    const { audit, prisma, provider, secrets, service } = buildService();
    provider.verifySmtp.mockResolvedValue({ valid: true, message: "OK" });
    prisma.emailAccount.upsert.mockResolvedValue(emailAccount());

    await expect(
      service.createSmtp(
        {
          display_name: "Support Indobraga",
          email_address: "Support@Indobraga.com",
          smtp_host: "smtp.indobraga.com",
          smtp_password: "plain-password",
          smtp_port: 465,
          smtp_security: "ssl_tls",
          smtp_username: "support@indobraga.com",
        },
        { id: 9 },
      ),
    ).resolves.toMatchObject({
      email_address: "support@indobraga.com",
      provider: "smtp",
      status: "connected",
    });

    expect(provider.verifySmtp).toHaveBeenCalledWith({
      host: "smtp.indobraga.com",
      password: "plain-password",
      port: 465,
      security: "ssl_tls",
      username: "support@indobraga.com",
    });
    expect(secrets.encrypt).toHaveBeenCalledWith("plain-password");
    const upsertArg = firstMockArg<{
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    }>(prisma.emailAccount.upsert);
    expect(upsertArg.create).toMatchObject({
      email: "support@indobraga.com",
      provider: EmailProviderType.SMTP_HOSTING,
      smtpSecurity: SmtpSecurityMode.SSL_TLS,
      status: EmailAccountStatus.CONNECTED,
    });
    expect(upsertArg.update).toMatchObject({
      smtpHost: "smtp.indobraga.com",
      status: EmailAccountStatus.CONNECTED,
    });
    expect("email" in upsertArg.update).toBe(false);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "email_account.smtp_connected",
        actorUserId: 9,
        metadata: { email: "support@indobraga.com", host: "smtp.indobraga.com" },
        resourceId: 10,
      }),
    );
  });

  it("rejects SMTP creation when provider verification fails", async () => {
    const { prisma, provider, service } = buildService();
    provider.verifySmtp.mockResolvedValue({ valid: false, message: "Koneksi gagal" });

    await expect(
      service.createSmtp(
        {
          display_name: "Support",
          email_address: "support@indobraga.com",
          smtp_host: "fail.indobraga.com",
          smtp_password: "plain-password",
          smtp_port: 587,
          smtp_security: "starttls",
          smtp_username: "support@indobraga.com",
        },
        { id: 9 },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prisma.emailAccount.upsert).not.toHaveBeenCalled();
  });

  it("maps unique email/provider write failures to conflict", async () => {
    const { provider, prisma, service } = buildService();
    provider.verifySmtp.mockResolvedValue({ valid: true, message: "OK" });
    prisma.emailAccount.upsert.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique failed", {
        clientVersion: "test",
        code: "P2002",
      }),
    );

    await expect(
      service.createSmtp(
        {
          display_name: "Support",
          email_address: "support@indobraga.com",
          smtp_host: "smtp.indobraga.com",
          smtp_password: "plain-password",
          smtp_port: 465,
          smtp_security: "ssl_tls",
          smtp_username: "support@indobraga.com",
        },
        { id: 9 },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects SMTP field patches for Google OAuth accounts", async () => {
    const { prisma, service } = buildService();
    prisma.emailAccount.findUnique.mockResolvedValue(
      emailAccount({
        provider: EmailProviderType.GOOGLE_OAUTH,
        smtpHost: null,
        smtpPort: null,
        smtpSecurity: null,
        smtpUsername: null,
      }),
    );

    await expect(
      service.update(10, { smtp_host: "smtp.indobraga.com" }, { id: 9 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.emailAccount.update).not.toHaveBeenCalled();
  });

  it("updates SMTP accounts by decrypting existing password and retesting changed settings", async () => {
    const { audit, prisma, provider, secrets, service } = buildService();
    prisma.emailAccount.findUnique.mockResolvedValue(emailAccount());
    prisma.emailAccount.update.mockResolvedValue(
      emailAccount({
        smtpHost: "smtp2.indobraga.com",
      }),
    );
    provider.verifySmtp.mockResolvedValue({ valid: true, message: "OK" });

    await expect(
      service.update(10, { smtp_host: "smtp2.indobraga.com", status: "connected" }, { id: 9 }),
    ).resolves.toMatchObject({
      smtp_host: "smtp2.indobraga.com",
      status: "connected",
    });

    expect(secrets.decrypt).toHaveBeenCalledWith("secret");
    expect(provider.verifySmtp).toHaveBeenCalledWith({
      host: "smtp2.indobraga.com",
      password: "decrypted:secret",
      port: 465,
      security: "ssl_tls",
      username: "support@indobraga.com",
    });
    const updateArg = firstMockArg<{ data: Record<string, unknown> }>(prisma.emailAccount.update);
    expect(updateArg.data).toMatchObject({
      lastError: null,
      smtpHost: "smtp2.indobraga.com",
      status: EmailAccountStatus.CONNECTED,
    });
    expect(updateArg.data.connectedAt).toBeInstanceOf(Date);
    expect(updateArg.data.lastTestAt).toBeInstanceOf(Date);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "email_account.smtp_update",
        metadata: { smtp_retested: true, status: "connected" },
      }),
    );
  });

  it("disables an existing account and records the mutation", async () => {
    const { audit, prisma, service } = buildService();
    prisma.emailAccount.findUnique.mockResolvedValue(emailAccount());
    prisma.emailAccount.update.mockResolvedValue(
      emailAccount({ status: EmailAccountStatus.DISABLED }),
    );

    await expect(service.disable(10, { id: 9 })).resolves.toMatchObject({
      id: 10,
      status: "disabled",
    });
    expect(prisma.emailAccount.update).toHaveBeenCalledWith({
      data: { status: EmailAccountStatus.DISABLED },
      where: { id: 10 },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "email_account.disable",
        metadata: { email: "support@indobraga.com" },
      }),
    );
  });

  it("handles a successful Google OAuth callback and consumes state", async () => {
    const { audit, prisma, provider, secrets, service } = buildService();
    prisma.emailOAuthState.create.mockResolvedValue({});
    const oauth = await service.createGoogleOAuthUrl(
      { display_name: "Marketing", email_hint: "Marketing@Indobraga.com" },
      { id: 9 },
    );
    const state = new URL(oauth.authorization_url).searchParams.get("state") ?? "";
    prisma.emailOAuthState.findUnique.mockResolvedValue({
      id: 21,
      adminUserId: 9,
      consumedAt: null,
      displayName: "Marketing",
      emailHint: "marketing@indobraga.com",
      expiresAt: new Date(Date.now() + 60_000),
    });
    provider.exchangeGoogleCode.mockResolvedValue({
      accessToken: "google-access",
      email: "marketing@indobraga.com",
      expiresAt: new Date(Date.now() + 3_600_000),
      refreshToken: "google-refresh",
      subject: "google-subject",
    });
    prisma.emailAccount.upsert.mockResolvedValue(
      emailAccount({
        id: 12,
        displayName: "Marketing",
        email: "marketing@indobraga.com",
        provider: EmailProviderType.GOOGLE_OAUTH,
        smtpHost: null,
        smtpPort: null,
        smtpSecurity: null,
        smtpUsername: null,
      }),
    );
    prisma.emailOAuthState.update.mockResolvedValue({});

    await expect(service.handleGoogleCallback({ code: "auth-code", state })).resolves.toBe(
      "https://indobraga.example.test/admin/email-accounts?connected=google&status=success",
    );
    expect(provider.exchangeGoogleCode).toHaveBeenCalledWith(
      "auth-code",
      "marketing@indobraga.com",
    );
    expect(secrets.encrypt).toHaveBeenCalledWith("google-access");
    expect(secrets.encrypt).toHaveBeenCalledWith("google-refresh");
    const stateUpdateArg = firstMockArg<{
      data: { consumedAt: unknown };
      where: { id: number };
    }>(prisma.emailOAuthState.update);
    expect(stateUpdateArg.data.consumedAt).toBeInstanceOf(Date);
    expect(stateUpdateArg.where).toEqual({ id: 21 });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "email_account.google_connected",
        actorUserId: 9,
        metadata: { email: "marketing@indobraga.com" },
        resourceId: 12,
      }),
    );
  });
});
