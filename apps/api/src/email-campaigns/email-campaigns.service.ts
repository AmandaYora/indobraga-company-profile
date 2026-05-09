import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  EmailAccount,
  EmailAccountStatus,
  EmailCampaign,
  EmailCampaignRecipient,
  EmailCampaignStatus,
  EmailRecipientStatus,
  Inquiry,
  InquiryStatus,
  Prisma,
} from "@prisma/client";
import type { Env } from "@/config/env";
import { AudienceService } from "@/audience/audience.service";
import { createPagePaginationMeta, normalizePagePagination } from "@/core/pagination";
import { PrismaService } from "@/database/prisma.service";
import { AuditService } from "@/audit/audit.service";
import { CampaignAudienceDraftDto } from "@/email-campaigns/dto/campaign-audience-draft.dto";
import { CampaignDraftDto } from "@/email-campaigns/dto/campaign-draft.dto";
import { CampaignInquiryDraftDto } from "@/email-campaigns/dto/campaign-inquiry-draft.dto";
import { InquiryRecipientFilterDto } from "@/email-campaigns/dto/inquiry-recipient-filter.dto";
import { ListCampaignsQueryDto } from "@/email-campaigns/dto/list-campaigns-query.dto";
import { ListRecipientsQueryDto } from "@/email-campaigns/dto/list-recipients-query.dto";
import { ListSendLogsQueryDto } from "@/email-campaigns/dto/list-send-logs-query.dto";
import { UpdateCampaignDto } from "@/email-campaigns/dto/update-campaign.dto";
import {
  API_TO_PRISMA_CAMPAIGN_STATUS,
  API_TO_PRISMA_RECIPIENT_STATUS,
  PRISMA_TO_API_CAMPAIGN_STATUS,
  PRISMA_TO_API_RECIPIENT_STATUS,
} from "@/email-campaigns/email-campaign-maps";
import { EmailSendAdapter } from "@/email-campaigns/email-send.adapter";
import { PRISMA_TO_API_EMAIL_PROVIDER } from "@/email-accounts/email-account-maps";
import { API_TO_PRISMA_INQUIRY_STATUS, PRISMA_TO_API_INQUIRY_STATUS } from "@/leads/lead-status.dto";

type Actor = {
  id?: number;
};

type CampaignWithSender = EmailCampaign & {
  senderAccount: EmailAccount;
};

type NormalizedRecipient = {
  email: string;
  name?: string | null;
  marketingContactId?: number;
};

type InquiryRecipientCandidate = Pick<
  Inquiry,
  "id" | "name" | "email" | "company" | "status" | "createdAt"
>;

type InquiryRecipientAnalysis = {
  totalInquiries: number;
  eligibleRecipients: NormalizedRecipient[];
  duplicateEmails: number;
  invalidEmails: number;
  sampleRecipients: InquiryRecipientCandidate[];
};

