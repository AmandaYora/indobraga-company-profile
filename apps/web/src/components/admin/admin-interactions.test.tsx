// @vitest-environment jsdom
import type { ReactElement, ReactNode } from "react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { ApiClientError } from "@/lib/api";

(
  globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }
).IS_REACT_ACT_ENVIRONMENT = true;

const state = vi.hoisted(() => ({
  authMode: "authenticated" as "authenticated" | "loading" | "api-error" | "unauthenticated",
  contentMode: "data" as "data" | "loading" | "error" | "empty",
  leadMode: "data" as "data" | "loading" | "error" | "empty",
  mediaMode: "data" as "data" | "loading" | "error" | "empty",
  mediaLibraryMode: "data" as "data" | "loading" | "error" | "empty",
  locationPath: "/admin/hero",
  navigate: vi.fn(),
  reload: vi.fn(),
  setData: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  contentCreate: vi.fn(),
  contentUpdate: vi.fn(),
  contentUpdateStatus: vi.fn(),
  contentRemove: vi.fn(),
  mediaList: vi.fn(),
  mediaUpload: vi.fn(),
  mediaRetry: vi.fn(),
  mediaRemove: vi.fn(),
  notificationsList: vi.fn(),
  markAllRead: vi.fn(),
  markRead: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: state.toastError,
    success: state.toastSuccess,
  },
}));

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");

  return {
    Link: ({ children, to, ...props }: { children: ReactNode; to: string }) =>
      React.createElement("a", { href: to, ...props }, children),
    Outlet: () => React.createElement("section", null, "Outlet Content"),
    useLocation: () => ({ pathname: state.locationPath }),
    useNavigate: () => state.navigate,
  };
});

vi.mock("@/components/ui/scroll-area", async () => {
  const React = await import("react");

  return {
    ScrollArea: ({ children, className }: { children: ReactNode; className?: string }) =>
      React.createElement("div", { className }, children),
  };
});

vi.mock("@/components/ui/dialog", async () => {
  const React = await import("react");
  const passthrough =
    (tag: string) =>
    ({ children, className }: { children?: ReactNode; className?: string }) =>
      React.createElement(tag, { className }, children);

  return {
    Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
      open ? React.createElement("div", { "data-testid": "dialog" }, children) : null,
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
      open ? React.createElement("div", { "data-testid": "alert-dialog" }, children) : null,
    AlertDialogAction: ({
      children,
      className,
      onClick,
    }: {
      children?: ReactNode;
      className?: string;
      onClick?: () => void;
    }) => React.createElement("button", { className, onClick, type: "button" }, children),
    AlertDialogCancel: ({ children }: { children?: ReactNode }) =>
      React.createElement("button", { type: "button" }, children),
    AlertDialogContent: passthrough("div"),
    AlertDialogDescription: passthrough("p"),
    AlertDialogFooter: passthrough("footer"),
    AlertDialogHeader: passthrough("header"),
    AlertDialogTitle: passthrough("h2"),
  };
});

vi.mock("@/components/ui/dropdown-menu", async () => {
  const React = await import("react");
  const DropdownContext = React.createContext<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }>({ open: false, onOpenChange: () => undefined });

  return {
    DropdownMenu: ({
      children,
      onOpenChange,
      open,
    }: {
      children: ReactNode;
      onOpenChange: (open: boolean) => void;
      open: boolean;
    }) =>
      React.createElement(DropdownContext.Provider, { value: { open, onOpenChange } }, children),
    DropdownMenuContent: ({ children, className }: { children: ReactNode; className?: string }) =>
      React.createElement("div", { className }, children),
    DropdownMenuTrigger: ({ children }: { children: ReactElement }) => {
      const ctx = React.useContext(DropdownContext);
      return React.cloneElement(children, {
        onClick: (event: MouseEvent) => {
          children.props.onClick?.(event);
          ctx.onOpenChange(!ctx.open);
        },
      });
    },
  };
});

