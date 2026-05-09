import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { PublicRoute } from "@/auth/auth.decorators";
import { NoStore } from "@/core/cache-control.decorator";
import { IdParamDto } from "@/core/id-param.dto";
import { RequirePermissions } from "@/core/permissions.decorator";
import { CreateInquiryDto } from "@/leads/dto/create-inquiry.dto";
import { CreateWhatsAppLeadDto } from "@/leads/dto/create-whatsapp-lead.dto";
import { ListLeadsQueryDto } from "@/leads/dto/list-leads-query.dto";
import { UpdateLeadDto } from "@/leads/dto/update-lead.dto";
import { LeadsService } from "@/leads/leads.service";

function actor(request: Request) {
  return { id: request.adminUser?.id };
}

@Controller()
@NoStore()
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post("public/inquiries")
  @PublicRoute()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  createInquiry(@Body() dto: CreateInquiryDto, @Req() request: Request) {
    return this.leads.createInquiry(dto, request);
  }

  @Post("public/whatsapp-leads")
  @PublicRoute()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  createWhatsAppLead(@Body() dto: CreateWhatsAppLeadDto, @Req() request: Request) {
    return this.leads.createWhatsAppLead(dto, request);
  }

  @Get("admin/inquiries")
  @RequirePermissions("leads.read")
  inquiries(@Query() query: ListLeadsQueryDto) {
    return this.leads.listInquiries(query);
  }

  @Get("admin/inquiries/:id")
  @RequirePermissions("leads.read")
  inquiryDetail(@Param() params: IdParamDto) {
    return this.leads.getInquiry(params.id);
  }

  @Patch("admin/inquiries/:id")
  @RequirePermissions("leads.manage")
  updateInquiry(@Param() params: IdParamDto, @Body() dto: UpdateLeadDto, @Req() request: Request) {
    return this.leads.updateInquiry(params.id, dto, actor(request));
  }

  @Delete("admin/inquiries/:id")
  @RequirePermissions("leads.manage")
  archiveInquiry(@Param() params: IdParamDto, @Req() request: Request) {
    return this.leads.archiveInquiry(params.id, actor(request));
  }

  @Get("admin/whatsapp-leads")
  @RequirePermissions("leads.read")
  whatsAppLeads(@Query() query: ListLeadsQueryDto) {
    return this.leads.listWhatsAppLeads(query);
  }

  @Get("admin/whatsapp-leads/:id")
  @RequirePermissions("leads.read")
  whatsAppLeadDetail(@Param() params: IdParamDto) {
    return this.leads.getWhatsAppLead(params.id);
  }

  @Patch("admin/whatsapp-leads/:id")
  @RequirePermissions("leads.manage")
  updateWhatsAppLead(
    @Param() params: IdParamDto,
    @Body() dto: UpdateLeadDto,
    @Req() request: Request,
  ) {
    return this.leads.updateWhatsAppLead(params.id, dto, actor(request));
  }

  @Delete("admin/whatsapp-leads/:id")
  @RequirePermissions("leads.manage")
  archiveWhatsAppLead(@Param() params: IdParamDto, @Req() request: Request) {
    return this.leads.archiveWhatsAppLead(params.id, actor(request));
  }
}
