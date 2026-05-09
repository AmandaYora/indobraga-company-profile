import { BadRequestException } from "@nestjs/common";
import {
  createPagePaginationMeta,
  decodeCursor,
  encodeCursor,
  normalizePagePagination,
} from "@/core/pagination";

describe("pagination helpers", () => {
  it("normalizes page pagination with max limit", () => {
    expect(
      normalizePagePagination({
        page: "3",
        limit: "999",
        defaultLimit: 10,
        maxLimit: 100,
      }),
    ).toEqual({
      page: 3,
      limit: 100,
      skip: 200,
    });
  });

  it("creates page pagination metadata", () => {
    expect(createPagePaginationMeta(2, 10, 25)).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      total_pages: 3,
    });
  });

  it("encodes and decodes cursor payloads", () => {
    const cursor = encodeCursor({ id: 123, published_at: "2026-05-08T00:00:00.000Z" });

    expect(decodeCursor(cursor)).toEqual({
      id: 123,
      published_at: "2026-05-08T00:00:00.000Z",
    });
  });

  it("rejects invalid cursor payloads", () => {
    expect(() => decodeCursor("invalid-cursor")).toThrow(BadRequestException);
  });
});
