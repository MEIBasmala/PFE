import { useState, useEffect, useCallback, useRef, DependencyList } from "react";
import { toast } from "sonner";
import { cachedFetch } from "@/lib/apiCache";

interface UseAsyncOptions {
  skip?: boolean;
  toastOnError?: boolean;
  cacheKey?: string;
  cacheTtl?: number;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  deps: DependencyList = [],
  options: UseAsyncOptions = {}
) {
  const { skip = false, toastOnError = false, cacheKey, cacheTtl = 60_000 } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);

  // Stable ref so fetchData never needs asyncFn in its own deps
  const fnRef = useRef(asyncFn);
  useEffect(() => { fnRef.current = asyncFn; });

  const fetchData = useCallback(async () => {
    if (skip) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const result = cacheKey
        ? await cachedFetch(cacheKey, () => fnRef.current(), cacheTtl)
        : await fnRef.current();
      setData(result);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      if (toastOnError) toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [skip, cacheKey, cacheTtl, toastOnError]); // asyncFn intentionally excluded

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, ...deps]);

  return { data, loading, error, refetch: fetchData };
}