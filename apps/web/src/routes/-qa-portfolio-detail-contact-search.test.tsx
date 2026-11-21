// @vitest-environment jsdom
import type { ReactElement, ReactNode } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  navigate: vi.fn(),
  search: vi.fn(),
  portfolioDetail: vi.fn(),
  createInquiry: vi.fn(),
  loaderData: undefined as unknown,
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: (path: string) => (options: Record<string, unknown>) => ({
    options,
    path,
    useLoaderData: () => state.loaderData,
  }),
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  notFound: () => ({ isNotFound: true }),
  useNavigate: () => state.navigate,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock("@/lib/api-services", () => ({
  adminSearchApi: { search: state.search },
  publicContentApi: { portfolioDetail: state.portfolioDetail, siteSettings: vi.fn() },
  publicLeadApi: { createInquiry: state.createInquiry },
}));

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.clearAllMocks();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

async function setValue(element: Element | null, value: string) {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
    throw new Error("Field not found");
  }
  const proto = element instanceof HTMLInputElement ? HTMLInputElement : HTMLTextAreaElement;
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto.prototype, "value")?.set?.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function click(element: Element | null) {
  if (!element) {
    throw new Error("Element not found");
  }
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}

type RouteModule = {
  Route: {
    options: {
      component: () => ReactElement;
      loader?: (ctx: { params: Record<string, string> }) => Promise<unknown>;
      head?: (ctx: { params: Record<string, string>; loaderData?: unknown }) => {
        meta?: Array<Record<string, string>>;
      };
    };
  };
};

const detail = {
  id: 1,
  title: "Jersey Klub",
  slug: "jersey-klub",
  category: "Jersey",
  thumbnail_url: "/t.jpg",
  medium_url: "/m.jpg",
  alt_text: "Jersey Klub",
  short_description: "Jersey custom full sublim.",
  images: [
    { thumbnail_url: "/a-t.jpg", medium_url: "/a-m.jpg", large_url: "/a-l.jpg", alt_text: "A" },
    { thumbnail_url: "/b-t.jpg", medium_url: "/b-m.jpg", large_url: "/b-l.jpg", alt_text: "B" },
  ],
  seo: {
    title: "Jersey Klub Custom - Indobraga",
    description: "Deskripsi SEO jersey",
    og_image_url: "/og.jpg",
  },
};

describe("portfolio detail route (QA IB-14/IB-15)", () => {
  it("renders the item and cycles through its gallery", async () => {
    state.loaderData = detail;
    const { Route } = (await import("./_public.portfolio_.$slug")) as unknown as RouteModule;
    const Page = Route.options.component;

    await act(async () => {
      root.render(<Page />);
    });

    expect(container.querySelector("h1")?.textContent).toBe("Jersey Klub");
    expect(container.textContent).toContain("Jersey custom full sublim.");
    expect(container.textContent).toContain("1 / 2");

    await click(container.querySelector('button[aria-label="Gambar berikutnya"]'));
    expect(container.textContent).toContain("2 / 2");
    await click(container.querySelector('button[aria-label="Gambar berikutnya"]'));
    expect(container.textContent).toContain("1 / 2");
    await click(container.querySelector('button[aria-label="Gambar sebelumnya"]'));
    expect(container.textContent).toContain("2 / 2");
    await click(container.querySelector('button[aria-label="Lihat gambar 1"]'));
    expect(container.textContent).toContain("1 / 2");
  });

  it("falls back to the cover image when there is no gallery", async () => {
    state.loaderData = { ...detail, images: [] };
    const { Route } = (await import("./_public.portfolio_.$slug")) as unknown as RouteModule;
    const Page = Route.options.component;

    await act(async () => {
      root.render(<Page />);
    });

    expect(container.querySelector('button[aria-label="Gambar berikutnya"]')).toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/m.jpg");
  });

  it("uses the SEO fields the editor filled in, with a noindex fallback", async () => {
    const { Route } = (await import("./_public.portfolio_.$slug")) as unknown as RouteModule;

    const seo = Route.options.head?.({ params: { slug: "jersey-klub" }, loaderData: detail });
    expect(JSON.stringify(seo)).toContain("Jersey Klub Custom - Indobraga");
    expect(JSON.stringify(seo)).toContain("Deskripsi SEO jersey");

    const missing = Route.options.head?.({ params: { slug: "tidak-ada" }, loaderData: undefined });
    expect(JSON.stringify(missing)).toContain("noindex");
  });

  it("turns an API 404 into a router not-found and rethrows other errors", async () => {
    const { ApiClientError } = await import("@/lib/api");
    const { Route } = (await import("./_public.portfolio_.$slug")) as unknown as RouteModule;

    state.portfolioDetail.mockResolvedValueOnce(detail);
    await expect(Route.options.loader?.({ params: { slug: "jersey-klub" } })).resolves.toBe(detail);

    state.portfolioDetail.mockRejectedValueOnce(
      new ApiClientError({ code: "NOT_FOUND", message: "x", status: 404 }),
    );
    await expect(Route.options.loader?.({ params: { slug: "slug-acak" } })).rejects.toEqual({
      isNotFound: true,
    });

    const boom = new ApiClientError({ code: "INTERNAL_ERROR", message: "x", status: 500 });
    state.portfolioDetail.mockRejectedValueOnce(boom);
    await expect(Route.options.loader?.({ params: { slug: "x" } })).rejects.toBe(boom);
  });
});

