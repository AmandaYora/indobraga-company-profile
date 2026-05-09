import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Response } from "express";
import { Observable } from "rxjs";
import { CACHE_CONTROL_METADATA } from "@/core/cache-control.decorator";

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const cacheControl = this.reflector.getAllAndOverride<string>(CACHE_CONTROL_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (cacheControl) {
      const response = context.switchToHttp().getResponse<Response>();
      response.setHeader("Cache-Control", cacheControl);
    }

    return next.handle();
  }
}
