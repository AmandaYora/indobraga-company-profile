import { Module } from "@nestjs/common";
import { DatabaseModule } from "@/database/database.module";
import { RevalidationModule } from "@/revalidation/revalidation.module";
import { SeoAssetsController } from "@/seo-assets/seo-assets.controller";
import { SeoAssetsService } from "@/seo-assets/seo-assets.service";

@Module({
  imports: [DatabaseModule, RevalidationModule],
  controllers: [SeoAssetsController],
  providers: [SeoAssetsService],
})
export class SeoAssetsModule {}
