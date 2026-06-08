import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import type { Env } from "@/config/env";
import { PublicRoute } from "@/auth/auth.decorators";
import { NoStore } from "@/core/cache-control.decorator";
import { IdParamDto } from "@/core/id-param.dto";
import { RequirePermissions } from "@/core/permissions.decorator";
import { CampaignAudienceDraftDto } from "@/email-campaigns/dto/campaign-audience-draft.dto";
import { CampaignDraftDto } from "@/email-campaigns/dto/campaign-draft.dto";
import { CampaignInquiryDraftDto } from "@/email-campaigns/dto/campaign-inquiry-draft.dto";
import { InquiryRecipientFilterDto } from "@/email-campaigns/dto/inquiry-recipient-filter.dto";
import { ListCampaignsQueryDto } from "@/email-campaigns/dto/list-campaigns-query.dto";
import { ListRecipientsQueryDto } from "@/email-campaigns/dto/list-recipients-query.dto";
import { ListSendLogsQueryDto } from "@/email-campaigns/dto/list-send-logs-query.dto";
import { UpdateCampaignDto } from "@/email-campaigns/dto/update-campaign.dto";
import { EmailCampaignsService } from "@/email-campaigns/email-campaigns.service";

function actor(request: Request) {
  return { id: request.adminUser?.id };
}

@Controller()
@NoStore()
export class EmailCampaignsController {
  constructor(
    private readonly campaigns: EmailCampaignsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get("admin/email-campaigns")
  @RequirePermissions("email_campaigns.read")
  list(@Query() query: ListCampaignsQueryDto) {
    return this.campaigns.list(query);
  }

  @Get("admin/email-campaigns/recipient-sources/inquiries/preview")
  @RequirePermissions("email_campaigns.manage")
  previewInquiryRecipients(@Query() query: InquiryRecipientFilterDto) {
    return this.campaigns.previewInquiryRecipients(query);
  }

  @Get("admin/email-campaigns/:id")
  @RequirePermissions("email_campaigns.read")
  detail(@Param() params: IdParamDto) {
    return this.campaigns.detail(params.id);
  }

  @Post("admin/email-campaigns/draft")
  @RequirePermissions("email_campaigns.manage")
  createDraft(@Body() dto: CampaignDraftDto, @Req() request: Request) {
    return this.campaigns.createDraft(dto, actor(request));
  }

  @Post("admin/email-campaigns/draft/from-inquiries")
  @RequirePermissions("email_campaigns.manage")
  createDraftFromInquiries(@Body() dto: CampaignInquiryDraftDto, @Req() request: Request) {
    return this.campaigns.createDraftFromInquiries(dto, actor(request));
  }

  @Post("admin/email-campaigns/draft/from-audience")
  @RequirePermissions("email_campaigns.manage")
  createDraftFromAudience(@Body() dto: CampaignAudienceDraftDto, @Req() request: Request) {
    return this.campaigns.createDraftFromAudience(dto, actor(request));
  }

  @Patch("admin/email-campaigns/:id")
  @RequirePermissions("email_campaigns.manage")
  update(@Param() params: IdParamDto, @Body() dto: UpdateCampaignDto, @Req() request: Request) {
    return this.campaigns.update(params.id, dto, actor(request));
  }

  @Post("admin/email-campaigns/:id/send")
  @RequirePermissions("email_campaigns.send")
  send(@Param() params: IdParamDto, @Req() request: Request) {
    return this.campaigns.send(params.id, actor(request));
  }

  @Get("admin/email-campaigns/:id/recipients")
  @RequirePermissions("email_campaigns.read")
  recipients(@Param() params: IdParamDto, @Query() query: ListRecipientsQueryDto) {
    return this.campaigns.recipients(params.id, query);
  }

  @Get("admin/email-campaigns/:id/logs")
  @RequirePermissions("email_campaign_logs.read")
  logs(@Param() params: IdParamDto, @Query() query: ListSendLogsQueryDto) {
    return this.campaigns.logs(params.id, query);
  }

  @Post("internal/workers/email-campaigns/tick")
  @PublicRoute()
  workerTick(@Headers("x-internal-worker-secret") secret: string | undefined) {
    if (secret !== this.config.get("INTERNAL_WORKER_SECRET", { infer: true })) {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Internal worker secret tidak valid.",
      });
    }

    return this.campaigns.manualTick();
  }
}
