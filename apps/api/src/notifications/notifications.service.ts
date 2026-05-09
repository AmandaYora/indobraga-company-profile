import { Injectable, Logger, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  EmailAccount,
  EmailAccountStatus,
  EmailProviderType,
  Notification,
  NotificationEmailJob,
  NotificationEmailJobStatus,
  NotificationSeverity,
  NotificationType,
  Prisma,
  SmtpSecurityMode,
} from "@prisma/client";
import nodemailer from "nodemailer";
import type { Env } from "@/config/env";
import { createPagePaginationMeta, normalizePagePagination } from "@/core/pagination";
import { PrismaService } from "@/database/prisma.service";
import { SecretCryptoService } from "@/email-accounts/secret-crypto.service";
import { ListNotificationsQueryDto } from "@/notifications/dto/list-notifications-query.dto";
import { NotificationStreamService } from "@/notifications/notification-stream.service";

type NotificationCreateInput = {
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: number;
  actorType?: string;
  actorId?: number;
  email?: {
    recipientEmail: string;
    subject: string;
    bodyText: string;
    bodyHtml?: string;
  };
};

type InquiryNotificationInput = {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string | null;
  message: string;
};

type WhatsAppNotificationInput = {
  id: number;
  name: string;
  phone: string;
  message?: string | null;
};

