import { HttpTypes } from "@medusajs/types"
import { listStoreCategories } from "@lib/commerce/repository"

export const listCategories = async (options?: Record<string, unknown>) => {
  const categories = await listStoreCategories(true)
  const handle = options?.handle
  const filtered = handle
    ? categories.filter((category) => category.handle === handle)
    : categories
  return filterActiveCategories(
    filtered as unknown as HttpTypes.StoreProductCategory[]
  )
}

export const filterActiveCategories = <
  T extends HttpTypes.StoreProductCategory,
>(
  categories: T[]
): T[] => {
  const prune = (category: T): T | null => {
    const activeChildren = Array.isArray(category.category_children)
      ? category.category_children
          .map((child) => prune(child as T))
          .filter((child): child is T => Boolean(child))
      : []
    return {
      ...category,
      category_children: activeChildren,
    } as T
  }
  return categories
    .filter((category) => !category.parent_category_id)
    .map(prune)
    .filter((category): category is T => Boolean(category))
}

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = categoryHandle.join("/")
  const categories = await listStoreCategories(true)
  const category = categories.find((item) => item.handle === handle)
  if (!category) return undefined
  let parentId = category.parent_category_id
  while (parentId) {
    const parent = categories.find((item) => item.id === parentId)
    if (!parent) return undefined
    parentId = parent.parent_category_id
  }
  return category as unknown as HttpTypes.StoreProductCategory
}
