import type { HttpTypes } from "@medusajs/types"
import rows from "./category-fallback.json"

// Public category content from the local ZK Home catalog. This keeps the
// storefront browsable until its managed database is connected in production.
export function getFallbackCategories(): HttpTypes.StoreProductCategory[] {
  const categories = rows
    .filter((row) => row.active)
    .map((row) => ({
      id: row.id,
      name: row.name,
      handle: row.handle,
      description: row.description,
      parent_category_id: row.parent_id,
      rank: row.rank,
      is_active: true,
      is_internal: false,
      metadata: row.metadata,
      product_count: 0,
      direct_product_count: 0,
      products: [],
      category_children: [] as HttpTypes.StoreProductCategory[],
    })) as unknown as HttpTypes.StoreProductCategory[]

  const byId = new Map(categories.map((category) => [category.id, category]))
  for (const category of categories) {
    if (!category.parent_category_id) continue
    const parent = byId.get(category.parent_category_id)
    if (!parent) continue
    parent.category_children.push(category)
    ;(category as any).parent_category = {
      id: parent.id,
      name: parent.name,
      handle: parent.handle,
      metadata: parent.metadata,
      parent_category_id: parent.parent_category_id,
      parent_category: (parent as any).parent_category,
    }
  }
  return categories
}
