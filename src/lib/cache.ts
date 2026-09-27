import { revalidatePath, revalidateTag } from "next/cache"

type CacheEntry<T> = {
  value: T
  expiresAt: number
}

declare global {
  var _memoryCache: Map<string, CacheEntry<any>> | undefined
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
  const cache = getMemoryCacheMap()
  const now = Date.now()
  const cached = cache.get(key)

  if (cached && cached.expiresAt > now) {
    return cached.value as T
  }

  const fresh = await fetcher()
  cache.set(key, {
    value: fresh,
    expiresAt: now + ttlSeconds * 1000,
  })
  return fresh
}

/**
 * Flush in-memory cache entries.
 */
export function clearMemoryCache(pattern?: string): number {
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
