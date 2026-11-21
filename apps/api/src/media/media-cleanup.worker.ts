import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "@/config/env";
import { MediaService } from "@/media/media.service";

/**
 * Periodically removes uploads that never got attached to content (QA IB-09).
 * Same lightweight pattern as the email worker: a native, unref'd `setInterval`
 * with a single-flight guard, so no extra scheduler dependency is needed.
 */
@Injectable()
export class MediaCleanupWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(MediaCleanupWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly media: MediaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onApplicationBootstrap(): void {
    const intervalMs = this.config.get("MEDIA_CLEANUP_POLL_MS", { infer: true });
    if (intervalMs <= 0) {
      this.logger.log("Orphan media cleanup disabled (MEDIA_CLEANUP_POLL_MS=0).");
      return;
    }

    this.timer = setInterval(() => void this.tick(), intervalMs);
    this.timer.unref?.();
    this.logger.log(`Orphan media cleanup active every ${intervalMs}ms.`);
  }

  onApplicationShutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async tick(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    try {
      const summary = await this.media.cleanupOrphans();
      if (summary.deleted > 0 || summary.cleanup_failed > 0) {
        this.logger.log(`Orphan media sweep: ${JSON.stringify(summary)}`);
      }
    } catch (error) {
      this.logger.error(
        "Orphan media sweep failed.",
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.running = false;
    }
  }
}
