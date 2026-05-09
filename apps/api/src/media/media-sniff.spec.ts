import { sniffMedia } from "@/media/media-sniff";

describe("sniffMedia", () => {
  it("detects PNG signature", () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(sniffMedia(buffer)).toEqual({
      kind: "image",
      mimeType: "image/png",
      extension: "png",
    });
  });

  it("detects JPEG signature", () => {
    expect(sniffMedia(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toEqual({
      kind: "image",
      mimeType: "image/jpeg",
      extension: "jpg",
    });
  });

  it("detects WebP signature", () => {
    expect(sniffMedia(Buffer.from("RIFFxxxxWEBP", "ascii"))).toEqual({
      kind: "image",
      mimeType: "image/webp",
      extension: "webp",
    });
  });

  it("detects MP4 ftyp signature", () => {
    const buffer = Buffer.concat([Buffer.from([0, 0, 0, 0]), Buffer.from("ftypisom", "ascii")]);

    expect(sniffMedia(buffer)).toEqual({
      kind: "video",
      mimeType: "video/mp4",
      extension: "mp4",
    });
  });

  it("returns null for unsupported signatures", () => {
    expect(sniffMedia(Buffer.from("not media"))).toBeNull();
  });
});