vi.mock("@/hooks/use-api-query", () => ({
  getErrorMessage: (error: unknown) => (error instanceof Error ? error.message : String(error)),
  useApiQuery: (key: readonly unknown[]) => {
    const first = String(key[0]);
    const second = String(key[1]);

    if (first === "auth") {
      if (state.authMode === "loading") {
        return { data: null, error: null, loading: true, reload: state.reload };
      }

      if (state.authMode === "api-error") {
        return {
          data: null,
          error: new ApiClientError({ code: "SERVER_ERROR", message: "Sesi gagal dimuat" }),
          loading: false,
          reload: state.reload,
        };
      }

      if (state.authMode === "unauthenticated") {
        return {
          data: null,
          error: new ApiClientError({ code: "UNAUTHENTICATED", message: "Login dulu" }),
          loading: false,
          reload: state.reload,
        };
      }

      return {
        data: {
          user: { email: "admin@example.com", id: 1, name: "Dimas Admin", role: "super_admin" },
        },
        error: null,
        loading: false,
        reload: state.reload,
      };
    }

    if (first === "admin" && second === "notifications") {
      return {
        data: { unread_count: 2 },
        error: null,
        loading: false,
        reload: state.reload,
        setData: state.setData,
      };
    }

    if (first === "admin" && second === "media-library") {
      if (state.mediaLibraryMode === "loading") {
        return { data: null, error: null, loading: true, reload: state.reload };
      }
      if (state.mediaLibraryMode === "error") {
        return {
          data: null,
          error: new Error("Media gagal"),
          loading: false,
          reload: state.reload,
        };
      }
      return {
        data:
          state.mediaLibraryMode === "empty"
            ? pageList([])
            : pageList([
                mediaItem({ id: 20, compression_status: "failed", error: "Resize gagal" }),
                mediaItem({
                  id: 21,
                  compression_status: "completed",
                  file_url: null,
                  original_file_name: "video.mp4",
                  thumbnail_url: null,
                  media_type: "video",
                }),
              ]),
        error: null,
        loading: false,
        reload: state.reload,
      };
    }

    if (first === "admin-resource") {
      if (state.contentMode === "loading") {
        return { data: null, error: null, loading: true, reload: state.reload };
      }
      if (state.contentMode === "error") {
        return {
          data: null,
          error: new Error("Konten gagal dimuat"),
          loading: false,
          reload: state.reload,
        };
      }
      return {
        data:
          state.contentMode === "empty"
            ? pageList([])
            : pageList([
                {
                  active: true,
                  body: "Deskripsi utama",
                  category: "featured",
                  created_at: "2026-01-01T00:00:00.000Z",
                  id: 11,
                  image_media_id: 9,
                  order: 3,
                  paragraphs: ["Satu", "Dua"],
                  status: "published",
                  title: "Hero Produksi",
                  updated_at: "2026-01-01T00:00:00.000Z",
                },
                {
                  active: false,
                  body: "Tanpa media",
                  category: "regular",
                  created_at: "2026-01-02T00:00:00.000Z",
                  id: 12,
                  image_media_id: null,
                  order: 4,
                  paragraphs: [],
                  status: "draft",
                  title: "Hero Draft",
                  updated_at: "2026-01-02T00:00:00.000Z",
                },
              ]),
        error: null,
        loading: false,
        reload: state.reload,
      };
    }

    if (first === "admin-media") {
      return {
        data:
          state.mediaMode === "empty"
            ? pageList([])
            : pageList([mediaItem({ id: 9, original_file_name: "hero.jpg" })]),
        error: state.mediaMode === "error" ? new Error("Media preview gagal") : null,
        loading: state.mediaMode === "loading",
        reload: state.reload,
      };
    }

    if (first === "Leads") {
      if (state.leadMode === "loading") {
        return { data: null, error: null, loading: true, reload: state.reload };
      }
      if (state.leadMode === "error") {
        return { data: null, error: new Error("Lead gagal"), loading: false, reload: state.reload };
      }
      return {
        data:
          state.leadMode === "empty"
            ? pageList([])
            : pageList([
                {
                  created_at: "2026-01-01T00:00:00.000Z",
                  email: "buyer@example.com",
                  id: 31,
                  internal_note: "Hubungi pagi",
                  message: "Butuh seragam produksi",
                  name: "Buyer Satu",
                  phone: "0812",
                  status: "new",
                  updated_at: "2026-01-01T00:00:00.000Z",
                },
              ]),
        error: null,
        loading: false,
        reload: state.reload,
      };
    }

    return { data: null, error: null, loading: false, reload: state.reload };
  },
}));

