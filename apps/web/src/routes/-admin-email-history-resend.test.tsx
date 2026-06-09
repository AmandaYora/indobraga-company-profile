// @vitest-environment jsdom
import type { ReactElement, ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const resendFailed = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: toastError } }));

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
    AlertDialogAction: ({ children, onClick }: { children?: ReactNode; onClick?: () => void }) =>
      React.createElement("button", { onClick }, children),
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
        user: {
          email: "super@example.com",
          id: 1,
          name: "Super Admin",
          permissions: ["email_campaign_logs.read", "email_campaigns.send"],
          role: "super_admin",
        },
      });
    }
    if (first === "admin" && second === "email-campaigns") {
      return queryState(pageList([campaign()]));
    }
    if (first === "campaign-recipients") {
      return queryState(
        pageList([{ id: 1, email: "lead@example.com", name: "Lead", status: "failed" }]),
      );
    }
    if (first === "campaign-logs") {
      return queryState(
        pageList([
          {
            id: 1,
            recipient_email: "lead@example.com",
            status: "failed",
            error_code: "EAUTH",
            error_message: "535 Authentication failed",
          },
        ]),
      );
    }
    return queryState(null);
  },
}));

vi.mock("@/lib/api-services", () => ({
  adminEmailCampaignApi: {
    list: vi.fn(),
    logs: vi.fn(),
    recipients: vi.fn(),
    resendFailed,
  },
  authApi: { me: vi.fn() },
}));

function queryState<T>(data: T) {
  return { data, error: null, loading: false, reload: vi.fn(), setData: vi.fn() };
}

function pageList<T>(items: T[]) {
  return {
    items,
    pagination: { limit: 10, page: 1, total: items.length, total_pages: 1 },
  };
}

function campaign() {
  return {
    body_html: "<p>Halo</p>",
    body_text: "Halo",
    created_at: "2026-01-01T00:00:00.000Z",
    email_account_id: 5,
    failed_count: 1,
    id: 81,
    sent_count: 2,
    sender_account: { id: 5, email_address: "marketing@indobraga.com" },
    status: "completed",
    subject: "Follow-up",
    title: "Follow-up Mei",
    total_recipients: 3,
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function findButton(container: HTMLElement, predicate: (button: HTMLButtonElement) => boolean) {
  return Array.from(container.querySelectorAll("button")).find((button) =>
    predicate(button as HTMLButtonElement),
  ) as HTMLButtonElement | undefined;
}

async function click(button: HTMLButtonElement | undefined) {
  if (!button) {
    throw new Error("button not found");
  }
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("email history resend flow", () => {
  let container: HTMLElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it("re-sends only the failed recipients from the detail modal", async () => {
    resendFailed.mockResolvedValue({ ...campaign(), failed_count: 0, status: "pending" });
    const { Route } = (await import("./admin.email-history")) as unknown as {
      Route: { options: { component: () => ReactElement } };
    };
    const Component = Route.options.component;

    await act(async () => {
      root.render(<Component />);
    });

    // Open the campaign detail (sets `selected`, rendering the resend banner).
    await click(
      findButton(container, (b) => (b.getAttribute("aria-label") ?? "").includes("Lihat detail")),
    );
    expect(container.textContent).toContain("Kirim Ulang yang Gagal");

    // Open the confirm dialog, then confirm.
    await click(findButton(container, (b) => b.textContent?.includes("Kirim Ulang yang Gagal") ?? false));
    await click(findButton(container, (b) => b.textContent?.trim() === "Kirim Ulang"));
    await act(async () => {
      await Promise.resolve();
    });

    expect(resendFailed).toHaveBeenCalledWith(81);
    expect(toastSuccess).toHaveBeenCalled();
  });
});
