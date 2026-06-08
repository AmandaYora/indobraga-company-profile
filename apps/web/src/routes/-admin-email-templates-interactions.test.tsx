// @vitest-environment jsdom
import { useState, type ReactElement, type ReactNode } from "react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { EmailContentEditor } from "@/components/admin/EmailContentEditor";
import type { ContentMode } from "./-admin.email-blast.helpers";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const state = vi.hoisted(() => ({
  reload: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  templateCreate: vi.fn(),
  templateUpdate: vi.fn(),
  templateRemove: vi.fn(),
  createDraft: vi.fn(),
  send: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: state.toastSuccess, error: state.toastError },
}));

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");

  return {
    createFileRoute: () => (options: unknown) => ({ options, useSearch: () => ({ tab: "single" }) }),
    useNavigate: () => vi.fn(),
    Link: ({ children }: { children: ReactNode }) => React.createElement("a", null, children),
  };
});

vi.mock("@/components/ui/dialog", async () => {
  const React = await import("react");
  const pass =
    (tag: string) =>
    ({ children, className }: { children?: ReactNode; className?: string }) =>
      React.createElement(tag, { className }, children);
  return {
    Dialog: ({ children, open }: { children: ReactNode; open: boolean }) =>
      open ? React.createElement("div", { "data-testid": "dialog" }, children) : null,
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
      open ? React.createElement("div", { "data-testid": "alert-dialog" }, children) : null,
    AlertDialogAction: ({ children, onClick }: { children?: ReactNode; onClick?: () => void }) =>
      React.createElement("button", { onClick, type: "button" }, children),
    AlertDialogCancel: ({ children }: { children?: ReactNode }) =>
      React.createElement("button", { type: "button" }, children),
    AlertDialogContent: pass("div"),
    AlertDialogDescription: pass("p"),
    AlertDialogFooter: pass("footer"),
    AlertDialogHeader: pass("header"),
    AlertDialogTitle: pass("h2"),
  };
});

vi.mock("@/components/ui/dropdown-menu", async () => {
  const React = await import("react");
  return {
    DropdownMenu: ({ children }: { children: ReactNode }) =>
      React.createElement("div", null, children),
    DropdownMenuContent: ({ children }: { children: ReactNode }) =>
      React.createElement("div", null, children),
    DropdownMenuTrigger: ({ children }: { children: ReactElement }) => children,
    DropdownMenuItem: ({ children, onSelect }: { children: ReactNode; onSelect?: () => void }) =>
      React.createElement("button", { onClick: onSelect, type: "button" }, children),
  };
});

vi.mock("@/hooks/use-api-query", () => ({
  getErrorMessage: (error: unknown) => (error instanceof Error ? error.message : String(error)),
  useApiQuery: (key: readonly unknown[]) => {
    const second = String(key[1]);
    if (second === "email-accounts") {
      return { data: pageList([account()]), error: null, loading: false, reload: state.reload };
    }
    if (second === "email-templates") {
      return { data: pageList([template()]), error: null, loading: false, reload: state.reload };
    }
    return { data: null, error: null, loading: false, reload: state.reload };
  },
}));

vi.mock("@/lib/api-services", () => ({
  adminEmailAccountsApi: { list: vi.fn() },
  adminEmailCampaignApi: { createDraft: state.createDraft, send: state.send },
  adminEmailTemplateApi: {
    list: vi.fn(),
    create: state.templateCreate,
    update: state.templateUpdate,
    remove: state.templateRemove,
  },
}));

function pageList<T>(items: T[]) {
  return {
    items,
    pagination: { limit: 10, page: 1, total: items.length, total_pages: 1 },
  };
}

function account() {
  return { id: 5, display_name: "Marketing", email_address: "marketing@indobraga.com" };
}

function template() {
  return {
    id: 7,
    name: "Sapaan Awal",
    subject: "Terima kasih {{nama}}",
    content_mode: "text" as ContentMode,
    body_text: "Halo {{nama}}",
    body_html: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(element));
  return { container, root };
}

async function click(element: Element | null | undefined) {
  if (!element) {
    throw new Error("Element not found");
  }
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await Promise.resolve();
  });
}

async function setValue(element: Element | null, value: string) {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    throw new Error("Form element not found");
  }
  const prototype =
    element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  await act(async () => {
    setter?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    await Promise.resolve();
  });
}

function buttonByText(container: HTMLElement, text: string) {
  return (
    Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === text,
    ) ?? null
  );
}

function buttonIncludes(container: HTMLElement, text: string) {
  return (
    Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(text),
    ) ?? null
  );
}

let mounted: { root: Root; container: HTMLElement } | undefined;

