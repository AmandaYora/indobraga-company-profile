import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";
import { MEDIA_STORAGE, type MediaStorageService } from "@/media/media-storage.types";

const DATABASE_HEALTH_TIMEOUT_MS = 2_000;
const STORAGE_HEALTH_TIMEOUT_MS = 3_000;

type HealthCheckResult = {
  latency_ms: number;
  status: "ok";
};

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEDIA_STORAGE) private readonly storage: MediaStorageService,
  ) {}

  async check() {
    const database = await this.checkDatabase();
    const storage = await this.checkStorage();

    return {
      status: "ok",
      service: "indobraga-api",
      uptime_seconds: Math.round(process.uptime()),
      checks: {
        database,
        storage,
      },
    };
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
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

  private async checkStorage(): Promise<HealthCheckResult> {
    const startedAt = Date.now();

    try {
      await withTimeout(this.storage.ping(), STORAGE_HEALTH_TIMEOUT_MS);
    } catch {
      throw new ServiceUnavailableException({
        code: "SERVICE_UNAVAILABLE",
        message: "Penyimpanan media belum siap.",
        details: [
          {
            field: "storage",
            message: "Object storage tidak dapat dijangkau atau melewati batas waktu.",
          },
        ],
      });
    }

    return {
      status: "ok",
      latency_ms: Date.now() - startedAt,
    };
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
