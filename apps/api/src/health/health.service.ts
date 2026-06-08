import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { MEDIA_STORAGE, type MediaStorageService } from "@/media/media-storage.types";

const DATABASE_HEALTH_TIMEOUT_MS = 2_000;
const STORAGE_HEALTH_TIMEOUT_MS = 5_000;

type DependencyStatus = "ok" | "error";

type DatabaseCheckResult = {
  status: "ok";
  latency_ms: number;
};

type StorageCheckResult = {
  status: DependencyStatus;
  latency_ms: number;
};

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorageService,
  ) {}

  async check() {
    // The database is required to serve any request, so it gates the endpoint
    // (503 when down). Object storage is only needed for admin uploads — the
    // public site serves fine without a live bucket call — so it is reported as
    // an informational sub-check and only downgrades the status to "degraded",
    // never failing the endpoint on transient bucket latency.
    const database = await this.checkDatabase();
    const storage = await this.checkStorage();

    return {
      status: storage.status === "ok" ? "ok" : "degraded",
      service: "indobraga-api",
      uptime_seconds: Math.round(process.uptime()),
      checks: {
        database,
        storage,
      },
    };
  }

  private async checkDatabase(): Promise<DatabaseCheckResult> {
    const startedAt = Date.now();

    try {
      await withTimeout(this.prisma.$queryRaw`SELECT 1 AS ok`, DATABASE_HEALTH_TIMEOUT_MS);
    } catch {
      throw new ServiceUnavailableException({
        code: "SERVICE_UNAVAILABLE",
        message: "Database belum siap.",
        details: [
          {
            field: "database",
            message: "Koneksi database gagal atau melewati batas waktu.",
          },
        ],
      });
    }

    return {
      status: "ok",
      latency_ms: Date.now() - startedAt,
    };
  }

  private async checkStorage(): Promise<StorageCheckResult> {
    const startedAt = Date.now();

    try {
      await withTimeout(this.storage.ping(), STORAGE_HEALTH_TIMEOUT_MS);
      return { status: "ok", latency_ms: Date.now() - startedAt };
    } catch {
      // Non-fatal: surface the degradation without taking the service down.
      return { status: "error", latency_ms: Date.now() - startedAt };
    }
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });
}
