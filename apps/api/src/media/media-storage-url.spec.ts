import { normalizeObjectKey, publicObjectUrl } from "@/media/media-storage-url";

describe("media storage URL helpers", () => {
  it("normalizes object keys before storage operations", () => {
    expect(normalizeObjectKey("\\upload\\prod\\file.webp")).toBe("upload/prod/file.webp");
    expect(normalizeObjectKey("///upload/prod/file.webp")).toBe("upload/prod/file.webp");
  });

  it("builds encoded public URLs without double slashes", () => {
    expect(publicObjectUrl("https://cdn.example.com/media///", "/folder/foto utama.webp")).toBe(
      "https://cdn.example.com/media/folder/foto%20utama.webp",
    );
  });
});
