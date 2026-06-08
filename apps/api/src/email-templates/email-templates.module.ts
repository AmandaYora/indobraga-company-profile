import { Module } from "@nestjs/common";
import { AuditModule } from "@/audit/audit.module";
import { DatabaseModule } from "@/database/database.module";
import { EmailTemplatesController } from "@/email-templates/email-templates.controller";
import { EmailTemplatesService } from "@/email-templates/email-templates.service";

@Module({
  imports: [AuditModule, DatabaseModule],
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService],
})
export class EmailTemplatesModule {}
