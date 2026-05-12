// @vitest-environment jsdom
import type { ReactElement, ReactNode } from "react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoot, type Root } from "react-dom/client";

(
  globalThis as typeof globalThis & {
    IS_REACT_ACT_ENVIRONMENT?: boolean;
  }
).IS_REACT_ACT_ENVIRONMENT = true;

const state = vi.hoisted(() => ({
  createRouter: vi.fn((config) => ({ config, kind: "router" })),
  invalidate: vi.fn(),
  leadCreate: vi.fn(),
  reset: vi.fn(),
  toastError: vi.fn(),
  windowOpen: vi.fn(),
}));

vi.mock("@tanstack/react-router", async () => {
  const React = await import("react");

  return {
    createFileRoute: (path: string) => (options: { component: () => ReactElement }) => ({
      options,
      path,
    }),
    createRootRoute: (options: Record<string, unknown>) => ({ options }),
    createRouter: state.createRouter,
    HeadContent: () => React.createElement("title", null, "Head"),
    Link: ({ children, to, ...props }: { children: ReactNode; to: string }) =>
      React.createElement("a", { href: to, ...props }, children),
    Outlet: () => React.createElement("section", null, "Outlet Content"),
    Scripts: () => React.createElement("script", { "data-testid": "scripts" }),
    useRouter: () => ({ invalidate: state.invalidate }),
  };
});

vi.mock("../routeTree.gen", () => ({
  routeTree: { id: "root-tree" },
}));

vi.mock("@/components/ui/sonner", async () => {
  const React = await import("react");

  return {
    Toaster: (props: Record<string, unknown>) =>
      React.createElement("div", { "data-position": props.position }, "Toaster"),
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: state.toastError,
  },
}));

vi.mock("@/hooks/use-api-query", () => ({
  useApiQuery: (
    _key: readonly unknown[],
    _load: () => unknown,
    options?: { initialData?: unknown },
  ) => ({
    data: options?.initialData,
    error: null,
    loading: false,
    reload: vi.fn(),
  }),
}));

vi.mock("@/lib/api-services", () => ({
  publicContentApi: {
    siteSettings: vi.fn(),
  },
  publicLeadApi: {
    createWhatsAppLead: state.leadCreate,
  },
}));

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
  if (!(element instanceof HTMLInputElement)) {
    throw new Error("Input not found");
  }

  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(element, value);

  await act(async () => {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve();
  });
}

async function submit(form: Element | null) {
  if (!form) {
    throw new Error("Form not found");
  }

  await act(async () => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

type MockRoute = {
  options: {
    component: () => ReactElement;
    head?: () => {
      links?: unknown[];
      meta?: unknown[];
      scripts?: unknown[];
    };
    notFoundComponent?: () => ReactElement;
    shellComponent?: (props: { children: ReactNode }) => ReactElement;
  };
};

let mounted: { unmount: () => void; root: Root; container: HTMLElement } | undefined;

beforeEach(() => {
  for (const value of Object.values(state)) {
    if (typeof value === "function" && "mockReset" in value) {
      value.mockReset();
    }
  }
  state.createRouter.mockImplementation((config) => ({ config, kind: "router" }));
  state.windowOpen.mockReturnValue(null);
  window.open = state.windowOpen;
});

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
  document.body.innerHTML = "";
});

