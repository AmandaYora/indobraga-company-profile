import { Injectable, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { createRequestId } from "@/core/request-context";

function normalizeRequestId(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw) {
    return null;
  }

  const requestId = raw.trim();
  if (!/^[A-Za-z0-9_.:-]{8,128}$/.test(requestId)) {
    return null;
  }

  return requestId;
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const requestId = normalizeRequestId(request.headers["x-request-id"]) ?? createRequestId();

    request.requestId = requestId;
    response.setHeader("X-Request-Id", requestId);

    next();
  }
}
