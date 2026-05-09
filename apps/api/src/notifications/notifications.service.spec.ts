import { NotificationSeverity, NotificationType } from "@prisma/client";
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
  notificationRead: {
    upsert: jest.fn(),
    createMany: jest.fn(),
  },
  notificationEmailJob: {
    findFirst: jest.fn(),
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

describe("NotificationsService", () => {
  it("creates inquiry notification and email job", async () => {
    const prisma = prismaMock();
    const stream = streamMock();
    prisma.notification.create.mockResolvedValue({
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
    });
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
});
