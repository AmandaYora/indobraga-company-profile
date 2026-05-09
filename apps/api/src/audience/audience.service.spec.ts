import { UnprocessableEntityException } from "@nestjs/common";
import {
  Inquiry,
  InquiryStatus,
  MarketingConsentStatus,
  MarketingContact,
  MarketingContactSource,
  MarketingContactStatus,
} from "@prisma/client";
import { AudienceService } from "@/audience/audience.service";

const now = new Date("2026-01-01T00:00:00.000Z");

const inquiry = (overrides: Partial<Inquiry> = {}): Inquiry => ({
  id: 7,
  name: "Budi",
  email: "BUDI@Example.com",
  phone: "08123456789",
  company: "PT Contoh",
  message: "Butuh produksi seragam.",
  status: InquiryStatus.NEW,
  internalNote: null,
  notificationStatus: "pending",
  source: "website",
  meta: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const contact = (overrides: Partial<MarketingContact> = {}): MarketingContact => ({
  id: 1,
  email: "budi@example.com",
  name: "Budi",
  phone: "08123456789",
  company: "PT Contoh",
  source: MarketingContactSource.INQUIRY,
  sourceRefId: 7,
  status: MarketingContactStatus.ACTIVE,
  consentStatus: MarketingConsentStatus.IMPLIED,
  tags: null,
  lastInteractionAt: now,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const prismaMock = () => ({
  marketingContact: {
    upsert: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
});

const configMock = (maxRecipients = 1000) => ({
  get: jest.fn((key: string) => {
    if (key === "EMAIL_CAMPAIGN_RECIPIENT_MAX") {
      return maxRecipients;
    }
    return undefined;
  }),
});

describe("AudienceService", () => {
  it("upserts marketing contact from inquiry with normalized email", async () => {
    const prisma = prismaMock();
    prisma.marketingContact.upsert.mockResolvedValue(contact());
    const service = new AudienceService(prisma as never, configMock() as never);

    await service.upsertFromInquiry(inquiry());

    expect(prisma.marketingContact.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "budi@example.com" },
        create: expect.objectContaining({
          email: "budi@example.com",
          source: MarketingContactSource.INQUIRY,
          sourceRefId: 7,
          status: MarketingContactStatus.ACTIVE,
        }) as object,
        update: expect.objectContaining({
          name: "Budi",
          sourceRefId: 7,
        }) as object,
      }),
    );
  });

  it("previews eligible and excluded contacts", async () => {
    const prisma = prismaMock();
    prisma.marketingContact.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    prisma.marketingContact.findMany.mockResolvedValue([contact()]);
    const service = new AudienceService(prisma as never, configMock() as never);

    await expect(service.preview({ source: "inquiry" })).resolves.toEqual({
      total_contacts: 3,
      eligible_recipients: 1,
      excluded_unsubscribed: 1,
      excluded_blocked: 1,
      sample_recipients: [
        {
          id: 1,
          name: "Budi",
          email: "budi@example.com",
          company: "PT Contoh",
        },
      ],
    });
  });

  it("resolves active audience recipients with marketing contact ids", async () => {
    const prisma = prismaMock();
    prisma.marketingContact.count.mockResolvedValue(1);
    prisma.marketingContact.findMany.mockResolvedValue([contact()]);
    const service = new AudienceService(prisma as never, configMock() as never);

    await expect(service.resolveRecipients({ q: "Budi" })).resolves.toEqual([
      { marketingContactId: 1, email: "budi@example.com", name: "Budi" },
    ]);
  });

  it("rejects audience recipients over campaign limit", async () => {
    const prisma = prismaMock();
    prisma.marketingContact.count.mockResolvedValue(2);
    const service = new AudienceService(prisma as never, configMock(1) as never);

    await expect(service.resolveRecipients({})).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });
});