@Injectable()
export class EmailCampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly audit: AuditService,
    private readonly sender: EmailSendAdapter,
    private readonly audience: AudienceService,
  ) {}

  async list(query: ListCampaignsQueryDto) {
    const pagination = normalizePagePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 10,
      maxLimit: 100,
    });
    const where: Prisma.EmailCampaignWhereInput = {
      ...(query.status ? { status: API_TO_PRISMA_CAMPAIGN_STATUS[query.status] } : {}),
      ...(query.email_account_id ? { senderAccountId: query.email_account_id } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q } },
              { subject: { contains: query.q } },
              { senderAccount: { email: { contains: query.q } } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.emailCampaign.findMany({
        where,
        include: { senderAccount: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.emailCampaign.count({ where }),
    ]);

    return {
      items: items.map((item) => this.presentCampaign(item)),
      pagination: createPagePaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async detail(id: number) {
    return this.presentCampaign(await this.findCampaign(id));
  }

  async previewInquiryRecipients(filter: InquiryRecipientFilterDto) {
    const analysis = await this.analyzeInquiryRecipients(filter);
    const recipientLimit = this.config.get("EMAIL_CAMPAIGN_RECIPIENT_MAX", { infer: true });

    return {
      total_inquiries: analysis.totalInquiries,
      eligible_recipients: analysis.eligibleRecipients.length,
      duplicate_emails: analysis.duplicateEmails,
      invalid_emails: analysis.invalidEmails,
      recipient_limit: recipientLimit,
      over_limit: analysis.eligibleRecipients.length > recipientLimit,
      sample_recipients: analysis.sampleRecipients.map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        company: item.company,
        status: PRISMA_TO_API_INQUIRY_STATUS[item.status],
        created_at: item.createdAt,
      })),
    };
  }

  async createDraft(dto: CampaignDraftDto, actor: Actor) {
    const recipients = this.normalizeRecipients(dto.recipients);
    const account = await this.findConnectedAccount(dto.email_account_id);

    const campaign = await this.prisma.emailCampaign.create({
      data: {
        senderAccountId: account.id,
        createdById: actor.id,
        name: dto.title,
        subject: dto.subject,
        bodyText: dto.body_text,
        bodyHtml: this.resolveBodyHtml(dto.body_text, dto.body_html),
        status: EmailCampaignStatus.DRAFT,
        totalRecipients: recipients.length,
        queuedCount: recipients.length,
        recipients: {
          createMany: {
            data: recipients.map((recipient) => ({
              email: recipient.email,
              name: recipient.name,
              marketingContactId: recipient.marketingContactId,
            })),
          },
        },
      },
      include: { senderAccount: true },
    });
    await this.recordMutation(actor, "email_campaign.create_draft", campaign.id, {
      total_recipients: recipients.length,
    });

    return {
      id: campaign.id,
      status: PRISMA_TO_API_CAMPAIGN_STATUS[campaign.status],
      total_recipients: campaign.totalRecipients,
    };
  }

  async createDraftFromAudience(dto: CampaignAudienceDraftDto, actor: Actor) {
    const recipients = this.normalizeRecipients(
      await this.audience.resolveRecipients(dto.audience_filter),
    );
    const account = await this.findConnectedAccount(dto.email_account_id);

    const campaign = await this.prisma.emailCampaign.create({
      data: {
        senderAccountId: account.id,
        createdById: actor.id,
        name: dto.title,
        subject: dto.subject,
        bodyText: dto.body_text,
        bodyHtml: this.resolveBodyHtml(dto.body_text, dto.body_html),
        status: EmailCampaignStatus.DRAFT,
        totalRecipients: recipients.length,
        queuedCount: recipients.length,
        recipients: {
          createMany: {
            data: recipients.map((recipient) => ({
              email: recipient.email,
              name: recipient.name,
              marketingContactId: recipient.marketingContactId,
            })),
          },
        },
      },
      include: { senderAccount: true },
    });
    await this.recordMutation(actor, "email_campaign.create_draft_from_audience", campaign.id, {
      total_recipients: recipients.length,
      audience_filter: dto.audience_filter as Prisma.InputJsonObject,
    });

    return {
      id: campaign.id,
      status: PRISMA_TO_API_CAMPAIGN_STATUS[campaign.status],
      total_recipients: campaign.totalRecipients,
    };
  }

  async createDraftFromInquiries(dto: CampaignInquiryDraftDto, actor: Actor) {
    const recipients = await this.resolveInquiryRecipients(dto.inquiry_filter);
    const account = await this.findConnectedAccount(dto.email_account_id);

    const campaign = await this.prisma.emailCampaign.create({
      data: {
        senderAccountId: account.id,
        createdById: actor.id,
        name: dto.title,
        subject: dto.subject,
        bodyText: dto.body_text,
        bodyHtml: this.resolveBodyHtml(dto.body_text, dto.body_html),
        status: EmailCampaignStatus.DRAFT,
        totalRecipients: recipients.length,
        queuedCount: recipients.length,
        recipients: {
          createMany: {
            data: recipients.map((recipient) => ({
              email: recipient.email,
              name: recipient.name,
            })),
          },
        },
      },
      include: { senderAccount: true },
    });
    await this.recordMutation(actor, "email_campaign.create_draft_from_inquiries", campaign.id, {
      total_recipients: recipients.length,
      inquiry_filter: dto.inquiry_filter as Prisma.InputJsonObject,
    });

    return {
      id: campaign.id,
      status: PRISMA_TO_API_CAMPAIGN_STATUS[campaign.status],
      total_recipients: campaign.totalRecipients,
    };
  }

  async update(id: number, dto: UpdateCampaignDto, actor: Actor) {
    const campaign = await this.findCampaign(id);
    if (campaign.status !== EmailCampaignStatus.DRAFT) {
      throw this.unprocessable("Hanya campaign draft yang boleh diubah.");
    }

    const account = dto.email_account_id
      ? await this.findConnectedAccount(dto.email_account_id)
      : campaign.senderAccount;
    const recipients = dto.recipients ? this.normalizeRecipients(dto.recipients) : undefined;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (recipients) {
        await tx.emailCampaignRecipient.deleteMany({ where: { campaignId: id } });
      }

      return tx.emailCampaign.update({
        where: { id },
        data: {
          senderAccountId: account.id,
          name: dto.title ?? undefined,
          subject: dto.subject ?? undefined,
          bodyText: dto.body_text ?? undefined,
          bodyHtml:
            dto.body_html !== undefined || dto.body_text !== undefined
              ? this.resolveBodyHtml(dto.body_text, dto.body_html)
              : undefined,
          totalRecipients: recipients?.length,
          queuedCount: recipients?.length,
          sentCount: recipients ? 0 : undefined,
          failedCount: recipients ? 0 : undefined,
          recipients: recipients
            ? {
                createMany: {
                  data: recipients.map((recipient) => ({
                    email: recipient.email,
                    name: recipient.name,
                    marketingContactId: recipient.marketingContactId,
                  })),
                },
              }
            : undefined,
        },
        include: { senderAccount: true },
      });
    });
    await this.recordMutation(actor, "email_campaign.update_draft", id, {
      recipients_replaced: recipients !== undefined,
    });

    return this.presentCampaign(updated);
  }

  async send(id: number, actor: Actor) {
    const campaign = await this.findCampaign(id);
    if (campaign.status !== EmailCampaignStatus.DRAFT) {
      throw this.unprocessable("Hanya campaign draft yang dapat dikirim.");
    }
    if (campaign.senderAccount.status !== EmailAccountStatus.CONNECTED) {
      throw this.unprocessable("Akun pengirim belum connected.");
    }
    if (campaign.totalRecipients <= 0) {
      throw this.unprocessable("Campaign wajib memiliki minimal satu recipient.");
    }

    const updated = await this.prisma.emailCampaign.update({
      where: { id },
      data: {
        status: EmailCampaignStatus.PENDING,
        queuedCount: campaign.totalRecipients,
        sentCount: 0,
        failedCount: 0,
        startedAt: null,
        finishedAt: null,
        lockedAt: null,
        lastError: null,
        recipients: {
          updateMany: {
            where: {},
            data: {
              status: EmailRecipientStatus.QUEUED,
              attempts: 0,
              nextAttemptAt: null,
              lockedAt: null,
              sentAt: null,
              failedAt: null,
              errorCode: null,
              errorMessage: null,
            },
          },
        },
      },
      include: { senderAccount: true },
    });
    await this.recordMutation(actor, "email_campaign.send", id, {
      total_recipients: campaign.totalRecipients,
    });

    return this.presentCampaign(updated);
  }

  async recipients(id: number, query: ListRecipientsQueryDto) {
    await this.ensureCampaign(id);
    const pagination = normalizePagePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 10,
      maxLimit: 100,
    });
    const where: Prisma.EmailCampaignRecipientWhereInput = {
      campaignId: id,
      ...(query.status ? { status: API_TO_PRISMA_RECIPIENT_STATUS[query.status] } : {}),
      ...(query.q
        ? {
            OR: [{ email: { contains: query.q } }, { name: { contains: query.q } }],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.emailCampaignRecipient.findMany({
        where,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.emailCampaignRecipient.count({ where }),
    ]);

    return {
      items: items.map((item) => this.presentRecipient(item)),
      pagination: createPagePaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async logs(id: number, query: ListSendLogsQueryDto) {
    await this.ensureCampaign(id);
    const pagination = normalizePagePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 10,
      maxLimit: 100,
    });
    const where: Prisma.EmailSendLogWhereInput = {
      campaignId: id,
      ...(query.status ? { status: query.status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.emailSendLog.findMany({
        where,
        include: { recipient: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.emailSendLog.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        campaign_id: item.campaignId,
        recipient_id: item.recipientId,
        recipient_email: item.recipient?.email ?? null,
        provider: item.provider,
        status: item.status,
        message_id: item.messageId,
        error_code: item.errorCode,
        error_message: item.errorMessage,
        response_meta: item.responseMeta,
        created_at: item.createdAt,
      })),
      pagination: createPagePaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async workerTick() {
    const claimed = await this.claimCampaign();
    if (!claimed) {
      return {
        claimed_campaign_id: null,
        processed: 0,
        sent: 0,
        failed: 0,
        remaining: 0,
        status: "idle",
      };
    }

    try {
      const result = await this.processCampaign(claimed);
      return result;
    } catch (error) {
      await this.prisma.emailCampaign.update({
        where: { id: claimed.id },
        data: {
          status: EmailCampaignStatus.FAILED,
          finishedAt: new Date(),
          lockedAt: null,
          lastError: error instanceof Error ? error.message : "Worker fatal error.",
        },
      });
      throw error;
    }
  }

  private async processCampaign(campaign: CampaignWithSender) {
    const batchSize = this.config.get("EMAIL_WORKER_BATCH_SIZE", { infer: true });
    const maxAttempts = this.config.get("EMAIL_WORKER_MAX_ATTEMPTS", { infer: true });
    const recipients = await this.prisma.emailCampaignRecipient.findMany({
      where: {
        campaignId: campaign.id,
        status: EmailRecipientStatus.QUEUED,
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: batchSize,
    });
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const attempt = recipient.attempts + 1;
      await this.prisma.emailCampaignRecipient.update({
        where: { id: recipient.id },
        data: { status: EmailRecipientStatus.SENDING, lockedAt: new Date(), attempts: attempt },
      });

      const result = await this.sender.send({
        account: campaign.senderAccount,
        to: recipient.email,
        name: recipient.name,
        subject: campaign.subject,
        bodyHtml: campaign.bodyHtml ?? "",
        bodyText: campaign.bodyText,
        attempt,
      });

      await this.prisma.emailSendLog.create({
        data: {
          campaignId: campaign.id,
          recipientId: recipient.id,
          provider: PRISMA_TO_API_EMAIL_PROVIDER[campaign.senderAccount.provider],
          status: result.status,
          messageId: result.messageId,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
          responseMeta: result.responseMeta,
        },
      });

      if (result.status === "sent") {
        sent += 1;
        await this.prisma.emailCampaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: EmailRecipientStatus.SENT,
            sentAt: new Date(),
            lockedAt: null,
            nextAttemptAt: null,
            errorCode: null,
            errorMessage: null,
          },
        });
      } else if (result.status === "temporary_failed" && attempt < maxAttempts) {
        await this.prisma.emailCampaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: EmailRecipientStatus.QUEUED,
            lockedAt: null,
            nextAttemptAt: new Date(Date.now() + 60_000),
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
          },
        });
      } else {
        failed += 1;
        await this.prisma.emailCampaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: EmailRecipientStatus.FAILED,
            failedAt: new Date(),
            lockedAt: null,
            nextAttemptAt: null,
            errorCode: result.errorCode ?? "SEND_FAILED",
            errorMessage: result.errorMessage ?? "Pengiriman gagal.",
          },
        });
      }
    }

    return this.refreshCampaignAggregates(campaign.id, recipients.length, sent, failed);
  }

  private async refreshCampaignAggregates(
    campaignId: number,
    processed: number,
    sentInBatch: number,
    failedInBatch: number,
  ) {
    const [queuedCount, sendingCount, sentCount, failedCount] = await this.prisma.$transaction([
      this.prisma.emailCampaignRecipient.count({
        where: { campaignId, status: EmailRecipientStatus.QUEUED },
      }),
      this.prisma.emailCampaignRecipient.count({
        where: { campaignId, status: EmailRecipientStatus.SENDING },
      }),
      this.prisma.emailCampaignRecipient.count({
        where: { campaignId, status: EmailRecipientStatus.SENT },
      }),
      this.prisma.emailCampaignRecipient.count({
        where: { campaignId, status: EmailRecipientStatus.FAILED },
      }),
    ]);
    const remaining = queuedCount + sendingCount;
    const completed = remaining === 0;
    const campaign = await this.prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        queuedCount,
        sentCount,
        failedCount,
        status: completed ? EmailCampaignStatus.COMPLETED : EmailCampaignStatus.SENDING,
        lockedAt: null,
        finishedAt: completed ? new Date() : null,
      },
    });

    return {
      claimed_campaign_id: campaignId,
      processed,
      sent: sentInBatch,
      failed: failedInBatch,
      remaining,
      status: PRISMA_TO_API_CAMPAIGN_STATUS[campaign.status],
    };
  }

  private async claimCampaign(): Promise<CampaignWithSender | null> {
    const pending = await this.prisma.emailCampaign.findFirst({
      where: { status: EmailCampaignStatus.PENDING },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });

    if (pending) {
      const claimed = await this.prisma.emailCampaign.updateMany({
        where: { id: pending.id, status: EmailCampaignStatus.PENDING },
        data: {
          status: EmailCampaignStatus.SENDING,
          lockedAt: new Date(),
          startedAt: new Date(),
        },
      });
      if (claimed.count === 0) {
        return null;
      }

      return this.findCampaign(pending.id);
    }

    const processing = await this.prisma.emailCampaign.findFirst({
      where: {
        status: EmailCampaignStatus.SENDING,
        lockedAt: null,
        recipients: {
          some: {
            status: EmailRecipientStatus.QUEUED,
            OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
          },
        },
      },
      orderBy: [{ startedAt: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    if (!processing) {
      return null;
    }

    const claimed = await this.prisma.emailCampaign.updateMany({
      where: { id: processing.id, status: EmailCampaignStatus.SENDING, lockedAt: null },
      data: { lockedAt: new Date() },
    });
    if (claimed.count === 0) {
      return null;
    }

    return this.findCampaign(processing.id);
  }

  private async resolveInquiryRecipients(
    filter: InquiryRecipientFilterDto,
  ): Promise<NormalizedRecipient[]> {
    const analysis = await this.analyzeInquiryRecipients(filter);
    const recipients = analysis.eligibleRecipients;
    const maxRecipients = this.config.get("EMAIL_CAMPAIGN_RECIPIENT_MAX", { infer: true });

    if (recipients.length === 0) {
      throw this.unprocessable("Tidak ada Pesan Kontak dengan email valid yang cocok.");
    }
    if (recipients.length > maxRecipients) {
      throw this.unprocessable(
        `Email valid hasil filter berjumlah ${recipients.length}. Batas penerima adalah ${maxRecipients}. Persempit filter terlebih dahulu.`,
      );
    }

    return recipients;
  }

  private async analyzeInquiryRecipients(
    filter: InquiryRecipientFilterDto,
  ): Promise<InquiryRecipientAnalysis> {
    const candidates = await this.prisma.inquiry.findMany({
      where: this.inquiryRecipientWhere(filter),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 10_000,
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        status: true,
        createdAt: true,
      },
    });
    const seen = new Set<string>();
    let duplicateEmails = 0;
    let invalidEmails = 0;
    const validByEmail = new Map<string, InquiryRecipientCandidate>();

    for (const inquiry of candidates) {
      const email = inquiry.email.trim().toLowerCase();
      if (!this.isEmailLike(email)) {
        invalidEmails += 1;
        continue;
      }
      if (seen.has(email)) {
        duplicateEmails += 1;
        continue;
      }
      seen.add(email);
      validByEmail.set(email, { ...inquiry, email });
    }

    const sampleRecipients = Array.from(validByEmail.values()).slice(0, 5);

    return {
      totalInquiries: candidates.length,
      eligibleRecipients: Array.from(validByEmail.values()).map((item) => ({
        email: item.email,
        name: item.name,
      })),
      duplicateEmails,
      invalidEmails,
      sampleRecipients,
    };
  }

  private inquiryRecipientWhere(filter: InquiryRecipientFilterDto): Prisma.InquiryWhereInput {
    const createdAt = this.inquiryDateRange(filter);

    return {
      archivedAt: null,
      ...(filter.status
        ? { status: API_TO_PRISMA_INQUIRY_STATUS[filter.status] }
        : { status: { not: InquiryStatus.SPAM } }),
      ...(createdAt ? { createdAt } : {}),
      ...(filter.q
        ? {
            OR: [
              { name: { contains: filter.q } },
              { email: { contains: filter.q } },
              { phone: { contains: filter.q } },
              { company: { contains: filter.q } },
              { message: { contains: filter.q } },
            ],
          }
        : {}),
    };
  }

  private inquiryDateRange(filter: InquiryRecipientFilterDto): Prisma.DateTimeFilter | undefined {
    const range: Prisma.DateTimeFilter = {};
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (filter.date_from) {
      fromDate = this.jakartaDateBoundary(filter.date_from, "start");
      range.gte = fromDate;
    }
    if (filter.date_to) {
      toDate = this.jakartaDateBoundary(filter.date_to, "end");
      range.lte = toDate;
    }
    if (fromDate && toDate && fromDate > toDate) {
      throw this.unprocessable("Rentang tanggal Pesan Kontak tidak valid.");
    }

    return Object.keys(range).length > 0 ? range : undefined;
  }

  private jakartaDateBoundary(value: string, boundary: "start" | "end"): Date {
    const dateOnly = value.slice(0, 10);
    const time = boundary === "start" ? "00:00:00.000" : "23:59:59.999";

    return new Date(`${dateOnly}T${time}+07:00`);
  }

  private isEmailLike(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private normalizeRecipients(recipients: NormalizedRecipient[]): NormalizedRecipient[] {
    const maxRecipients = this.config.get("EMAIL_CAMPAIGN_RECIPIENT_MAX", { infer: true });
    const seen = new Set<string>();
    const normalized = recipients.flatMap((recipient) => {
      const email = recipient.email.trim().toLowerCase();
      if (seen.has(email)) {
        return [];
      }
      seen.add(email);

      return [
        {
          email,
          name: recipient.name?.trim() || undefined,
          marketingContactId: recipient.marketingContactId,
        },
      ];
    });

    if (normalized.length > maxRecipients) {
      throw this.unprocessable(`Recipient maksimal ${maxRecipients}.`);
    }

    return normalized;
  }

  private resolveBodyHtml(bodyText?: string | null, bodyHtml?: string | null): string {
    const trimmedHtml = bodyHtml?.trim();
    const trimmedText = bodyText?.trim();

    if (trimmedHtml && this.hasMeaningfulHtml(trimmedHtml)) {
      return trimmedHtml;
    }
    if (trimmedText) {
      return this.textToHtml(trimmedText);
    }

    throw this.unprocessable("Isi email wajib diisi.");
  }

  private textToHtml(value: string): string {
    return value
      .split(/\r?\n/)
      .map((line) => `<p>${this.escapeHtml(line) || "<br>"}</p>`)
      .join("");
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private hasMeaningfulHtml(value: string): boolean {
    const plainText = value
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<br\s*\/?>/gi, "")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;|&#160;/gi, " ")
      .trim();

    return plainText.length > 0;
  }

  private async findConnectedAccount(id: number): Promise<EmailAccount> {
    const account = await this.prisma.emailAccount.findUnique({ where: { id } });
    if (!account || account.status !== EmailAccountStatus.CONNECTED) {
      throw this.unprocessable("Akun pengirim harus connected.");
    }

    return account;
  }

  private async findCampaign(id: number): Promise<CampaignWithSender> {
    const campaign = await this.prisma.emailCampaign.findUnique({
      where: { id },
      include: { senderAccount: true },
    });
    if (!campaign) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Campaign email tidak ditemukan.",
      });
    }

    return campaign;
  }

  private async ensureCampaign(id: number): Promise<void> {
    await this.findCampaign(id);
  }

  private presentCampaign(campaign: CampaignWithSender) {
    return {
      id: campaign.id,
      title: campaign.name,
      subject: campaign.subject,
      body_text: campaign.bodyText,
      body_html: campaign.bodyHtml,
      status: PRISMA_TO_API_CAMPAIGN_STATUS[campaign.status],
      total_recipients: campaign.totalRecipients,
      queued_count: campaign.queuedCount,
      sent_count: campaign.sentCount,
      failed_count: campaign.failedCount,
      started_at: campaign.startedAt,
      finished_at: campaign.finishedAt,
      last_error: campaign.lastError,
      sender_account: {
        id: campaign.senderAccount.id,
        provider: PRISMA_TO_API_EMAIL_PROVIDER[campaign.senderAccount.provider],
        email_address: campaign.senderAccount.email,
        display_name: campaign.senderAccount.displayName,
        status: campaign.senderAccount.status.toLowerCase(),
      },
      created_at: campaign.createdAt,
      updated_at: campaign.updatedAt,
    };
  }

  private presentRecipient(recipient: EmailCampaignRecipient) {
    return {
      id: recipient.id,
      campaign_id: recipient.campaignId,
      email: recipient.email,
      name: recipient.name,
      status: PRISMA_TO_API_RECIPIENT_STATUS[recipient.status],
      attempts: recipient.attempts,
      next_attempt_at: recipient.nextAttemptAt,
      sent_at: recipient.sentAt,
      failed_at: recipient.failedAt,
      error_code: recipient.errorCode,
      error_message: recipient.errorMessage,
      created_at: recipient.createdAt,
      updated_at: recipient.updatedAt,
    };
  }

  private async recordMutation(
    actor: Actor,
    action: string,
    resourceId: number,
    metadata?: Prisma.InputJsonObject,
  ): Promise<void> {
    await this.audit.record({
      actorUserId: actor.id,
      action,
      resourceType: "email-campaigns",
      resourceId,
      metadata,
    });
  }

  private unprocessable(message: string): UnprocessableEntityException {
    return new UnprocessableEntityException({
      code: "UNPROCESSABLE_ENTITY",
      message,
    });
  }
}
