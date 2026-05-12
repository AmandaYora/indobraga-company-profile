import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (options: { component: () => ReactElement }) => ({
    options,
    path,
  }),
  useNavigate: () => vi.fn(),
}));

vi.mock("@/components/admin/AdminLayout", () => ({
  AdminLayout: () => <div>Admin layout shell</div>,
}));

vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: () => ({
    data: {
      latest_email_campaigns: [
        { id: 1, sent_count: 10, title: "Campaign Mei", total_recipients: 20 },
      ],
      latest_inquiries: [
        {
          company: "PT Contoh",
          created_at: "2026-01-01T00:00:00.000Z",
          email: "budi@example.com",
          name: "Budi Santoso",
          status: "new",
        },
      ],
      totals: {
        active_portfolios: 4,
        completed_media: 5,
        email_campaigns: 6,
        failed_media: 1,
        inquiries: 2,
        pending_email_campaigns: 7,
        published_news: 3,
        whatsapp_leads: 8,
      },
    },
    error: null,
    loading: false,
    reload: vi.fn(),
  }),
}));

type MockRoute = {
  options: {
    component: () => ReactElement;
    head?: () => unknown;
  };
};

function renderRoute(route: MockRoute) {
  return renderToStaticMarkup(<route.options.component />);
}

describe("admin dashboard routes", () => {
  it("renders dashboard summary and admin route metadata", async () => {
    const [admin, dashboard, login] = await Promise.all([
      import("./admin"),
      import("./admin.index"),
      import("./login"),
    ]);

    expect(renderRoute(admin.Route as MockRoute)).toContain("Admin layout shell");
    expect((admin.Route as MockRoute).options.head?.()).toMatchObject({
      meta: expect.any(Array),
    });

    const output = renderRoute(dashboard.Route as MockRoute);

    expect(output).toContain("Selamat datang kembali");
    expect(output).toContain("Total Pesan Kontak");
    expect(output).toContain("2");
    expect(output).toContain("Prospek WhatsApp");
    expect(output).toContain("8");
    expect(output).toContain("Budi Santoso");
    expect(output).toContain("Campaign Mei");
    expect(output).toContain("10/20 terkirim");

    const loginOutput = renderRoute(login.Route as MockRoute);
    expect(loginOutput).toContain("Admin Indobraga");
    expect(loginOutput).toContain("Masuk ke Panel Admin");
    expect((login.Route as MockRoute).options.head?.()).toMatchObject({
      meta: expect.any(Array),
    });
  });
});
