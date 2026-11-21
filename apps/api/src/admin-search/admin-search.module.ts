import { Module } from "@nestjs/common";
import { AdminSearchController } from "@/admin-search/admin-search.controller";
import { AdminSearchService } from "@/admin-search/admin-search.service";
import { DatabaseModule } from "@/database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [AdminSearchController],
  providers: [AdminSearchService],
})
export class AdminSearchModule {}
