import { cachedQuery } from "@lib/admin/db"

/**
 * Searches for a modern active product handle corresponding to a legacy/deleted product handle.
 * Used to avoid 404s and preserve SEO ranking via permanent 301/308 redirects.
 */
export async function findProductRedirectHandle(rawHandle: string): Promise<string | null> {
  if (!rawHandle) return null

  // 1. Try to extract standard product SKU / CH code (e.g. ch4815682)
  const chMatch = rawHandle.match(/(ch\d+)/i)
  if (chMatch) {
    const code = chMatch[1].toLowerCase()
    const rows = await cachedQuery<{ handle: string }>(
      `product-redirect-code:${code}`,
      `SELECT handle FROM store_product 
       WHERE handle ILIKE $1 AND status = 'published' AND deleted_at IS NULL 
       LIMIT 1`,
      [`%${code}%`],
      600
    ).catch(() => [])

    if (rows[0]?.handle && rows[0].handle !== rawHandle) {
      return rows[0].handle
    }
  }

  // 2. Check if a deleted/inactive product previously had this handle
  const deletedRows = await cachedQuery<{ title: string }>(
    `product-redirect-deleted:${rawHandle}`,
    `SELECT title FROM store_product 
     WHERE handle = $1 AND (status = 'deleted' OR deleted_at IS NOT NULL) 
     LIMIT 1`,
    [rawHandle],
    600
  ).catch(() => [])

  if (deletedRows[0]?.title) {
    const words = deletedRows[0].title
      .replace(/^zkhome\s+/i, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)

    if (words.length > 0) {
      const searchTerm = `%${words.slice(0, 2).join("%")}%`
      const activeByTitle = await cachedQuery<{ handle: string }>(
        `product-redirect-title:${rawHandle}`,
        `SELECT handle FROM store_product 
         WHERE title ILIKE $1 AND status = 'published' AND deleted_at IS NULL 
         LIMIT 1`,
        [searchTerm],
        600
      ).catch(() => [])

      if (activeByTitle[0]?.handle && activeByTitle[0].handle !== rawHandle) {
        return activeByTitle[0].handle
      }
    }
  }

  return null
}
