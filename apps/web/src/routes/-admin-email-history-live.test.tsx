// @vitest-environment jsdom
import type { ReactElement, ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const campaignSetData = vi.fn();
const listFn = vi.fn();

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (options: { component: () => ReactElement }) => ({
    options,
    path,
  }),
}));

vi.mock("@/components/ui/dialog", async () => {
  const React = await import("react");
  const pass =
    (tag: string) =>
    ({ children, className }: { children?: ReactNode; className?: string }) =>
      React.createElement(tag, { className }, children);
  return {
    Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
      open ? React.createElement("div", null, children) : null,
    DialogContent: pass("div"),
    DialogDescription: pass("p"),
    DialogFooter: pass("footer"),
    DialogHeader: pass("header"),
    DialogTitle: pass("h2"),
  };
});

vi.mock("@/components/ui/alert-dialog", async () => {
  const React = await import("react");
  const pass =
    (tag: string) =>
    ({ children, className }: { children?: ReactNode; className?: string }) =>
      React.createElement(tag, { className }, children);
  return {
    AlertDialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
      open ? React.createElement("div", null, children) : null,
    AlertDialogAction: ({ children }: { children?: ReactNode }) =>
      React.createElement("button", null, children),
    AlertDialogCancel: ({ children }: { children?: ReactNode }) =>
      React.createElement("button", null, children),
    AlertDialogContent: pass("div"),
    AlertDialogDescription: pass("p"),
    AlertDialogFooter: pass("footer"),
    AlertDialogHeader: pass("header"),
    AlertDialogTitle: pass("h2"),
  };
});

vi.mock("@/hooks/use-api-query", () => ({
  getErrorMessage: (error: unknown) => String(error),
  useApiQuery: (key: readonly unknown[]) => {
    const first = String(key[0]);
    const second = String(key[1]);
    if (first === "auth") {
      return queryState({
        user: { id: 1, name: "Admin", email: "a@b.com", role: "super_admin", permissions: [] },
      });
    }
    if (first === "admin" && second === "email-campaigns") {
      return { ...queryState(pageList([campaign("processing")])), setData: campaignSetData };
    }
    return queryState(pageList([]));
  },
}));

vi.mock("@/lib/api-services", () => ({
  adminEmailCampaignApi: {
    list: listFn,
    logs: vi.fn(),
    recipients: vi.fn(),
    resendFailed: vi.fn(),
  },
  authApi: { me: vi.fn() },
}));

function queryState<T>(data: T) {
  return { data, error: null, loading: false, reload: vi.fn(), setData: vi.fn() };
}

function pageList<T>(items: T[]) {
  return { items, pagination: { limit: 10, page: 1, total: items.length, total_pages: 1 } };
}

function campaign(status: string) {
  return {
    created_at: "2026-01-01T00:00:00.000Z",
    failed_count: 0,
    id: 91,
    sent_count: 0,
    sender_account: { email_address: "marketing@indobraga.com" },
    status,
    title: "Blast Juni",
    total_recipients: 5,
  };
}

describe("email history live status", () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("silently refreshes the list while a campaign is in-flight", async () => {
    listFn.mockResolvedValue(pageList([campaign("completed")]));
    const { Route } = (await import("./admin.email-history")) as unknown as {
      Route: { options: { component: () => ReactElement } };
    };
    const Component = Route.options.component;

    await act(async () => {
      root.render(<Component />);
    });

    // Before any tick, no poll yet.
    expect(listFn).not.toHaveBeenCalled();

    // Advance past the 5s poll interval -> silent refresh via setData.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(listFn).toHaveBeenCalled();
    expect(campaignSetData).toHaveBeenCalled();
  });
});
