import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailAccount, EmailAccountStatus, EmailProviderType, Prisma } from "@prisma/client";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { Env } from "@/config/env";
import { createPagePaginationMeta, normalizePagePagination } from "@/core/pagination";
import { PrismaService } from "@/database/prisma.service";
import { AuditService } from "@/audit/audit.service";
import { GoogleOAuthCallbackQueryDto } from "@/email-accounts/dto/google-oauth-callback-query.dto";
import { GoogleOAuthUrlDto } from "@/email-accounts/dto/google-oauth-url.dto";
import { ListEmailAccountsQueryDto } from "@/email-accounts/dto/list-email-accounts-query.dto";
import { SmtpAccountDto } from "@/email-accounts/dto/smtp-account.dto";
import { UpdateEmailAccountDto } from "@/email-accounts/dto/update-email-account.dto";
import {
  API_TO_PRISMA_EMAIL_PROVIDER,
  API_TO_PRISMA_EMAIL_STATUS,
  API_TO_PRISMA_SMTP_SECURITY,
  ApiSmtpSecurity,
  PRISMA_TO_API_EMAIL_PROVIDER,
  PRISMA_TO_API_EMAIL_STATUS,
  PRISMA_TO_API_SMTP_SECURITY,
} from "@/email-accounts/email-account-maps";
import { EmailProviderAdapter } from "@/email-accounts/email-provider.adapter";
import { SecretCryptoService } from "@/email-accounts/secret-crypto.service";

type Actor = {
  id?: number;
};

type OAuthStatePayload = {
  nonce: string;
  admin_user_id?: number;
  exp: number;
};

type SmtpCandidate = {
  email: string;
  displayName: string;
  host: string;
  port: number;
  security: ApiSmtpSecurity;
  username: string;
  password: string;
};

