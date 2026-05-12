import { describe, expect, it } from "vitest";
import {
  mediaForItem,
  mediaForValue,
  normalizePayload,
  type ResourceField,
} from "./AdminResourceManager.helpers";
import type { AdminContentItem, AdminMedia } from "@/lib/api-models";

const fields: ResourceField[] = [
  { name: "name", label: "Nama" },
  { name: "sort_order", label: "Urutan", type: "number" },
  { name: "category_id", label: "Kategori", type: "select", valueType: "number" },
  { name: "content", label: "Konten", type: "paragraphs" },
  { name: "media_file_id", label: "Media", type: "media" },
];

describe("AdminResourceManager helpers", () => {
  it("normalizes create and update payloads to backend-owned fields only", () => {
    expect(
      normalizePayload(
        {
          id: 123,
          name: "QA Service",
          category_id: "12",
          sort_order: 7,
          status: "published",
          created_at: "2026-05-11T00:00:00.000Z",
          updated_at: "2026-05-11T00:00:00.000Z",
        },
        fields,
      ),
    ).toEqual({
      name: "QA Service",
      category_id: 12,
      sort_order: 7,
      status: "published",
    });
  });

  it("omits empty values while preserving valid false and zero values", () => {
    expect(
      normalizePayload(
        {
          name: "",
          sort_order: 0,
          media_file_id: null,
          status: "draft",
          unknown: false,
        },
        fields,
      ),
    ).toEqual({
      sort_order: 0,
      status: "draft",
    });
  });

  it("turns paragraph text into trimmed non-empty paragraph arrays", () => {
    expect(
      normalizePayload(
        {
          content: " Paragraf pertama\n\n\nParagraf kedua \n  ",
        },
        fields,
      ),
    ).toEqual({
      content: ["Paragraf pertama", "Paragraf kedua"],
    });
  });

  it("resolves media from direct values and item fields", () => {
    const media = { id: 9, thumbnail_url: "thumb.webp" } as AdminMedia;
    const mediaById = new Map<number, AdminMedia>([[media.id, media]]);
    const item = { id: 1, media_file_id: 9 } as AdminContentItem;

    expect(mediaForValue(9, mediaById)).toBe(media);
    expect(mediaForValue("9", mediaById)).toBeUndefined();
    expect(mediaForItem(item, "media_file_id", mediaById)).toBe(media);
    expect(mediaForItem(item, "missing_media_id", mediaById)).toBeUndefined();
  });
});
