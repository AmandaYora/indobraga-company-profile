import { Module } from "@nestjs/common";
import { AudienceController } from "@/audience/audience.controller";
import { AudienceService } from "@/audience/audience.service";
import { DatabaseModule } from "@/database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [AudienceController],
  providers: [AudienceService],
  exports: [AudienceService],
})
export class AudienceModule {}
