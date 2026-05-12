const mockSendMail = jest.fn();
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: mockCreateTransport,
  },
}));

import {
  EmailAccountStatus,
  EmailProviderType,
  NotificationEmailJobStatus,
  NotificationSeverity,
  NotificationType,
  SmtpSecurityMode,
} from "@prisma/client";
import type { ConfigService } from "@nestjs/config";
import type { Env } from "@/config/env";
import { NotificationsService } from "@/notifications/notifications.service";

const now = new Date("2026-05-09T13:20:00.000Z");

const prismaMock = () => ({
  notification: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  siteSettings: {
    findUnique: jest.fn(),
  },
  notificationRead: {
    upsert: jest.fn(),
    createMany: jest.fn(),
  },
  notificationEmailJob: {
    findFirst: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  emailAccount: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  inquiry: {
    updateMany: jest.fn(),
  },
  $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
});

const configMock = (overrides: Record<string, unknown> = {}) => {
  const values: Record<string, unknown> = {
    NOTIFICATION_EMAIL_ENABLED: true,
    NOTIFICATION_EMAIL_TO: "support@indobraga.com",
    NOTIFICATION_EMAIL_SENDER: "support@indobraga.com",
    NOTIFICATION_WORKER_BATCH_SIZE: 20,
    NOTIFICATION_WORKER_MAX_ATTEMPTS: 3,
    SMTP_TEST_TIMEOUT_MS: 10_000,
    ...overrides,
  };

  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService<Env, true>;
};

const streamMock = () => ({
  broadcastCreated: jest.fn(),
  notifyRead: jest.fn(),
});

type NotificationFindManyArg = {
  include: { reads: { take: number; where: { userId: number } } };
  skip: number;
  take: number;
  where: {
    OR?: Array<{ message?: { contains: string }; title?: { contains: string } }>;
    reads?: { none: { userId: number } };
  };
};

type NotificationEmailJobUpdateArg = {
  data: {
    attempts?: number;
    lastError?: string | null;
    lockedAt?: Date | null;
    nextAttemptAt?: Date | null;
    status?: NotificationEmailJobStatus;
  };
  where?: { id: number };
};

describe("NotificationsService", () => {
  beforeEach(() => {
    mockSendMail.mockReset().mockResolvedValue(undefined);
    mockCreateTransport.mockReset().mockReturnValue({ sendMail: mockSendMail });
  });

  const notificationRow = (overrides: Record<string, unknown> = {}) => ({
    actorId: null,
    actorType: null,
    createdAt: now,
    expiresAt: null,
    id: 7,
    message: "Budi mengirim pesan kontak dari website.",
    resourceId: 12,
    resourceType: "inquiry",
    severity: NotificationSeverity.INFO,
    title: "Pesan kontak baru",
    type: NotificationType.INQUIRY_CREATED,
    ...overrides,
  });

  const emailJob = (overrides: Record<string, unknown> = {}) => ({
    attempts: 0,
    bodyHtml: "<p>Halo</p>",
    bodyText: "Halo",
    createdAt: now,
    id: 22,
    lastError: null,
    lockedAt: now,
    nextAttemptAt: null,
    notification: notificationRow(),
    notificationId: 7,
    recipientEmail: "owner@example.com",
    sentAt: null,
    status: NotificationEmailJobStatus.PROCESSING,
    subject: "Pesan baru",
    updatedAt: now,
    ...overrides,
  });

  const smtpAccount = (overrides: Record<string, unknown> = {}) => ({
    accessTokenEncrypted: null,
    connectedAt: now,
    createdAt: now,
    displayName: "Indobraga Support",
    email: "support@indobraga.com",
    encryptedSmtpPassword: "cipher",
    expiresAt: null,
    id: 3,
    lastError: null,
    provider: EmailProviderType.SMTP_HOSTING,
    refreshTokenEncrypted: null,
    scope: null,
    smtpHost: "smtp.example.com",
    smtpPort: 587,
    smtpSecurity: SmtpSecurityMode.STARTTLS,
    smtpUsername: "smtp-user",
    status: EmailAccountStatus.CONNECTED,
    updatedAt: now,
    ...overrides,
  });

  it("creates inquiry notification and email job", async () => {
    const prisma = prismaMock();
    const stream = streamMock();
    prisma.notification.create.mockResolvedValue(notificationRow());
    const service = new NotificationsService(
      prisma as never,
      configMock(),
      { decrypt: jest.fn() } as never,
      stream as never,
    );

    await service.createInquiryCreated({
      id: 12,
      name: "Budi",
      email: "budi@example.com",
      phone: "08123456789",
      company: "PT Contoh",
      message: "Butuh produksi seragam.",
    });

    const [createArg] = prisma.notification.create.mock.calls[0] as [
      {
        data: {
          emailJobs?: { create: { recipientEmail: string; subject: string } };
          resourceId?: number;
          resourceType?: string;
          type: NotificationType;
        };
      },
    ];
    expect(createArg.data.emailJobs?.create.recipientEmail).toBe("support@indobraga.com");
    expect(createArg.data.emailJobs?.create.subject).toBe("Pesan kontak baru dari Budi");
    expect(createArg.data.resourceId).toBe(12);
    expect(createArg.data.resourceType).toBe("inquiry");
    expect(createArg.data.type).toBe(NotificationType.INQUIRY_CREATED);
    expect(stream.broadcastCreated).toHaveBeenCalledWith({
      notificationId: 7,
      resourceId: 12,
      resourceType: "inquiry",
    });
  });

  it("falls back to site settings as notification email recipient", async () => {
    const prisma = prismaMock();
    prisma.siteSettings.findUnique.mockResolvedValue({ email: "Info@Indobraga.COM" });
    prisma.notification.create.mockResolvedValue(notificationRow());
    const service = new NotificationsService(
      prisma as never,
      configMock({ NOTIFICATION_EMAIL_TO: "" }),
      { decrypt: jest.fn() } as never,
      streamMock() as never,
    );

    await service.createInquiryCreated({
      id: 12,
      name: "Budi",
      email: "budi@example.com",
      phone: "08123456789",
      message: "Butuh produksi seragam.",
    });

    const [createArg] = prisma.notification.create.mock.calls[0] as [
      { data: { emailJobs?: { create: { recipientEmail: string; bodyHtml: string } } } },
    ];
    expect(createArg.data.emailJobs?.create.recipientEmail).toBe("info@indobraga.com");
    expect(createArg.data.emailJobs?.create.bodyHtml).toContain("Budi");
    expect(createArg.data.emailJobs?.create.bodyHtml).not.toContain("Perusahaan");
  });

  it("creates WhatsApp lead notification without email job", async () => {
    const prisma = prismaMock();
    prisma.notification.create.mockResolvedValue(
      notificationRow({
        id: 9,
        resourceId: 4,
        resourceType: "whatsapp_lead",
        type: NotificationType.WHATSAPP_LEAD_CREATED,
      }),
    );
    const stream = streamMock();
    const service = new NotificationsService(
      prisma as never,
      configMock(),
      { decrypt: jest.fn() } as never,
      stream as never,
    );

    await service.createWhatsAppLeadCreated({
      id: 4,
      name: "Sari",
      phone: "0812",
      message: null,
    });

    const [createArg] = prisma.notification.create.mock.calls[0] as [
      {
        data: {
          emailJobs?: unknown;
          resourceId?: number;
          resourceType?: string;
          title: string;
          type: NotificationType;
        };
      },
    ];
    expect(createArg.data.emailJobs).toBeUndefined();
    expect(createArg.data.resourceId).toBe(4);
    expect(createArg.data.resourceType).toBe("whatsapp_lead");
    expect(createArg.data.type).toBe(NotificationType.WHATSAPP_LEAD_CREATED);
    expect(stream.broadcastCreated).toHaveBeenCalledWith({
      notificationId: 9,
      resourceId: 4,
      resourceType: "whatsapp_lead",
    });
  });

  it("lists notifications with unread and search filters", async () => {
    const prisma = prismaMock();
    prisma.notification.findMany.mockResolvedValue([
      notificationRow({ reads: [{ id: 1 }], title: "Pesan penting" }),
    ]);
    prisma.notification.count.mockResolvedValue(1);
    const service = new NotificationsService(
      prisma as never,
      configMock(),
      { decrypt: jest.fn() } as never,
      streamMock() as never,
    );

    await expect(
      service.list(2, { limit: 5, page: 2, q: "pesan", read: "unread" } as never),
    ).resolves.toEqual({
      items: [
        expect.objectContaining({
          id: 7,
          read: true,
          resource_id: 12,
          resource_type: "inquiry",
          severity: "info",
          type: "inquiry_created",
        }),
      ],
      pagination: {
        limit: 5,
        page: 2,
        total: 1,
        total_pages: 1,
      },
    });
    const [findManyArg] = prisma.notification.findMany.mock.calls[0] as [NotificationFindManyArg];
    expect(findManyArg).toMatchObject({
      include: { reads: { take: 1, where: { userId: 2 } } },
      skip: 5,
      take: 5,
    });
    expect(findManyArg.where).toMatchObject({
      OR: [{ title: { contains: "pesan" } }, { message: { contains: "pesan" } }],
      reads: { none: { userId: 2 } },
    });
  });

  it("marks notification as read for the active admin user", async () => {
    const prisma = prismaMock();
    const stream = streamMock();
    prisma.notification.findFirst.mockResolvedValue({ id: 7 });
    prisma.notificationRead.upsert.mockResolvedValue({ id: 1 });
    prisma.notification.count.mockResolvedValue(3);
    const service = new NotificationsService(
      prisma as never,
      configMock(),
      { decrypt: jest.fn() } as never,
      stream as never,
    );

    await expect(service.markRead(2, 7)).resolves.toEqual({ unread_count: 3 });
    expect(prisma.notificationRead.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          notificationId_userId: {
            notificationId: 7,
            userId: 2,
          },
        },
      }),
    );
    expect(stream.notifyRead).toHaveBeenCalledWith(2);
  });

  it("rejects read updates for missing notifications", async () => {
    const prisma = prismaMock();
    prisma.notification.findFirst.mockResolvedValue(null);
    const service = new NotificationsService(
      prisma as never,
      configMock(),
      { decrypt: jest.fn() } as never,
      streamMock() as never,
    );

    await expect(service.markRead(2, 404)).rejects.toMatchObject({
      response: { code: "NOT_FOUND" },
    });
    expect(prisma.notificationRead.upsert).not.toHaveBeenCalled();
  });

  it("marks all active notifications as read in bulk", async () => {
    const prisma = prismaMock();
    const stream = streamMock();
    prisma.notification.findMany.mockResolvedValue([{ id: 7 }, { id: 8 }]);
    prisma.notificationRead.createMany.mockResolvedValue({ count: 2 });
    const service = new NotificationsService(
      prisma as never,
      configMock(),
      { decrypt: jest.fn() } as never,
      stream as never,
    );

    await expect(service.markAllRead(2)).resolves.toEqual({
      marked_read: 2,
      unread_count: 0,
    });
    expect(prisma.notificationRead.createMany).toHaveBeenCalledWith({
      data: [
        { notificationId: 7, userId: 2 },
        { notificationId: 8, userId: 2 },
      ],
      skipDuplicates: true,
    });
    expect(stream.notifyRead).toHaveBeenCalledWith(2);
  });

  it("does not bulk insert read rows when there are no unread notifications", async () => {
    const prisma = prismaMock();
    const stream = streamMock();
    prisma.notification.findMany.mockResolvedValue([]);
    const service = new NotificationsService(
      prisma as never,
      configMock(),
      { decrypt: jest.fn() } as never,
      stream as never,
    );

    await expect(service.markAllRead(2)).resolves.toEqual({
      marked_read: 0,
      unread_count: 0,
    });
    expect(prisma.notificationRead.createMany).not.toHaveBeenCalled();
    expect(stream.notifyRead).toHaveBeenCalledWith(2);
  });

  it("returns idle worker result when no notification email job is pending", async () => {
    const prisma = prismaMock();
    prisma.notificationEmailJob.findFirst.mockResolvedValue(null);
    const service = new NotificationsService(
      prisma as never,
      configMock(),
      { decrypt: jest.fn() } as never,
      streamMock() as never,
    );

    await expect(service.workerTick()).resolves.toEqual({
      failed: 0,
      processed: 0,
      retried: 0,
      sent: 0,
    });
  });

  it("returns idle worker result when a pending email job is already claimed elsewhere", async () => {
    const prisma = prismaMock();
    prisma.notificationEmailJob.findFirst.mockResolvedValue({ id: 22 });
    prisma.notificationEmailJob.updateMany.mockResolvedValue({ count: 0 });
    const service = new NotificationsService(
      prisma as never,
      configMock(),
      { decrypt: jest.fn() } as never,
      streamMock() as never,
    );

    await expect(service.workerTick()).resolves.toEqual({
      failed: 0,
      processed: 0,
      retried: 0,
      sent: 0,
    });
    expect(prisma.notificationEmailJob.findUnique).not.toHaveBeenCalled();
  });

  it("claims and sends notification email jobs with the configured SMTP sender", async () => {
    const prisma = prismaMock();
    const secrets = { decrypt: jest.fn().mockReturnValue("plain-password") };
    prisma.notificationEmailJob.findFirst.mockResolvedValue({ id: 22 });
    prisma.notificationEmailJob.updateMany.mockResolvedValue({ count: 1 });
    prisma.notificationEmailJob.findUnique.mockResolvedValue(emailJob());
    prisma.emailAccount.findUnique.mockResolvedValue(smtpAccount());
    prisma.notificationEmailJob.update.mockResolvedValue({});
    prisma.inquiry.updateMany.mockResolvedValue({ count: 1 });
    const service = new NotificationsService(
      prisma as never,
      configMock({ NOTIFICATION_WORKER_BATCH_SIZE: 1 }),
      secrets as never,
      streamMock() as never,
    );

    await expect(service.workerTick()).resolves.toEqual({
      failed: 0,
      processed: 1,
      retried: 0,
      sent: 1,
    });
    expect(mockCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: { pass: "plain-password", user: "smtp-user" },
        host: "smtp.example.com",
        port: 587,
        requireTLS: true,
        secure: false,
      }),
    );
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"Indobraga Support" <support@indobraga.com>',
        html: "<p>Halo</p>",
        subject: "Pesan baru",
        text: "Halo",
        to: "owner@example.com",
      }),
    );
    const [sentUpdateArg] = prisma.notificationEmailJob.update.mock.calls[0] as [
      NotificationEmailJobUpdateArg,
    ];
    expect(sentUpdateArg).toMatchObject({
      data: {
        attempts: 1,
        lastError: null,
        lockedAt: null,
        nextAttemptAt: null,
        status: NotificationEmailJobStatus.SENT,
      },
      where: { id: 22 },
    });
    expect(prisma.inquiry.updateMany).toHaveBeenCalledWith({
      data: { notificationStatus: "sent" },
      where: { id: 12 },
    });
  });

  it("retries worker failures before max attempts", async () => {
    const prisma = prismaMock();
    mockSendMail.mockRejectedValue(new Error("smtp down"));
    prisma.notificationEmailJob.findFirst.mockResolvedValue({ id: 22 });
    prisma.notificationEmailJob.updateMany.mockResolvedValue({ count: 1 });
    prisma.notificationEmailJob.findUnique.mockResolvedValue(emailJob({ attempts: 1 }));
    prisma.emailAccount.findUnique.mockResolvedValue(smtpAccount());
    prisma.notificationEmailJob.update.mockResolvedValue({});
    const service = new NotificationsService(
      prisma as never,
      configMock({ NOTIFICATION_WORKER_BATCH_SIZE: 1, NOTIFICATION_WORKER_MAX_ATTEMPTS: 3 }),
      { decrypt: jest.fn().mockReturnValue("plain-password") } as never,
      streamMock() as never,
    );

    await expect(service.workerTick()).resolves.toEqual({
      failed: 0,
      processed: 1,
      retried: 1,
      sent: 0,
    });
    const [updateArg] = prisma.notificationEmailJob.update.mock.calls[0] as [
      {
        data: { lastError: string; nextAttemptAt: Date | null; status: NotificationEmailJobStatus };
      },
    ];
    expect(updateArg.data.status).toBe(NotificationEmailJobStatus.PENDING);
    expect(updateArg.data.nextAttemptAt).toBeInstanceOf(Date);
    expect(updateArg.data.lastError).toBe("smtp down");
    expect(prisma.inquiry.updateMany).not.toHaveBeenCalled();
  });

  it("marks worker failures final when max attempts is reached", async () => {
    const prisma = prismaMock();
    prisma.notificationEmailJob.findFirst.mockResolvedValue({ id: 22 });
    prisma.notificationEmailJob.updateMany.mockResolvedValue({ count: 1 });
    prisma.notificationEmailJob.findUnique.mockResolvedValue(emailJob({ attempts: 2 }));
    prisma.emailAccount.findFirst.mockResolvedValue(null);
    prisma.notificationEmailJob.update.mockResolvedValue({});
    prisma.inquiry.updateMany.mockResolvedValue({ count: 1 });
    const service = new NotificationsService(
      prisma as never,
      configMock({
        NOTIFICATION_EMAIL_SENDER: "",
        NOTIFICATION_WORKER_BATCH_SIZE: 1,
        NOTIFICATION_WORKER_MAX_ATTEMPTS: 3,
      }),
      { decrypt: jest.fn() } as never,
      streamMock() as never,
    );

    await expect(service.workerTick()).resolves.toEqual({
      failed: 1,
      processed: 1,
      retried: 0,
      sent: 0,
    });
    expect(prisma.emailAccount.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          provider: EmailProviderType.SMTP_HOSTING,
          status: EmailAccountStatus.CONNECTED,
        },
      }),
    );
    const [failedUpdateArg] = prisma.notificationEmailJob.update.mock.calls[0] as [
      NotificationEmailJobUpdateArg,
    ];
    expect(failedUpdateArg).toMatchObject({
      data: {
        attempts: 3,
        lastError: "Akun pengirim notifikasi belum connected.",
        nextAttemptAt: null,
        status: NotificationEmailJobStatus.FAILED,
      },
    });
    expect(prisma.inquiry.updateMany).toHaveBeenCalledWith({
      data: { notificationStatus: "failed" },
      where: { id: 12 },
    });
  });
});
