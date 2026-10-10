import { cachedQuery } from "@lib/admin/db"

/**
 * Searches for a modern active product handle corresponding to a legacy/deleted product handle.
 * Used to avoid 404s and preserve SEO ranking via permanent 301/308 redirects.
 */
export async function findProductRedirectHandle(rawHandle: string): Promise<string | null> {
  if (!rawHandle) return null

  const history = await cachedQuery<{ handle: string }>(
    `product-slug-history:${rawHandle}`,
    `SELECT handle FROM store_product WHERE status='published' AND deleted_at IS NULL
      AND metadata->'slug_history' ? $1 LIMIT 1`, [rawHandle], 60,
  )
  if (history[0]?.handle && history[0].handle !== rawHandle) return history[0].handle

  return null
}
