import {
  EmailCampaign,
  EmailCampaignStatus,
  Inquiry,
  InquiryStatus,
  WhatsAppLead,
  WhatsAppLeadStatus,
} from "@prisma/client";
import { DashboardService } from "@/dashboard/dashboard.service";

const now = new Date("2026-01-01T00:00:00.000Z");

const inquiry = (): Inquiry => ({
  id: 1,
  name: "Budi",
  email: "budi@example.com",
  phone: "08123456789",
  company: "PT Contoh",
  message: "Pesan",
  status: InquiryStatus.NEW,
  internalNote: null,
  notificationStatus: null,
  source: "website",
  meta: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
});

const whatsAppLead = (): WhatsAppLead => ({
  id: 2,
  name: "Sari",
  phone: "08987654321",
  message: "Halo",
  whatsappUrl: "https://wa.me/6285158700895",
  status: WhatsAppLeadStatus.CONTACTED,
  internalNote: null,
  source: "website",
  meta: null,
  archivedAt: null,
  createdAt: now,
  updatedAt: now,
});

const campaign = (): EmailCampaign => ({
  id: 3,
  senderAccountId: 1,
  createdById: 1,
  name: "Promo",
  subject: "Promo Indobraga",
  bodyText: null,
  bodyHtml: "<p>Promo</p>",
  status: EmailCampaignStatus.SENDING,
  totalRecipients: 10,
  queuedCount: 2,
  sentCount: 7,
  failedCount: 1,
  lockedAt: null,
  startedAt: null,
  finishedAt: null,
  lastError: null,
  createdAt: now,
  updatedAt: now,
});

describe("DashboardService", () => {
  it("returns admin dashboard totals and latest activity lists", async () => {
    const counts = [5, 4, 3, 2, 1, 9, 1, 2, 6, 1, 7];
    const prisma = {
      inquiry: {
        count: jest.fn().mockResolvedValueOnce(counts[0]).mockResolvedValueOnce(counts[0]),
        findMany: jest.fn().mockResolvedValue([inquiry()]),
      },
      whatsAppLead: {
        count: jest.fn().mockResolvedValue(counts[1]),
        findMany: jest.fn().mockResolvedValue([whatsAppLead()]),
      },
      galleryItem: { count: jest.fn().mockResolvedValue(counts[2]) },
      newsArticle: { count: jest.fn().mockResolvedValue(counts[3]) },
      portfolio: { count: jest.fn().mockResolvedValue(counts[4]) },
      mediaFile: {
        count: jest.fn().mockResolvedValueOnce(counts[5]).mockResolvedValueOnce(counts[6]),
      },
      emailAccount: { count: jest.fn().mockResolvedValue(counts[7]) },
      emailCampaign: {
        count: jest.fn().mockResolvedValueOnce(counts[8]).mockResolvedValueOnce(counts[9]),
        findMany: jest.fn().mockResolvedValue([campaign()]),
      },
      revalidationEvent: { count: jest.fn().mockResolvedValue(counts[10]) },
      $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
    };
    const service = new DashboardService(prisma as never);

    await expect(service.summary()).resolves.toEqual({
      totals: {
        inquiries: 5,
        whatsapp_leads: 4,
        published_gallery: 3,
        published_news: 2,
        active_portfolios: 1,
        completed_media: 9,
        failed_media: 1,
        connected_email_accounts: 2,
        email_campaigns: 6,
        pending_email_campaigns: 1,
        pending_revalidation: 7,
      },
      latest_inquiries: [expect.objectContaining({ id: 1, status: "new" })],
      latest_whatsapp_leads: [expect.objectContaining({ id: 2, status: "contacted" })],
      latest_email_campaigns: [expect.objectContaining({ id: 3, status: "processing" })],
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
