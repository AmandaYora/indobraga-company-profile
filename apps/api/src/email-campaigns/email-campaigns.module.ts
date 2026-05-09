import { Module } from "@nestjs/common";
import { AuditModule } from "@/audit/audit.module";
import { DatabaseModule } from "@/database/database.module";
import { EmailAccountsModule } from "@/email-accounts/email-accounts.module";
import { EmailCampaignsController } from "@/email-campaigns/email-campaigns.controller";
import { EmailCampaignsService } from "@/email-campaigns/email-campaigns.service";
import { EmailSendAdapter } from "@/email-campaigns/email-send.adapter";

@Module({
  imports: [AuditModule, DatabaseModule, EmailAccountsModule],
  controllers: [EmailCampaignsController],
  providers: [EmailCampaignsService, EmailSendAdapter],
})
export class EmailCampaignsModule {}
