import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { ApiClientError, isApiClientError } from "@/lib/api";

type ApiQueryState<TData> = {
  data: TData | null;
  error: ApiClientError | Error | null;
  loading: boolean;
  reload: () => void;
  setData: Dispatch<SetStateAction<TData | null>>;
};

export function useApiQuery<TData>(
  key: readonly unknown[],
  loader: () => Promise<TData>,
  options: { enabled?: boolean; initialData?: TData | null } = {},
): ApiQueryState<TData> {
  const { enabled = true, initialData = null } = options;
  const [data, setData] = useState<TData | null>(initialData);
  const [error, setError] = useState<ApiClientError | Error | null>(null);
  const [loading, setLoading] = useState(enabled && initialData === null);
  const [revision, setRevision] = useState(0);
  const initialDataRef = useRef(initialData);
  const stableKey = useMemo(() => JSON.stringify(key), [key]);

  const reload = useCallback(() => {
    setRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  useEffect(() => {
    setData(initialDataRef.current);
    setError(null);
    setLoading(enabled && initialDataRef.current === null);
  }, [enabled, stableKey]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(initialDataRef.current === null);
    setError(null);

    loader()
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(normalizeError(caught));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, loader, revision, stableKey]);

  return { data, error, loading, reload, setData };
}

export function getErrorMessage(error: unknown): string {
  if (isApiClientError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kendala saat memuat data.";
}

function normalizeError(error: unknown): ApiClientError | Error {
  if (isApiClientError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Terjadi kendala saat memuat data.");
}
