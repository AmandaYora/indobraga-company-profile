export function normalizeObjectKey(objectKey: string): string {
  return objectKey.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function publicObjectUrl(baseUrl: string, objectKey: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  const encodedKey = normalizeObjectKey(objectKey)
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${base}/${encodedKey}`;
}
