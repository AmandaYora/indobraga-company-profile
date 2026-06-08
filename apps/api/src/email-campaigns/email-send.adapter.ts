import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmailAccount, EmailProviderType } from "@prisma/client";
import nodemailer from "nodemailer";
import type { Env } from "@/config/env";
import { SecretCryptoService } from "@/email-accounts/secret-crypto.service";

type SendInput = {
  account: EmailAccount;
  to: string;
  name?: string | null;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  attempt: number;
};

type SendResult = {
  status: "sent" | "temporary_failed" | "failed";
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
  responseMeta?: Record<string, string | number | boolean | null>;
};

@Injectable()
export class EmailSendAdapter {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly secrets: SecretCryptoService,
  ) {}

  async send(input: SendInput): Promise<SendResult> {
    if (this.config.get("EMAIL_PROVIDER_MODE", { infer: true }) === "mock") {
      return this.mockSend(input);
    }

    return input.account.provider === EmailProviderType.SMTP_HOSTING
      ? this.sendSmtp(input)
      : this.sendGoogle(input);
  }

  private mockSend(input: SendInput): SendResult {
    const email = input.to.toLowerCase();
    if (email.includes("tempfail") && input.attempt < this.maxAttempts()) {
      return {
        status: "temporary_failed",
        errorCode: "MOCK_TEMPORARY_FAILURE",
        errorMessage: "Mock temporary failure.",
        responseMeta: { attempt: input.attempt },
      };
    }

    if (email.includes("fail")) {
      return {
        status: "failed",
        errorCode: "MOCK_PERMANENT_FAILURE",
        errorMessage: "Mock permanent failure.",
        responseMeta: { attempt: input.attempt },
      };
    }

    return {
      status: "sent",
      messageId: `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      responseMeta: { provider_mode: "mock" },
    };
  }

  private async sendSmtp(input: SendInput): Promise<SendResult> {
    if (
      !input.account.smtpHost ||
      !input.account.smtpPort ||
      !input.account.encryptedSmtpPassword
    ) {
      return {
        status: "failed",
        errorCode: "SMTP_ACCOUNT_INCOMPLETE",
        errorMessage: "Konfigurasi SMTP tidak lengkap.",
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: input.account.smtpHost,
        port: input.account.smtpPort,
        secure: input.account.smtpSecurity === "SSL_TLS",
        requireTLS: input.account.smtpSecurity === "STARTTLS",
        auth: {
          user: input.account.smtpUsername ?? input.account.email,
          pass: this.secrets.decrypt(input.account.encryptedSmtpPassword),
        },
        connectionTimeout: this.config.get("SMTP_TEST_TIMEOUT_MS", { infer: true }),
        greetingTimeout: this.config.get("SMTP_TEST_TIMEOUT_MS", { infer: true }),
        socketTimeout: this.config.get("SMTP_TEST_TIMEOUT_MS", { infer: true }),
      });
      const displayName = this.headerSafe(input.account.displayName);
      const recipientName = this.headerSafe(input.name);
      const fromEmail = this.headerSafe(input.account.email);
      const toEmail = this.headerSafe(input.to);
      const result = await transporter.sendMail({
        from: `"${displayName}" <${fromEmail}>`,
        to: recipientName ? `"${recipientName}" <${toEmail}>` : toEmail,
        subject: this.headerSafe(input.subject),
        html: input.bodyHtml,
        text: input.bodyText ?? undefined,
      });

      return {
        status: "sent",
        messageId: result.messageId,
        responseMeta: { accepted: result.accepted.length, rejected: result.rejected.length },
      };
    } catch (error) {
      return {
        status: "temporary_failed",
        errorCode: "SMTP_SEND_FAILED",
        errorMessage: error instanceof Error ? error.message : "SMTP send failed.",
      };
    }
  }

  private async sendGoogle(input: SendInput): Promise<SendResult> {
    if (!input.account.encryptedAccessToken) {
      return {
        status: "failed",
        errorCode: "GOOGLE_TOKEN_MISSING",
        errorMessage: "Token Google tidak tersedia.",
      };
    }

    const displayName = this.headerSafe(input.account.displayName);
    const recipientName = this.headerSafe(input.name);
    const fromEmail = this.headerSafe(input.account.email);
    const toEmail = this.headerSafe(input.to);
    const rawMessage = [
      `From: "${displayName}" <${fromEmail}>`,
      `To: ${recipientName ? `"${recipientName}" <${toEmail}>` : toEmail}`,
      `Subject: ${this.headerSafe(input.subject)}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "",
      input.bodyHtml,
    ].join("\r\n");

    try {
      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.secrets.decrypt(input.account.encryptedAccessToken)}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ raw: Buffer.from(rawMessage).toString("base64url") }),
      });
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;

      if (!response.ok) {
        return {
          status: response.status >= 500 ? "temporary_failed" : "failed",
          errorCode: "GMAIL_SEND_FAILED",
          errorMessage: typeof body.error === "string" ? body.error : "Gmail API send failed.",
          responseMeta: { http_status: response.status },
        };
      }

      return {
        status: "sent",
        messageId: typeof body.id === "string" ? body.id : undefined,
        responseMeta: { provider: "gmail" },
      };
    } catch (error) {
      return {
        status: "temporary_failed",
        errorCode: "GMAIL_SEND_FAILED",
        errorMessage: error instanceof Error ? error.message : "Gmail API send failed.",
      };
    }
  }

  private maxAttempts(): number {
    return this.config.get("EMAIL_WORKER_MAX_ATTEMPTS", { infer: true });
  }

  /** Strip CR/LF so a crafted name/subject cannot inject extra mail headers. */
  private headerSafe(value: string | null | undefined): string {
    return (value ?? "").replace(/[\r\n]+/g, " ").trim();
  }
}
