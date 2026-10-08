"use client"

import { useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { Heading } from "@modules/common/components/ui"
import {
  Star,
  Check,
  X,
} from "@lib/icons"
import { sanitizeRichTextHtml } from "@modules/common/components/rich-text-editor"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const [reviewsData, setReviewsData] = useState<{ count: number; avg: number }>({
    count: 0,
    avg: 0,
  })

  const md = (product.metadata as Record<string, any>) || {}
  const brandName = (md.brand_name as string) || product.collection?.title || (md.brand as string) || ""
  const sku = String(product.variants?.[0]?.sku || md.sku || "").trim()

  useEffect(() => {
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

    </div>
  )
}
