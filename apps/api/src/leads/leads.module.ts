import { Module } from "@nestjs/common";
import { AuditModule } from "@/audit/audit.module";
import { DatabaseModule } from "@/database/database.module";
import { LeadsController } from "@/leads/leads.controller";
import { LeadsService } from "@/leads/leads.service";

@Module({
  imports: [AuditModule, DatabaseModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
