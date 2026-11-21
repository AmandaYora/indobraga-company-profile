import { useCallback, useMemo, useRef } from "react";
import { adminMediaApi } from "@/lib/api-services";

/**
 * Tracks media uploaded while a form is open so files that never get attached to
 * content (form cancelled, image replaced) can be removed right away instead of
 * piling up in storage (QA IB-09). The API additionally sweeps stale orphans, so
 * this is a best-effort fast path: failures are swallowed on purpose.
 */
export function useSessionUploads() {
  const uploaded = useRef(new Set<number>());

  /** Remember a freshly uploaded media id. */
  const track = useCallback((id: number | null | undefined) => {
    if (typeof id === "number") {
      uploaded.current.add(id);
    }
  }, []);

  const removeIds = useCallback(async (ids: number[]) => {
    await Promise.allSettled(ids.map((id) => adminMediaApi.remove(id)));
  }, []);

  /**
   * Delete every tracked upload that is not in `keep` (the ids that were actually
   * saved), then forget them all. Call with no argument on cancel to delete all.
   */
  const discard = useCallback(
    async (keep: Iterable<number> = []) => {
      const keepSet = new Set(keep);
      const stale = [...uploaded.current].filter((id) => !keepSet.has(id));
      uploaded.current.clear();
      if (stale.length > 0) {
        await removeIds(stale);
      }
    },
    [removeIds],
  );

  /** Forget tracked uploads without deleting them (e.g. when the form is reopened). */
  const reset = useCallback(() => {
    uploaded.current.clear();
  }, []);

  // Stable identity: callers use it in effect dependency lists (unmount cleanup), and a
  // changing object would run that cleanup - deleting fresh uploads - on every render.
  return useMemo(() => ({ track, discard, reset }), [track, discard, reset]);
}

/** Collects every media id (number or number[]) found in a saved payload's values. */
export function collectNumericIds(payload: Record<string, unknown>): number[] {
  const ids: number[] = [];
  for (const value of Object.values(payload)) {
    if (typeof value === "number") {
      ids.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "number") {
          ids.push(item);
        }
      }
    }
  }

  return ids;
}
