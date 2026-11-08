/**
 * Client-side in-memory session cache & in-flight request deduplicator.
 *
 * Prevents duplicate concurrent calls and redundant network roundtrips
 * on initial page loads and route transitions.
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

const clientCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();

// Default stale time: 3 minutes
const DEFAULT_STALE_TIME_MS = 180000;

export function getCachedData<T = any>(key: string, maxAgeMs = DEFAULT_STALE_TIME_MS): T | null {
  const entry = clientCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > maxAgeMs) {
    clientCache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedData<T = any>(key: string, data: T): void {
  clientCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCacheKey(keyPrefix: string): void {
  for (const key of clientCache.keys()) {
    if (key === keyPrefix || key.startsWith(`${keyPrefix}:`) || key.startsWith(`${keyPrefix}?`)) {
      clientCache.delete(key);
    }
  }
}

export function clearAllClientCache(): void {
  clientCache.clear();
  inFlightRequests.clear();
}

/**
 * Deduplicates concurrent in-flight requests and returns cached results within staleTime.
 */
export async function fetchWithClientCache<T = any>(
  key: string,
  fetcher: () => Promise<T>,
  staleTimeMs = DEFAULT_STALE_TIME_MS
): Promise<T> {
  // 1. Return fresh cached data if available
  const cached = getCachedData<T>(key, staleTimeMs);
  if (cached !== null) {
    return cached;
  }

  // 2. Deduplicate concurrent in-flight requests
  const existingPromise = inFlightRequests.get(key);
  if (existingPromise) {
    return existingPromise;
  }

  // 3. Fire new request and share promise among all concurrent callers
  const promise = (async () => {
    try {
      const result = await fetcher();
      setCachedData(key, result);
      return result;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

