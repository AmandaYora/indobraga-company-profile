import { Controller, Get, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import { AdminSearchQueryDto } from "@/admin-search/dto/admin-search-query.dto";
import { AdminSearchService } from "@/admin-search/admin-search.service";
import { NoStore } from "@/core/cache-control.decorator";
import { RequirePermissions } from "@/core/permissions.decorator";

/**
 * Global admin search (header search box). Every signed-in admin may call it;
 * the service only searches the areas the caller is actually permitted to read.
 */
@Controller("admin/search")
@NoStore()
@RequirePermissions("dashboard.read")
export class AdminSearchController {
  constructor(private readonly search: AdminSearchService) {}

  @Get()
  find(@Query() query: AdminSearchQueryDto, @Req() request: Request) {
    return this.search.search(query.q, request.adminUser?.permissions ?? []);
  }
}
