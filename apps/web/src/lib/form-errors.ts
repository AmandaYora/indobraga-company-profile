import { isApiClientError } from "@/lib/api";

/** field name -> message to show next to that field. */
export type FieldErrors = Record<string, string>;

/**
 * Extracts per-field validation messages from an API error response so forms can
 * mark exactly which inputs are wrong (QA IB-10). Nested paths ("a.b.c") are
 * reduced to their last segment, matching the flat form field names.
 */
export function fieldErrorsFromError(error: unknown): FieldErrors {
  if (!isApiClientError(error) || !error.details?.length) {
    return {};
  }

  const errors: FieldErrors = {};
  for (const detail of error.details) {
    if (!detail.field || !detail.message) {
      continue;
    }

    const key = detail.field.split(".").at(-1) ?? detail.field;
    errors[key] ??= detail.message;
  }

  return errors;
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Drops one field's error once the user edits it. */
export function clearFieldError(errors: FieldErrors, field: string): FieldErrors {
  if (!(field in errors)) {
    return errors;
  }

  const next = { ...errors };
  delete next[field];
  return next;
}
