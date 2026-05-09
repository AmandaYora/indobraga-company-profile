import { RevalidationStatus } from "@prisma/client";
import { RevalidationService } from "@/revalidation/revalidation.service";

describe("RevalidationService", () => {
  it("does nothing when cache key list is empty", async () => {
    const prisma = {
      revalidationEvent: { createMany: jest.fn() },
    };

    await new RevalidationService(prisma as never).queue({
      resourceType: "news",
      resourceId: 1,
      cacheKeys: [],
    });

    expect(prisma.revalidationEvent.createMany).not.toHaveBeenCalled();
  });

  it("queues revalidation events for each cache key", async () => {
    const prisma = {
      revalidationEvent: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };

    await new RevalidationService(prisma as never).queue({
      resourceType: "news",
      resourceId: 1,
      cacheKeys: ["public:news:list", "sitemap"],
    });

    expect(prisma.revalidationEvent.createMany).toHaveBeenCalledWith({
      data: [
        { resourceType: "news", resourceId: 1, cacheKey: "public:news:list" },
        { resourceType: "news", resourceId: 1, cacheKey: "sitemap" },
      ],
    });
  });

  it("processes pending events idempotently", async () => {
    const prisma = {
      revalidationEvent: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, cacheKey: "home" },
          { id: 2, cacheKey: "home" },
          { id: 3, cacheKey: "sitemap" },
        ]),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
    };

    const result = await new RevalidationService(prisma as never).processPending(10);

    expect(prisma.revalidationEvent.findMany).toHaveBeenCalledWith({
      where: { status: RevalidationStatus.PENDING },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 10,
    });
    expect(prisma.revalidationEvent.updateMany).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ processed: 3, cache_keys: ["home", "sitemap"] });
  });
});
