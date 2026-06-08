import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuditModule } from "@/audit/audit.module";
import type { Env } from "@/config/env";
import { DatabaseModule } from "@/database/database.module";
import { MediaController } from "@/media/media.controller";
import { LocalStorageService } from "@/media/local-storage.service";
import { MEDIA_STORAGE } from "@/media/media-storage.types";
import { MediaService } from "@/media/media.service";
import { RevalidationModule } from "@/revalidation/revalidation.module";
import { S3StorageService } from "@/media/s3-storage.service";

@Module({
  imports: [AuditModule, DatabaseModule, RevalidationModule],
  controllers: [MediaController],
  providers: [
    {
      provide: MEDIA_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        config.get("STORAGE_DRIVER", { infer: true }) === "s3"
          ? new S3StorageService(config)
          : new LocalStorageService(config),
    },
    MediaService,
  ],
  exports: [MediaService, MEDIA_STORAGE],
})
export class MediaModule {}
