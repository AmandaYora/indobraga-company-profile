import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "@/config/env";
import { RevalidationService } from "@/revalidation/revalidation.service";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_BATCHES_PER_TICK = 40;

/**
 * Drains queued revalidation events in-app. Before this worker existed the queue
 * was only drained by an external tick that nothing called, so pending events
 * piled up (QA IB-17d: pending_revalidation = 1709). Completed events are also
 * pruned so the table does not grow without bound.
 */
@Injectable()
export class RevalidationWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(RevalidationWorker.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastPruneAt = 0;

  constructor(
    private readonly revalidation: RevalidationService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onApplicationBootstrap(): void {
    const intervalMs = this.config.get("REVALIDATION_WORKER_POLL_MS", { infer: true });
    if (intervalMs <= 0) {
      this.logger.log("Revalidation worker disabled (REVALIDATION_WORKER_POLL_MS=0).");
      return;
    }

    this.timer = setInterval(() => void this.tick(), intervalMs);
    this.timer.unref?.();
    this.logger.log(`Revalidation worker active every ${intervalMs}ms.`);
    // Start draining the existing backlog right away instead of waiting a full interval.
    void this.tick();
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
      // Drain the whole backlog in bounded batches rather than one batch per tick.
      for (let batch = 0; batch < MAX_BATCHES_PER_TICK; batch += 1) {
        const result = await this.revalidation.processPending(200);
        if (result.processed === 0) {
          break;
        }
      }

      if (Date.now() - this.lastPruneAt > ONE_DAY_MS) {
        this.lastPruneAt = Date.now();
        const retentionDays = this.config.get("REVALIDATION_RETENTION_DAYS", { infer: true });
        const removed = await this.revalidation.pruneCompleted(retentionDays);
        if (removed > 0) {
          this.logger.log(`Pruned ${removed} completed revalidation events.`);
        }
      }
    } catch (error) {
      this.logger.error(
        "Revalidation drain failed.",
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.running = false;
    }
  }
}
