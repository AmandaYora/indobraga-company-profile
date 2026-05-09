import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { memoryStorage } from "multer";
import { NoStore } from "@/core/cache-control.decorator";
import { IdParamDto } from "@/core/id-param.dto";
import { RequirePermissions } from "@/core/permissions.decorator";
import { ListMediaQueryDto } from "@/media/dto/list-media-query.dto";
import { UploadMediaDto } from "@/media/dto/upload-media.dto";
import { MediaService } from "@/media/media.service";

function actor(request: Request) {
  return { id: request.adminUser?.id };
}

@Controller("admin/media")
@NoStore()
@RequirePermissions("media.manage")
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadMediaDto,
    @Req() request: Request,
  ) {
    return this.mediaService.upload(file, dto, actor(request));
  }

  @Get()
  list(@Query() query: ListMediaQueryDto) {
    return this.mediaService.list(query);
  }

  @Get(":id")
  detail(@Param() params: IdParamDto) {
    return this.mediaService.detail(params.id);
  }

  @Delete(":id")
  remove(@Param() params: IdParamDto, @Req() request: Request) {
    return this.mediaService.remove(params.id, actor(request));
  }

  @Post(":id/retry")
  retry(@Param() params: IdParamDto, @Req() request: Request) {
    return this.mediaService.retry(params.id, actor(request));
  }
}