type JobWithNotification = NotificationEmailJob & {
  notification: Notification | null;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly secrets: SecretCryptoService,
    private readonly stream: NotificationStreamService,
  ) {}

  async list(userId: number, query: ListNotificationsQueryDto) {
    const pagination = normalizePagePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 10,
      maxLimit: 50,
    });
    const where: Prisma.NotificationWhereInput = {
      ...this.activeWhere(),
      ...(query.read === "unread" ? { reads: { none: { userId } } } : {}),
      ...(query.q
        ? {
            OR: [{ title: { contains: query.q } }, { message: { contains: query.q } }],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        include: { reads: { where: { userId }, take: 1 } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: items.map((item) => this.present(item)),
      pagination: createPagePaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async unreadCount(userId: number) {
    const unread = await this.prisma.notification.count({
      where: {
        ...this.activeWhere(),
        reads: { none: { userId } },
      },
    });

    return { unread_count: unread };
  }

  async markRead(userId: number, notificationId: number) {
    await this.ensureNotification(notificationId);
    await this.prisma.notificationRead.upsert({
      where: {
        notificationId_userId: {
          notificationId,
          userId,
        },
      },
      update: { readAt: new Date() },
      create: { notificationId, userId },
    });
    this.stream.notifyRead(userId);

    return this.unreadCount(userId);
  }

  async markAllRead(userId: number) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        ...this.activeWhere(),
        reads: { none: { userId } },
      },
      select: { id: true },
      take: 500,
    });

    if (notifications.length > 0) {
      await this.prisma.notificationRead.createMany({
        data: notifications.map((notification) => ({
          notificationId: notification.id,
          userId,
        })),
        skipDuplicates: true,
      });
    }
    this.stream.notifyRead(userId);

    return { marked_read: notifications.length, unread_count: 0 };
  }

  async createInquiryCreated(input: InquiryNotificationInput): Promise<void> {
    const recipientEmail = await this.notificationRecipientEmail();
    const subject = `Pesan kontak baru dari ${input.name}`;
    const bodyText = [
      "Pesan kontak baru masuk dari website Indobraga.",
      "",
      `Nama: ${input.name}`,
      `Email: ${input.email}`,
      `Telepon: ${input.phone}`,
      input.company ? `Perusahaan: ${input.company}` : null,
      "",
      "Pesan:",
      input.message,
    ]
      .filter(Boolean)
      .join("\n");

    await this.create({
      type: NotificationType.INQUIRY_CREATED,
      severity: NotificationSeverity.INFO,
      title: "Pesan kontak baru",
      message: `${input.name} mengirim pesan kontak dari website.`,
      resourceType: "inquiry",
      resourceId: input.id,
      email: this.config.get("NOTIFICATION_EMAIL_ENABLED", { infer: true })
        ? {
            recipientEmail,
            subject,
            bodyText,
            bodyHtml: `<p>Pesan kontak baru masuk dari website Indobraga.</p><p><strong>Nama:</strong> ${escapeHtml(input.name)}<br/><strong>Email:</strong> ${escapeHtml(input.email)}<br/><strong>Telepon:</strong> ${escapeHtml(input.phone)}${input.company ? `<br/><strong>Perusahaan:</strong> ${escapeHtml(input.company)}` : ""}</p><p><strong>Pesan:</strong></p><p>${escapeHtml(input.message).replace(/\n/g, "<br/>")}</p>`,
          }
        : undefined,
    });
  }

  async createWhatsAppLeadCreated(input: WhatsAppNotificationInput): Promise<void> {
    await this.create({
      type: NotificationType.WHATSAPP_LEAD_CREATED,
      severity: NotificationSeverity.INFO,
      title: "Prospek WhatsApp baru",
      message: `${input.name} membuka percakapan WhatsApp dari website.`,
      resourceType: "whatsapp_lead",
      resourceId: input.id,
    });
  }

  async workerTick() {
    const batchSize = this.config.get("NOTIFICATION_WORKER_BATCH_SIZE", { infer: true });
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      retried: 0,
    };

    for (let index = 0; index < batchSize; index += 1) {
      const job = await this.claimEmailJob();
      if (!job) {
        break;
      }

      results.processed += 1;
      const result = await this.processEmailJob(job);
      results[result] += 1;
    }

    return results;
  }

  private async create(input: NotificationCreateInput): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        type: input.type,
        severity: input.severity ?? NotificationSeverity.INFO,
        title: input.title,
        message: input.message,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        actorType: input.actorType,
        actorId: input.actorId,
        emailJobs: input.email
          ? {
              create: {
                recipientEmail: input.email.recipientEmail,
                subject: input.email.subject,
                bodyText: input.email.bodyText,
                bodyHtml: input.email.bodyHtml,
              },
            }
          : undefined,
      },
    });
    this.stream.broadcastCreated({
      notificationId: notification.id,
      resourceType: notification.resourceType,
      resourceId: notification.resourceId,
    });

    return notification;
  }

  private async claimEmailJob(): Promise<JobWithNotification | null> {
    const pending = await this.prisma.notificationEmailJob.findFirst({
      where: {
        status: NotificationEmailJobStatus.PENDING,
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    if (!pending) {
      return null;
    }

    const claimed = await this.prisma.notificationEmailJob.updateMany({
      where: { id: pending.id, status: NotificationEmailJobStatus.PENDING },
      data: { status: NotificationEmailJobStatus.PROCESSING, lockedAt: new Date() },
    });
    if (claimed.count === 0) {
      return null;
    }

    return this.prisma.notificationEmailJob.findUnique({
      where: { id: pending.id },
      include: { notification: true },
    });
  }

  private async processEmailJob(job: JobWithNotification): Promise<"sent" | "failed" | "retried"> {
    const nextAttempt = job.attempts + 1;

    try {
      const sender = await this.findNotificationSenderAccount();
      await this.sendEmail(sender, job);
      await this.prisma.notificationEmailJob.update({
        where: { id: job.id },
        data: {
          status: NotificationEmailJobStatus.SENT,
          attempts: nextAttempt,
          sentAt: new Date(),
          lockedAt: null,
          nextAttemptAt: null,
          lastError: null,
        },
      });
      await this.syncInquiryNotificationStatus(job, "sent");

      return "sent";
    } catch (error) {
      const maxAttempts = this.config.get("NOTIFICATION_WORKER_MAX_ATTEMPTS", { infer: true });
      const message = error instanceof Error ? error.message : "Pengiriman notifikasi gagal.";
      const willRetry = nextAttempt < maxAttempts;

      await this.prisma.notificationEmailJob.update({
        where: { id: job.id },
        data: {
          status: willRetry
            ? NotificationEmailJobStatus.PENDING
            : NotificationEmailJobStatus.FAILED,
          attempts: nextAttempt,
          lockedAt: null,
          nextAttemptAt: willRetry ? new Date(Date.now() + nextAttempt * 60_000) : null,
          lastError: message,
        },
      });
      if (!willRetry) {
        await this.syncInquiryNotificationStatus(job, "failed");
      }
      this.logger.warn(`Notification email job ${job.id} failed: ${message}`);

      return willRetry ? "retried" : "failed";
    }
  }

  private async sendEmail(sender: EmailAccount, job: NotificationEmailJob): Promise<void> {
    if (!sender.smtpHost || !sender.smtpPort || !sender.encryptedSmtpPassword) {
      throw new Error("Akun pengirim notifikasi belum lengkap.");
    }

    const transporter = nodemailer.createTransport({
      host: sender.smtpHost,
      port: sender.smtpPort,
      secure: sender.smtpSecurity === SmtpSecurityMode.SSL_TLS,
      requireTLS: sender.smtpSecurity === SmtpSecurityMode.STARTTLS,
      auth: {
        user: sender.smtpUsername ?? sender.email,
        pass: this.secrets.decrypt(sender.encryptedSmtpPassword),
      },
      connectionTimeout: this.config.get("SMTP_TEST_TIMEOUT_MS", { infer: true }),
      greetingTimeout: this.config.get("SMTP_TEST_TIMEOUT_MS", { infer: true }),
      socketTimeout: this.config.get("SMTP_TEST_TIMEOUT_MS", { infer: true }),
    });

    await transporter.sendMail({
      from: `"${sender.displayName}" <${sender.email}>`,
      to: job.recipientEmail,
      subject: job.subject,
      text: job.bodyText,
      html: job.bodyHtml ?? undefined,
    });
  }

  private async findNotificationSenderAccount(): Promise<EmailAccount> {
    const configuredEmail = this.config.get("NOTIFICATION_EMAIL_SENDER", { infer: true }).trim();
    const account = configuredEmail
      ? await this.prisma.emailAccount.findUnique({
          where: {
            provider_email: {
              provider: EmailProviderType.SMTP_HOSTING,
              email: configuredEmail.toLowerCase(),
            },
          },
        })
      : await this.prisma.emailAccount.findFirst({
          where: {
            provider: EmailProviderType.SMTP_HOSTING,
            status: EmailAccountStatus.CONNECTED,
          },
          orderBy: [{ connectedAt: "desc" }, { id: "asc" }],
        });

    if (!account || account.status !== EmailAccountStatus.CONNECTED) {
      throw new UnprocessableEntityException({
        code: "UNPROCESSABLE_ENTITY",
        message: "Akun pengirim notifikasi belum connected.",
      });
    }

    return account;
  }

  private async notificationRecipientEmail(): Promise<string> {
    const configuredEmail = this.config.get("NOTIFICATION_EMAIL_TO", { infer: true }).trim();
    if (configuredEmail) {
      return configuredEmail.toLowerCase();
    }

    const settings = await this.prisma.siteSettings.findUnique({ where: { id: 1 } });

    return (settings?.email ?? "support@indobraga.com").toLowerCase();
  }

  private async syncInquiryNotificationStatus(
    job: JobWithNotification,
    status: "sent" | "failed",
  ): Promise<void> {
    if (
      job.notification?.resourceType !== "inquiry" ||
      typeof job.notification.resourceId !== "number"
    ) {
      return;
    }

    await this.prisma.inquiry.updateMany({
      where: { id: job.notification.resourceId },
      data: { notificationStatus: status },
    });
  }

  private async ensureNotification(id: number): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, ...this.activeWhere() },
      select: { id: true },
    });

    if (!notification) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Notifikasi tidak ditemukan.",
      });
    }
  }

  private activeWhere(): Prisma.NotificationWhereInput {
    return {
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };
  }

  private present(notification: Notification & { reads?: { id: number }[] }) {
    return {
      id: notification.id,
      type: notification.type.toLowerCase(),
      severity: notification.severity.toLowerCase(),
      title: notification.title,
      message: notification.message,
      resource_type: notification.resourceType,
      resource_id: notification.resourceId,
      read: Boolean(notification.reads?.length),
      created_at: notification.createdAt,
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
