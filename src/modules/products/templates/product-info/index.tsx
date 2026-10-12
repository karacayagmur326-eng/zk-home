"use client"

import { useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { Star } from "@lib/icons"
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
  useEffect(() => {
    // Fetch real reviews for this product
    fetch(`/api/products/${product.id}/reviews`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
          const revs = data.reviews
          const count = revs.length
          const avg = revs.reduce((acc: number, r: any) => acc + Number(r.rating), 0) / count
          setReviewsData({ count, avg: Math.round(avg * 10) / 10 })
        }
      })
      .catch(() => {})
  }, [product.id])

  const scrollToReviews = (targetHash: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("product:section", { detail: targetHash }))
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
      ? sanitizeRichTextHtml(md.product_summary).replace(/<(\/?)h1\b/gi, "<$1h2").trim()
      : ""

  return (
    <div id="product-info" className="flex flex-col gap-y-3.5 relative font-sans h-full justify-between">
      <div className="space-y-3.5">
        {/* 1. Brand Tag & Main Title */}
        <div>
          <h1 className="text-sm sm:text-xl lg:text-[22px] font-black text-slate-900 leading-snug tracking-tight" data-testid="product-title">
            {brandName && <span className="mr-1.5 inline-block text-xs font-extrabold uppercase tracking-wider text-[#A95E5E] sm:mb-1 sm:block">{brandName}</span>}
            {md.h1_title || product.title}
          </h1>
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
              <span className="font-black text-slate-900 group-hover:text-[#A95E5E] text-sm leading-none transition-colors">
                {reviewsData.avg > 0 ? reviewsData.avg : "—"}
              </span>
              <Star className="w-3.5 h-3.5 fill-[#C98484] stroke-[#C98484] shrink-0" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 group-hover:text-[#A95E5E] mt-1.5 leading-none transition-colors">
              Yıldız
            </span>
          </button>

          {/* Item 2: Değerlendirme */}
          <button
            type="button"
            onClick={() => scrollToReviews("degerlendir")}
            className="group flex flex-col items-center justify-center py-1.5 px-1 rounded-xl hover:bg-rose-50/90 active:bg-rose-100/80 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <span className="font-black text-slate-900 group-hover:text-[#A95E5E] text-sm leading-none transition-colors">
              {reviewsData.count}
            </span>
            <span className="text-[10px] font-bold text-slate-500 group-hover:text-[#A95E5E] mt-1.5 leading-none transition-colors">
              Değerlendirme
            </span>
          </button>

          {/* Item 3: Soru */}
          <button
            type="button"
            onClick={() => scrollToReviews("sorular")}
            className="group flex flex-col items-center justify-center py-1.5 px-1 rounded-xl hover:bg-rose-50/90 active:bg-rose-100/80 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <span className="font-black text-slate-900 group-hover:text-[#A95E5E] text-sm leading-none transition-colors">
              {md.questions_count || 0}
            </span>
            <span className="text-[10px] font-bold text-slate-500 group-hover:text-[#A95E5E] mt-1.5 leading-none transition-colors">
              Soru
            </span>
          </button>
        </div>

        {/* Desktop Version: Original Text Row */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 font-medium py-1 border-b border-slate-100/80">
          <button
            type="button"
            onClick={() => scrollToReviews("degerlendir")}
            className="flex items-center gap-1.5 hover:text-[#A95E5E] transition-colors cursor-pointer"
          >
            <div className="flex text-[#A95E5E]">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 stroke-[#C98484] ${i < Math.round(reviewsData.avg) ? "fill-[#C98484]" : "fill-none"}`}
                />
              ))}
            </div>
            <span className="font-black text-slate-900 text-xs">
              {reviewsData.avg > 0 ? reviewsData.avg : "—"}
            </span>
          </button>

          <span className="text-slate-300">|</span>

          <button
            type="button"
            onClick={() => scrollToReviews("degerlendir")}
            className="hover:text-[#A95E5E] transition-colors font-medium text-slate-600 cursor-pointer"
          >
            {reviewsData.count} Değerlendirme
          </button>

          <span className="text-slate-300">|</span>

          <button
            type="button"
            onClick={() => scrollToReviews("sorular")}
            className="hover:text-[#A95E5E] transition-colors font-medium text-slate-600 cursor-pointer"
          >
            {md.questions_count || 0} Soru
          </button>
        </div>

        {/* 3. Admin panelinden girilen ürün özeti (masaüstü) */}
        {productSummary ? (
          <div
            className="product-rich-text prose prose-sm max-w-none py-1 text-slate-700 prose-headings:text-slate-900 prose-a:text-[#A95E5E]"
            dangerouslySetInnerHTML={{ __html: productSummary }}
          />
        ) : null}

      </div>

    </div>
  )
}
