import { UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import { of } from "rxjs";
import type { Env } from "@/config/env";
import { NotificationsController } from "@/notifications/notifications.controller";

const request = { adminUser: { id: 17 } } as unknown as Request;

const configMock = (secret = "worker-secret") =>
  ({
    get: jest.fn((key: string) => (key === "INTERNAL_WORKER_SECRET" ? secret : undefined)),
  }) as unknown as ConfigService<Env, true>;

const notificationsMock = () => ({
  list: jest.fn().mockResolvedValue({ items: [] }),
  markAllRead: jest.fn().mockResolvedValue({ marked_read: 0, unread_count: 0 }),
  markRead: jest.fn().mockResolvedValue({ unread_count: 1 }),
  unreadCount: jest.fn().mockResolvedValue({ unread_count: 3 }),
  workerTick: jest.fn().mockResolvedValue({ processed: 0 }),
});

const streamMock = () => ({
  stream: jest.fn().mockReturnValue(of({ type: "connected", data: { type: "connected" } })),
});

describe("NotificationsController", () => {
  it("proxies admin notification queries with the authenticated admin id", async () => {
    const notifications = notificationsMock();
    const stream = streamMock();
    const controller = new NotificationsController(
      notifications as never,
      stream as never,
      configMock(),
    );

    const query = { page: 2, limit: 10 } as never;
    await expect(controller.list(query, request)).resolves.toEqual({ items: [] });
    await expect(controller.unreadCount(request)).resolves.toEqual({ unread_count: 3 });
    expect(controller.streamNotifications(request)).toBe(stream.stream.mock.results[0].value);
    await expect(controller.markRead({ id: 9 }, request)).resolves.toEqual({ unread_count: 1 });
    await expect(controller.markAllRead(request)).resolves.toEqual({
      marked_read: 0,
      unread_count: 0,
    });

    expect(notifications.list).toHaveBeenCalledWith(17, query);
    expect(notifications.unreadCount).toHaveBeenCalledWith(17);
    expect(stream.stream).toHaveBeenCalledWith(17);
    expect(notifications.markRead).toHaveBeenCalledWith(17, 9);
    expect(notifications.markAllRead).toHaveBeenCalledWith(17);
  });

  it("runs worker tick only when the internal worker secret matches", async () => {
    const notifications = notificationsMock();
    const controller = new NotificationsController(
      notifications as never,
      streamMock() as never,
      configMock("expected-secret"),
    );

    await expect(controller.workerTick("expected-secret")).resolves.toEqual({ processed: 0 });
    expect(notifications.workerTick).toHaveBeenCalledTimes(1);

    expect(() => controller.workerTick("wrong-secret")).toThrow(UnauthorizedException);
    expect(notifications.workerTick).toHaveBeenCalledTimes(1);
  });
});
