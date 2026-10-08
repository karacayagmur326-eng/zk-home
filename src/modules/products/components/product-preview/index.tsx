import { getProductPrice } from "@lib/util/get-product-price"
import { productSummaryForCard } from "@lib/util/product-card"
import { Battery, Settings2, Star, Zap } from "@lib/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  AddToCartButton,
  FavoriteButton,
} from "@modules/products/components/product-card-actions"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

const textValue = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : null

export default function ProductPreview({
  product,
  isFeatured,
  region: _region,
  viewMode = "grid",
  showSummary = true,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region?: HttpTypes.StoreRegion
  viewMode?: string
  showSummary?: boolean
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const metadata = (product.metadata || {}) as Record<string, unknown>
  const summary = productSummaryForCard(product)
  const brandName = product.collection?.title || textValue(metadata.brand_name) || textValue(metadata.brand) || ""
  const tagValues = (product.tags || []).map((tag) => tag.value.toLowerCase())
  const badges = [
    tagValues.includes("yeni") ? "YENİ" : null,
    tagValues.includes("kampanya") ? "KAMPANYA" : null,
    tagValues.includes("çok satan") || tagValues.includes("cok satan")
      ? "ÇOK SATAN"
      : null,
  ].filter(Boolean) as string[]

  const rating = Number(metadata.rating || 0)
  const reviewCount = Number(metadata.review_count || 0)
  const specs = [
    { icon: Zap, value: textValue(metadata.voltage) },
    { icon: Battery, value: textValue(metadata.battery_capacity) },
    { icon: null, value: textValue(metadata.max_torque) },
    { icon: Settings2, value: textValue(metadata.speed) },
  ].filter((spec) => spec.value)

  const purchasableVariant = product.variants?.find(
    (variant) => {
      const pricedVariant = variant as typeof variant & {
        prices?: Array<{ amount: number }>
      }
      return (
        Boolean(
          pricedVariant.calculated_price?.calculated_amount ||
            pricedVariant.prices?.length,
        ) &&
        (!pricedVariant.manage_inventory ||
          pricedVariant.allow_backorder ||
          pricedVariant.inventory_quantity == null ||
          (pricedVariant.inventory_quantity || 0) > 0)
      )
    },
  )
  const favoriteProduct = {
    id: product.id,
    title: product.title,
    handle: product.handle,
    thumbnail: product.thumbnail,
    variantId: purchasableVariant?.id,
    price: cheapestPrice?.calculated_price,
  }

  if (viewMode === "list") {
    return (
      <article
        className="group relative flex h-full w-full flex-col gap-4 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-[#C98484] hover:shadow-lg sm:grid sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-x-4 sm:gap-y-3 xl:grid-cols-[136px_minmax(0,1fr)]"
        data-testid="product-wrapper"
      >
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-sm bg-[#C98484] px-2 py-1 text-[9px] font-bold tracking-wide text-white"
            >
              {badge}
            </span>
          ))}
        </div>
        <FavoriteButton
          product={favoriteProduct}
          className="absolute right-3 top-3 z-10"
        />
        <LocalizedClientLink
          href={`/urunler/${product.handle}`}
          className="relative block aspect-[4/5] w-full self-start flex-shrink-0 bg-white sm:row-span-2"
        >
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            alt={product.title}
            size="square"
            isFeatured={isFeatured}
            className="h-full w-full object-contain"
          />
        </LocalizedClientLink>
        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div>
            <LocalizedClientLink href={`/urunler/${product.handle}`}>
              <h2 className="pr-10 text-base font-bold leading-tight text-foreground transition-colors group-hover:text-[#C98484]">
                {product.title}
              </h2>
            </LocalizedClientLink>
            {summary && <p className="mt-2 line-clamp-2 text-xs leading-[1.5] text-[#827b78]">{summary}</p>}
            {specs.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
                {specs.map(({ icon: Icon, value }) => (
                  <span key={value} className="inline-flex items-center gap-1">
                    {Icon && <Icon className="h-4 w-4" />}
                    {value}
                  </span>
                ))}
              </div>
            )}
            {reviewCount > 0 && (
              <div className="mt-3 flex items-center gap-1 text-xs text-muted">
                <Star className="h-4 w-4 fill-[#FBBF24] text-[#FBBF24]" />
                <strong className="text-foreground">{rating.toFixed(1)}</strong>
                <span>({reviewCount} değerlendirme)</span>
              </div>
            )}
            {purchasableVariant?.manage_inventory && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                <div className={`w-1.5 h-1.5 rounded-full ${(purchasableVariant.inventory_quantity || 0) > 0 ? "bg-emerald-500" : "bg-red-500"}`}></div>
                {(purchasableVariant.inventory_quantity || 0) > 0 ? `Stok: ${purchasableVariant.inventory_quantity} adet` : "Stokta Yok"}
              </div>
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-col items-start justify-end border-t border-border pt-3 sm:col-start-2">
          {cheapestPrice && (
            <div className="mb-3 flex flex-wrap items-center">
              <PreviewPrice price={cheapestPrice} />
            </div>
          )}
          <AddToCartButton
            variantId={purchasableVariant?.id}
            preview={{ id: product.id, title: product.title, handle: product.handle, thumbnail: product.thumbnail, unitPrice: purchasableVariant?.calculated_price?.calculated_amount || 0 }}
            className="w-full"
          />
        </div>
      </article>
    )
  }

  return (
    <article
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#EADBD4]/70 bg-white shadow-sm transition-all duration-200 hover:border-[#C98484]/50 hover:shadow-md"
      data-testid="product-wrapper"
    >
      {/* Discount Badge + Wishlist row */}
      <div className="relative m-2 mb-0">
        {/* Portrait image frame keeps the full photo visible. */}
        <LocalizedClientLink
          href={`/urunler/${product.handle}`}
          className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-[#FBF7F4] cursor-pointer z-10"
        >
          {/* Discount Badge top-left */}
          {cheapestPrice?.percentage_diff && cheapestPrice.percentage_diff !== "0" && (
            <span className="absolute top-2 left-2 z-20 rounded-md bg-[#e02b27] px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
              %{cheapestPrice.percentage_diff} İNDİRİM
            </span>
          )}
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            alt={product.title}
            size="square"
            isFeatured={isFeatured}
            className="h-full w-full pointer-events-none"
            imageClassName="!p-0 !scale-100"
          />
        </LocalizedClientLink>

        {/* Wishlist button top-right */}
        <div className="absolute top-2 right-2 z-20">
          <FavoriteButton product={favoriteProduct} className="!h-8 !w-8" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 px-2.5 pb-3 pt-1.5 sm:px-3 sm:pt-3">
        <LocalizedClientLink href={`/urunler/${product.handle}`} className="cursor-pointer block z-10">
          <h2 className="min-h-[34px] text-[11px] font-semibold leading-snug text-slate-900 line-clamp-2 group-hover:text-[#C98484] min-[390px]:text-[12px] sm:text-[13px]">
            <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wide text-[#C98484]">{brandName}</span>
            {product.title}
          </h2>
        </LocalizedClientLink>

        {showSummary && summary && <p className="min-h-[36px] line-clamp-2 text-xs leading-[1.5] text-[#827b78]">{summary}</p>}

        {reviewCount > 0 && (
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < Math.round(rating) ? "fill-[#C98484] text-[#C98484]" : "fill-gray-200 text-gray-200"}`} />
            ))}
          </div>
        )}

        <div className="mt-auto pt-1.5">
          {cheapestPrice && (
            <div className="flex flex-col min-w-0 mb-2">
              <PreviewPrice price={cheapestPrice} />
            </div>
          )}
          <AddToCartButton
            variantId={purchasableVariant?.id}
            preview={{ id: product.id, title: product.title, handle: product.handle, thumbnail: product.thumbnail, unitPrice: purchasableVariant?.calculated_price?.calculated_amount || 0 }}
            className="w-full !rounded-xl !px-2 !py-2 !text-xs !gap-1.5"
          />
        </div>
      </div>
    </article>
  )
}
