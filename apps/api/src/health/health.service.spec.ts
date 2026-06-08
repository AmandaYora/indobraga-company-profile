import { ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { HealthService } from "@/health/health.service";
import type { MediaStorageService } from "@/media/media-storage.types";

describe("HealthService", () => {
  let prisma: { $queryRaw: jest.Mock };
  let storage: { ping: jest.Mock; put: jest.Mock; delete: jest.Mock };
  let service: HealthService;

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]),
    };
    storage = {
      ping: jest.fn().mockResolvedValue(undefined),
      put: jest.fn(),
      delete: jest.fn(),
    };
    service = new HealthService(
      prisma as unknown as PrismaService,
      storage as unknown as MediaStorageService,
    );
  });

  it("returns ok when the database and storage respond", async () => {
    const response = await service.check();

    expect(response.status).toBe("ok");
    expect(response.service).toBe("indobraga-api");
    expect(response.uptime_seconds).toEqual(expect.any(Number));
    expect(response.checks.database.status).toBe("ok");
    expect(response.checks.database.latency_ms).toEqual(expect.any(Number));
    expect(response.checks.storage.status).toBe("ok");
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(storage.ping).toHaveBeenCalledTimes(1);
  });

  it("returns service unavailable when the database check fails", async () => {
    prisma.$queryRaw.mockRejectedValue(new Error("connection failed"));

    try {
      await service.check();
      throw new Error("Expected health check to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
        code: "SERVICE_UNAVAILABLE",
        message: "Database belum siap.",
      });
    }
  });

  it("returns service unavailable when object storage is unreachable", async () => {
    storage.ping.mockRejectedValue(new Error("bucket unreachable"));

    try {
      await service.check();
      throw new Error("Expected health check to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
        code: "SERVICE_UNAVAILABLE",
        message: "Penyimpanan media belum siap.",
      });
    }
  });
});
