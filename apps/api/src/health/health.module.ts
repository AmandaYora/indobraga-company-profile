import { Module } from "@nestjs/common";
import { DatabaseModule } from "@/database/database.module";
import { HealthController } from "@/health/health.controller";
import { HealthService } from "@/health/health.service";
import { MediaModule } from "@/media/media.module";

@Module({
  imports: [DatabaseModule, MediaModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
