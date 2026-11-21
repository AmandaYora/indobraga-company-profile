import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Search } from "lucide-react";
import { adminSearchApi } from "@/lib/api-services";
import type { AdminSearchItem, AdminSearchResult } from "@/lib/api-models";
import { getErrorMessage } from "@/hooks/use-api-query";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

type FlatHit = AdminSearchItem & { groupLabel: string; key: string };

/**
 * Header search box. Queries `/admin/search` as you type (debounced) and lists
 * matching content, contact messages and news grouped by type. Choosing a hit
 * opens its management page already filtered to that keyword (QA IB-04).
 */
export function AdminGlobalSearch() {
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AdminSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const term = query.trim();
  const hits: FlatHit[] =
    result?.groups.flatMap((group) =>
      group.items.map((item) => ({
        ...item,
        groupLabel: group.label,
        key: `${group.key}-${item.id}`,
      })),
    ) ?? [];

  useEffect(() => {
    if (term.length < MIN_QUERY_LENGTH) {
      setResult(null);
      setError(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(() => {
      adminSearchApi
        .search(term)
        .then((data) => {
          if (!cancelled) {
            setResult(data);
            setError(null);
            setActive(0);
          }
        })
        .catch((caught: unknown) => {
          if (!cancelled) {
            setResult(null);
            setError(getErrorMessage(caught, { action: "load" }));
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const choose = (hit: FlatHit) => {
    setOpen(false);
    // Route paths come from the API as plain strings; they are all valid /admin/* pages.
    void navigate({ to: hit.to as never, search: { q: term } as never });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!hits.length) {
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index + 1) % hits.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index - 1 + hits.length) % hits.length);
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      const hit = hits[active];
      if (hit) {
        choose(hit);
      }
    }
  };

  const showPanel = open && term.length >= MIN_QUERY_LENGTH;
  const activeId = hits[active] ? `${listId}-${hits[active].key}` : undefined;

  return (
    <div ref={rootRef} className="relative">
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        role="combobox"
        aria-label="Cari konten, pesan kontak, atau berita"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showPanel ? activeId : undefined}
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Cari konten, pesan kontak, atau berita..."
        className="w-full rounded-full border border-border bg-secondary py-2 pl-10 pr-10 text-sm outline-none focus:border-primary"
      />
      {loading && (
        <Loader2
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      )}

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          aria-label="Hasil pencarian"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[26rem] overflow-y-auto rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-elegant"
        >
          {error && (
            <p role="alert" className="px-3 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
          {!error && !loading && result && hits.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">
              Tidak ada hasil untuk &quot;{term}&quot;.
            </p>
          )}
          {!error && loading && hits.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">Mencari...</p>
          )}
          {result?.groups.map((group) => (
            <div key={group.key} className="mb-1 last:mb-0">
              <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
              {group.items.map((item) => {
                const key = `${group.key}-${item.id}`;
                const index = hits.findIndex((hit) => hit.key === key);
                const isActive = index === active;
                return (
                  <button
                    key={key}
                    id={`${listId}-${key}`}
                    role="option"
                    aria-selected={isActive}
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => {
                      const hit = hits[index];
                      if (hit) {
                        choose(hit);
                      }
                    }}
                    className={`flex w-full min-w-0 flex-col rounded-lg px-3 py-2 text-left transition ${
                      isActive ? "bg-secondary" : "hover:bg-secondary/70"
                    }`}
                  >
                    <span className="text-anywhere truncate text-sm font-semibold">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="text-anywhere truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
