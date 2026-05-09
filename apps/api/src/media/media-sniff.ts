export type SniffedMedia = {
  kind: "image" | "video";
  mimeType: string;
  extension: string;
};

export function sniffMedia(buffer: Buffer): SniffedMedia | null {
  if (buffer.length >= 12) {
    const riff = buffer.subarray(0, 4).toString("ascii");
    const webp = buffer.subarray(8, 12).toString("ascii");
    if (riff === "RIFF" && webp === "WEBP") {
      return { kind: "image", mimeType: "image/webp", extension: "webp" };
    }
  }

  if (buffer.length >= 8) {
    const png = buffer.subarray(0, 8);
    if (png.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
      return { kind: "image", mimeType: "image/png", extension: "png" };
    }
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { kind: "image", mimeType: "image/jpeg", extension: "jpg" };
  }

  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    return { kind: "video", mimeType: "video/mp4", extension: "mp4" };
  }

  return null;
}
