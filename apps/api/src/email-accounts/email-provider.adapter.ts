import { BadGatewayException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer from "nodemailer";
import type { Env } from "@/config/env";
import { ApiSmtpSecurity } from "@/email-accounts/email-account-maps";

type GoogleExchangeResult = {
  email: string;
  subject: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
};

type SmtpVerificationInput = {
  host: string;
  port: number;
  security: ApiSmtpSecurity;
  username: string;
  password: string;
};

type SmtpVerificationResult = {
  valid: boolean;
  message: string;
  error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

@Injectable()
export class EmailProviderAdapter {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async exchangeGoogleCode(code: string, emailHint?: string): Promise<GoogleExchangeResult> {
    if (this.config.get("EMAIL_PROVIDER_MODE", { infer: true }) === "mock") {
      const normalizedEmail = emailHint?.trim().toLowerCase() || "marketing@indobraga.com";
      return {
        email: normalizedEmail,
        subject: `mock-google-${Buffer.from(normalizedEmail).toString("base64url").slice(0, 24)}`,
        accessToken: `mock-access-${code}`,
        refreshToken: `mock-refresh-${code}`,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      };
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.config.get("GOOGLE_OAUTH_CLIENT_ID", { infer: true }),
        client_secret: this.config.get("GOOGLE_OAUTH_CLIENT_SECRET", { infer: true }),
        code,
        grant_type: "authorization_code",
        redirect_uri: this.config.get("GOOGLE_OAUTH_REDIRECT_URI", { infer: true }),
      }),
    });
    const tokenBody: unknown = await tokenResponse.json();

    if (!tokenResponse.ok || !isRecord(tokenBody) || typeof tokenBody.access_token !== "string") {
      throw this.upstreamError("Google OAuth gagal menukar kode authorization.");
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { authorization: `Bearer ${tokenBody.access_token}` },
    });
    const profileBody: unknown = await profileResponse.json();

    if (!profileResponse.ok || !isRecord(profileBody) || typeof profileBody.email !== "string") {
      throw this.upstreamError("Google OAuth gagal mengambil profil email.");
    }

    return {
      email: profileBody.email.toLowerCase(),
      subject: typeof profileBody.sub === "string" ? profileBody.sub : profileBody.email,
      accessToken: tokenBody.access_token,
      refreshToken:
        typeof tokenBody.refresh_token === "string"
          ? tokenBody.refresh_token
          : `refresh-missing-${Date.now()}`,
      expiresAt: new Date(Date.now() + this.expiresInMs(tokenBody.expires_in)),
    };
  }

  async verifySmtp(input: SmtpVerificationInput): Promise<SmtpVerificationResult> {
    if (
      this.config.get("NODE_ENV", { infer: true }) === "production" &&
      input.security === "none"
    ) {
      return {
        valid: false,
        message: "SMTP tanpa enkripsi tidak boleh digunakan di production.",
        error: "SMTP_INSECURE",
      };
    }

    if (this.config.get("EMAIL_PROVIDER_MODE", { infer: true }) === "mock") {
      const invalid =
        input.host.toLowerCase().includes("fail") ||
        input.username.toLowerCase().includes("fail") ||
        input.password.toLowerCase().includes("fail");

      return invalid
        ? {
            valid: false,
            message: "Koneksi SMTP gagal pada adapter mock.",
            error: "SMTP_MOCK_FAILED",
          }
        : { valid: true, message: "Koneksi SMTP berhasil." };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: input.host,
        port: input.port,
        secure: input.security === "ssl_tls",
        requireTLS: input.security === "starttls",
        auth: {
          user: input.username,
          pass: input.password,
        },
        connectionTimeout: this.config.get("SMTP_TEST_TIMEOUT_MS", { infer: true }),
        greetingTimeout: this.config.get("SMTP_TEST_TIMEOUT_MS", { infer: true }),
        socketTimeout: this.config.get("SMTP_TEST_TIMEOUT_MS", { infer: true }),
      });

      await transporter.verify();
      return { valid: true, message: "Koneksi SMTP berhasil." };
    } catch (error) {
      return {
        valid: false,
        message: "Koneksi SMTP gagal.",
        error: error instanceof Error ? error.message : "SMTP_VERIFY_FAILED",
      };
    }
  }

  private expiresInMs(value: unknown): number {
    return typeof value === "number" && Number.isFinite(value) ? value * 1000 : 60 * 60 * 1000;
  }

  private upstreamError(message: string): BadGatewayException {
    return new BadGatewayException({
      code: "UPSTREAM_ERROR",
      message,
    });
  }
}
