import { clx } from "@modules/common/components/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
  compact = false,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  compact?: boolean
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return (
      <div className="my-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-bold text-amber-900">
          Bu ürün için güncel fiyat bilgisi bulunmuyor.
        </p>
      </div>
    )
  }

  const isSale = selectedPrice.price_type === "sale" || selectedPrice.original_price_number > selectedPrice.calculated_price_number
  const percentage =
    isSale && selectedPrice.percentage_diff !== "0"
      ? selectedPrice.percentage_diff
      : null

  // ── COMPACT MODE (for sticky mobile bottom bar) ──
  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {isSale && (
          <span className="text-gray-400 line-through text-[11px] font-semibold">
            {selectedPrice.original_price}
          </span>
        )}
        <span className="text-xl font-black text-[#C98484] leading-none">
          {selectedPrice.calculated_price}
        </span>
        {percentage && (
          <span className="bg-[#e02b27] text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
            %{percentage}
          </span>
        )}
        <span className="text-[10px] text-gray-400 font-medium">KDV Dahil</span>
      </div>
    )
  }

  // ── FULL MODE (Inline Price + KDV Dahil) ──
  return (
    <div className="flex flex-col gap-1 my-1">
      
      {/* Strikethrough Original Price */}
      {isSale && (
        <span className="text-gray-400 line-through text-xs sm:text-sm font-semibold mt-1">
          {selectedPrice.original_price}
        </span>
      )}

      {/* Main Sale Price + KDV Dahil Inline */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <div className="storefront-price flex items-baseline gap-1 text-3xl sm:text-4xl text-[#C98484] leading-none font-black">
          {selectedPrice.calculated_price}
        </div>
        <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
          KDV DAHİL
        </span>
      </div>
    </div>
  )
}
