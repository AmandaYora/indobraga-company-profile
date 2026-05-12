import type { AdminContentItem, AdminMedia } from "@/lib/api-models";

export type FieldValue = unknown;

export type ResourceField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "checkbox" | "media" | "paragraphs";
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  valueType?: "string" | "number";
  usage?: "hero" | "partner" | "portfolio" | "machine" | "gallery" | "news" | "og" | "other";
};

export function mediaForItem<TItem extends AdminContentItem>(
  item: TItem,
  fieldName: string,
  mediaById: Map<number, AdminMedia>,
) {
  return mediaForValue(item[fieldName], mediaById);
}

export function mediaForValue(value: unknown, mediaById: Map<number, AdminMedia>) {
  return typeof value === "number" ? mediaById.get(value) : undefined;
}

export function normalizePayload(values: Record<string, FieldValue>, fields: ResourceField[]) {
  const fieldMap = new Map(fields.map((field) => [field.name, field]));
  return Object.entries(values).reduce<Record<string, unknown>>((payload, [key, value]) => {
    const field = fieldMap.get(key);

    if (!field && key !== "status") {
      return payload;
    }

    if (value === "" || value === undefined || value === null) {
      return payload;
    }

    if (field?.type === "paragraphs") {
      payload[key] = String(value)
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean);
      return payload;
    }

    if (field?.type === "select" && field.valueType === "number") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        payload[key] = parsed;
      }
      return payload;
    }

    payload[key] = value;
    return payload;
  }, {});
}