describe("contact page form (QA IB-10/IB-16)", () => {
  const settings = {
    brand: "Indobraga",
    legal_name: "PT. Braga Indonesia Perkasa",
    email: "indobraga@gmail.com",
    phone: "0852-2300-0039",
    whatsapp: "6285223000039",
    instagram: "indobraga",
    contact_person: "Mahardika",
    contact_role: "Tim Marketing",
    address: "Bandung",
    contact_hero_image_url: null,
  };

  it("shows contact details as real links", async () => {
    state.loaderData = settings;
    const { Route } = (await import("./_public.kontak")) as unknown as RouteModule;
    const Page = Route.options.component;

    await act(async () => {
      root.render(<Page />);
    });

    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("mailto:indobraga@gmail.com");
    expect(hrefs).toContain("tel:085223000039");
    expect(hrefs).toContain("https://wa.me/6285223000039");
    expect(hrefs).toContain("https://instagram.com/indobraga");
  });

  it("marks every empty required field and does not call the API", async () => {
    state.loaderData = settings;
    const { Route } = (await import("./_public.kontak")) as unknown as RouteModule;
    const Page = Route.options.component;
    await act(async () => {
      root.render(<Page />);
    });

    const form = container.querySelector("form") as HTMLFormElement;
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(state.createInquiry).not.toHaveBeenCalled();
    expect(form.querySelectorAll('[aria-invalid="true"]')).toHaveLength(4);
    expect(form.textContent).toContain("Nama wajib diisi");
    expect(form.textContent).toContain("Email wajib diisi");
    expect(form.textContent).toContain("Nomor telepon wajib diisi");
    expect(form.textContent).toContain("Pesan wajib diisi");
    // each label is wired to its control
    for (const label of form.querySelectorAll("label[for]")) {
      expect(document.getElementById((label as HTMLLabelElement).htmlFor)).not.toBeNull();
    }
  });

  it("rejects a malformed phone/email, then sends a valid message", async () => {
    state.loaderData = settings;
    state.createInquiry.mockResolvedValue({ id: 1, status: "new" });
    const { Route } = (await import("./_public.kontak")) as unknown as RouteModule;
    const Page = Route.options.component;
    await act(async () => {
      root.render(<Page />);
    });
    const form = container.querySelector("form") as HTMLFormElement;
    const submit = async () =>
      act(async () => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });

    await setValue(form.querySelector('input[name="name"]'), "Budi");
    await setValue(form.querySelector('input[name="email"]'), "bukan-email");
    await setValue(form.querySelector('input[name="phone"]'), "0812");
    await setValue(
      form.querySelector('textarea[name="message"]'),
      "Saya ingin konsultasi produksi.",
    );
    await submit();

    expect(state.createInquiry).not.toHaveBeenCalled();
    expect(form.textContent).toContain("Format email belum valid");
    expect(form.textContent).toContain("Nomor telepon belum valid");

    await setValue(form.querySelector('input[name="email"]'), "budi@example.com");
    await setValue(form.querySelector('input[name="phone"]'), "0812-3456-7890");
    await submit();

    expect(state.createInquiry).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Budi", email: "budi@example.com", phone: "0812-3456-7890" }),
    );
    expect(container.textContent).toContain("Pesan berhasil dikirim");
  });
});

describe("AdminGlobalSearch (QA IB-04)", () => {
  it("searches as you type, lists grouped hits and opens the chosen one filtered", async () => {
    vi.useFakeTimers();
    state.search.mockResolvedValue({
      query: "Persib",
      total: 2,
      groups: [
        {
          key: "news",
          label: "Berita",
          items: [{ id: 5, title: "Persib Juara", subtitle: "Berita", to: "/admin/news" }],
        },
        {
          key: "inquiries",
          label: "Pesan Kontak",
          items: [{ id: 9, title: "Budi", subtitle: "budi@example.com", to: "/admin/inquiries" }],
        },
      ],
    });
    const { AdminGlobalSearch } = await import("@/components/admin/AdminGlobalSearch");

    await act(async () => {
      root.render(<AdminGlobalSearch />);
    });
    const input = container.querySelector("input") as HTMLInputElement;

    // below the minimum length nothing is requested
    await setValue(input, "P");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(state.search).not.toHaveBeenCalled();

    await setValue(input, "Persib");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(state.search).toHaveBeenCalledWith("Persib");
    expect(container.textContent).toContain("Persib Juara");
    expect(container.textContent).toContain("Pesan Kontak");

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    });
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(state.navigate).toHaveBeenCalledWith({
      to: "/admin/inquiries",
      search: { q: "Persib" },
    });
  });

  it("shows an empty state and an error state", async () => {
    vi.useFakeTimers();
    const { AdminGlobalSearch } = await import("@/components/admin/AdminGlobalSearch");
    await act(async () => {
      root.render(<AdminGlobalSearch />);
    });
    const input = container.querySelector("input") as HTMLInputElement;

    state.search.mockResolvedValueOnce({ query: "zzz", total: 0, groups: [] });
    await setValue(input, "zzz");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(container.textContent).toContain("Tidak ada hasil");

    state.search.mockRejectedValueOnce(new Error("Koneksi bermasalah"));
    await setValue(input, "zzzz");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Koneksi bermasalah");

    await act(async () => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });
});
