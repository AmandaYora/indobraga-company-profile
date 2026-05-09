import { BadRequestException } from "@nestjs/common";

export type PagePaginationOptions = {
  page?: unknown;
  limit?: unknown;
  defaultLimit: number;
  maxLimit: number;
};

export type PagePagination = {
  page: number;
  limit: number;
  skip: number;
};

export type PagePaginationMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

function toPositiveInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function normalizePagePagination(options: PagePaginationOptions): PagePagination {
  const page = toPositiveInteger(options.page) ?? 1;
  const requestedLimit = toPositiveInteger(options.limit) ?? options.defaultLimit;
  const limit = Math.min(requestedLimit, options.maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function createPagePaginationMeta(
  page: number,
  limit: number,
  total: number,
): PagePaginationMeta {
  return {
    page,
    limit,
    total,
    total_pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function encodeCursor(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | undefined): Record<string, unknown> | null {
  if (!cursor) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Cursor payload is not an object.");
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw new BadRequestException({
      code: "BAD_REQUEST",
      message: "Cursor tidak valid.",
    });
  }
}
