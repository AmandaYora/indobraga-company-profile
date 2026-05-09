import {
  Controller,
  Get,
  Headers,
  MessageEvent,
  Param,
  Post,
  Query,
  Req,
  Sse,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request } from "express";
import { Observable } from "rxjs";
import type { Env } from "@/config/env";
import { PublicRoute } from "@/auth/auth.decorators";
import { NoStore } from "@/core/cache-control.decorator";
import { IdParamDto } from "@/core/id-param.dto";
import { RequirePermissions } from "@/core/permissions.decorator";
import { RawResponse } from "@/core/raw-response.decorator";
import { ListNotificationsQueryDto } from "@/notifications/dto/list-notifications-query.dto";
import { NotificationStreamService } from "@/notifications/notification-stream.service";
import { NotificationsService } from "@/notifications/notifications.service";

@Controller()
@NoStore()
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly stream: NotificationStreamService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Get("admin/notifications")
  @RequirePermissions("notifications.read")
  list(@Query() query: ListNotificationsQueryDto, @Req() request: Request) {
    return this.notifications.list(request.adminUser!.id, query);
  }

  @Get("admin/notifications/unread-count")
  @RequirePermissions("notifications.read")
  unreadCount(@Req() request: Request) {
    return this.notifications.unreadCount(request.adminUser!.id);
  }

  @Sse("admin/notifications/stream")
  @SkipThrottle()
  @RawResponse()
  @RequirePermissions("notifications.read")
  streamNotifications(@Req() request: Request): Observable<MessageEvent> {
    return this.stream.stream(request.adminUser!.id);
  }

  @Post("admin/notifications/:id/read")
  @RequirePermissions("notifications.read")
  markRead(@Param() params: IdParamDto, @Req() request: Request) {
    return this.notifications.markRead(request.adminUser!.id, params.id);
  }

  @Post("admin/notifications/read-all")
  @RequirePermissions("notifications.read")
  markAllRead(@Req() request: Request) {
    return this.notifications.markAllRead(request.adminUser!.id);
  }

  @Post("internal/workers/notifications/tick")
  @PublicRoute()
  workerTick(@Headers("x-internal-worker-secret") secret: string | undefined) {
    if (secret !== this.config.get("INTERNAL_WORKER_SECRET", { infer: true })) {
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Internal worker secret tidak valid.",
      });
    }

    return this.notifications.workerTick();
  }
}
