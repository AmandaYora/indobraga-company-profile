import { Injectable } from "@nestjs/common";
import {
  ContentStatus,
  EmailAccountStatus,
  EmailCampaign,
  EmailCampaignStatus,
  Inquiry,
  MediaStatus,
  RevalidationStatus,
  WhatsAppLead,
} from "@prisma/client";
import { PrismaService } from "@/database/prisma.service";
import { PRISMA_TO_API_CAMPAIGN_STATUS } from "@/email-campaigns/email-campaign-maps";
import {
  PRISMA_TO_API_INQUIRY_STATUS,
  PRISMA_TO_API_WHATSAPP_STATUS,
} from "@/leads/lead-status.dto";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [
      inquiries,
      whatsappLeads,
      publishedGallery,
      publishedNews,
      activePortfolios,
      completedMedia,
      failedMedia,
      connectedEmailAccounts,
      emailCampaigns,
      pendingCampaigns,
      pendingRevalidation,
      latestInquiries,
      latestWhatsAppLeads,
      latestEmailCampaigns,
    ] = await this.prisma.$transaction([
      this.prisma.inquiry.count({ where: { archivedAt: null } }),
      this.prisma.whatsAppLead.count({ where: { archivedAt: null } }),
      this.prisma.galleryItem.count({ where: { status: ContentStatus.PUBLISHED } }),
      this.prisma.newsArticle.count({ where: { status: ContentStatus.PUBLISHED } }),
      this.prisma.portfolio.count({ where: { status: ContentStatus.PUBLISHED } }),
      this.prisma.mediaFile.count({ where: { status: MediaStatus.COMPLETED } }),
      this.prisma.mediaFile.count({ where: { status: MediaStatus.FAILED } }),
      this.prisma.emailAccount.count({ where: { status: EmailAccountStatus.CONNECTED } }),
      this.prisma.emailCampaign.count(),
      this.prisma.emailCampaign.count({
        where: { status: { in: [EmailCampaignStatus.PENDING, EmailCampaignStatus.SENDING] } },
      }),
      this.prisma.revalidationEvent.count({ where: { status: RevalidationStatus.PENDING } }),
      this.prisma.inquiry.findMany({
        where: { archivedAt: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 5,
      }),
      this.prisma.whatsAppLead.findMany({
        where: { archivedAt: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 5,
      }),
      this.prisma.emailCampaign.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 5,
      }),
    ]);

    return {
      totals: {
        inquiries,
        whatsapp_leads: whatsappLeads,
        published_gallery: publishedGallery,
        published_news: publishedNews,
        active_portfolios: activePortfolios,
        completed_media: completedMedia,
        failed_media: failedMedia,
        connected_email_accounts: connectedEmailAccounts,
        email_campaigns: emailCampaigns,
        pending_email_campaigns: pendingCampaigns,
        pending_revalidation: pendingRevalidation,
      },
      latest_inquiries: latestInquiries.map((item) => this.presentInquiry(item)),
      latest_whatsapp_leads: latestWhatsAppLeads.map((item) => this.presentWhatsAppLead(item)),
      latest_email_campaigns: latestEmailCampaigns.map((item) => this.presentCampaign(item)),
    };
  }

  private presentInquiry(item: Inquiry) {
    return {
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      company: item.company,
      status: PRISMA_TO_API_INQUIRY_STATUS[item.status],
      created_at: item.createdAt,
    };
  }

  private presentWhatsAppLead(item: WhatsAppLead) {
    return {
      id: item.id,
      name: item.name,
      phone: item.phone,
      status: PRISMA_TO_API_WHATSAPP_STATUS[item.status],
      created_at: item.createdAt,
    };
  }

  private presentCampaign(item: EmailCampaign) {
    return {
      id: item.id,
      title: item.name,
      subject: item.subject,
      status: PRISMA_TO_API_CAMPAIGN_STATUS[item.status],
      total_recipients: item.totalRecipients,
      sent_count: item.sentCount,
      failed_count: item.failedCount,
      created_at: item.createdAt,
    };
  }
}
