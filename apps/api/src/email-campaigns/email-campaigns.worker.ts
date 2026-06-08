import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "@/config/env";
import { EmailCampaignsService } from "@/email-campaigns/email-campaigns.service";

/**
 * Lightweight in-app scheduler. The primary delivery trigger is event-driven
 * (`send` kicks the drain immediately); this poll is only a safety net that
 * resumes interrupted campaigns and picks up delayed retries. Uses a native
 * `setInterval` (no extra dependency) and never overlaps work thanks to the
 * service's single-flight guard.
 */
@Injectable()
export class EmailCampaignsWorker implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(EmailCampaignsWorker.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly campaigns: EmailCampaignsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  onApplicationBootstrap(): void {
    const intervalMs = this.config.get("EMAIL_WORKER_POLL_MS", { infer: true });
    if (intervalMs <= 0) {
      // Fully manual mode: no event-driven drain, no poll. Rely on the worker tick.
      this.logger.log("Email worker poll disabled (EMAIL_WORKER_POLL_MS=0).");
      return;
    }

    this.campaigns.enableAutoDrain();
    this.timer = setInterval(() => {
      void this.campaigns.drainPendingCampaigns();
    }, intervalMs);
    // Do not keep the process alive solely for this timer.
    this.timer.unref?.();
    this.logger.log(`Email worker poll active every ${intervalMs}ms.`);
  }

  onApplicationShutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
