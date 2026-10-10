"use client"

import React, { useRef, useId } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ChevronLeft, ChevronRight, ArrowRight } from "@lib/icons"
import FeaturedProductCard from "@modules/products/components/featured-product-card"
import { HttpTypes } from "@medusajs/types"

export default function RelatedProductsCarousel({
  products = [],
  currencyCode = "TRY",
  title = "BENZER ÜRÜNLER",
  subtitle = "Atölyeniz ve işleriniz için en uyumlu tamamlayıcı seçimler.",
}: {
  products?: HttpTypes.StoreProduct[]
  currencyCode?: string
  title?: string
  subtitle?: string
}) {
  const titleId = useId()
  const scrollRef = useRef<HTMLDivElement>(null)

  if (!products || products.length === 0) return null

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: "smooth" })
    }
  }

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: "smooth" })
    }
  }

  return (
    <section aria-labelledby={titleId} className="w-full font-sans">
      {/* ── Seamless Full-Width on Mobile | Elegant White Card on Desktop ── */}
      <div className="space-y-4 rounded-none border-0 bg-transparent p-0 shadow-none sm:space-y-6 sm:rounded-2xl sm:border sm:border-slate-200/80 sm:bg-white sm:p-7 sm:shadow-2xs lg:!rounded-none lg:!border-0 lg:!bg-transparent lg:!p-0 lg:!shadow-none">
        
        {/* Header Row: Vertical Orange Bar + Title + Subtitle + Controls & Link (Matching Screenshot 100%) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          
          {/* Left: Vertical Orange Bar Accent & Title & Subtitle */}
          <div className="flex items-start gap-2.5 sm:gap-3">
            <span className="w-1.5 h-5 sm:h-7 rounded-full bg-[#C98484] shrink-0 mt-0.5 sm:mt-1" />
            <div>
              <h2
                id={titleId}
                className="text-base sm:text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight"
              >
                {title}
              </h2>
              <p className="text-[11px] sm:text-xs font-medium text-slate-400 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right: Circular Scroll Buttons `<` `>` + Tümünü Gör Link (Hidden on Mobile) */}
          <div className="hidden sm:flex items-center justify-end gap-3 shrink-0 pt-1 sm:pt-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleScrollLeft}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200/90 bg-slate-50 hover:bg-white text-slate-700 hover:border-[#C98484] hover:text-[#C98484] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                title="Sola Kaydır"
              >
                <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
              <button
                type="button"
                onClick={handleScrollRight}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-slate-200/90 bg-slate-50 hover:bg-white text-slate-700 hover:border-[#C98484] hover:text-[#C98484] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                title="Sağa Kaydır"
              >
                <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            </div>

            {/* Tümünü Gör → Link */}
            <LocalizedClientLink
              href="/magaza"
              className="inline-flex items-center gap-1 text-xs font-black text-[#C98484] hover:underline transition-all ml-1"
            >
              <span>Tümünü Gör</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </LocalizedClientLink>
          </div>
        </div>

        {/* ── Product Carousel Grid Matching Featured Section ── */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pt-1 pb-1 items-stretch"
        >
          {products.map((p) => (
            <div key={p.id} className="w-[185px] sm:w-[240px] shrink-0 flex flex-col">
              <FeaturedProductCard
                product={p}
                showSummary
                region={
                  {
                    id: "local-fallback",
                    currency_code: currencyCode.toLowerCase(),
                  } as any
                }
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
