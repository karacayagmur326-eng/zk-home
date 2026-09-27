"use server"

import { HttpTypes } from "@medusajs/types"
import { listStoreProducts } from "@lib/commerce/repository"

export const retrieveVariant = async (
  variantId: string
): Promise<HttpTypes.StoreProductVariant | null> => {
  const { products } = await listStoreProducts({ limit: 500 })
  for (const product of products) {
    const variant = product.variants?.find(
      (item: any) => item.id === variantId || item.sku === variantId
    )
    if (variant) return variant as HttpTypes.StoreProductVariant
  }
  return null
}
