import { Module } from "@nestjs/common";
import { DatabaseModule } from "@/database/database.module";
import { PublicContentController } from "@/public-content/public-content.controller";
import { PublicContentService } from "@/public-content/public-content.service";

@Module({
  imports: [DatabaseModule],
  controllers: [PublicContentController],
  providers: [PublicContentService],
})
export class PublicContentModule {}