beforeEach(() => {
  for (const value of Object.values(state)) {
    if (typeof value === "function" && "mockReset" in value) {
      value.mockReset();
    }
  }
  state.templateCreate.mockResolvedValue({ id: 9 });
  state.templateUpdate.mockResolvedValue({ id: 7 });
  state.templateRemove.mockResolvedValue({ id: 7, status: "deleted" });
});

afterEach(() => {
  if (mounted) {
    act(() => mounted?.root.unmount());
    mounted.container.remove();
    mounted = undefined;
  }
});

function EditorHarness() {
  const [mode, setMode] = useState<ContentMode>("text");
  const [text, setText] = useState("");
  const [html, setHtml] = useState("");
  return (
    <EmailContentEditor
      mode={mode}
      bodyText={text}
      bodyHtml={html}
      onModeChange={setMode}
      onBodyTextChange={setText}
      onBodyHtmlChange={setHtml}
      variables={["nama", "email", "perusahaan"]}
    />
  );
}

describe("email content editor and template management", () => {
  it("toggles between text and HTML modes with an HTML preview", async () => {
    mounted = render(<EditorHarness />);
    const { container } = mounted;

    expect(container.textContent).toContain("Variabel tersedia");
    expect(container.textContent).toContain("{{perusahaan}}");
    expect(container.querySelector("textarea")?.getAttribute("placeholder")).toContain("Halo");

    await click(buttonByText(container, "HTML"));
    expect(container.textContent).toContain("Tulis HTML langsung");

    await setValue(container.querySelector("textarea"), "<p>Halo <b>Budi</b></p>");
    await click(buttonByText(container, "Pratinjau"));
    const preview = container.querySelector(".email-html-preview");
    expect(preview?.innerHTML).toContain("<b>Budi</b>");

    await click(buttonByText(container, "Edit HTML"));
    expect(container.querySelector("textarea")).not.toBeNull();
  });

  it("edits and deletes a template from Kelola Template", async () => {
    const { Route } = await import("./admin.email-templates");
    const Page = (Route as { options: { component: () => ReactElement } }).options.component;
    mounted = render(<Page />);
    const { container } = mounted;

    expect(container.textContent).toContain("Kelola Template");
    expect(container.textContent).toContain("Sapaan Awal");

    await click(container.querySelector('button[aria-label="Sunting template Sapaan Awal"]'));
    expect(container.querySelector('[data-testid="dialog"]')).not.toBeNull();
    await setValue(
      Array.from(container.querySelectorAll("input")).find((input) =>
        input.value.includes("Sapaan Awal"),
      ) ?? null,
      "Sapaan Diperbarui",
    );
    await click(buttonByText(container, "Simpan"));
    expect(state.templateUpdate).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ name: "Sapaan Diperbarui", content_mode: "text" }),
    );

    await click(container.querySelector('button[aria-label="Hapus template Sapaan Awal"]'));
    await click(buttonIncludes(container, "Hapus"));
    expect(state.templateRemove).toHaveBeenCalledWith(7);
  });

  it("saves and applies templates from Kirim Email", async () => {
    const { Route } = await import("./admin.email-blast");
    const Page = (Route as { options: { component: () => ReactElement } }).options.component;
    mounted = render(<Page />);
    const { container } = mounted;

    // Saving with empty content is blocked.
    await click(buttonByText(container, "Simpan sebagai Template"));
    expect(state.toastError).toHaveBeenCalled();

    // Applying a saved template fills the form.
    await click(buttonIncludes(container, "Sapaan Awal"));
    expect(state.toastSuccess).toHaveBeenCalledWith(
      expect.stringContaining("Sapaan Awal"),
      expect.anything(),
    );

    // Fill content then save as a new template.
    await setValue(
      Array.from(container.querySelectorAll("input")).find(
        (input) => input.getAttribute("placeholder") === "Tulis subjek email...",
      ) ?? null,
      "Promo Akhir Tahun",
    );
    await setValue(container.querySelector("textarea"), "Halo {{nama}}");
    await click(buttonByText(container, "Simpan sebagai Template"));
    await setValue(
      Array.from(container.querySelectorAll("input")).find(
        (input) => input.getAttribute("placeholder") === "Mis. Follow-up Pesan Kontak",
      ) ?? null,
      "Template Promo",
    );
    await click(buttonByText(container, "Simpan Template"));
    expect(state.templateCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Template Promo", subject: "Promo Akhir Tahun" }),
    );

    // Switching to the Massal tab reveals the Excel template download.
    await click(buttonByText(container, "Massal"));
    expect(container.textContent).toContain("Daftar Penerima (Excel)");
  });
});
