import type { HttpTypes } from "@medusajs/types"

const CARD_METADATA_KEYS = [
  "brand_name",
  "original_price",
  "normal_price",
  "compare_price",
  "regular_price",
  "sales_count",
  "order_count",
  "is_sale",
  "on_sale",
  "discount_percentage",
] as const

export function compactProductForCard(
  product: HttpTypes.StoreProduct
): HttpTypes.StoreProduct {
  const metadata = (product.metadata || {}) as Record<string, unknown>
  const cardMetadata = Object.fromEntries(
    CARD_METADATA_KEYS
      .filter((key) => metadata[key] !== undefined)
      .map((key) => [key, metadata[key]])
  )

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    thumbnail: product.thumbnail,
    created_at: product.created_at,
    collection: product.collection
      ? { id: product.collection.id, title: product.collection.title }
      : null,
    images: product.images?.slice(0, 2).map((image) => ({
      id: image.id,
      url: image.url,
    })),
    variants: product.variants?.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      title: variant.title,
      calculated_price: variant.calculated_price,
      prices: (variant as any).prices?.map((price: any) => ({
        amount: price.amount,
        currency_code: price.currency_code,
      })),
    })) as unknown as HttpTypes.StoreProduct["variants"],
    metadata: cardMetadata,
  } as HttpTypes.StoreProduct
}

export function compactProductsForCards(
  products: HttpTypes.StoreProduct[]
): HttpTypes.StoreProduct[] {
  return products.map(compactProductForCard)
}
