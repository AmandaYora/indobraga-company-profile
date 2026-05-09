import {
  EmailAccount,
  EmailAccountStatus,
  EmailCampaign,
  EmailCampaignStatus,
  EmailProviderType,
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

const prismaMock = () => ({
  emailAccount: {
    findUnique: jest.fn(),
  },
  emailCampaign: {
    create: jest.fn(),
  },
});

const configMock = () => ({
  get: jest.fn((key: string) => {
    if (key === "EMAIL_CAMPAIGN_RECIPIENT_MAX") {
      return 1000;
    }
    return undefined;
  }),
});

describe("EmailCampaignsService", () => {
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
});
