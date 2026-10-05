"use client"

import { useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { getProductPrice } from "@lib/util/get-product-price"
import { productSummaryForCard } from "@lib/util/product-card"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import { Heart, ShoppingCart, Star, Loader2, Check } from "@lib/icons"
import { addToCart } from "@lib/util/cart-feedback"
import { useToast } from "@modules/common/components/feedback"
import { FavoriteButton } from "../product-card-actions"

export default function FeaturedProductCard({
  product,
  region,
  badgeText,
  showAddToCart = false,
  showSummary = false,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  badgeText?: string
  showAddToCart?: boolean
  showSummary?: boolean
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const addingRef = useRef(false)

  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const countryCode = (params?.countryCode as string) || "tr"

  const { cheapestPrice } = getProductPrice({ product })
  const metadata = (product.metadata || {}) as Record<string, any>
  const summary = productSummaryForCard(product)

  const hasDiscount =
    cheapestPrice?.price_type === "sale" ||
    Boolean(
      cheapestPrice?.original_price_number &&
        cheapestPrice?.calculated_price_number &&
        cheapestPrice.original_price_number > cheapestPrice.calculated_price_number
    )

  const displayPrice = cheapestPrice?.calculated_price || "—"
  const originalPrice = hasDiscount ? cheapestPrice?.original_price : null
  const percentageDiff = hasDiscount ? cheapestPrice?.percentage_diff : null

  const brandName = product.collection?.title || metadata.brand_name || "ZK HOME"

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (addingRef.current || isAdding || isSuccess) return

    const variantId = product.variants?.[0]?.id
    if (!variantId) {
      router.push(`/urunler/${product.handle}`)
      return
    }

    addingRef.current = true
    setIsAdding(true)

    try {
      const newCount = await addToCart({ variantId, quantity: 1, countryCode })
      if (newCount === null) { addingRef.current = false; return }
      setIsSuccess(true)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("cart_updated", { detail: { count: newCount } })
        )
      }
      router.refresh()
      setTimeout(() => {
        setIsSuccess(false)
        addingRef.current = false
      }, 1500)
    } catch {
      addingRef.current = false
      toast({
        title: "Sepete eklenemedi",
        description: "Lütfen tekrar deneyin.",
        variant: "danger",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="group relative flex flex-col justify-between h-full w-full min-w-0 shrink-0 p-1 sm:p-1.5 transition-all duration-200 hover:-translate-y-1">
      <div>
        {/* Product Image Stage */}
        <div className="relative block aspect-square w-full overflow-hidden rounded-2xl p-0.5 mb-2 sm:mb-2.5 transition-all duration-300 cursor-pointer z-10 group/img">
          {/* Discount Badge */}
          {hasDiscount && percentageDiff && percentageDiff !== "0" && (
            <span className="absolute top-2 left-2 z-20 rounded-md bg-[#e02b27] px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
              %{percentageDiff} İNDİRİM
            </span>
          )}

          {/* Favorite Heart Button - Top Right Corner */}
          <div className="absolute top-2 right-2 z-20">
            <FavoriteButton
              product={{
                id: product.id,
                title: product.title,
                handle: product.handle,
                thumbnail: product.thumbnail,
                variantId: product.variants?.[0]?.id,
                price: displayPrice,
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200/80 bg-white/90 backdrop-blur-xs text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-[#C98484] flex items-center justify-center transition-all shadow-2xs cursor-pointer shrink-0"
            />
          </div>

          <LocalizedClientLink
            href={`/urunler/${product.handle}`}
            prefetch={false}
            title={product.title}
            className="block h-full w-full"
          >
            <Thumbnail
              thumbnail={product.thumbnail}
              images={product.images}
              alt={product.title}
              size="square"
              isFeatured={false}
              className="h-full w-full object-contain p-0 transition-transform duration-300 group-hover/img:scale-105 pointer-events-none"
            />
          </LocalizedClientLink>
        </div>

        {/* Product Title & Brand (Brand on Left Next to Title) */}
        <LocalizedClientLink
          href={`/urunler/${product.handle}`}
          prefetch={false}
          className="block mb-2 cursor-pointer z-10"
        >
          <h3 className="text-xs font-bold leading-snug text-slate-900 line-clamp-2 transition-colors group-hover:text-[#C98484] min-h-[32px]">
            <span className="text-[#C98484] text-[10px] font-black tracking-wider uppercase mr-1.5 inline-block align-baseline">
              {brandName}
            </span>
            <span>{product.title}</span>
          </h3>
        </LocalizedClientLink>
        {showSummary && summary && (
          <p className="mb-2 min-h-[36px] line-clamp-2 text-xs leading-[1.5] text-[#827b78]">
            {summary}
          </p>
        )}
      </div>

      {/* Bottom Price Section */}
      <div className="mt-1 sm:mt-2 pt-1 flex items-center justify-between gap-1.5 sm:gap-2">
        <LocalizedClientLink
          href={`/urunler/${product.handle}`}
          prefetch={false}
          className="flex flex-col min-w-0 cursor-pointer z-10"
        >
          {hasDiscount && originalPrice && (
            <span className="text-[10px] text-slate-600 line-through leading-none mb-0.5">
              {originalPrice}
            </span>
          )}
          <span className="text-[#C98484] font-black text-sm sm:text-base tracking-tight truncate">
            {displayPrice}
          </span>
        </LocalizedClientLink>
      </div>

      {/* "Sepete Ekle" Button */}
      <div className="mt-2 pt-0.5 w-full z-20">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAdding || isSuccess}
          className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-98 disabled:opacity-80 disabled:cursor-not-allowed ${
            isSuccess
              ? "bg-emerald-600 text-white"
              : "bg-[#C98484] text-white hover:bg-[#A95E5E]"
          }`}
        >
          {isSuccess ? (
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          ) : isAdding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <ShoppingCart className="w-3.5 h-3.5" />
          )}
          <span>{isAdding ? "Ekleniyor..." : isSuccess ? "Eklendi ✓" : "Sepete Ekle"}</span>
        </button>
      </div>
    </div>
  )
}
