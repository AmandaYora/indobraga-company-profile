// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareImageForUpload } from "./image-compression";

describe("prepareImageForUpload", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps unsupported image formats unchanged", async () => {
    const file = new File(["<svg />"], "icon.svg", { type: "image/svg+xml" });

    await expect(prepareImageForUpload(file)).resolves.toEqual({
      compressed: false,
      file,
      finalSize: file.size,
      originalSize: file.size,
    });
  });

  it("resizes and converts supported images to a smaller WebP before upload", async () => {
    const source = new File([new Uint8Array(1000)], "hero.png", {
      lastModified: 123,
      type: "image/png",
    });
    const close = vi.fn();
    const drawImage = vi.fn();
    const toBlob = vi.fn((callback: BlobCallback, type?: string, quality?: number) => {
      callback(new Blob([new Uint8Array(300)], { type }));
      expect(quality).toBe(0.82);
    });
    const canvas = {
      getContext: vi.fn(() => ({ drawImage })),
      height: 0,
      toBlob,
      width: 0,
    } as unknown as HTMLCanvasElement;

    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ close, height: 1500, width: 3000 }),
    );
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    const result = await prepareImageForUpload(source);

    expect(result.compressed).toBe(true);
    expect(result.originalSize).toBe(1000);
    expect(result.finalSize).toBe(300);
    expect(result.file.name).toBe("hero.png");
    expect(result.file.type).toBe("image/webp");
    expect(canvas.width).toBe(1920);
    expect(canvas.height).toBe(960);
    expect(drawImage).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it("keeps the original file when browser compression does not reduce size", async () => {
    const source = new File([new Uint8Array(400)], "small.webp", { type: "image/webp" });
    const close = vi.fn();
    const canvas = {
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      height: 0,
      toBlob: vi.fn((callback: BlobCallback, type?: string) => {
        callback(new Blob([new Uint8Array(500)], { type }));
      }),
      width: 0,
    } as unknown as HTMLCanvasElement;

    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ close, height: 400, width: 400 }),
    );
    vi.spyOn(document, "createElement").mockReturnValue(canvas);

    const result = await prepareImageForUpload(source);

    expect(result).toEqual({
      compressed: false,
      file: source,
      finalSize: source.size,
      originalSize: source.size,
    });
    expect(close).toHaveBeenCalled();
  });
});
