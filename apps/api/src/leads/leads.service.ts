import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
import type { Request } from "express";
import { AudienceService } from "@/audience/audience.service";
import { createPagePaginationMeta, normalizePagePagination } from "@/core/pagination";
import { PrismaService } from "@/database/prisma.service";
import { CreateInquiryDto } from "@/leads/dto/create-inquiry.dto";
import { CreateWhatsAppLeadDto } from "@/leads/dto/create-whatsapp-lead.dto";
import { ListLeadsQueryDto } from "@/leads/dto/list-leads-query.dto";
import { UpdateLeadDto } from "@/leads/dto/update-lead.dto";
import {
  API_TO_PRISMA_INQUIRY_STATUS,
  API_TO_PRISMA_WHATSAPP_STATUS,
  PRISMA_TO_API_INQUIRY_STATUS,
  PRISMA_TO_API_WHATSAPP_STATUS,
} from "@/leads/lead-status.dto";
import { NotificationsService } from "@/notifications/notifications.service";
import { AuditService } from "@/audit/audit.service";

type Actor = {
  id?: number;
};

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly audience: AudienceService,
    private readonly notifications: NotificationsService,
  ) {}

  async createInquiry(dto: CreateInquiryDto, request: Request) {
    const inquiry = await this.prisma.inquiry.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        message: dto.message,
        notificationStatus: "pending",
        source: request.get("referer") ?? "website",
        meta: this.requestMeta(request),
      },
    });
    await this.syncInquiryAudience(inquiry);
    await this.createInquiryNotification(inquiry);

    return {
      id: inquiry.id,
      status: PRISMA_TO_API_INQUIRY_STATUS[inquiry.status],
    };
  }

  async createWhatsAppLead(dto: CreateWhatsAppLeadDto, request: Request) {
    const settings = await this.prisma.siteSettings.findUnique({ where: { id: 1 } });
    const targetNumber = settings?.whatsapp ?? "6285158700895";
    const generatedMessage =
      dto.message ??
      `Halo Indobraga, saya ${dto.name}. Saya ingin konsultasi kebutuhan produksi. Nomor saya ${dto.phone}.`;
    const whatsappUrl = `https://wa.me/${targetNumber}?text=${encodeURIComponent(generatedMessage)}`;
    const lead = await this.prisma.whatsAppLead.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        message: generatedMessage,
        whatsappUrl,
        source: request.get("referer") ?? "website",
        meta: this.requestMeta(request),
      },
    });
    await this.createWhatsAppLeadNotification(lead);

    return {
      id: lead.id,
      status: PRISMA_TO_API_WHATSAPP_STATUS[lead.status],
      whatsapp_url: lead.whatsappUrl,
      generated_message: lead.message,
    };
  }

  async listInquiries(query: ListLeadsQueryDto) {
    const pagination = this.page(query);
    const where: Prisma.InquiryWhereInput = {
      archivedAt: null,
      ...(query.status ? { status: API_TO_PRISMA_INQUIRY_STATUS[query.status] } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q } },
              { email: { contains: query.q } },
              { phone: { contains: query.q } },
              { company: { contains: query.q } },
              { message: { contains: query.q } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.inquiry.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.inquiry.count({ where }),
    ]);

    return {
      items: items.map((item) => this.presentInquiry(item)),
      pagination: createPagePaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async getInquiry(id: number) {
    const inquiry = await this.prisma.inquiry.findFirst({
      where: { id, archivedAt: null },
    });
    if (!inquiry) {
      throw this.notFound("Pesan kontak");
    }
    return this.presentInquiry(inquiry);
  }

  async updateInquiry(id: number, dto: UpdateLeadDto, actor: Actor) {
    const inquiry = await this.writeInquiry(id, {
      status: dto.status ? API_TO_PRISMA_INQUIRY_STATUS[dto.status] : undefined,
      internalNote: dto.internal_note,
    });
    await this.recordMutation(actor, "inquiry.update", "inquiries", id, {
      status: dto.status,
      has_internal_note: dto.internal_note !== undefined,
    });
    return this.presentInquiry(inquiry);
  }

  async archiveInquiry(id: number, actor: Actor) {
    await this.writeInquiry(id, { archivedAt: new Date() });
    await this.recordMutation(actor, "inquiry.archive", "inquiries", id);
    return { id, status: "archived" };
  }

  async listWhatsAppLeads(query: ListLeadsQueryDto) {
    const pagination = this.page(query);
    const where: Prisma.WhatsAppLeadWhereInput = {
      archivedAt: null,
      ...(query.status ? { status: API_TO_PRISMA_WHATSAPP_STATUS[query.status] } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q } },
              { phone: { contains: query.q } },
              { message: { contains: query.q } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.whatsAppLead.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.whatsAppLead.count({ where }),
    ]);

    return {
      items: items.map((item) => this.presentWhatsAppLead(item)),
      pagination: createPagePaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async getWhatsAppLead(id: number) {
    const lead = await this.prisma.whatsAppLead.findFirst({
      where: { id, archivedAt: null },
    });
    if (!lead) {
      throw this.notFound("Prospek WhatsApp");
    }
    return this.presentWhatsAppLead(lead);
  }

  async updateWhatsAppLead(id: number, dto: UpdateLeadDto, actor: Actor) {
    const lead = await this.writeWhatsAppLead(id, {
      status: dto.status ? API_TO_PRISMA_WHATSAPP_STATUS[dto.status] : undefined,
      internalNote: dto.internal_note,
    });
    await this.recordMutation(actor, "whatsapp_lead.update", "whatsapp-leads", id, {
      status: dto.status,
      has_internal_note: dto.internal_note !== undefined,
    });
    return this.presentWhatsAppLead(lead);
  }

  async archiveWhatsAppLead(id: number, actor: Actor) {
    await this.writeWhatsAppLead(id, { archivedAt: new Date() });
    await this.recordMutation(actor, "whatsapp_lead.archive", "whatsapp-leads", id);
    return { id, status: "archived" };
  }

  private page(query: ListLeadsQueryDto) {
    return normalizePagePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 10,
      maxLimit: 100,
    });
  }

  private async writeInquiry(id: number, data: Prisma.InquiryUpdateInput) {
    try {
      return await this.prisma.inquiry.update({
        where: { id, archivedAt: null },
        data,
      });
    } catch {
      throw this.notFound("Pesan kontak");
    }
  }

  private async writeWhatsAppLead(id: number, data: Prisma.WhatsAppLeadUpdateInput) {
    try {
      return await this.prisma.whatsAppLead.update({
        where: { id, archivedAt: null },
        data,
      });
    } catch {
      throw this.notFound("Prospek WhatsApp");
    }
  }

  private async recordMutation(
    actor: Actor,
    action: string,
    resourceType: string,
    resourceId: number,
    metadata?: Prisma.InputJsonObject,
  ): Promise<void> {
    await this.audit.record({
      actorUserId: actor.id,
      action,
      resourceType,
      resourceId,
      metadata,
    });
  }

  private async createInquiryNotification(
    inquiry: Prisma.InquiryGetPayload<object>,
  ): Promise<void> {
    try {
      await this.notifications.createInquiryCreated({
        id: inquiry.id,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        company: inquiry.company,
        message: inquiry.message,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to create inquiry notification ${inquiry.id}: ${this.errorMessage(error)}`,
      );
    }
  }

  private async syncInquiryAudience(inquiry: Prisma.InquiryGetPayload<object>): Promise<void> {
    try {
      await this.audience.upsertFromInquiry(inquiry);
    } catch (error) {
      this.logger.warn(
        `Failed to sync inquiry audience ${inquiry.id}: ${this.errorMessage(error)}`,
      );
    }
  }

  private async createWhatsAppLeadNotification(
    lead: Prisma.WhatsAppLeadGetPayload<object>,
  ): Promise<void> {
    try {
      await this.notifications.createWhatsAppLeadCreated({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        message: lead.message,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to create WhatsApp lead notification ${lead.id}: ${this.errorMessage(error)}`,
      );
    }
  }

  private presentInquiry(item: Prisma.InquiryGetPayload<object>) {
    return {
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      company: item.company,
      message: item.message,
      status: PRISMA_TO_API_INQUIRY_STATUS[item.status],
      internal_note: item.internalNote,
      notification_status: item.notificationStatus,
      source: item.source,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private presentWhatsAppLead(item: Prisma.WhatsAppLeadGetPayload<object>) {
    return {
      id: item.id,
      name: item.name,
      phone: item.phone,
      generated_message: item.message,
      whatsapp_url: item.whatsappUrl,
      status: PRISMA_TO_API_WHATSAPP_STATUS[item.status],
      internal_note: item.internalNote,
      source: item.source,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private requestMeta(request: Request): Prisma.InputJsonObject {
    return {
      user_agent: request.get("user-agent") ?? null,
      referrer: request.get("referer") ?? null,
      ip_hash: request.ip ? createHash("sha256").update(request.ip).digest("hex") : null,
    };
  }

  private notFound(resource: string): NotFoundException {
    return new NotFoundException({
      code: "NOT_FOUND",
      message: `${resource} tidak ditemukan.`,
    });
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
  }
}
