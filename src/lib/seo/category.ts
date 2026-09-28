import type { HttpTypes } from "@medusajs/types"

type CategoryLike = Pick<HttpTypes.StoreProductCategory, "handle" | "metadata"> & {
  product_count?: number
}

export function categoryPath(category: CategoryLike): string {
  const metadata = (category.metadata || {}) as Record<string, unknown>
  return metadata.pretty_url === true
    ? `/${category.handle}`
    : `/kategoriler/${category.handle}`
}

export function categoryIndexable(category: CategoryLike): boolean {
  const metadata = (category.metadata || {}) as Record<string, unknown>
  return metadata.is_indexable === true &&
    Array.isArray((category as CategoryLike & { products?: unknown[] }).products) &&
    Boolean((category as CategoryLike & { products?: unknown[] }).products?.length)
}

export function categorySeoText(category: CategoryLike) {
  const metadata = (category.metadata || {}) as Record<string, unknown>
  return {
    title: typeof metadata.seo_title === "string" ? metadata.seo_title.trim() : "",
    description: typeof metadata.seo_description === "string" ? metadata.seo_description.trim() : "",
  }
}
