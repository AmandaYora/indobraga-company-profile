import { Injectable, UnprocessableEntityException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Inquiry,
  MarketingConsentStatus,
  MarketingContact,
  MarketingContactSource,
  MarketingContactStatus,
  Prisma,
} from "@prisma/client";
import type { Env } from "@/config/env";
import { createPagePaginationMeta, normalizePagePagination } from "@/core/pagination";
import { PrismaService } from "@/database/prisma.service";
import {
  API_TO_PRISMA_MARKETING_SOURCE,
  API_TO_PRISMA_MARKETING_STATUS,
  PRISMA_TO_API_MARKETING_CONSENT,
  PRISMA_TO_API_MARKETING_SOURCE,
  PRISMA_TO_API_MARKETING_STATUS,
} from "@/audience/audience-maps";
import { AudienceFilterDto } from "@/audience/dto/audience-filter.dto";
import { ListAudienceQueryDto } from "@/audience/dto/list-audience-query.dto";

export type AudienceRecipient = {
  marketingContactId: number;
  email: string;
  name?: string | null;
};

@Injectable()
export class AudienceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async upsertFromInquiry(inquiry: Inquiry): Promise<void> {
    const email = this.normalizeEmail(inquiry.email);

    await this.prisma.marketingContact.upsert({
      where: { email },
      create: {
        email,
        name: inquiry.name,
        phone: inquiry.phone,
        company: inquiry.company,
        source: MarketingContactSource.INQUIRY,
        sourceRefId: inquiry.id,
        status: MarketingContactStatus.ACTIVE,
        consentStatus: MarketingConsentStatus.IMPLIED,
        lastInteractionAt: inquiry.createdAt,
      },
      update: {
        name: inquiry.name,
        phone: inquiry.phone,
        company: inquiry.company,
        source: MarketingContactSource.INQUIRY,
        sourceRefId: inquiry.id,
        lastInteractionAt: inquiry.createdAt,
      },
    });
  }

  async list(query: ListAudienceQueryDto) {
    const pagination = normalizePagePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 10,
      maxLimit: 100,
    });
    const where = this.where(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.marketingContact.findMany({
        where,
        orderBy: [{ lastInteractionAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.marketingContact.count({ where }),
    ]);

    return {
      items: items.map((item) => this.present(item)),
      pagination: createPagePaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async preview(filter: AudienceFilterDto) {
    const baseWhere = this.where({ ...filter, status: undefined });
    const eligibleWhere = { ...baseWhere, status: MarketingContactStatus.ACTIVE };
    const [total, eligible, unsubscribed, blocked, sample] = await this.prisma.$transaction([
      this.prisma.marketingContact.count({ where: baseWhere }),
      this.prisma.marketingContact.count({ where: eligibleWhere }),
      this.prisma.marketingContact.count({
        where: { ...baseWhere, status: MarketingContactStatus.UNSUBSCRIBED },
      }),
      this.prisma.marketingContact.count({
        where: { ...baseWhere, status: MarketingContactStatus.BLOCKED },
      }),
      this.prisma.marketingContact.findMany({
        where: eligibleWhere,
        orderBy: [{ lastInteractionAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        take: 5,
      }),
    ]);

    return {
      total_contacts: total,
      eligible_recipients: eligible,
      excluded_unsubscribed: unsubscribed,
      excluded_blocked: blocked,
      sample_recipients: sample.map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        company: item.company,
      })),
    };
  }

  async resolveRecipients(filter: AudienceFilterDto): Promise<AudienceRecipient[]> {
    const maxRecipients = this.config.get("EMAIL_CAMPAIGN_RECIPIENT_MAX", { infer: true });
    const where = {
      ...this.where({ ...filter, status: undefined }),
      status: MarketingContactStatus.ACTIVE,
    };
    const eligible = await this.prisma.marketingContact.count({ where });
    if (eligible === 0) {
      throw this.unprocessable("Tidak ada kontak aktif yang cocok dengan filter audience.");
    }
    if (eligible > maxRecipients) {
      throw this.unprocessable(
        `Kontak aktif hasil filter berjumlah ${eligible}. Batas penerima campaign adalah ${maxRecipients}. Persempit filter terlebih dahulu.`,
      );
    }

    const contacts = await this.prisma.marketingContact.findMany({
      where,
      orderBy: [{ lastInteractionAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: maxRecipients,
    });

    return contacts.map((contact) => ({
      marketingContactId: contact.id,
      email: contact.email,
      name: contact.name,
    }));
  }

  async exportCsv(filter: AudienceFilterDto): Promise<string> {
    const contacts = await this.prisma.marketingContact.findMany({
      where: this.where(filter),
      orderBy: [{ lastInteractionAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
      take: 10_000,
    });
    const rows = [
      [
        "Nama",
        "Email",
        "Telepon",
        "Perusahaan",
        "Sumber",
        "Status",
        "Consent",
        "Interaksi Terakhir",
        "Dibuat",
      ],
      ...contacts.map((item) => [
        item.name ?? "",
        item.email,
        item.phone ?? "",
        item.company ?? "",
        PRISMA_TO_API_MARKETING_SOURCE[item.source],
        PRISMA_TO_API_MARKETING_STATUS[item.status],
        PRISMA_TO_API_MARKETING_CONSENT[item.consentStatus],
        item.lastInteractionAt?.toISOString() ?? "",
        item.createdAt.toISOString(),
      ]),
    ];

    return `\uFEFF${rows.map((row) => row.map((cell) => this.csvCell(cell)).join(",")).join("\r\n")}\r\n`;
  }

  private where(filter: AudienceFilterDto): Prisma.MarketingContactWhereInput {
    return {
      ...(filter.status ? { status: API_TO_PRISMA_MARKETING_STATUS[filter.status] } : {}),
      ...(filter.source ? { source: API_TO_PRISMA_MARKETING_SOURCE[filter.source] } : {}),
      ...(filter.q
        ? {
            OR: [
              { name: { contains: filter.q } },
              { email: { contains: filter.q } },
              { phone: { contains: filter.q } },
              { company: { contains: filter.q } },
            ],
          }
        : {}),
    };
  }

  private present(item: MarketingContact) {
    return {
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      company: item.company,
      source: PRISMA_TO_API_MARKETING_SOURCE[item.source],
      source_ref_id: item.sourceRefId,
      status: PRISMA_TO_API_MARKETING_STATUS[item.status],
      consent_status: PRISMA_TO_API_MARKETING_CONSENT[item.consentStatus],
      last_interaction_at: item.lastInteractionAt,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private csvCell(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private unprocessable(message: string): UnprocessableEntityException {
    return new UnprocessableEntityException({
      code: "UNPROCESSABLE_ENTITY",
      message,
    });
  }
}
