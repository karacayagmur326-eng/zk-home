"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@modules/common/components/ui"
import {
  ArrowLeftRight,
  Star,
  Check,
  X,
} from "@lib/icons"
import { addToCompare, isInCompare, formatComparePrice } from "@lib/util/compare-store"
import { FavoriteButton } from "@modules/products/components/product-card-actions"
import { getProductPrice } from "@lib/util/get-product-price"
import { sanitizeRichTextHtml } from "@modules/common/components/rich-text-editor"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const [reviewsData, setReviewsData] = useState<{ count: number; avg: number }>({
    count: 0,
    avg: 0,
  })

  const [compareNotice, setCompareNotice] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  })

  const [inCompare, setInCompare] = useState(false)

  const md = (product.metadata as Record<string, any>) || {}
  const brandName = (md.brand_name as string) || product.collection?.title || "ZK HOME"
  const sku = String(product.variants?.[0]?.sku || md.sku || "").trim()
  const { cheapestPrice } = getProductPrice({ product })

  useEffect(() => {
    setInCompare(isInCompare(product.id))

    // Fetch real reviews for this product
    fetch(`/api/products/${product.id}/reviews`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
          const revs = data.reviews
          const count = revs.length
          const avg = revs.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) / count
          setReviewsData({ count, avg: Math.round(avg * 10) / 10 })
        } else if (md.reviews && Array.isArray(md.reviews) && md.reviews.length > 0) {
          const revs = md.reviews
          const count = revs.length
          const avg = revs.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0) / count
          setReviewsData({ count, avg: Math.round(avg * 10) / 10 })
        }
      })
      .catch(() => {})
  }, [product.id])

  const handleToggleCompare = () => {
    const mainImg = product.thumbnail || product.images?.[0]?.url || ""
    const priceVal =
      product.variants?.[0]?.calculated_price?.calculated_amount ??
      (product.variants?.[0] as any)?.prices?.[0]?.amount

    const formattedPrice = formatComparePrice(priceVal || 1699)

    const res = addToCompare({
      id: product.id,
      title: product.title,
      handle: product.handle,
      thumbnail: mainImg,
      price: formattedPrice,
      category: product.categories?.[0]?.name || product.type?.value || "Alet & Donanım",
      brand: brandName,
      sku,
      rating: reviewsData.avg || 5.0,
    })

    setInCompare(isInCompare(product.id))
    setCompareNotice({ open: true, message: res.message })
  }

  const scrollToReviews = (targetHash: string) => {
    if (typeof window !== "undefined") {
      window.location.hash = targetHash
      window.dispatchEvent(new Event("hashchange"))
      const tabsElem = document.getElementById("product-tabs")
      if (tabsElem) {
        tabsElem.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  // Bu alan yalnızca admin panelindeki "Ürün Özeti" editöründen beslenir.
  // Ürün açıklaması, başlık veya başka alanlardan otomatik içerik üretilmez.
  const productSummary =
    typeof md.product_summary === "string"
      ? sanitizeRichTextHtml(md.product_summary).trim()
      : ""

  return (
    <div id="product-info" className="flex flex-col gap-y-3.5 relative font-sans h-full justify-between">
      <div className="space-y-3.5">
        {/* 1. Brand Tag & Main Title */}
        <div>
          {/* Mobile Only: Brand + Title Side-by-Side (Inline) with smaller font */}
          <div className="sm:hidden">
            <h1 className="text-sm font-bold text-slate-900 leading-snug tracking-tight">
              <span className="text-[#C98484] text-xs font-black tracking-wider uppercase mr-1.5 inline-block">
                {brandName}
              </span>
              {product.title}
            </h1>
          </div>

          {/* Desktop Only: Original Stacked Brand & Title */}
          <div className="hidden sm:block">
            <span className="text-[#C98484] text-xs font-extrabold tracking-widest uppercase mb-1 block">
              {brandName}
            </span>
            <Heading
              level="h1"
              className="text-lg sm:text-xl lg:text-[22px] font-black text-slate-900 leading-snug tracking-tight"
              data-testid="product-title"
            >
              {product.title}
            </Heading>
          </div>
        </div>

        {/* 2. Ratings, Reviews & Questions Row */}
        {/* Mobile Version: 3-column vertical stacked stat badges with dividers and hover animation */}
        <div className="sm:hidden grid grid-cols-3 divide-x divide-slate-200/90 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-2 shadow-2xs">
          {/* Item 1: Rating */}
          <button
            type="button"
            onClick={() => scrollToReviews("degerlendir")}
            className="group flex flex-col items-center justify-center py-1.5 px-1 rounded-xl hover:bg-rose-50/90 active:bg-rose-100/80 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-1">
              <span className="font-black text-slate-900 group-hover:text-[#C98484] text-sm leading-none transition-colors">
                {reviewsData.avg > 0 ? reviewsData.avg : (md.rating ? Number(md.rating) : "5.0")}
              </span>
              <Star className="w-3.5 h-3.5 fill-[#C98484] stroke-[#C98484] shrink-0" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#C98484] mt-1.5 leading-none transition-colors">
              Yıldız
            </span>
          </button>

          {/* Item 2: Değerlendirme */}
          <button
            type="button"
            onClick={() => scrollToReviews("degerlendir")}
            className="group flex flex-col items-center justify-center py-1.5 px-1 rounded-xl hover:bg-rose-50/90 active:bg-rose-100/80 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <span className="font-black text-slate-900 group-hover:text-[#C98484] text-sm leading-none transition-colors">
              {reviewsData.count || md.review_count || 0}
            </span>
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#C98484] mt-1.5 leading-none transition-colors">
              Değerlendirme
            </span>
          </button>

          {/* Item 3: Soru */}
          <button
            type="button"
            onClick={() => scrollToReviews("sorular")}
            className="group flex flex-col items-center justify-center py-1.5 px-1 rounded-xl hover:bg-rose-50/90 active:bg-rose-100/80 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <span className="font-black text-slate-900 group-hover:text-[#C98484] text-sm leading-none transition-colors">
              {md.questions_count || 0}
            </span>
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#C98484] mt-1.5 leading-none transition-colors">
              Soru
            </span>
          </button>
        </div>

        {/* Desktop Version: Original Text Row */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 font-medium py-1 border-b border-slate-100/80">
          <button
            type="button"
            onClick={() => scrollToReviews("degerlendir")}
            className="flex items-center gap-1.5 hover:text-[#C98484] transition-colors cursor-pointer"
          >
            <div className="flex text-[#C98484]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-3.5 h-3.5 fill-[#C98484] stroke-[#C98484]"
                />
              ))}
            </div>
            <span className="font-black text-slate-900 text-xs">
              {reviewsData.avg > 0 ? reviewsData.avg : (md.rating ? Number(md.rating) : "5.0")}
            </span>
          </button>

          <span className="text-slate-300">|</span>

          <button
            type="button"
            onClick={() => scrollToReviews("degerlendir")}
            className="hover:text-[#C98484] transition-colors font-medium text-slate-600 cursor-pointer"
          >
            {reviewsData.count || md.review_count || 0} Değerlendirme
          </button>

          <span className="text-slate-300">|</span>

          <button
            type="button"
            onClick={() => scrollToReviews("sorular")}
            className="hover:text-[#C98484] transition-colors font-medium text-slate-600 cursor-pointer"
          >
            {md.questions_count || 0} Soru
          </button>
        </div>

        {/* 3. Admin panelinden girilen ürün özeti (masaüstü) */}
        {productSummary ? (
          <div
            className="product-rich-text hidden sm:block prose prose-sm max-w-none py-1 text-slate-700 prose-headings:text-slate-900 prose-a:text-[#C98484]"
            dangerouslySetInnerHTML={{ __html: productSummary }}
          />
        ) : null}

        {/* 4. Action Buttons (Hidden on Mobile, Visible on Desktop) */}
        <div className="hidden sm:flex items-center gap-6 pt-1">
          <FavoriteButton
            product={{
              id: product.id,
              title: product.title,
              handle: product.handle,
              thumbnail: product.thumbnail,
              variantId: product.variants?.[0]?.id,
              price: cheapestPrice?.calculated_price,
            }}
            variant="text"
            className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-[#C98484] text-xs transition-colors cursor-pointer"
          />

          <span className="text-slate-300">|</span>

          <button
            type="button"
            onClick={handleToggleCompare}
            className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-[#C98484] text-xs transition-colors cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-slate-600 stroke-[1.8]" />
            <span>{inCompare ? "Karşılaştırıldı ✓" : "Karşılaştır"}</span>
          </button>
        </div>

        {/* 5. Stock Status + Stock Code Box (Side-by-Side on Mobile and Desktop) */}
        <div className="flex items-center gap-2 w-full">
          {/* Stock Status Badge */}
          {(() => {
            const variant = product.variants?.[0] as any
            const manageInventory = variant?.manage_inventory ?? false
            const inventoryQty = variant?.inventory_quantity ?? 999
            const allowBackorder = variant?.allow_backorder ?? false
            const isInStock = !manageInventory || allowBackorder || inventoryQty > 0
            return isInStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 px-3 py-2 text-xs font-extrabold text-emerald-700 shrink-0">
                <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                </span>
                Stokta Mevcut
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200/80 px-3 py-2 text-xs font-extrabold text-red-600 shrink-0">
                <span className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                  <X className="w-2.5 h-2.5 text-white stroke-[3]" />
                </span>
                Stokta Yok
              </span>
            )
          })()}

          {/* Stock Code: yalnızca yönetim panelinde girilmiş gerçek değer gösterilir. */}
          {sku && (
            <div className="rounded-xl bg-[#f8f9fa] border border-slate-200/50 py-2 px-3 sm:px-4 text-xs font-semibold text-slate-600 flex-1 min-w-0 text-left truncate">
              Stok Kodu: <strong className="font-extrabold text-slate-900 ml-1">{sku}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Custom Compare Notification Modal */}
      {compareNotice.open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95">
            {/* Top Right Close Button (X) */}
            <button
              type="button"
              onClick={() => setCompareNotice({ open: false, message: "" })}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full border border-slate-200/80 bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Kapat"
              title="Kapat"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#C98484] grid place-items-center mx-auto">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 pr-6 pl-6">{compareNotice.message}</h3>
            <p className="text-xs text-slate-500 font-medium">
              Eklendiğiniz ürünleri yan yana kıyaslamak için karşılaştırma sayfasını ziyaret edebilirsiniz.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Link
                href="/karsilastir"
                onClick={() => setCompareNotice({ open: false, message: "" })}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#C98484] py-2.5 text-xs font-black text-white shadow-xs hover:bg-rose-600 transition-colors"
              >
                Karşılaştır Sayfasına Git
              </Link>
              <button
                type="button"
                onClick={() => setCompareNotice({ open: false, message: "" })}
                className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Alışverişe Devam Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
