import { Module } from "@nestjs/common";
import { AdminContentController } from "@/admin-content/admin-content.controller";
import { AdminContentService } from "@/admin-content/admin-content.service";
import { AuditModule } from "@/audit/audit.module";
import { DatabaseModule } from "@/database/database.module";
import { RevalidationModule } from "@/revalidation/revalidation.module";

@Module({
  imports: [AuditModule, DatabaseModule, RevalidationModule],
  controllers: [AdminContentController],
  providers: [AdminContentService],
})
export class AdminContentModule {}
