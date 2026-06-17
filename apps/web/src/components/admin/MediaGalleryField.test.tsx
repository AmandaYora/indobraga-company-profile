// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaGalleryField } from "@/components/admin/MediaGalleryField";
import type { AdminMedia } from "@/lib/api-models";

vi.mock("@/lib/api-services", () => ({ adminMediaApi: { upload: vi.fn() } }));
vi.mock("@/lib/image-compression", () => ({ prepareImageForUpload: vi.fn() }));
vi.mock("@/hooks/use-api-query", () => ({ getErrorMessage: vi.fn(() => "err") }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { adminMediaApi } from "@/lib/api-services";
import { prepareImageForUpload } from "@/lib/image-compression";

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const media = (id: number): AdminMedia => ({
  id,
  media_type: "image",
  mime_type: "image/webp",
  original_file_name: `file-${id}.webp`,
  compression_status: "completed",
  thumbnail_url: `thumb-${id}.webp`,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
});

function buttonsByLabel(container: HTMLElement, label: string) {
  return Array.from(container.querySelectorAll("button")).filter(
    (button) => button.getAttribute("aria-label") === label,
  );
}

describe("MediaGalleryField", () => {
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

  it("renders thumbnails, marks the first as cover, and shows the remaining count", async () => {
    await act(async () => {
      root.render(
        <MediaGalleryField
          usage="portfolio"
          max={10}
          ids={[1, 2]}
          previews={[media(1), media(2)]}
          onChange={vi.fn()}
        />,
      );
    });

    expect(container.querySelectorAll("li img")).toHaveLength(2);
    expect(container.textContent).toContain("Sampul");
    expect(container.textContent).toContain("Sisa 8 dari 10");
  });

  it("reorders images when the move button is used", async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(
        <MediaGalleryField
          usage="portfolio"
          ids={[1, 2]}
          previews={[media(1), media(2)]}
          onChange={onChange}
        />,
      );
    });

    await act(async () => {
      buttonsByLabel(container, "Geser ke kanan")[0]!.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(onChange).toHaveBeenCalledWith([2, 1], [media(2), media(1)]);
  });

  it("removes an image when the remove button is used", async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(
        <MediaGalleryField
          usage="portfolio"
          ids={[1, 2]}
          previews={[media(1), media(2)]}
          onChange={onChange}
        />,
      );
    });

    await act(async () => {
      buttonsByLabel(container, "Hapus gambar")[1]!.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(onChange).toHaveBeenCalledWith([1], [media(1)]);
  });

  it("uploads a selected file and appends it to the gallery", async () => {
    const uploaded = media(99);
    vi.mocked(prepareImageForUpload).mockResolvedValue({
      file: new File(["x"], "photo.webp", { type: "image/webp" }),
    } as Awaited<ReturnType<typeof prepareImageForUpload>>);
    vi.mocked(adminMediaApi.upload).mockResolvedValue(uploaded);
    const onChange = vi.fn();

    await act(async () => {
      root.render(
        <MediaGalleryField
          usage="portfolio"
          ids={[1]}
          previews={[media(1)]}
          onChange={onChange}
        />,
      );
    });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "new.png", { type: "image/png" });
    Object.defineProperty(input, "files", { value: [file], configurable: true });

    await act(async () => {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(adminMediaApi.upload).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith([1, 99], [media(1), uploaded]);
  });
});
