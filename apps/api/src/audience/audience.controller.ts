import { Controller, Get, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { AudienceService } from "@/audience/audience.service";
import { AudienceFilterDto } from "@/audience/dto/audience-filter.dto";
import { ListAudienceQueryDto } from "@/audience/dto/list-audience-query.dto";
import { NoStore } from "@/core/cache-control.decorator";
import { RequirePermissions } from "@/core/permissions.decorator";
import { RawResponse } from "@/core/raw-response.decorator";

@Controller()
@NoStore()
export class AudienceController {
  constructor(private readonly audience: AudienceService) {}

  @Get("admin/audience/contacts")
  @RequirePermissions("audience.read")
  list(@Query() query: ListAudienceQueryDto) {
    return this.audience.list(query);
  }

  @Get("admin/audience/preview")
  @RequirePermissions("audience.read")
  preview(@Query() query: AudienceFilterDto) {
    return this.audience.preview(query);
  }

  @Get("admin/audience/export.csv")
  @RawResponse()
  @RequirePermissions("audience.export")
  async exportCsv(@Query() query: AudienceFilterDto, @Res() response: Response) {
    const csv = await this.audience.exportCsv(query);
    response.setHeader("content-type", "text/csv; charset=utf-8");
    response.setHeader("content-disposition", 'attachment; filename="indobraga-audience.csv"');
    response.send(csv);
  }
}