@Injectable()
export class EmailAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly audit: AuditService,
    private readonly provider: EmailProviderAdapter,
    private readonly secrets: SecretCryptoService,
  ) {}

  async list(query: ListEmailAccountsQueryDto) {
    const pagination = normalizePagePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 10,
      maxLimit: 100,
    });
    const where: Prisma.EmailAccountWhereInput = {
      ...(query.provider ? { provider: API_TO_PRISMA_EMAIL_PROVIDER[query.provider] } : {}),
      ...(query.status ? { status: API_TO_PRISMA_EMAIL_STATUS[query.status] } : {}),
      ...(query.q
        ? {
            OR: [
              { email: { contains: query.q } },
              { displayName: { contains: query.q } },
              { smtpHost: { contains: query.q } },
              { smtpUsername: { contains: query.q } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.emailAccount.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.emailAccount.count({ where }),
    ]);

    return {
      items: items.map((item) => this.present(item)),
      pagination: createPagePaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async createGoogleOAuthUrl(dto: GoogleOAuthUrlDto, actor: Actor) {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const state = this.signOAuthState({
      nonce: randomBytes(24).toString("base64url"),
      admin_user_id: actor.id,
      exp: expiresAt.getTime(),
    });

    await this.prisma.emailOAuthState.create({
      data: {
        stateHash: this.hash(state),
        adminUserId: actor.id,
        emailHint: dto.email_hint?.toLowerCase(),
        displayName: dto.display_name,
        expiresAt,
      },
    });

    return {
      authorization_url: this.buildGoogleAuthorizationUrl(state, dto.email_hint),
      state_expires_at: expiresAt,
    };
  }

  async handleGoogleCallback(query: GoogleOAuthCallbackQueryDto): Promise<string> {
    if (query.error) {
      await this.consumeOAuthState(query.state);
      return this.redirectUrl("error", "oauth_denied");
    }

    if (!query.code) {
      await this.consumeOAuthState(query.state);
      return this.redirectUrl("error", "missing_code");
    }

    const state = await this.validateOAuthState(query.state);
    if (!state) {
      return this.redirectUrl("error", "invalid_state");
    }

    try {
      const tokens = await this.provider.exchangeGoogleCode(
        query.code,
        state.emailHint ?? undefined,
      );
      const now = new Date();
      const account = await this.prisma.emailAccount.upsert({
        where: {
          provider_email: {
            provider: EmailProviderType.GOOGLE_OAUTH,
            email: tokens.email,
          },
        },
        create: {
          provider: EmailProviderType.GOOGLE_OAUTH,
          email: tokens.email,
          displayName: state.displayName ?? tokens.email,
          status: EmailAccountStatus.CONNECTED,
          googleSubject: tokens.subject,
          encryptedAccessToken: this.secrets.encrypt(tokens.accessToken),
          encryptedRefreshToken: this.secrets.encrypt(tokens.refreshToken),
          tokenExpiresAt: tokens.expiresAt,
          lastTestAt: now,
          connectedAt: now,
          lastError: null,
        },
        update: {
          displayName: state.displayName ?? tokens.email,
          status: EmailAccountStatus.CONNECTED,
          googleSubject: tokens.subject,
          encryptedAccessToken: this.secrets.encrypt(tokens.accessToken),
          encryptedRefreshToken: this.secrets.encrypt(tokens.refreshToken),
          tokenExpiresAt: tokens.expiresAt,
          lastTestAt: now,
          connectedAt: now,
          lastError: null,
        },
      });

      await this.prisma.emailOAuthState.update({
        where: { id: state.id },
        data: { consumedAt: now },
      });
      await this.recordMutation(
        { id: state.adminUserId ?? undefined },
        "email_account.google_connected",
        account.id,
        { email: account.email },
      );

      return this.redirectUrl("success", "google");
    } catch {
      await this.prisma.emailOAuthState.update({
        where: { id: state.id },
        data: { consumedAt: new Date() },
      });
      return this.redirectUrl("error", "provider_failed");
    }
  }

  async testSmtp(dto: SmtpAccountDto) {
    const result = await this.provider.verifySmtp({
      host: dto.smtp_host,
      port: dto.smtp_port,
      security: dto.smtp_security,
      username: dto.smtp_username,
      password: dto.smtp_password,
    });

    return {
      valid: result.valid,
      message: result.message,
    };
  }

  async createSmtp(dto: SmtpAccountDto, actor: Actor) {
    const candidate = this.smtpCandidateFromDto(dto);
    const verification = await this.provider.verifySmtp({
      host: candidate.host,
      port: candidate.port,
      security: candidate.security,
      username: candidate.username,
      password: candidate.password,
    });

    if (!verification.valid) {
      throw this.unprocessable(verification.message);
    }

    const now = new Date();
    const account = await this.writeAccount(() =>
      this.prisma.emailAccount.upsert({
        where: {
          provider_email: {
            provider: EmailProviderType.SMTP_HOSTING,
            email: candidate.email,
          },
        },
        create: {
          provider: EmailProviderType.SMTP_HOSTING,
          email: candidate.email,
          displayName: candidate.displayName,
          status: EmailAccountStatus.CONNECTED,
          smtpHost: candidate.host,
          smtpPort: candidate.port,
          smtpSecurity: API_TO_PRISMA_SMTP_SECURITY[candidate.security],
          smtpUsername: candidate.username,
          encryptedSmtpPassword: this.secrets.encrypt(candidate.password),
          lastTestAt: now,
          connectedAt: now,
          lastError: null,
        },
        update: {
          displayName: candidate.displayName,
          status: EmailAccountStatus.CONNECTED,
          smtpHost: candidate.host,
          smtpPort: candidate.port,
          smtpSecurity: API_TO_PRISMA_SMTP_SECURITY[candidate.security],
          smtpUsername: candidate.username,
          encryptedSmtpPassword: this.secrets.encrypt(candidate.password),
          lastTestAt: now,
          connectedAt: now,
          lastError: null,
        },
      }),
    );
    await this.recordMutation(actor, "email_account.smtp_connected", account.id, {
      email: account.email,
      host: account.smtpHost ?? undefined,
    });

    return this.present(account);
  }

  async update(id: number, dto: UpdateEmailAccountDto, actor: Actor) {
    const account = await this.findAccount(id);

    if (account.provider === EmailProviderType.GOOGLE_OAUTH) {
      this.assertNoSmtpPatch(dto);
      const updated = await this.writeAccount(() =>
        this.prisma.emailAccount.update({
          where: { id },
          data: {
            displayName: dto.display_name ?? undefined,
            status: dto.status ? API_TO_PRISMA_EMAIL_STATUS[dto.status] : undefined,
            connectedAt: dto.status === "connected" ? new Date() : undefined,
            lastError: dto.status === "connected" ? null : undefined,
          },
        }),
      );
      await this.recordMutation(actor, "email_account.google_update", id, {
        status: dto.status,
      });

      return this.present(updated);
    }

    const hasSmtpPatch = this.hasSmtpPatch(dto);
    const smtpPassword = dto.smtp_password ?? this.decryptExistingSmtpPassword(account);
    const candidate: SmtpCandidate = {
      email: (dto.email_address ?? account.email).toLowerCase(),
      displayName: dto.display_name ?? account.displayName,
      host: dto.smtp_host ?? account.smtpHost ?? "",
      port: dto.smtp_port ?? account.smtpPort ?? 0,
      security:
        dto.smtp_security ??
        (account.smtpSecurity ? PRISMA_TO_API_SMTP_SECURITY[account.smtpSecurity] : "ssl_tls"),
      username: dto.smtp_username ?? account.smtpUsername ?? "",
      password: smtpPassword,
    };

    let lastTestAt: Date | undefined;
    if (hasSmtpPatch) {
      const verification = await this.provider.verifySmtp({
        host: candidate.host,
        port: candidate.port,
        security: candidate.security,
        username: candidate.username,
        password: candidate.password,
      });
      if (!verification.valid) {
        throw this.unprocessable(verification.message);
      }
      lastTestAt = new Date();
    }

    const updated = await this.writeAccount(() =>
      this.prisma.emailAccount.update({
        where: { id },
        data: {
          email: dto.email_address ? candidate.email : undefined,
          displayName: dto.display_name ?? undefined,
          status: dto.status ? API_TO_PRISMA_EMAIL_STATUS[dto.status] : undefined,
          smtpHost: dto.smtp_host ?? undefined,
          smtpPort: dto.smtp_port ?? undefined,
          smtpSecurity: dto.smtp_security
            ? API_TO_PRISMA_SMTP_SECURITY[dto.smtp_security]
            : undefined,
          smtpUsername: dto.smtp_username ?? undefined,
          encryptedSmtpPassword: dto.smtp_password
            ? this.secrets.encrypt(dto.smtp_password)
            : undefined,
          lastTestAt,
          connectedAt:
            dto.status === "connected" || hasSmtpPatch ? (lastTestAt ?? new Date()) : undefined,
          lastError: dto.status === "connected" || hasSmtpPatch ? null : undefined,
        },
      }),
    );
    await this.recordMutation(actor, "email_account.smtp_update", id, {
      status: dto.status,
      smtp_retested: hasSmtpPatch,
    });

    return this.present(updated);
  }

  async reconnect(id: number, actor: Actor) {
    const account = await this.findAccount(id);

    if (account.provider === EmailProviderType.GOOGLE_OAUTH) {
      return this.createGoogleOAuthUrl(
        {
          email_hint: account.email,
          display_name: account.displayName,
        },
        actor,
      );
    }

    return {
      provider: "smtp",
      action: "update_credentials",
      message: "Perbarui konfigurasi SMTP lalu jalankan test ulang.",
    };
  }

  async disable(id: number, actor: Actor) {
    await this.findAccount(id);
    const account = await this.prisma.emailAccount.update({
      where: { id },
      data: {
        status: EmailAccountStatus.DISABLED,
      },
    });
    await this.recordMutation(actor, "email_account.disable", id, { email: account.email });

    return this.present(account);
  }

  private present(account: EmailAccount) {
    return {
      id: account.id,
      provider: PRISMA_TO_API_EMAIL_PROVIDER[account.provider],
      auth_type: account.provider === EmailProviderType.GOOGLE_OAUTH ? "oauth" : "smtp",
      email_address: account.email,
      display_name: account.displayName,
      status: PRISMA_TO_API_EMAIL_STATUS[account.status],
      smtp_host: account.provider === EmailProviderType.SMTP_HOSTING ? account.smtpHost : null,
      smtp_port: account.provider === EmailProviderType.SMTP_HOSTING ? account.smtpPort : null,
      smtp_security:
        account.provider === EmailProviderType.SMTP_HOSTING && account.smtpSecurity
          ? PRISMA_TO_API_SMTP_SECURITY[account.smtpSecurity]
          : null,
      smtp_username:
        account.provider === EmailProviderType.SMTP_HOSTING ? account.smtpUsername : null,
      last_validated_at: account.lastTestAt,
      connected_at: account.connectedAt,
      last_error: account.lastError,
      created_at: account.createdAt,
      updated_at: account.updatedAt,
    };
  }

  private smtpCandidateFromDto(dto: SmtpAccountDto): SmtpCandidate {
    return {
      email: dto.email_address.toLowerCase(),
      displayName: dto.display_name,
      host: dto.smtp_host,
      port: dto.smtp_port,
      security: dto.smtp_security,
      username: dto.smtp_username,
      password: dto.smtp_password,
    };
  }

  private async findAccount(id: number): Promise<EmailAccount> {
    const account = await this.prisma.emailAccount.findUnique({ where: { id } });
    if (!account) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Akun pengirim email tidak ditemukan.",
      });
    }

    return account;
  }

  private assertNoSmtpPatch(dto: UpdateEmailAccountDto): void {
    if (this.hasSmtpPatch(dto) || dto.email_address) {
      throw new BadRequestException({
        code: "BAD_REQUEST",
        message: "Akun Google perlu dihubungkan ulang untuk mengubah aksesnya.",
      });
    }
  }

  private hasSmtpPatch(dto: UpdateEmailAccountDto): boolean {
    return (
      dto.email_address !== undefined ||
      dto.smtp_host !== undefined ||
      dto.smtp_port !== undefined ||
      dto.smtp_security !== undefined ||
      dto.smtp_username !== undefined ||
      dto.smtp_password !== undefined
    );
  }

  private decryptExistingSmtpPassword(account: EmailAccount): string {
    if (!account.encryptedSmtpPassword) {
      throw this.unprocessable("Kata sandi email wajib diisi untuk mengecek ulang koneksi.");
    }

    return this.secrets.decrypt(account.encryptedSmtpPassword);
  }

  private async writeAccount(operation: () => Promise<EmailAccount>): Promise<EmailAccount> {
    try {
      return await operation();
    } catch (error) {
      if (this.isUniqueError(error)) {
        throw new ConflictException({
          code: "CONFLICT",
          message: "Akun pengirim dengan alamat email tersebut sudah ada.",
        });
      }
      throw error;
    }
  }

  private isUniqueError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }

  private async validateOAuthState(state: string) {
    const payload = this.verifyOAuthStateSignature(state);
    if (!payload) {
      return null;
    }

    const stored = await this.prisma.emailOAuthState.findUnique({
      where: { stateHash: this.hash(state) },
    });
    if (
      !stored ||
      stored.consumedAt ||
      stored.expiresAt.getTime() <= Date.now() ||
      stored.adminUserId !== (payload.admin_user_id ?? null)
    ) {
      return null;
    }

    return stored;
  }

  private async consumeOAuthState(state: string): Promise<void> {
    await this.prisma.emailOAuthState.updateMany({
      where: {
        stateHash: this.hash(state),
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });
  }

  private signOAuthState(payload: OAuthStatePayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = this.sign(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  private verifyOAuthStateSignature(state: string): OAuthStatePayload | null {
    const [encodedPayload, signature] = state.split(".");
    if (!encodedPayload || !signature) {
      return null;
    }

    const expected = this.sign(encodedPayload);
    if (!this.safeEqual(signature, expected)) {
      return null;
    }

    try {
      const payload = JSON.parse(
        Buffer.from(encodedPayload, "base64url").toString("utf8"),
      ) as OAuthStatePayload;

      if (
        typeof payload.nonce !== "string" ||
        typeof payload.exp !== "number" ||
        payload.exp <= Date.now()
      ) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private buildGoogleAuthorizationUrl(state: string, emailHint?: string): string {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set(
      "client_id",
      this.config.get("GOOGLE_OAUTH_CLIENT_ID", { infer: true }) || "mock-google-client",
    );
    url.searchParams.set(
      "redirect_uri",
      this.config.get("GOOGLE_OAUTH_REDIRECT_URI", { infer: true }),
    );
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email https://www.googleapis.com/auth/gmail.send");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);
    if (emailHint) {
      url.searchParams.set("login_hint", emailHint);
    }

    return url.toString();
  }

  private redirectUrl(status: "success" | "error", reason: string): string {
    const url = new URL(
      "/admin/email-accounts",
      this.config.get("PUBLIC_SITE_URL", { infer: true }),
    );
    url.searchParams.set("connected", "google");
    url.searchParams.set("status", status);
    if (status === "error") {
      url.searchParams.set("reason", reason);
    }

    return url.toString();
  }

  private sign(value: string): string {
    return createHmac("sha256", this.config.get("SESSION_SECRET", { infer: true }))
      .update(value)
      .digest("base64url");
  }

  private hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  private safeEqual(actual: string, expected: string): boolean {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);

    return (
      actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
    );
  }

  private async recordMutation(
    actor: Actor,
    action: string,
    resourceId: number,
    metadata?: Prisma.InputJsonObject,
  ): Promise<void> {
    await this.audit.record({
      actorUserId: actor.id,
      action,
      resourceType: "email-accounts",
      resourceId,
      metadata,
    });
  }

  private unprocessable(message: string): UnprocessableEntityException {
    return new UnprocessableEntityException({
      code: "UNPROCESSABLE_ENTITY",
      message,
    });
  }
}
