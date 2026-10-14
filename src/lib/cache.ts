import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

declare global {
  var _memoryCache: Map<string, CacheEntry<any>> | undefined
  var _pendingCacheReads: Map<string, Promise<any>> | undefined
  var _cacheReadGeneration: number | undefined
}

function getMemoryCacheMap(): Map<string, CacheEntry<any>> {
  if (!global._memoryCache) {
    global._memoryCache = new Map<string, CacheEntry<any>>()
  }
  return global._memoryCache
}

/**
 * High-performance in-memory TTL caching wrapper for heavy database queries & catalog items.
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const pending = global._pendingCacheReads ||= new Map<string, Promise<any>>()
  const existing = pending.get(key)
  if (existing) return existing as Promise<T>
  const request = readCached(key, fetcher, ttlSeconds)
  pending.set(key, request)
  try { return await request }
  finally { if (pending.get(key) === request) pending.delete(key) }
}

async function readCached<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number): Promise<T> {
  const generation = global._cacheReadGeneration || 0
  // The Next Data Cache is shared across Vercel instances and invalidated
  // with the same catalog tag when a database mutation succeeds.
  if (process.env.NODE_ENV === "production") {
    return unstable_cache(fetcher, [key], { tags: ["catalog"], revalidate: ttlSeconds })()
  }
  const cache = getMemoryCacheMap()
  const now = Date.now()
  const cached = cache.get(key)

  if (cached && cached.expiresAt > now) {
    return cached.value as T
  }

  const fresh = await fetcher()
  if ((global._cacheReadGeneration || 0) === generation) {
    cache.set(key, {
      value: fresh,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }
  return fresh
}

/**
 * Flush in-memory cache entries.
 */
export function clearMemoryCache(pattern?: string): number {
  global._cacheReadGeneration = (global._cacheReadGeneration || 0) + 1
  const pending = global._pendingCacheReads
  if (pending) {
    for (const key of pending.keys()) {
      if (!pattern || key.includes(pattern)) pending.delete(key)
    }
  }
  if (process.env.NODE_ENV === "production") {
    try { revalidateTag("catalog") }
    catch { /* Local migration tools run outside the Next request context. */ }
  }
  const cache = getMemoryCacheMap()
  if (!pattern) {
    const count = cache.size
    cache.clear()
    return count
  }

  let deleted = 0
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key)
      deleted++
    }
  }
  return deleted
}

/**
 * Full site cache revalidation engine.
 * Clears both in-memory DB query cache and Next.js App Router full route cache.
 */
export async function flushAllSiteCache() {
  const memoryClearedCount = clearMemoryCache()

  try {
    revalidatePath("/", "layout")
  } catch (e) {
    console.warn("revalidatePath error:", e)
  }

  try {
    revalidateTag("catalog")
    revalidateTag("settings")
    revalidateTag("categories")
    revalidateTag("products")
    revalidateTag("sliders")
  } catch (e) {
    // Ignore tag revalidation error if not configured
  }

  return {
    success: true,
    memoryClearedCount,
    timestamp: new Date().toLocaleString("tr-TR"),
  }
}
