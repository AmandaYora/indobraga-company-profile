import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminContentModule } from "@/admin-content/admin-content.module";
import { AudienceModule } from "@/audience/audience.module";
import { AuthModule } from "@/auth/auth.module";
import { validateEnv } from "@/config/env";
import { CoreModule } from "@/core/core.module";
import { DashboardModule } from "@/dashboard/dashboard.module";
import { EmailAccountsModule } from "@/email-accounts/email-accounts.module";
import { EmailCampaignsModule } from "@/email-campaigns/email-campaigns.module";
import { HealthModule } from "@/health/health.module";
import { LeadsModule } from "@/leads/leads.module";
import { MediaModule } from "@/media/media.module";
import { NotificationsModule } from "@/notifications/notifications.module";
import { PublicContentModule } from "@/public-content/public-content.module";
import { SeoAssetsModule } from "@/seo-assets/seo-assets.module";
import { UsersModule } from "@/users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    CoreModule,
    AdminContentModule,
    AudienceModule,
    AuthModule,
    DashboardModule,
    EmailAccountsModule,
    EmailCampaignsModule,
    HealthModule,
    LeadsModule,
    MediaModule,
    NotificationsModule,
    PublicContentModule,
    SeoAssetsModule,
    UsersModule,
  ],
})
export class AppModule {}
