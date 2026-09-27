import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

interface MinPricedProduct extends HttpTypes.StoreProduct {
  _minPrice?: number
}

/**
 * Helper function to sort products by price until the store API supports sorting by price
 * @param products
 * @param sortBy
 * @returns products sorted by price
 */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions,
): HttpTypes.StoreProduct[] {
  const sortedProducts = [...products] as MinPricedProduct[]

  if (["price_asc", "price_desc"].includes(sortBy)) {
    // Precompute the minimum price for each product
    sortedProducts.forEach((product) => {
      const prices = (product.variants || [])
        .map(
          (variant) => {
            const pricedVariant = variant as typeof variant & {
              prices?: Array<{ amount: number }>
            }
            return (
              pricedVariant?.calculated_price?.calculated_amount ??
              pricedVariant?.prices?.[0]?.amount
            )
          },
        )
        .filter(
          (amount): amount is number =>
            typeof amount === "number" && Number.isFinite(amount),
        )

      product._minPrice = prices.length ? Math.min(...prices) : Infinity
    })

    // Sort products based on the precomputed minimum prices
    sortedProducts.sort((a, b) => {
      if (!Number.isFinite(a._minPrice) && !Number.isFinite(b._minPrice)) {
        return 0
      }
      if (!Number.isFinite(a._minPrice)) return 1
      if (!Number.isFinite(b._minPrice)) return -1

      const diff = a._minPrice! - b._minPrice!
      return sortBy === "price_asc" ? diff : -diff
    })
  }

  if (sortBy === "created_at") {
    sortedProducts.sort((a, b) => {
      return (
        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
      )
    })
  }

  return sortedProducts
}
