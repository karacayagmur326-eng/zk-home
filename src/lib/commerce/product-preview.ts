import "server-only"
import { cache } from "react"
import { HttpTypes } from "@medusajs/types"
import { getAdminSession } from "@lib/admin/auth"
import { listStoreProducts } from "@lib/commerce/repository"

// Authorize before reading drafts. React cache only deduplicates this request;
// the repository keeps published and admin queries in separate cache entries.
export const getProductForStorefront = cache(async (handle: string) => {
  const session = await getAdminSession().catch(() => null)
  const { products } = await listStoreProducts({
    handles: [handle], status: session ? "all" : "published", limit: 1,
  })
  const product = products[0] || null
  return {
    product: product as unknown as HttpTypes.StoreProduct | null,
    isPreview: Boolean(session && product && product.status !== "published"),
  }
})
