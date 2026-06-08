import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "@/database/prisma.service";

const DATABASE_HEALTH_TIMEOUT_MS = 2_000;

type HealthCheckResult = {
  latency_ms: number;
  status: "ok";
};

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    const database = await this.checkDatabase();

    return {
      status: "ok",
      service: "indobraga-api",
      uptime_seconds: Math.round(process.uptime()),
      checks: {
        database,
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
