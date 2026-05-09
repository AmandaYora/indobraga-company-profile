import { Module } from "@nestjs/common";
import { DatabaseModule } from "@/database/database.module";
import { EmailAccountsModule } from "@/email-accounts/email-accounts.module";
import { NotificationsController } from "@/notifications/notifications.controller";
import { NotificationStreamService } from "@/notifications/notification-stream.service";
import { NotificationsService } from "@/notifications/notifications.service";

@Module({
  imports: [DatabaseModule, EmailAccountsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationStreamService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