describe("app shell and public interactions", () => {
  it("configures router and renders root route shell states", async () => {
    const [{ getRouter }, rootModule, publicModule] = await Promise.all([
      import("@/router"),
      import("./__root"),
      import("./_public"),
    ]);

    const router = getRouter();
    expect(state.createRouter).toHaveBeenCalledWith(
      expect.objectContaining({
        context: {},
        defaultErrorComponent: expect.any(Function),
        defaultPreloadStaleTime: 0,
        routeTree: { id: "root-tree" },
        scrollRestoration: true,
      }),
    );
    expect(router).toEqual(expect.objectContaining({ kind: "router" }));

    const root = rootModule.Route as MockRoute;
    const head = root.options.head?.();
    expect(head?.meta?.length).toBeGreaterThan(3);
    expect(head?.links?.length).toBeGreaterThan(2);
    expect(head?.scripts?.length).toBeGreaterThan(1);

    mounted = render(root.options.shellComponent?.({ children: <main>Konten</main> }) ?? <></>);
    expect(mounted.container.textContent).toContain("Konten");
    mounted.unmount();

    mounted = render(root.options.component());
    expect(mounted.container.textContent).toContain("Outlet Content");
    expect(mounted.container.textContent).toContain("Toaster");
    mounted.unmount();

    mounted = render(root.options.notFoundComponent?.() ?? <></>);
    expect(mounted.container.textContent).toContain("404");
    expect(mounted.container.textContent).toContain("Kembali ke beranda");
    mounted.unmount();

    const publicRoute = publicModule.Route as MockRoute;
    mounted = render(<publicRoute.options.component />);
    expect(mounted.container.textContent).toContain("Outlet Content");
    expect(mounted.container.textContent).toContain("Indobraga");
  });

  it("renders default error component and retries through router invalidation", async () => {
    const { DefaultErrorComponent } = await import("@/components/DefaultErrorComponent");

    mounted = render(<DefaultErrorComponent error={new Error("Boom")} reset={state.reset} />);
    expect(mounted.container.textContent).toContain("Terjadi kesalahan");
    expect(mounted.container.textContent).toContain("Boom");

    await click(mounted.container.querySelector("button"));
    expect(state.invalidate).toHaveBeenCalled();
    expect(state.reset).toHaveBeenCalled();
  });

  it("submits WhatsApp FAB leads and falls back to direct WhatsApp URL on API failure", async () => {
    const { WhatsAppFAB } = await import("@/components/public/WhatsAppFAB");
    const { SiteSettingsContext, fallbackSettings } =
      await import("@/components/public/site-settings");

    state.leadCreate.mockResolvedValueOnce({ whatsapp_url: "https://wa.me/success" });
    mounted = render(
      <SiteSettingsContext.Provider value={{ ...fallbackSettings, whatsapp: "628123" }}>
        <WhatsAppFAB />
      </SiteSettingsContext.Provider>,
    );

    await click(mounted.container.querySelector('button[aria-label="Hubungi via WhatsApp"]'));
    await change(mounted.container.querySelector('input[placeholder="Nama Anda"]'), "Dimas");
    await change(mounted.container.querySelector('input[placeholder="08xxxxxxxxxx"]'), "08123");
    await submit(mounted.container.querySelector("form"));

    expect(state.leadCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Dimas", phone: "08123" }),
    );
    expect(state.windowOpen).toHaveBeenCalledWith("https://wa.me/success", "_blank");
    expect(mounted.container.textContent).not.toContain("Chat via WhatsApp");
    mounted.unmount();

    state.leadCreate.mockRejectedValueOnce(new Error("API mati"));
    mounted = render(
      <SiteSettingsContext.Provider value={{ ...fallbackSettings, whatsapp: "628123" }}>
        <WhatsAppFAB />
      </SiteSettingsContext.Provider>,
    );

    await click(mounted.container.querySelector('button[aria-label="Hubungi via WhatsApp"]'));
    await change(mounted.container.querySelector('input[placeholder="Nama Anda"]'), "Ayu");
    await change(mounted.container.querySelector('input[placeholder="08xxxxxxxxxx"]'), "08999");
    await submit(mounted.container.querySelector("form"));

    expect(state.windowOpen).toHaveBeenLastCalledWith(
      expect.stringContaining("https://wa.me/628123"),
      "_blank",
    );
    expect(state.toastError).toHaveBeenCalledWith("Prospek WhatsApp belum tersimpan", {
      description: "API mati",
    });
  });

  it("tracks mobile breakpoint changes", async () => {
    const listeners = new Set<() => void>();
    const removeEventListener = vi.fn((_event: string, listener: () => void) => {
      listeners.delete(listener);
    });

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    window.matchMedia = vi.fn(() => ({
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      dispatchEvent: vi.fn(),
      matches: false,
      media: "",
      onchange: null,
      removeEventListener,
    })) as unknown as typeof window.matchMedia;

    const { useIsMobile } = await import("@/hooks/use-mobile");

    function Probe() {
      return <span>{useIsMobile() ? "mobile" : "desktop"}</span>;
    }

    mounted = render(<Probe />);
    await flush();
    expect(mounted.container.textContent).toBe("desktop");

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 });
    await act(async () => {
      for (const listener of listeners) {
        listener();
      }
      await Promise.resolve();
    });
    expect(mounted.container.textContent).toBe("mobile");

    mounted.unmount();
    expect(removeEventListener).toHaveBeenCalled();
  });
});
