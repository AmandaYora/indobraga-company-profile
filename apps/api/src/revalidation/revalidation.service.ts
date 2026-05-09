import { Injectable } from "@nestjs/common";
import { RevalidationStatus } from "@prisma/client";
import { PrismaService } from "@/database/prisma.service";

type RevalidationInput = {
  resourceType: string;
  resourceId?: number;
  cacheKeys: string[];
};

@Injectable()
export class RevalidationService {
  constructor(private readonly prisma: PrismaService) {}

  async queue(input: RevalidationInput): Promise<void> {
    if (input.cacheKeys.length === 0) {
      return;
    }

    await this.prisma.revalidationEvent.createMany({
      data: input.cacheKeys.map((cacheKey) => ({
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        cacheKey,
      })),
    });
  }

  async processPending(limit = 50) {
    const events = await this.prisma.revalidationEvent.findMany({
      where: { status: RevalidationStatus.PENDING },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: limit,
    });

    if (events.length === 0) {
      return {
        processed: 0,
        cache_keys: [],
      };
    }

    const ids = events.map((event) => event.id);
    await this.prisma.revalidationEvent.updateMany({
      where: { id: { in: ids }, status: RevalidationStatus.PENDING },
      data: { status: RevalidationStatus.PROCESSING, attempts: { increment: 1 } },
    });
    await this.prisma.revalidationEvent.updateMany({
      where: { id: { in: ids }, status: RevalidationStatus.PROCESSING },
      data: { status: RevalidationStatus.COMPLETED, processedAt: new Date(), lastError: null },
    });

    return {
      processed: events.length,
      cache_keys: [...new Set(events.map((event) => event.cacheKey))],
    };
  }
}
