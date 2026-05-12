import {
  EmailAccount,
  EmailAccountStatus,
  EmailCampaign,
  EmailCampaignRecipient,
  EmailCampaignStatus,
  EmailRecipientStatus,
  EmailProviderType,
  InquiryStatus,
  SmtpSecurityMode,
} from "@prisma/client";
import { UnprocessableEntityException } from "@nestjs/common";
import type { AuditService } from "@/audit/audit.service";
import type { AudienceService } from "@/audience/audience.service";
import { EmailCampaignsService } from "@/email-campaigns/email-campaigns.service";
import type { EmailSendAdapter } from "@/email-campaigns/email-send.adapter";

const now = new Date("2026-01-01T00:00:00.000Z");

const account = (overrides: Partial<EmailAccount> = {}): EmailAccount => ({
  id: 3,
  provider: EmailProviderType.SMTP_HOSTING,
  email: "support@indobraga.com",
  displayName: "Indobraga Support",
  status: EmailAccountStatus.CONNECTED,
  googleSubject: null,
  encryptedAccessToken: null,
  encryptedRefreshToken: null,
  tokenExpiresAt: null,
  smtpHost: "smtp.hostinger.com",
  smtpPort: 465,
  smtpSecurity: SmtpSecurityMode.SSL_TLS,
  smtpUsername: "support@indobraga.com",
  encryptedSmtpPassword: "encrypted",
  lastTestAt: now,
  connectedAt: now,
  lastError: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const campaign = (
  senderAccount: EmailAccount,
  overrides: Partial<EmailCampaign> = {},
): EmailCampaign & { senderAccount: EmailAccount } => ({
  id: 11,
  senderAccountId: senderAccount.id,
  createdById: 9,
  name: "Follow up kontak",
  subject: "Terima kasih sudah menghubungi Indobraga",
  bodyText: "Halo",
  bodyHtml: "<p>Halo</p>",
  status: EmailCampaignStatus.DRAFT,
  totalRecipients: 1,
  queuedCount: 1,
  sentCount: 0,
  failedCount: 0,
  lockedAt: null,
  startedAt: null,
  finishedAt: null,
  lastError: null,
  createdAt: now,
  updatedAt: now,
  senderAccount,
  ...overrides,
});

const recipient = (overrides: Partial<EmailCampaignRecipient> = {}): EmailCampaignRecipient => ({
  id: 31,
  campaignId: 11,
  marketingContactId: null,
  email: "budi@example.com",
  name: "Budi",
  status: EmailRecipientStatus.QUEUED,
  attempts: 0,
  nextAttemptAt: null,
  lockedAt: null,
  sentAt: null,
  failedAt: null,
  errorCode: null,
  errorMessage: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const firstMockArg = <T>(mock: jest.Mock): T => {
  const calls = mock.mock.calls as unknown[][];
  return calls[0]?.[0] as T;
};

type TransactionMock = {
  emailCampaign: {
    update: jest.Mock;
  };
  emailCampaignRecipient: {
    deleteMany: jest.Mock;
  };
};

type TransactionCallback = (tx: TransactionMock) => unknown;

const prismaMock = () => ({
  $transaction: jest.fn((operations: unknown) => {
    if (typeof operations === "function") {
      const callback = operations as TransactionCallback;

      return callback({
        emailCampaign: {
          update: prismaMockState.emailCampaignUpdate,
        },
        emailCampaignRecipient: {
          deleteMany: prismaMockState.emailCampaignRecipientDeleteMany,
        },
      });
    }

    return Promise.all(operations as Promise<unknown>[]);
  }),
  emailAccount: {
    findUnique: jest.fn(),
  },
  emailCampaign: {
    count: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  emailCampaignRecipient: {
    count: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  emailSendLog: {
    count: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  inquiry: {
    findMany: jest.fn(),
  },
});

const prismaMockState = {
  emailCampaignRecipientDeleteMany: jest.fn(),
  emailCampaignUpdate: jest.fn(),
};

const configMock = () => ({
  get: jest.fn((key: string) => {
    if (key === "EMAIL_CAMPAIGN_RECIPIENT_MAX") {
      return 1000;
    }
    if (key === "EMAIL_WORKER_BATCH_SIZE") {
      return 20;
    }
    if (key === "EMAIL_WORKER_MAX_ATTEMPTS") {
      return 3;
    }
    return undefined;
  }),
});

describe("EmailCampaignsService", () => {
  beforeEach(() => {
    prismaMockState.emailCampaignRecipientDeleteMany.mockReset();
    prismaMockState.emailCampaignUpdate.mockReset();
  });

  it("lists campaigns with filters and public status mapping", async () => {
    const senderAccount = account();
    const prisma = prismaMock();
    prisma.emailCampaign.findMany.mockResolvedValue([
      campaign(senderAccount, { status: EmailCampaignStatus.PENDING }),
    ]);
    prisma.emailCampaign.count.mockResolvedValue(1);
    const service = new EmailCampaignsService(
      prisma as never,
      configMock() as never,
      { record: jest.fn() } as unknown as AuditService,
      {} as unknown as EmailSendAdapter,
      { resolveRecipients: jest.fn() } as unknown as AudienceService,
    );

    await expect(
      service.list({ email_account_id: 3, limit: 5, page: 2, q: "kontak", status: "pending" }),
    ).resolves.toMatchObject({
      items: [
        {
          id: 11,
          status: "pending",
          sender_account: {
            email_address: "support@indobraga.com",
            provider: "smtp",
            status: "connected",
          },
        },
      ],
      pagination: {
        limit: 5,
        page: 2,
        total: 1,
      },
    });

    const findManyArg = firstMockArg<{
      skip: number;
      take: number;
      where: Record<string, unknown>;
    }>(prisma.emailCampaign.findMany);
    expect(findManyArg.skip).toBe(5);
    expect(findManyArg.take).toBe(5);
    expect(findManyArg.where).toMatchObject({
      senderAccountId: 3,
      status: EmailCampaignStatus.PENDING,
      OR: [
        { name: { contains: "kontak" } },
        { subject: { contains: "kontak" } },
        { senderAccount: { email: { contains: "kontak" } } },
      ],
    });
  });

  it("creates draft from active audience recipients as campaign snapshot", async () => {
    const senderAccount = account();
    const createdCampaign = campaign(senderAccount);
    const prisma = prismaMock();
    prisma.emailAccount.findUnique.mockResolvedValue(senderAccount);
    prisma.emailCampaign.create.mockResolvedValue(createdCampaign);
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const audience = {
      resolveRecipients: jest.fn().mockResolvedValue([
        {
          marketingContactId: 21,
          email: "budi@example.com",
          name: "Budi",
        },
      ]),
    };
    const service = new EmailCampaignsService(
      prisma as never,
      configMock() as never,
      audit as unknown as AuditService,
      {} as unknown as EmailSendAdapter,
      audience as unknown as AudienceService,
    );

    await expect(
      service.createDraftFromAudience(
        {
          email_account_id: 3,
          title: "Follow up kontak",
          subject: "Terima kasih sudah menghubungi Indobraga",
          body_text: "Halo",
          audience_filter: { source: "inquiry" },
        },
        { id: 9 },
      ),
    ).resolves.toEqual({ id: 11, status: "draft", total_recipients: 1 });

    expect(audience.resolveRecipients).toHaveBeenCalledWith({ source: "inquiry" });
    expect(prisma.emailCampaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalRecipients: 1,
          recipients: {
            createMany: {
              data: [
                {
                  email: "budi@example.com",
                  name: "Budi",
                  marketingContactId: 21,
                },
              ],
            },
          },
        }) as object,
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "email_campaign.create_draft_from_audience",
        resourceId: 11,
      }),
    );
  });

  it("rejects an empty email body even when HTML contains only a line break", async () => {
    const senderAccount = account();
    const prisma = prismaMock();
    prisma.emailAccount.findUnique.mockResolvedValue(senderAccount);
    const service = new EmailCampaignsService(
      prisma as never,
      configMock() as never,
      { record: jest.fn() } as unknown as AuditService,
      {} as unknown as EmailSendAdapter,
      { resolveRecipients: jest.fn() } as unknown as AudienceService,
    );

    await expect(
      service.createDraft(
        {
          email_account_id: 3,
          title: "Body kosong",
          subject: "Body kosong",
          body_text: "",
          body_html: "<p><br></p>",
          recipients: [{ email: "budi@example.com" }],
        },
        { id: 9 },
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(prisma.emailCampaign.create).not.toHaveBeenCalled();
  });

  it("previews Pesan Kontak recipients with valid email, duplicate, and invalid counts", async () => {
    const prisma = prismaMock();
    prisma.inquiry.findMany.mockResolvedValue([
      {
        id: 1,
        name: "Budi",
        email: "BUDI@EXAMPLE.COM",
        company: "PT Contoh",
        status: InquiryStatus.NEW,
        createdAt: now,
      },
      {
        id: 2,
        name: "Budi Duplikat",
        email: "budi@example.com",
        company: "PT Contoh",
        status: InquiryStatus.CONTACTED,
        createdAt: now,
      },
      {
        id: 3,
        name: "Email Salah",
        email: "email-salah",
        company: null,
        status: InquiryStatus.NEW,
        createdAt: now,
      },
    ]);
    const service = new EmailCampaignsService(
      prisma as never,
      configMock() as never,
      { record: jest.fn() } as unknown as AuditService,
      {} as unknown as EmailSendAdapter,
      { resolveRecipients: jest.fn() } as unknown as AudienceService,
    );

    await expect(service.previewInquiryRecipients({ q: "contoh" })).resolves.toEqual(
      expect.objectContaining({
        total_inquiries: 3,
        eligible_recipients: 1,
        duplicate_emails: 1,
        invalid_emails: 1,
        over_limit: false,
      }),
    );
    expect(prisma.inquiry.findMany).toHaveBeenCalledTimes(1);
  });

  it("creates draft from filtered Pesan Kontak recipients", async () => {
    const senderAccount = account();
    const createdCampaign = campaign(senderAccount, { totalRecipients: 2, queuedCount: 2 });
    const prisma = prismaMock();
    prisma.emailAccount.findUnique.mockResolvedValue(senderAccount);
    prisma.emailCampaign.create.mockResolvedValue(createdCampaign);
    prisma.inquiry.findMany.mockResolvedValue([
      {
        id: 1,
        name: "Budi",
        email: "BUDI@EXAMPLE.COM",
        company: "PT Contoh",
        status: InquiryStatus.NEW,
        createdAt: now,
      },
      {
        id: 2,
        name: "Sari",
        email: "sari@example.com",
        company: "CV Sari",
        status: InquiryStatus.CONTACTED,
        createdAt: now,
      },
    ]);
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new EmailCampaignsService(
      prisma as never,
      configMock() as never,
      audit as unknown as AuditService,
      {} as unknown as EmailSendAdapter,
      { resolveRecipients: jest.fn() } as unknown as AudienceService,
    );

    await expect(
      service.createDraftFromInquiries(
        {
          email_account_id: 3,
          title: "Follow up Pesan Kontak",
          subject: "Terima kasih sudah menghubungi Indobraga",
          body_text: "Halo",
          inquiry_filter: { status: "new" },
        },
        { id: 9 },
      ),
    ).resolves.toEqual({ id: 11, status: "draft", total_recipients: 2 });

    expect(prisma.emailCampaign.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalRecipients: 2,
          recipients: {
            createMany: {
              data: [
                { email: "budi@example.com", name: "Budi" },
                { email: "sari@example.com", name: "Sari" },
              ],
            },
          },
        }) as object,
      }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "email_campaign.create_draft_from_inquiries",
        resourceId: 11,
      }),
    );
  });

  it("updates draft campaigns and replaces recipients inside a transaction", async () => {
    const originalAccount = account();
    const replacementAccount = account({
      id: 4,
      email: "sales@indobraga.com",
      displayName: "Indobraga Sales",
    });
    const prisma = prismaMock();
    prisma.emailCampaign.findUnique.mockResolvedValue(campaign(originalAccount));
    prisma.emailAccount.findUnique.mockResolvedValue(replacementAccount);
    prismaMockState.emailCampaignRecipientDeleteMany.mockResolvedValue({ count: 2 });
    prismaMockState.emailCampaignUpdate.mockResolvedValue(
      campaign(replacementAccount, {
        bodyHtml: "<p>Body baru</p>",
        failedCount: 0,
        name: "Campaign update",
        queuedCount: 1,
        senderAccountId: 4,
        sentCount: 0,
        subject: "Subject update",
        totalRecipients: 1,
      }),
    );
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new EmailCampaignsService(
      prisma as never,
      configMock() as never,
      audit as unknown as AuditService,
      {} as unknown as EmailSendAdapter,
      { resolveRecipients: jest.fn() } as unknown as AudienceService,
    );

    await expect(
      service.update(
        11,
        {
          body_text: "Body baru",
          email_account_id: 4,
          recipients: [
            { email: " BARU@example.com ", name: " Baru " },
            { email: "baru@example.com", name: "Duplikat" },
          ],
          subject: "Subject update",
          title: "Campaign update",
        },
        { id: 9 },
      ),
    ).resolves.toMatchObject({
      id: 11,
      queued_count: 1,
      sender_account: { email_address: "sales@indobraga.com" },
      title: "Campaign update",
      total_recipients: 1,
    });

    expect(prismaMockState.emailCampaignRecipientDeleteMany).toHaveBeenCalledWith({
      where: { campaignId: 11 },
    });
    const updateArg = firstMockArg<{ data: Record<string, unknown> }>(
      prismaMockState.emailCampaignUpdate,
    );
    expect(updateArg.data).toMatchObject({
      bodyHtml: "<p>Body baru</p>",
      failedCount: 0,
      name: "Campaign update",
      queuedCount: 1,
      senderAccountId: 4,
      sentCount: 0,
      subject: "Subject update",
      totalRecipients: 1,
    });
    expect(updateArg.data.recipients).toEqual({
      createMany: {
        data: [{ email: "baru@example.com", marketingContactId: undefined, name: "Baru" }],
      },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "email_campaign.update_draft",
        metadata: { recipients_replaced: true },
        resourceId: 11,
      }),
    );
  });

  it("moves draft campaigns to pending and resets recipient delivery state", async () => {
    const senderAccount = account();
    const prisma = prismaMock();
    prisma.emailCampaign.findUnique.mockResolvedValue(
      campaign(senderAccount, { totalRecipients: 2 }),
    );
    prisma.emailCampaign.update.mockResolvedValue(
      campaign(senderAccount, {
        queuedCount: 2,
        status: EmailCampaignStatus.PENDING,
        totalRecipients: 2,
      }),
    );
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new EmailCampaignsService(
      prisma as never,
      configMock() as never,
      audit as unknown as AuditService,
      {} as unknown as EmailSendAdapter,
      { resolveRecipients: jest.fn() } as unknown as AudienceService,
    );

    await expect(service.send(11, { id: 9 })).resolves.toMatchObject({
      id: 11,
      queued_count: 2,
      status: "pending",
    });
    const sendUpdateArg = firstMockArg<{ data: Record<string, unknown> }>(
      prisma.emailCampaign.update,
    );
    expect(sendUpdateArg.data).toMatchObject({
      failedCount: 0,
      queuedCount: 2,
      recipients: {
        updateMany: {
          data: {
            attempts: 0,
            errorCode: null,
            errorMessage: null,
            failedAt: null,
            lockedAt: null,
            nextAttemptAt: null,
            sentAt: null,
            status: EmailRecipientStatus.QUEUED,
          },
          where: {},
        },
      },
      sentCount: 0,
      status: EmailCampaignStatus.PENDING,
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "email_campaign.send",
        metadata: { total_recipients: 2 },
      }),
    );
  });

  it("lists campaign recipients with status filter and API field mapping", async () => {
    const senderAccount = account();
    const prisma = prismaMock();
    prisma.emailCampaign.findUnique.mockResolvedValue(campaign(senderAccount));
    prisma.emailCampaignRecipient.findMany.mockResolvedValue([
      recipient({
        attempts: 1,
        errorCode: "SMTP_TEMP",
        errorMessage: "Temporary failed",
        status: EmailRecipientStatus.FAILED,
      }),
    ]);
    prisma.emailCampaignRecipient.count.mockResolvedValue(1);
    const service = new EmailCampaignsService(
      prisma as never,
      configMock() as never,
      { record: jest.fn() } as unknown as AuditService,
      {} as unknown as EmailSendAdapter,
      { resolveRecipients: jest.fn() } as unknown as AudienceService,
    );

    await expect(
      service.recipients(11, { limit: 10, page: 1, q: "budi", status: "failed" }),
    ).resolves.toMatchObject({
      items: [
        {
          attempts: 1,
          campaign_id: 11,
          email: "budi@example.com",
          error_code: "SMTP_TEMP",
          status: "failed",
        },
      ],
      pagination: {
        total: 1,
      },
    });

    const findManyArg = firstMockArg<{ where: Record<string, unknown> }>(
      prisma.emailCampaignRecipient.findMany,
    );
    expect(findManyArg.where).toMatchObject({
      campaignId: 11,
      status: EmailRecipientStatus.FAILED,
      OR: [{ email: { contains: "budi" } }, { name: { contains: "budi" } }],
    });
  });

  it("lists campaign send logs with recipient email", async () => {
    const senderAccount = account();
    const prisma = prismaMock();
    prisma.emailCampaign.findUnique.mockResolvedValue(campaign(senderAccount));
    prisma.emailSendLog.findMany.mockResolvedValue([
      {
        campaignId: 11,
        createdAt: now,
        errorCode: null,
        errorMessage: null,
        id: 71,
        messageId: "provider-message-id",
        provider: "smtp",
        recipient: { email: "budi@example.com" },
        recipientId: 31,
        responseMeta: { accepted: 1 },
        status: "sent",
      },
    ]);
    prisma.emailSendLog.count.mockResolvedValue(1);
    const service = new EmailCampaignsService(
      prisma as never,
      configMock() as never,
      { record: jest.fn() } as unknown as AuditService,
      {} as unknown as EmailSendAdapter,
      { resolveRecipients: jest.fn() } as unknown as AudienceService,
    );

    await expect(service.logs(11, { limit: 10, page: 1, status: "sent" })).resolves.toEqual({
      items: [
        {
          campaign_id: 11,
          created_at: now,
          error_code: null,
          error_message: null,
          id: 71,
          message_id: "provider-message-id",
          provider: "smtp",
          recipient_email: "budi@example.com",
          recipient_id: 31,
          response_meta: { accepted: 1 },
          status: "sent",
        },
      ],
      pagination: {
        limit: 10,
        page: 1,
        total: 1,
        total_pages: 1,
      },
    });
  });

  it("returns idle worker status when no campaign can be claimed", async () => {
    const prisma = prismaMock();
    prisma.emailCampaign.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const service = new EmailCampaignsService(
      prisma as never,
      configMock() as never,
      { record: jest.fn() } as unknown as AuditService,
      {} as unknown as EmailSendAdapter,
      { resolveRecipients: jest.fn() } as unknown as AudienceService,
    );

    await expect(service.workerTick()).resolves.toEqual({
      claimed_campaign_id: null,
      failed: 0,
      processed: 0,
      remaining: 0,
      sent: 0,
      status: "idle",
    });
    expect(prisma.emailCampaign.updateMany).not.toHaveBeenCalled();
  });

  it("worker tick claims a pending campaign, sends queued recipients, and completes aggregates", async () => {
    const senderAccount = account();
    const prisma = prismaMock();
    const sender = {
      send: jest.fn().mockResolvedValue({
        errorCode: null,
        errorMessage: null,
        messageId: "message-id",
        responseMeta: { accepted: 1 },
        status: "sent",
      }),
    };
    prisma.emailCampaign.findFirst.mockResolvedValueOnce({ id: 11 });
    prisma.emailCampaign.updateMany.mockResolvedValue({ count: 1 });
    prisma.emailCampaign.findUnique.mockResolvedValue(
      campaign(senderAccount, { status: EmailCampaignStatus.SENDING }),
    );
    prisma.emailCampaignRecipient.findMany.mockResolvedValue([recipient()]);
    prisma.emailCampaignRecipient.update.mockResolvedValue({});
    prisma.emailSendLog.create.mockResolvedValue({});
    prisma.emailCampaignRecipient.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(0);
    prisma.emailCampaign.update.mockResolvedValue(
      campaign(senderAccount, {
        failedCount: 0,
        queuedCount: 0,
        sentCount: 1,
        status: EmailCampaignStatus.COMPLETED,
      }),
    );
    const service = new EmailCampaignsService(
      prisma as never,
      configMock() as never,
      { record: jest.fn() } as unknown as AuditService,
      sender as unknown as EmailSendAdapter,
      { resolveRecipients: jest.fn() } as unknown as AudienceService,
    );

    await expect(service.workerTick()).resolves.toEqual({
      claimed_campaign_id: 11,
      failed: 0,
      processed: 1,
      remaining: 0,
      sent: 1,
      status: "completed",
    });
    expect(sender.send).toHaveBeenCalledWith({
      account: senderAccount,
      attempt: 1,
      bodyHtml: "<p>Halo</p>",
      bodyText: "Halo",
      name: "Budi",
      subject: "Terima kasih sudah menghubungi Indobraga",
      to: "budi@example.com",
    });
    expect(prisma.emailSendLog.create).toHaveBeenCalledWith({
      data: {
        campaignId: 11,
        errorCode: null,
        errorMessage: null,
        messageId: "message-id",
        provider: "smtp",
        recipientId: 31,
        responseMeta: { accepted: 1 },
        status: "sent",
      },
    });
    const aggregateUpdateArg = firstMockArg<{
      data: Record<string, unknown>;
      where: { id: number };
    }>(prisma.emailCampaign.update);
    expect(aggregateUpdateArg.data).toMatchObject({
      failedCount: 0,
      lockedAt: null,
      queuedCount: 0,
      sentCount: 1,
      status: EmailCampaignStatus.COMPLETED,
    });
    expect(aggregateUpdateArg.data.finishedAt).toBeInstanceOf(Date);
    expect(aggregateUpdateArg.where).toEqual({ id: 11 });
  });
});
