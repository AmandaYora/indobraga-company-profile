import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { EmailContentMode, EmailTemplate, Prisma } from "@prisma/client";
import { createPagePaginationMeta, normalizePagePagination } from "@/core/pagination";
import { PrismaService } from "@/database/prisma.service";
import { AuditService } from "@/audit/audit.service";
import { CreateEmailTemplateDto } from "@/email-templates/dto/create-email-template.dto";
import { ListEmailTemplatesQueryDto } from "@/email-templates/dto/list-email-templates-query.dto";
import { UpdateEmailTemplateDto } from "@/email-templates/dto/update-email-template.dto";

type Actor = {
  id?: number;
};

type ApiContentMode = "text" | "html";

const PRISMA_TO_API_CONTENT_MODE: Record<EmailContentMode, ApiContentMode> = {
  [EmailContentMode.TEXT]: "text",
  [EmailContentMode.HTML]: "html",
};

type ResolvedBody = {
  contentMode: EmailContentMode;
  bodyText: string | null;
  bodyHtml: string | null;
};

@Injectable()
export class EmailTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: ListEmailTemplatesQueryDto) {
    const pagination = normalizePagePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 50,
      maxLimit: 100,
    });
    const where: Prisma.EmailTemplateWhereInput = query.q
      ? {
          OR: [{ name: { contains: query.q } }, { subject: { contains: query.q } }],
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.emailTemplate.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.emailTemplate.count({ where }),
    ]);

    return {
      items: items.map((item) => this.present(item)),
      pagination: createPagePaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async create(dto: CreateEmailTemplateDto, actor: Actor) {
    const body = this.resolveBody(dto.content_mode, dto.body_text, dto.body_html);
    const template = await this.prisma.emailTemplate.create({
      data: {
        name: dto.name,
        subject: dto.subject,
        contentMode: body.contentMode,
        bodyText: body.bodyText,
        bodyHtml: body.bodyHtml,
      },
    });
    await this.recordMutation(actor, "email_template.create", template.id);

    return this.present(template);
  }

  async update(id: number, dto: UpdateEmailTemplateDto, actor: Actor) {
    const existing = await this.findTemplate(id);
    const contentMode = dto.content_mode ?? PRISMA_TO_API_CONTENT_MODE[existing.contentMode];
    const body = this.resolveBody(
      contentMode,
      dto.body_text ?? existing.bodyText ?? undefined,
      dto.body_html ?? existing.bodyHtml ?? undefined,
    );

    const template = await this.prisma.emailTemplate.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        subject: dto.subject ?? undefined,
        contentMode: body.contentMode,
        bodyText: body.bodyText,
        bodyHtml: body.bodyHtml,
      },
    });
    await this.recordMutation(actor, "email_template.update", id);

    return this.present(template);
  }

  async remove(id: number, actor: Actor) {
    await this.findTemplate(id);
    await this.prisma.emailTemplate.delete({ where: { id } });
    await this.recordMutation(actor, "email_template.delete", id);

    return { id, status: "deleted" };
  }

  private resolveBody(
    mode: ApiContentMode,
    bodyText?: string | null,
    bodyHtml?: string | null,
  ): ResolvedBody {
    if (mode === "html") {
      const html = bodyHtml?.trim();
      if (!html) {
        throw this.unprocessable("Isi email (HTML) wajib diisi.");
      }

      return {
        contentMode: EmailContentMode.HTML,
        bodyText: bodyText?.trim() || null,
        bodyHtml: html,
      };
    }

    const text = bodyText?.trim();
    if (!text) {
      throw this.unprocessable("Isi email wajib diisi.");
    }

    return {
      contentMode: EmailContentMode.TEXT,
      bodyText: text,
      bodyHtml: bodyHtml?.trim() || null,
    };
  }

  private async findTemplate(id: number): Promise<EmailTemplate> {
    const template = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException({
        code: "NOT_FOUND",
        message: "Template email tidak ditemukan.",
      });
    }

    return template;
  }

  private present(template: EmailTemplate) {
    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      content_mode: PRISMA_TO_API_CONTENT_MODE[template.contentMode],
      body_text: template.bodyText,
      body_html: template.bodyHtml,
      created_at: template.createdAt,
      updated_at: template.updatedAt,
    };
  }

  private async recordMutation(actor: Actor, action: string, resourceId: number): Promise<void> {
    await this.audit.record({
      actorUserId: actor.id,
      action,
      resourceType: "email-templates",
      resourceId,
    });
  }

  private unprocessable(message: string): UnprocessableEntityException {
    return new UnprocessableEntityException({
      code: "UNPROCESSABLE_ENTITY",
      message,
    });
  }
}
