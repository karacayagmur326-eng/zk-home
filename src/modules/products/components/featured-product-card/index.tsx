import type { HttpTypes } from "@medusajs/types"
import ProductPreview from "../product-preview"

export default function FeaturedProductCard({
  product,
  region,
  showSummary = false,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  badgeText?: string
  showAddToCart?: boolean
  showSummary?: boolean
}) {
  return <ProductPreview product={product} region={region} showSummary={showSummary} />
}
