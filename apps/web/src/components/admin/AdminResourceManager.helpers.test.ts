import { describe, expect, it } from "vitest";
import {
  mediaForItem,
  mediaForValue,
  normalizePayload,
  validateRequiredFields,
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
    const embeddedMedia = { id: 10, thumbnail_url: "embedded.webp" } as AdminMedia;
    const mediaById = new Map<number, AdminMedia>([[media.id, media]]);
    const item = { id: 1, media_file_id: 9 } as AdminContentItem;
    const itemWithPreview = { id: 2, media_file_id: 10, media_file: embeddedMedia };

    expect(mediaForValue(9, mediaById)).toBe(media);
    expect(mediaForValue("9", mediaById)).toBeUndefined();
    expect(mediaForItem(item, "media_file_id", mediaById)).toBe(media);
    expect(mediaForItem(itemWithPreview, "media_file_id", mediaById)).toBe(embeddedMedia);
    expect(mediaForItem(item, "missing_media_id", mediaById)).toBeUndefined();
  });

  it("flags empty required fields next to the field (QA IB-10)", () => {
    const fields: ResourceField[] = [
      { name: "name", label: "Nama Klien", required: true },
      { name: "segment", label: "Segmen" },
      { name: "hero_section_id", label: "Bagian Beranda", type: "hidden", required: true },
      { name: "logo_media_id", label: "Logo", type: "media", requiredWhenPublished: true },
    ];

    expect(validateRequiredFields({ name: "  ", status: "draft" }, fields)).toEqual({
      name: "Nama Klien wajib diisi.",
    });
    expect(validateRequiredFields({ name: "Brand", status: "draft" }, fields)).toEqual({});
  });

  it("requires publish-only fields only while publishing (QA IB-06)", () => {
    const fields: ResourceField[] = [
      { name: "name", label: "Nama Klien", required: true },
      { name: "logo_media_id", label: "Logo", type: "media", requiredWhenPublished: true },
    ];

    expect(validateRequiredFields({ name: "Brand", status: "published" }, fields)).toEqual({
      logo_media_id: "Logo wajib diunggah sebelum ditayangkan.",
    });
    expect(
      validateRequiredFields({ name: "Brand", status: "published", logo_media_id: 7 }, fields),
    ).toEqual({});
  });

  it("treats an empty gallery array as missing", () => {
    const fields: ResourceField[] = [
      { name: "media_file_ids", label: "Gambar Produk", type: "media-multi", required: true },
    ];

    expect(validateRequiredFields({ media_file_ids: [] }, fields)).toEqual({
      media_file_ids: "Gambar Produk wajib diunggah.",
    });
    expect(validateRequiredFields({ media_file_ids: [1] }, fields)).toEqual({});
  });

});
