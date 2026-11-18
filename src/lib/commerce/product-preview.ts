import "server-only"
import { cache } from "react"
import { HttpTypes } from "@medusajs/types"
import { getAdminSession } from "@lib/admin/auth"
import { listStoreProducts } from "@lib/commerce/repository"

// Authorize before reading drafts. React cache only deduplicates this request;
// the repository keeps published and admin queries in separate cache entries.
export const getProductForStorefront = cache(async (handle: string, allowPreview = false) => {
  // Published pages do not depend on a session and can use the Full Route Cache.
  // Only a missing public product needs the authenticated draft lookup.
  const published = await listStoreProducts({ handles: [handle], status: "published", limit: 1 })
  if (published.products[0]) return { product: published.products[0] as unknown as HttpTypes.StoreProduct, isPreview: false }
  if (!allowPreview) return { product: null, isPreview: false }
  const session = await getAdminSession()
  if (!session) return { product: null, isPreview: false }
  const { products } = await listStoreProducts({
    handles: [handle], status: session ? "all" : "published", limit: 1,
  })
  const product = products[0] || null
  return {
    product: product as unknown as HttpTypes.StoreProduct | null,
    isPreview: Boolean(session && product && product.status !== "published"),
  }
})
