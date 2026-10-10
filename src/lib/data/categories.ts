import { HttpTypes } from "@medusajs/types"
import { listStoreCategories } from "@lib/commerce/repository"
import { isDatabaseReachable } from "@lib/admin/db"
import { getFallbackCategories } from "./category-fallback"

const getPublicCategories = async () => {
  try {
    const categories = await listStoreCategories(true)
    if (categories.length || await isDatabaseReachable()) return categories
  } catch (error) {
    console.error("Kategoriler yüklenemedi:", error)
    if (process.env.NODE_ENV === "production") throw error
  }
  return getFallbackCategories()
}

export const listCategories = async (options?: Record<string, unknown>) => {
  const categories = await getPublicCategories()
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
  const categories = await getPublicCategories()
  const category = categories.find((item) => item.handle === handle) || categories.find(item => Array.isArray(item.metadata?.slug_history) && item.metadata.slug_history.includes(handle))
  if (!category) return undefined
  let parentId = category.parent_category_id
  while (parentId) {
    const parent = categories.find((item) => item.id === parentId)
    if (!parent) return undefined
    parentId = parent.parent_category_id
  }
  return category as unknown as HttpTypes.StoreProductCategory
}
