import { Module } from "@nestjs/common";
import { AuditModule } from "@/audit/audit.module";
import { AudienceModule } from "@/audience/audience.module";
import { DatabaseModule } from "@/database/database.module";
import { LeadsController } from "@/leads/leads.controller";
import { LeadsService } from "@/leads/leads.service";
import { NotificationsModule } from "@/notifications/notifications.module";

@Module({
  imports: [AuditModule, AudienceModule, DatabaseModule, NotificationsModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
