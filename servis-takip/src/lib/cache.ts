const store: Record<string, { data: unknown; time: number }> = {};
const TTL = 5 * 60 * 1000;

export function getCache<T>(key: string): T | null {
  const item = store[key];
  if (!item) return null;
  if (Date.now() - item.time > TTL) {
    delete store[key];
    return null;
  }
  return item.data as T;
}

export function setCache(key: string, data: unknown): void {
  store[key] = { data, time: Date.now() };
}

export function invalidateCache(key: string): void {
  delete store[key];
}

export function invalidateCachePrefix(prefix: string): void {
  for (const k of Object.keys(store)) {
    if (k.startsWith(prefix)) delete store[k];
  }
}
