import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import cookieParser from "cookie-parser";
import { CacheControlInterceptor } from "@/core/cache-control.interceptor";
import { HttpExceptionFilter } from "@/core/http-exception.filter";
import { RequestIdMiddleware } from "@/core/request-id.middleware";
import { ResponseEnvelopeInterceptor } from "@/core/response-envelope.interceptor";
import { createValidationPipe } from "@/core/validation.pipe";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: "default",
        ttl: 60_000,
        limit: 120,
      },
    ]),
  ],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: createValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheControlInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(cookieParser(), RequestIdMiddleware).forRoutes("*");
  }
}
