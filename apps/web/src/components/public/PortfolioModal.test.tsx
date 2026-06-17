// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortfolioModal } from "@/components/public/PortfolioModal";
import type { PublicPortfolioItem } from "@/lib/api-models";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const multiImageItem: PublicPortfolioItem = {
  id: 1,
  title: "Jersey Klub",
  slug: "jersey-klub",
  category: "Jersey",
  short_description: "Produksi jersey untuk klub.",
  medium_url: "cover.webp",
  images: [
    { thumbnail_url: "a-thumb.webp", medium_url: "a-med.webp", large_url: "a-large.webp" },
    { thumbnail_url: "b-thumb.webp", medium_url: "b-med.webp", large_url: "b-large.webp" },
    { thumbnail_url: "c-thumb.webp", medium_url: "c-med.webp", large_url: "c-large.webp" },
  ],
};

function findButton(label: string) {
  return Array.from(document.body.querySelectorAll("button")).find(
    (button) => button.getAttribute("aria-label") === label,
  );
}

describe("PortfolioModal", () => {
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

  it("shows info and cycles a multi-image carousel with the counter", async () => {
    await act(async () => {
      root.render(<PortfolioModal item={multiImageItem} onClose={vi.fn()} />);
    });

    expect(document.body.textContent).toContain("Jersey Klub");
    expect(document.body.textContent).toContain("Jersey");
    expect(document.body.textContent).toContain("Produksi jersey untuk klub.");
    expect(document.body.textContent).toContain("1 / 3");

    // Dots: one per image.
    const dots = Array.from(document.body.querySelectorAll("button")).filter((button) =>
      button.getAttribute("aria-label")?.startsWith("Ke gambar"),
    );
    expect(dots).toHaveLength(3);

    await act(async () => {
      findButton("Gambar berikutnya")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(document.body.textContent).toContain("2 / 3");

    // Wraps around from the first image to the last via "previous".
    await act(async () => {
      findButton("Gambar sebelumnya")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(document.body.textContent).toContain("1 / 3");

    await act(async () => {
      findButton("Gambar sebelumnya")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(document.body.textContent).toContain("3 / 3");
  });

  it("jumps to a specific image when a dot is clicked", async () => {
    await act(async () => {
      root.render(<PortfolioModal item={multiImageItem} onClose={vi.fn()} />);
    });

    await act(async () => {
      findButton("Ke gambar 3")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(document.body.textContent).toContain("3 / 3");
  });

  it("falls back to the cover image and hides nav when there is a single image", async () => {
    const singleImageItem: PublicPortfolioItem = {
      id: 2,
      title: "Polo Resmi",
      slug: "polo-resmi",
      category: "Polo",
      medium_url: "cover-polo.webp",
      thumbnail_url: "cover-polo-thumb.webp",
      images: [],
    };

    await act(async () => {
      root.render(<PortfolioModal item={singleImageItem} onClose={vi.fn()} />);
    });

    expect(document.body.textContent).toContain("Polo Resmi");
    expect(findButton("Gambar berikutnya")).toBeUndefined();
    expect(document.body.textContent).not.toContain("1 / 1");
  });

  it("calls onClose when the close button is activated", async () => {
    const onClose = vi.fn();
    await act(async () => {
      root.render(<PortfolioModal item={multiImageItem} onClose={onClose} />);
    });

    await act(async () => {
      findButton("Tutup")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onClose).toHaveBeenCalled();
  });

  it("renders nothing while closed", async () => {
    await act(async () => {
      root.render(<PortfolioModal item={null} onClose={vi.fn()} />);
    });

    expect(findButton("Tutup")).toBeUndefined();
  });
});
