import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (options: { component: () => ReactElement }) => ({
    options,
    path,
  }),
}));

vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: (key: readonly unknown[]) => {
    const scope = String(key[1]);

    if (scope === "site-settings") {
      return {
        data: {
          address: "Bandung",
          brand: "Indobraga",
          contact_hero_image_url: "/contact-hero.jpg",
          contact_hero_media_file_id: 6,
          contact_person: "Mahardika",
          contact_role: "Marketing",
          email: "support@example.com",
          instagram: "indobraga",
          legal_name: "PT Braga",
          logo_media_file_id: 7,
          logo_url: "/logo.webp",
          og_image_url: "/og.jpg",
          og_media_file_id: 5,
          phone: "0812",
          seo_description: "Deskripsi SEO",
          seo_title: "Judul SEO",
          whatsapp: "62812",
        },
        error: null,
        loading: false,
        reload: vi.fn(),
      };
    }

    return {
      data: {
        items: [
          {
            created_at: "2026-01-01T00:00:00.000Z",
            email: "super@example.com",
            id: 1,
            last_login_at: "2026-01-02T00:00:00.000Z",
            name: "Super Admin",
            role: "super_admin",
            status: "active",
          },
          {
            created_at: "2026-01-03T00:00:00.000Z",
            email: "editor@example.com",
            id: 2,
            last_login_at: null,
            name: "Content Editor",
            role: "content_editor",
            status: "inactive",
          },
        ],
        pagination: { limit: 10, page: 1, total: 2, total_pages: 1 },
      },
      error: null,
      loading: false,
      reload: vi.fn(),
    };
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

describe("admin page rendering", () => {
  it("renders settings and users admin pages from query state", async () => {
    const [settings, users] = await Promise.all([
      import("./admin.settings"),
      import("./admin.users"),
    ]);

    const output = [
      renderRoute(settings.Route as MockRoute),
      renderRoute(users.Route as MockRoute),
    ].join("\n");

    expect(output).toContain("Pengaturan Website");
    expect(output).toContain("Identitas Perusahaan");
    expect(output).toContain("Tampilan di Google &amp; Media Sosial");
    expect(output).toContain("Media Halaman");
    expect(output).toContain("Logo Website");
    expect(output).toContain("Gambar Utama Kontak");
    expect(output).toContain("Gambar Saat Dibagikan");
    expect(output).toContain("Pengguna");
    expect(output).toContain("Tambah Pengguna");
    expect(output).toContain("Admin Utama");
    expect(output).toContain("Editor Konten");
    expect(output).toContain("super@example.com");
    expect(output).toContain("editor@example.com");
    expect(output).toContain("Aktif");
    expect(output).toContain("Tidak Aktif");
  });
});
