import { getCached } from "@lib/cache"

type Snapshot = { body: string; status: number; headers: [string, string][]; generatedAt: number }
class UncachedResponse extends Error {
  constructor(readonly snapshot: Snapshot) { super("Response must not be cached") }
}

/** Cache generated public XML as well as its underlying queries. Errors and
 * explicitly private/disabled responses are never stored in the Data Cache. */
export async function cachedPublicResponse(key: string, generate: () => Promise<Response>, ttl = 900): Promise<Response> {
  let snapshot: Snapshot
  try {
    snapshot = await getCached(`public-response-v2:${key}`, async () => {
      const response = await generate()
      const value: Snapshot = { body: await response.text(), status: response.status, headers: [...response.headers.entries()], generatedAt: Date.now() }
      if (!response.ok || /no-store|private/i.test(response.headers.get("cache-control") || "")) throw new UncachedResponse(value)
      return value
    }, ttl, ["store_product", "store_variant", "store_product_image", "store_product_category", "store_category", "store_collection", "store_product_tag", "store_tag", "theme_settings", "store_setting", "store_settings", "blog_posts", "blog_categories", "content_pages"])
  } catch (error) {
    if (!(error instanceof UncachedResponse)) throw error
    snapshot = error.snapshot
  }
  const headers = new Headers(snapshot.headers)
  if (snapshot.status === 200 && !/no-store|private/i.test(headers.get("cache-control") || "")) {
    // The Data Cache can return stale XML while refreshing it. Do not give
    // that old snapshot a new full CDN lifetime on every cache miss.
    const age = Number.isFinite(snapshot.generatedAt) ? Math.max(0, Math.floor((Date.now() - snapshot.generatedAt) / 1000)) : ttl
    const remaining = Math.max(0, ttl - age)
    headers.set("Cache-Control", remaining
      ? `public, max-age=${Math.min(60, remaining)}, s-maxage=${remaining}, stale-while-revalidate=60`
      : "public, max-age=0, s-maxage=0, must-revalidate")
  }
  return new Response(snapshot.body, { status: snapshot.status, headers })
}
