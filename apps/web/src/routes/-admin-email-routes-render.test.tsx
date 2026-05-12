import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (options: { component: () => ReactElement }) => ({
    options,
    path,
  }),
}));

vi.mock("@/components/ui/dialog", async () => {
  const React = await import("react");
  const passthrough =
    (tag: string) =>
    ({ children, className }: { children?: ReactNode; className?: string }) =>
      React.createElement(tag, { className }, children);

  return {
    Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
      open ? React.createElement("div", null, children) : null,
    DialogContent: passthrough("div"),
    DialogDescription: passthrough("p"),
    DialogFooter: passthrough("footer"),
    DialogHeader: passthrough("header"),
    DialogTitle: passthrough("h2"),
  };
});

vi.mock("@/components/ui/alert-dialog", async () => {
  const React = await import("react");
  const passthrough =
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
    AlertDialogContent: passthrough("div"),
    AlertDialogDescription: passthrough("p"),
    AlertDialogFooter: passthrough("footer"),
    AlertDialogHeader: passthrough("header"),
    AlertDialogTitle: passthrough("h2"),
  };
});

vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: (key: readonly unknown[]) => {
    const first = String(key[0]);
    const second = String(key[1]);
    const third = String(key[2]);

    if (first === "admin" && second === "email-accounts" && third === "connected") {
      return queryState(
        pageList([emailAccount({ id: 5, email_address: "marketing@indobraga.com" })]),
      );
    }

    if (first === "admin" && second === "email-accounts") {
      return queryState(
        pageList([
          emailAccount({ id: 1, email_address: "marketing@indobraga.com", provider: "google" }),
          emailAccount({
            display_name: "Support",
            email_address: "support@indobraga.com",
            id: 2,
            last_error: "Auth failed",
            provider: "smtp",
            smtp_host: "smtp.hostinger.com",
            status: "needs_reconnect",
          }),
        ]),
      );
    }

    if (first === "admin" && second === "email-campaigns" && third === "inquiry-preview") {
      return queryState({
        duplicate_emails: 1,
        eligible_recipients: 2,
        invalid_emails: 1,
        over_limit: true,
        recipient_limit: 1000,
        sample_recipients: [
          {
            created_at: "2026-01-01T00:00:00.000Z",
            email: "buyer@example.com",
            id: 10,
            name: "Buyer Satu",
            status: "new",
          },
        ],
        total_inquiries: 4,
      });
    }

    if (first === "admin" && second === "email-campaigns") {
      return queryState(pageList([campaign()]));
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
  },
  adminEmailCampaignApi: {
    createDraft: vi.fn(),
    createDraftFromInquiries: vi.fn(),
    list: vi.fn(),
    logs: vi.fn(),
    previewInquiryRecipients: vi.fn(),
    recipients: vi.fn(),
    send: vi.fn(),
  },
}));

type MockRoute = {
  options: {
    component: () => ReactElement;
  };
};

function renderRoute(route: MockRoute) {
  return renderToStaticMarkup(<route.options.component />);
}

function queryState<T>(data: T) {
  return { data, error: null, loading: false, reload: vi.fn() };
}

function pageList<T>(items: T[]) {
  return {
    items,
    pagination: {
      limit: 10,
      page: 1,
      total: items.length,
      total_pages: Math.max(1, Math.ceil(items.length / 10)),
    },
  };
}

function emailAccount(overrides: Record<string, unknown> = {}) {
  return {
    created_at: "2026-01-01T00:00:00.000Z",
    display_name: "Marketing",
    email_address: "marketing@indobraga.com",
    id: 1,
    last_error: null,
    provider: "google",
    smtp_host: null,
    status: "connected",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
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
    sender_account: emailAccount({ id: 5, email_address: "marketing@indobraga.com" }),
    status: "completed",
    subject: "Follow-up",
    title: "Follow-up Mei",
    total_recipients: 3,
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

describe("admin email route rendering", () => {
  it("renders account, blast, and history routes from API query state", async () => {
    const [accounts, blast, history] = await Promise.all([
      import("./admin.email-accounts"),
      import("./admin.email-blast"),
      import("./admin.email-history"),
    ]);

    const output = [
      renderRoute(accounts.Route as MockRoute),
      renderRoute(blast.Route as MockRoute),
      renderRoute(history.Route as MockRoute),
    ].join("\n");

    expect(output).toContain("Akun Pengirim Email");
    expect(output).toContain("marketing@indobraga.com");
    expect(output).toContain("support@indobraga.com");
    expect(output).toContain("Auth failed");
    expect(output).toContain("Kirim Email Massal");
    expect(output).toContain("Buyer Satu");
    expect(output).toContain("buyer@example.com");
    expect(output).toContain("Hasil filter melebihi batas 1000 email");
    expect(output).toContain("Riwayat Email Massal");
    expect(output).toContain("Follow-up Mei");
    expect(output).toContain("Selesai");
  });
});
