import { Injectable, MessageEvent } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Observable, Subject } from "rxjs";
import type { Env } from "@/config/env";

export type NotificationStreamData = {
  type: "connected" | "heartbeat" | "notification.created" | "notification.read";
  notification_id?: number;
  resource_type?: string | null;
  resource_id?: number | null;
  timestamp: string;
};

@Injectable()
export class NotificationStreamService {
  private readonly streams = new Map<number, Set<Subject<MessageEvent>>>();

  constructor(private readonly config: ConfigService<Env, true>) {}

  stream(userId: number): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const subject = new Subject<MessageEvent>();
      const subscription = subject.subscribe(subscriber);
      const heartbeatMs = this.config.get("NOTIFICATION_STREAM_HEARTBEAT_MS", { infer: true });
      this.addSubject(userId, subject);

      subject.next(this.event("connected"));
      const heartbeat = setInterval(() => {
        subject.next(this.event("heartbeat"));
      }, heartbeatMs);

      return () => {
        clearInterval(heartbeat);
        subscription.unsubscribe();
        this.removeSubject(userId, subject);
        subject.complete();
      };
    });
  }

  broadcastCreated(input: {
    notificationId: number;
    resourceType?: string | null;
    resourceId?: number | null;
  }): void {
    this.broadcast({
      type: "notification.created",
      notification_id: input.notificationId,
      resource_type: input.resourceType ?? null,
      resource_id: input.resourceId ?? null,
      timestamp: new Date().toISOString(),
    });
  }

  notifyRead(userId: number): void {
    this.emitToUser(userId, {
      type: "notification.read",
      timestamp: new Date().toISOString(),
    });
  }

  private addSubject(userId: number, subject: Subject<MessageEvent>): void {
    const subjects = this.streams.get(userId) ?? new Set<Subject<MessageEvent>>();
    subjects.add(subject);
    this.streams.set(userId, subjects);
  }

  private removeSubject(userId: number, subject: Subject<MessageEvent>): void {
    const subjects = this.streams.get(userId);
    if (!subjects) {
      return;
    }

    subjects.delete(subject);
    if (subjects.size === 0) {
      this.streams.delete(userId);
    }
  }

  private broadcast(data: NotificationStreamData): void {
    for (const subjects of this.streams.values()) {
      for (const subject of subjects) {
        subject.next({ type: data.type, data });
      }
    }
  }

  private emitToUser(userId: number, data: NotificationStreamData): void {
    const subjects = this.streams.get(userId);
    if (!subjects) {
      return;
    }

    for (const subject of subjects) {
      subject.next({ type: data.type, data });
    }
  }

  private event(type: "connected" | "heartbeat"): MessageEvent {
    return {
      type,
      data: {
        type,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
