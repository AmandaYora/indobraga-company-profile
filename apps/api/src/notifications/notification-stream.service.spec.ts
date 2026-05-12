import type { ConfigService } from "@nestjs/config";
import type { Env } from "@/config/env";
import { NotificationStreamService } from "@/notifications/notification-stream.service";

type StreamTestEvent = {
  type?: string;
  data?: {
    notification_id?: number;
    resource_id?: number | null;
    resource_type?: string | null;
    type?: string;
  };
};

const configMock = () =>
  ({
    get: jest.fn((key: string) => (key === "NOTIFICATION_STREAM_HEARTBEAT_MS" ? 1_000 : undefined)),
  }) as unknown as ConfigService<Env, true>;

describe("NotificationStreamService", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2026-05-09T13:20:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("emits connected, heartbeat, broadcast, and targeted read events", () => {
    const service = new NotificationStreamService(configMock());
    const userOneEvents: StreamTestEvent[] = [];
    const userTwoEvents: StreamTestEvent[] = [];

    const userOne = service
      .stream(1)
      .subscribe((event) => userOneEvents.push(event as StreamTestEvent));
    const userTwo = service
      .stream(2)
      .subscribe((event) => userTwoEvents.push(event as StreamTestEvent));

    expect(userOneEvents[0]).toMatchObject({
      data: { type: "connected" },
      type: "connected",
    });
    expect(userTwoEvents).toHaveLength(1);

    jest.advanceTimersByTime(1_000);
    expect(userOneEvents.at(-1)).toMatchObject({
      data: { type: "heartbeat" },
      type: "heartbeat",
    });

    service.broadcastCreated({
      notificationId: 7,
      resourceId: 12,
      resourceType: "inquiry",
    });
    expect(userOneEvents.at(-1)).toMatchObject({
      data: {
        notification_id: 7,
        resource_id: 12,
        resource_type: "inquiry",
        type: "notification.created",
      },
      type: "notification.created",
    });
    expect(userTwoEvents.at(-1)?.type).toBe("notification.created");

    service.notifyRead(1);
    expect(userOneEvents.at(-1)?.type).toBe("notification.read");
    expect(userTwoEvents.at(-1)?.type).toBe("notification.created");

    userOne.unsubscribe();
    const eventCountAfterUnsubscribe = userOneEvents.length;
    service.broadcastCreated({ notificationId: 8 });
    expect(userOneEvents).toHaveLength(eventCountAfterUnsubscribe);
    expect(userTwoEvents.at(-1)).toMatchObject({
      data: {
        notification_id: 8,
        resource_id: null,
        resource_type: null,
        type: "notification.created",
      },
    });

    userTwo.unsubscribe();
  });
});
