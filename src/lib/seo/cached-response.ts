import { getCached } from "@lib/cache"

type Snapshot = { body: string; status: number; headers: [string, string][] }
class UncachedResponse extends Error {
  constructor(readonly snapshot: Snapshot) { super("Response must not be cached") }
}

/** Cache generated public XML as well as its underlying queries. Errors and
 * explicitly private/disabled responses are never stored in the Data Cache. */
export async function cachedPublicResponse(key: string, generate: () => Promise<Response>, ttl = 900): Promise<Response> {
  let snapshot: Snapshot
  try {
    snapshot = await getCached(`public-response-v1:${key}`, async () => {
      const response = await generate()
      const value: Snapshot = { body: await response.text(), status: response.status, headers: [...response.headers.entries()] }
      if (!response.ok || /no-store|private/i.test(response.headers.get("cache-control") || "")) throw new UncachedResponse(value)
      return value
    }, ttl, ["store_product", "store_variant", "store_product_image", "store_product_category", "store_category", "store_collection", "store_product_tag", "store_tag", "theme_settings", "store_setting", "store_settings", "blog_posts", "blog_categories", "content_pages"])
  } catch (error) {
    if (!(error instanceof UncachedResponse)) throw error
    snapshot = error.snapshot
  }
  const headers = new Headers(snapshot.headers)
  if (snapshot.status === 200 && !/no-store|private/i.test(headers.get("cache-control") || "")) {
    headers.set("Cache-Control", `public, max-age=60, s-maxage=${ttl}, stale-while-revalidate=60`)
  }
  return new Response(snapshot.body, { status: snapshot.status, headers })
}
