import { Module } from "@nestjs/common";
import { DatabaseModule } from "@/database/database.module";
import { DashboardController } from "@/dashboard/dashboard.controller";
import { DashboardService } from "@/dashboard/dashboard.service";

@Module({
  imports: [DatabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