vi.mock("@/lib/api-services", () => ({
  adminContentApi: {
    create: state.contentCreate,
    list: vi.fn(),
    remove: state.contentRemove,
    update: state.contentUpdate,
    updateStatus: state.contentUpdateStatus,
  },
  adminMediaApi: {
    list: state.mediaList,
    remove: state.mediaRemove,
    retry: state.mediaRetry,
    upload: state.mediaUpload,
  },
  adminNotificationsApi: {
    list: state.notificationsList,
    markAllRead: state.markAllRead,
    markRead: state.markRead,
    streamUrl: () => "/api/v1/admin/notifications/stream",
  },
  authApi: {
    logout: state.logout,
    me: vi.fn(),
  },
}));

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

function mediaItem(overrides: Record<string, unknown> = {}) {
  return {
    alt_text: "Hero",
    compression_status: "completed",
    created_at: "2026-01-01T00:00:00.000Z",
    error: null,
    file_url: "/hero.jpg",
    id: 9,
    media_type: "image",
    medium_url: "/hero-md.jpg",
    original_file_name: "hero.jpg",
    poster_url: null,
    thumbnail_url: "/hero-thumb.jpg",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(element);
  });

  return {
    container,
    root,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

async function click(element: Element | null) {
  if (!element) {
    throw new Error("Element not found");
  }

  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await Promise.resolve();
  });
}

async function change(element: Element | null, value: string) {
  if (
    !(
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    )
  ) {
    throw new Error("Form element not found");
  }

  const prototype =
    element instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLSelectElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;

  await act(async () => {
    valueSetter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve();
  });
}

