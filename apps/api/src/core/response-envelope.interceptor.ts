import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { Observable, map } from "rxjs";
import { RAW_RESPONSE_METADATA } from "@/core/raw-response.decorator";
import { createResponseMeta, ResponseMeta } from "@/core/request-context";

type StandardSuccessEnvelope = {
  success: true;
  data: unknown;
  meta?: Partial<ResponseMeta>;
};

function isStandardSuccessEnvelope(value: unknown): value is StandardSuccessEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === true &&
    "data" in value
  );
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const rawResponse = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (rawResponse) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data: unknown) => {
        const meta = createResponseMeta(request);

        if (isStandardSuccessEnvelope(data)) {
          return {
            ...data,
            meta: {
              ...meta,
              ...data.meta,
            },
          };
        }

        return {
          success: true,
          data: data ?? null,
          meta,
        };
      }),
    );
  }
}
