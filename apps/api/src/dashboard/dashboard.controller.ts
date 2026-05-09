import { Controller, Get } from "@nestjs/common";
import { NoStore } from "@/core/cache-control.decorator";
import { RequirePermissions } from "@/core/permissions.decorator";
import { DashboardService } from "@/dashboard/dashboard.service";

@Controller("admin/dashboard")
@NoStore()
@RequirePermissions("dashboard.read")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  summary() {
    return this.dashboard.summary();
  }
}
