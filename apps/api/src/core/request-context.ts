import type { Request } from "express";
import { randomUUID } from "node:crypto";

export type ResponseMeta = {
  request_id: string;
  timestamp: string;
};

export function createRequestId(): string {
  return `req_${randomUUID()}`;
}

export function getRequestId(request: Request): string {
  return request.requestId ?? createRequestId();
}

export function createResponseMeta(request: Request): ResponseMeta {
  return {
    request_id: getRequestId(request),
    timestamp: new Date().toISOString(),
  };
}
