import { Module } from "@nestjs/common";
import { DatabaseModule } from "@/database/database.module";
import { RevalidationService } from "@/revalidation/revalidation.service";

@Module({
  imports: [DatabaseModule],
  providers: [RevalidationService],
  exports: [RevalidationService],
})
export class RevalidationModule {}
