import { useEffect } from "react";

/**
 * On first render of a list page, pre-fills its local search box from `?q=` in the
 * URL. This is how a hit picked in the admin global search lands on the matching
 * list already filtered (QA IB-04).
 */
export function useInitialSearchQuery(setQuery: (value: string) => void) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) {
      setQuery(initial);
    }
    // Intentionally run once on mount; later edits are owned by the page's own input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
