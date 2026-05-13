import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  ApiErrorBody,
  ApiErrorCode,
  ApiErrorDetail,
  getDefaultErrorCode,
  getDefaultErrorMessage,
} from "@/core/api-error";
import { createResponseMeta } from "@/core/request-context";

type HttpExceptionPayload = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    typeof value === "string" &&
    [
      "BAD_REQUEST",
      "VALIDATION_ERROR",
      "UNAUTHENTICATED",
      "FORBIDDEN",
      "NOT_FOUND",
      "CONFLICT",
      "PAYLOAD_TOO_LARGE",
      "UNSUPPORTED_MEDIA_TYPE",
      "UNPROCESSABLE_ENTITY",
      "RATE_LIMITED",
      "INTERNAL_ERROR",
      "UPSTREAM_ERROR",
      "SERVICE_UNAVAILABLE",
    ].includes(value)
  );
}

function toErrorDetails(value: unknown): ApiErrorDetail[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const details = value.flatMap((item): ApiErrorDetail[] => {
    if (!isRecord(item) || typeof item.message !== "string") {
      return [];
    }

    return [
      {
        field: typeof item.field === "string" ? item.field : undefined,
        message: item.message,
      },
    ];
  });

  return details.length > 0 ? details : undefined;
}

function readHttpExceptionPayload(exception: HttpException): HttpExceptionPayload {
  const response = exception.getResponse();

  if (typeof response === "string") {
    return { message: response };
  }

  if (isRecord(response)) {
    return response;
  }

  return {};
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const { status, error } = this.toErrorResponse(exception);

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        JSON.stringify({
          request_id: request.requestId ?? "request_unknown",
          method: request.method,
          path: request.originalUrl,
          status,
          error_code: error.code,
          message: error.message,
        }),
        stack,
      );
    }

    response.status(status).json({
      success: false,
      error,
      meta: createResponseMeta(request),
    });
  }

  private toErrorResponse(exception: unknown): { status: number; error: ApiErrorBody } {
    if (!(exception instanceof HttpException)) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: {
          code: "INTERNAL_ERROR",
          message: getDefaultErrorMessage("INTERNAL_ERROR"),
        },
      };
    }

    const status = exception.getStatus();
    const payload = readHttpExceptionPayload(exception);
    const defaultCode = getDefaultErrorCode(status);
    const explicitCode = isApiErrorCode(payload.code) ? payload.code : undefined;
    const code: ApiErrorCode = explicitCode ?? defaultCode;
    const message =
      explicitCode && typeof payload.message === "string"
        ? payload.message
        : getDefaultErrorMessage(code);

    return {
      status,
      error: {
        code,
        message,
        details: toErrorDetails(payload.details),
      },
    };
  }
}
