// @vitest-environment jsdom
import type { ReactElement, ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const update = vi.fn();
const remove = vi.fn();
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
    if (String(key[0]) === "admin" && String(key[1]) === "email-accounts") {
      return queryState(pageList([account()]));
    }
    return queryState(null);
  },
}));

vi.mock("@/lib/api-services", () => ({
  adminEmailAccountsApi: {
    createSmtp: vi.fn(),
    disable: vi.fn(),
    googleOAuthUrl: vi.fn(),
    list: vi.fn(),
    reconnect: vi.fn(),
    remove,
    testSmtp: vi.fn(),
    update,
  },
}));

function queryState<T>(data: T) {
  return { data, error: null, loading: false, reload: vi.fn(), setData: vi.fn() };
}

function pageList<T>(items: T[]) {
  return { items, pagination: { limit: 6, page: 1, total: items.length, total_pages: 1 } };
}

function account() {
  return {
    auth_type: "smtp",
    created_at: "2026-01-01T00:00:00.000Z",
    display_name: "Indobraga Support",
    email_address: "support@indobraga.com",
    id: 7,
    last_error: null,
    provider: "smtp",
    smtp_host: "smtp.hostinger.com",
    smtp_port: 465,
    smtp_security: "ssl_tls",
    smtp_username: "support@indobraga.com",
    status: "connected",
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

describe("email account edit and delete actions", () => {
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

  it("edits an SMTP account and deletes it", async () => {
    update.mockResolvedValue(account());
    remove.mockResolvedValue({ id: 7, status: "deleted" });
    const { Route } = (await import("./admin.email-accounts")) as unknown as {
      Route: { options: { component: () => ReactElement } };
    };
    const Component = Route.options.component;

    await act(async () => {
      root.render(<Component />);
    });

    // Open the edit modal (covers openEdit + the edit form fields).
    await click(
      findButton(container, (b) => (b.getAttribute("aria-label") ?? "").includes("Ubah akun")),
    );
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    expect(container.textContent).toContain("Server Email (SMTP Host)");

    // Submit the edit form -> saveEdit -> update(id, body).
    await act(async () => {
      form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(update).toHaveBeenCalledWith(7, expect.objectContaining({ smtp_host: "smtp.hostinger.com" }));

    // Delete: open confirm then confirm -> remove(id).
    await click(
      findButton(container, (b) => (b.getAttribute("aria-label") ?? "").includes("Hapus akun")),
    );
    await click(findButton(container, (b) => b.textContent?.trim() === "Hapus"));
    await act(async () => {
      await Promise.resolve();
    });
    expect(remove).toHaveBeenCalledWith(7);
    expect(toastSuccess).toHaveBeenCalled();
  });
});
