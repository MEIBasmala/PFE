// src/lib/apiCache.ts
// Lightweight in-memory + sessionStorage cache for API responses
// Prevents redundant network calls when navigating between pages

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // ms
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function isStale(entry: CacheEntry<unknown>): boolean {
  return Date.now() - entry.timestamp > entry.ttl;
}

export const apiCache = {
  get<T>(key: string): T | null {
    // 1. Check memory first (fastest)
    const mem = memoryCache.get(key);
    if (mem && !isStale(mem)) return mem.data as T;

    // 2. Fall back to sessionStorage (survives hot reloads)
    try {
      const raw = sessionStorage.getItem(`kl_cache_${key}`);
      if (raw) {
        const entry = JSON.parse(raw) as CacheEntry<T>;
        if (!isStale(entry)) {
          memoryCache.set(key, entry); // promote to memory
          return entry.data;
        }
        sessionStorage.removeItem(`kl_cache_${key}`);
      }
    } catch {
      // ignore parse errors
    }
    return null;
  },

  set<T>(key: string, data: T, ttl = 60_000): void {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
    memoryCache.set(key, entry);
    try {
      sessionStorage.setItem(`kl_cache_${key}`, JSON.stringify(entry));
    } catch {
      // sessionStorage might be full — memory cache is enough
    }
  },

  invalidate(prefix: string): void {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) memoryCache.delete(key);
    }
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith(`kl_cache_${prefix}`)) sessionStorage.removeItem(k);
      }
    } catch { /* ignore */ }
  },

  clear(): void {
    memoryCache.clear();
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k?.startsWith("kl_cache_")) toRemove.push(k);
      }
      toRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch { /* ignore */ }
  },
};

// Pending request deduplication — prevents multiple identical in-flight requests
const pending = new Map<string, Promise<unknown>>();

/**
 * Wraps an API call with caching + deduplication.
 * - Returns cached data instantly if fresh
 * - Deduplicates concurrent identical requests
 * - Caches the result for future navigations
 *
 * @example
 * const profile = await cachedFetch('profile', () => getPatientProfile(), 120_000);
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 60_000,
): Promise<T> {
  // Return cached value if still fresh
  const cached = apiCache.get<T>(key);
  if (cached !== null) return cached;

  // Deduplicate in-flight requests for the same key
  if (pending.has(key)) return pending.get(key) as Promise<T>;

  const promise = fetcher().then((data) => {
    apiCache.set(key, data, ttl);
    pending.delete(key);
    return data;
  }).catch((err) => {
    pending.delete(key);
    throw err;
  });

  pending.set(key, promise);
  return promise;
}