async function uploadFile(element: Element | null, file: File) {
  if (!(element instanceof HTMLInputElement)) {
    throw new Error("File input not found");
  }

  Object.defineProperty(element, "files", {
    configurable: true,
    value: [file],
  });

  await act(async () => {
    element.dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve();
  });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function submitButton(container: HTMLElement) {
  return Array.from(container.querySelectorAll("button")).find((button) =>
    button.textContent?.includes("Simpan"),
  );
}

let mounted: { unmount: () => void; root: Root; container: HTMLElement } | undefined;

beforeEach(() => {
  state.authMode = "authenticated";
  state.contentMode = "data";
  state.leadMode = "data";
  state.mediaMode = "data";
  state.mediaLibraryMode = "data";
  state.locationPath = "/admin/hero";
  vi.useRealTimers();
  vi.setSystemTime?.(undefined);

  for (const value of Object.values(state)) {
    if (typeof value === "function" && "mockReset" in value) {
      value.mockReset();
    }
  }

  state.contentCreate.mockResolvedValue({ id: 41 });
  state.contentUpdate.mockResolvedValue({ id: 11 });
  state.contentUpdateStatus.mockResolvedValue({ id: 11, status: "draft" });
  state.contentRemove.mockResolvedValue({ id: 11 });
  state.mediaUpload.mockResolvedValue(mediaItem({ id: 30, original_file_name: "new.jpg" }));
  state.mediaRetry.mockResolvedValue({ id: 20 });
  state.mediaRemove.mockResolvedValue({ id: 20 });
  state.notificationsList.mockResolvedValue({
    items: [
      {
        created_at: new Date(Date.now()).toISOString(),
        id: 71,
        message: "Ada pesan kontak baru",
        read: false,
        resource_type: "inquiry",
        severity: "warning",
        title: "Lead Baru",
      },
    ],
  });
  state.markAllRead.mockResolvedValue({ unread_count: 0 });
  state.markRead.mockResolvedValue({ unread_count: 1 });
  state.logout.mockResolvedValue(undefined);
});

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("admin interactive components", () => {
  it("runs content manager list, create, edit, status, upload, and delete flows", async () => {
    const { AdminResourceManager } = await import("./AdminResourceManager");

    mounted = render(
      <AdminResourceManager
        resource="hero"
        title="Konten Hero"
        description="Kelola hero"
        addLabel="Tambah Hero"
        itemLabel="hero"
        imageField="image_media_id"
        defaultValues={{ category: "featured", order: 1 }}
        fields={[
          { name: "title", label: "Judul", type: "text", required: true },
          { name: "order", label: "Urutan", type: "number" },
          { name: "body", label: "Deskripsi", type: "textarea" },
          { name: "paragraphs", label: "Paragraf", type: "paragraphs" },
          {
            name: "category",
            label: "Kategori",
            type: "select",
            options: [
              { label: "Featured", value: "featured" },
              { label: "Regular", value: "regular" },
            ],
          },
          { name: "active", label: "Aktif", type: "checkbox" },
          { name: "image_media_id", label: "Gambar", type: "media", usage: "hero" },
        ]}
        columns={[
          { label: "Judul", value: (item) => item.title },
          { label: "Kategori", value: (item) => String(item.category) },
        ]}
        primaryText={(item) => item.title}
        secondaryText={(item) => `ID ${item.id}`}
      />,
    );

    expect(mounted.container.textContent).toContain("Konten Hero");
    expect(mounted.container.textContent).toContain("Hero Produksi");
    expect(mounted.container.querySelector("img")?.getAttribute("src")).toBe("/hero-thumb.jpg");

    await click(mounted.container.querySelector('button[aria-label="Ubah status Hero Produksi"]'));
    expect(state.contentUpdateStatus).toHaveBeenCalledWith("hero", 11, "draft");
    expect(state.toastSuccess).toHaveBeenCalledWith("Status diubah menjadi Draf");
    expect(state.reload).toHaveBeenCalled();

    await click(mounted.container.querySelector('button[aria-label="Ubah Hero Produksi"]'));
    expect(mounted.container.textContent).toContain("Ubah hero");
    let dialog = mounted.container.querySelector('[data-testid="dialog"]');
    await change(dialog?.querySelector('input[value="Hero Produksi"]'), "Hero Revisi");
    await change(dialog?.querySelector('input[type="number"]'), "8");
    await change(dialog?.querySelector("textarea"), "Deskripsi revisi");
    await uploadFile(
      dialog?.querySelector('input[type="file"]'),
      new File(["img"], "new.jpg", { type: "image/jpeg" }),
    );
    expect(state.mediaUpload).toHaveBeenCalledWith(expect.any(File), {
      alt_text: "new.jpg",
      usage: "hero",
    });
    expect(state.toastSuccess).toHaveBeenCalledWith("Media berhasil diunggah");
    await click(submitButton(mounted.container));
    expect(state.contentUpdate).toHaveBeenCalledWith(
      "hero",
      11,
      expect.objectContaining({ image_media_id: 30, order: 8, title: "Hero Revisi" }),
    );

    await click(
      Array.from(mounted.container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Tambah Hero"),
      ),
    );
    expect(mounted.container.textContent).toContain("Tambah Hero");
    dialog = mounted.container.querySelector('[data-testid="dialog"]');
    await change(dialog?.querySelector('input[type="text"]'), "Hero Baru");
    await click(submitButton(mounted.container));
    expect(state.contentCreate).toHaveBeenCalledWith(
      "hero",
      expect.objectContaining({ category: "featured", status: "draft", title: "Hero Baru" }),
    );

    await click(mounted.container.querySelector('button[aria-label="Hapus Hero Produksi"]'));
    expect(mounted.container.textContent).toContain('Hapus "Hero Produksi"?');
    await click(
      Array.from(mounted.container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Hapus"),
      ),
    );
    expect(state.contentRemove).toHaveBeenCalledWith("hero", 11);
  });

  it("renders content manager loading, error, and empty states", async () => {
    const { AdminResourceManager } = await import("./AdminResourceManager");

    const props = {
      addLabel: "Tambah",
      columns: [{ label: "Judul", value: (item: { title: string }) => item.title }],
      description: "Kelola",
      fields: [{ name: "title", label: "Judul", type: "text" as const }],
      itemLabel: "konten",
      primaryText: (item: { title: string }) => item.title,
      resource: "hero" as const,
      title: "Konten",
    };

    state.contentMode = "loading";
    mounted = render(<AdminResourceManager {...props} />);
    expect(mounted.container.textContent).toContain("Memuat konten");
    mounted.unmount();

    state.contentMode = "error";
    mounted = render(<AdminResourceManager {...props} />);
    expect(mounted.container.textContent).toContain("Konten gagal dimuat");
    mounted.unmount();

    state.contentMode = "empty";
    mounted = render(<AdminResourceManager {...props} />);
    expect(mounted.container.textContent).toContain("Tidak ada konten");
  });

  it("runs lead manager edit and archive flows", async () => {
    const { LeadManager } = await import("./LeadManager");
    const update = vi.fn().mockResolvedValue({ id: 31 });
    const archive = vi.fn().mockResolvedValue({ id: 31, status: "archived" });

    mounted = render(
      <LeadManager
        title="Leads"
        description="Kelola leads"
        itemLabel="lead"
        load={vi.fn()}
        update={update}
        archive={archive}
        getContact={(lead) => `${lead.email} / ${lead.phone}`}
        getMessage={(lead) => lead.message}
      />,
    );

    expect(mounted.container.textContent).toContain("Buyer Satu");
    expect(mounted.container.textContent).toContain("buyer@example.com / 0812");

    await click(mounted.container.querySelector('button[aria-label="Kelola lead Buyer Satu"]'));
    expect(mounted.container.textContent).toContain("Kelola Buyer Satu");
    const modalSelects = Array.from(mounted.container.querySelectorAll("select"));
    await change(modalSelects.at(-1) ?? null, "contacted");
    await change(mounted.container.querySelector("textarea"), "Sudah ditelepon");
    await click(submitButton(mounted.container));
    expect(update).toHaveBeenCalledWith(31, {
      internal_note: "Sudah ditelepon",
      status: "contacted",
    });
    expect(state.toastSuccess).toHaveBeenCalledWith("lead diperbarui");

    await click(mounted.container.querySelector('button[aria-label="Arsipkan lead Buyer Satu"]'));
    expect(mounted.container.textContent).toContain("Arsipkan Buyer Satu?");
    await click(
      Array.from(mounted.container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Arsipkan"),
      ),
    );
    expect(archive).toHaveBeenCalledWith(31);
  });

  it("renders lead loading, error, and empty states", async () => {
    const { LeadManager } = await import("./LeadManager");
    const props = {
      archive: vi.fn(),
      description: "Kelola leads",
      getContact: (lead: { email?: string; phone?: string }) => `${lead.email} ${lead.phone}`,
      getMessage: (lead: { message: string }) => lead.message,
      itemLabel: "lead",
      load: vi.fn(),
      title: "Leads",
      update: vi.fn(),
    };

    state.leadMode = "loading";
    mounted = render(<LeadManager {...props} />);
    expect(mounted.container.textContent).toContain("Memuat lead");
    mounted.unmount();

    state.leadMode = "error";
    mounted = render(<LeadManager {...props} />);
    expect(mounted.container.textContent).toContain("Lead gagal");
    mounted.unmount();

    state.leadMode = "empty";
    mounted = render(<LeadManager {...props} />);
    expect(mounted.container.textContent).toContain("Tidak ada lead");
  });

  it("runs media library retry and delete flows", async () => {
    const { MediaLibraryPanel } = await import("./MediaLibraryPanel");

    mounted = render(<MediaLibraryPanel />);

    expect(mounted.container.textContent).toContain("Media Library");
    expect(mounted.container.textContent).toContain("Resize gagal");
    expect(mounted.container.textContent).toContain("video");

    await click(mounted.container.querySelector('button[aria-label="Retry media hero.jpg"]'));
    expect(state.mediaRetry).toHaveBeenCalledWith(20);
    expect(state.toastSuccess).toHaveBeenCalledWith("Retry media dijalankan");

    await click(mounted.container.querySelector('button[aria-label="Hapus media hero.jpg"]'));
    expect(mounted.container.textContent).toContain("Hapus media hero.jpg?");
    await click(
      Array.from(mounted.container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Hapus"),
      ),
    );
    expect(state.mediaRemove).toHaveBeenCalledWith(20);
  });

  it("renders media library loading, error, and empty states", async () => {
    const { MediaLibraryPanel } = await import("./MediaLibraryPanel");

    state.mediaLibraryMode = "loading";
    mounted = render(<MediaLibraryPanel />);
    expect(mounted.container.textContent).toContain("Memuat media");
    mounted.unmount();

    state.mediaLibraryMode = "error";
    mounted = render(<MediaLibraryPanel />);
    expect(mounted.container.textContent).toContain("Media gagal");
    mounted.unmount();

    state.mediaLibraryMode = "empty";
    mounted = render(<MediaLibraryPanel />);
    expect(mounted.container.textContent).toContain("Belum ada media");
  });

  it("renders admin layout session states and authenticated navigation shell", async () => {
    const { AdminLayout } = await import("./AdminLayout");

    state.authMode = "loading";
    mounted = render(<AdminLayout />);
    expect(mounted.container.textContent).toContain("Memeriksa sesi admin");
    mounted.unmount();

    state.authMode = "api-error";
    mounted = render(<AdminLayout />);
    expect(mounted.container.textContent).toContain("Sesi gagal dimuat");
    mounted.unmount();

    state.authMode = "unauthenticated";
    mounted = render(<AdminLayout />);
    await flush();
    expect(state.navigate).toHaveBeenCalledWith({ to: "/login" });
    expect(mounted.container.textContent).toBe("");
    mounted.unmount();

    state.authMode = "authenticated";
    mounted = render(<AdminLayout />);
    expect(mounted.container.textContent).toContain("Admin Indobraga");
    expect(mounted.container.textContent).toContain("Dimas Admin");
    expect(mounted.container.textContent).toContain("Admin Utama");
    expect(mounted.container.textContent).toContain("Konten Beranda");

    await click(mounted.container.querySelector('button[aria-label="Notifikasi, 2 belum dibaca"]'));
    await flush();
    expect(state.notificationsList).toHaveBeenCalledWith({ limit: 10, read: "all" });
    expect(mounted.container.textContent).toContain("Lead Baru");

    await click(
      Array.from(mounted.container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Lead Baru"),
      ),
    );
    expect(state.markRead).toHaveBeenCalledWith(71);
    expect(state.navigate).toHaveBeenCalledWith({ to: "/admin/inquiries" });

    await click(
      mounted.container.querySelector(
        'button[aria-label="Tandai semua notifikasi sebagai dibaca"]',
      ),
    );
    expect(state.markAllRead).toHaveBeenCalled();
    expect(state.setData).toHaveBeenCalledWith({ unread_count: 0 });

    await click(
      Array.from(mounted.container.querySelectorAll("button")).find((button) =>
        button.textContent?.includes("Keluar"),
      ),
    );
    expect(state.logout).toHaveBeenCalled();
    expect(state.navigate).toHaveBeenCalledWith({ to: "/login" });
  });
});
