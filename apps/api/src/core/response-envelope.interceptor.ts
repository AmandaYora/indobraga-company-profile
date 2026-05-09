import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { Request } from "express";
import { Observable, map } from "rxjs";
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
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
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
