import { Module } from "@nestjs/common";
import { DatabaseModule } from "@/database/database.module";
import { RevalidationService } from "@/revalidation/revalidation.service";
import { RevalidationWorker } from "@/revalidation/revalidation.worker";

@Module({
  imports: [DatabaseModule],
  providers: [RevalidationService, RevalidationWorker],
  exports: [RevalidationService],
})
export class RevalidationModule {}
