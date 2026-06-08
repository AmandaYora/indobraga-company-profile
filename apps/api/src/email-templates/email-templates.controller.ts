import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { NoStore } from "@/core/cache-control.decorator";
import { IdParamDto } from "@/core/id-param.dto";
import { RequirePermissions } from "@/core/permissions.decorator";
import { CreateEmailTemplateDto } from "@/email-templates/dto/create-email-template.dto";
import { ListEmailTemplatesQueryDto } from "@/email-templates/dto/list-email-templates-query.dto";
import { UpdateEmailTemplateDto } from "@/email-templates/dto/update-email-template.dto";
import { EmailTemplatesService } from "@/email-templates/email-templates.service";

function actor(request: Request) {
  return { id: request.adminUser?.id };
}

@Controller()
@NoStore()
export class EmailTemplatesController {
  constructor(private readonly templates: EmailTemplatesService) {}

  @Get("admin/email-templates")
  @RequirePermissions("email_campaigns.read")
  list(@Query() query: ListEmailTemplatesQueryDto) {
    return this.templates.list(query);
  }

  @Post("admin/email-templates")
  @RequirePermissions("email_campaigns.manage")
  create(@Body() dto: CreateEmailTemplateDto, @Req() request: Request) {
    return this.templates.create(dto, actor(request));
  }

  @Patch("admin/email-templates/:id")
  @RequirePermissions("email_campaigns.manage")
  update(@Param() params: IdParamDto, @Body() dto: UpdateEmailTemplateDto, @Req() request: Request) {
    return this.templates.update(params.id, dto, actor(request));
  }

  @Delete("admin/email-templates/:id")
  @RequirePermissions("email_campaigns.manage")
  remove(@Param() params: IdParamDto, @Req() request: Request) {
    return this.templates.remove(params.id, actor(request));
  }
}
