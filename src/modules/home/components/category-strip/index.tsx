"use client"

import { useEffect, useRef, useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { ArrowRight, ChevronLeft, ChevronRight } from "@lib/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CategoryCard from "@modules/home/components/category-card"

export default function CategoryStrip({
  categories = [],
}: {
  categories?: HttpTypes.StoreProductCategory[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Match the illustrated category cards in the main navigation menus.
  const selectedCategories = categories.flatMap(
    (category) => category.category_children || []
  )

  // Hide only when the catalog has no active categories.
  if (selectedCategories.length === 0) {
    return null
  }

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 6)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6)
  }

  useEffect(() => {
    checkScroll()
    const handleResize = () => checkScroll()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [selectedCategories.length])

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const step = 280
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    })
  }

  const circlePx = 88

  return (
    <section
      aria-labelledby="home-categories-title"
      className="relative border-b border-gray-100 bg-[#f8fafc] py-2 sm:py-3.5 select-none"
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      <div className="content-container px-2 sm:px-4">
        <div className="relative flex items-center justify-between gap-1 sm:gap-2">
          {/* Kategoriler Yatay Kaydırma Alanı */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            className="no-scrollbar touch-pan-x snap-x snap-mandatory overflow-x-auto overscroll-x-contain flex-1 px-1 py-1"
          >
            <div className="flex w-max items-start justify-start gap-2 py-1 sm:gap-3 md:gap-3.5 lg:gap-4.5">
              {selectedCategories.map((category) => (
                <div key={category.id} className="shrink-0 snap-start">
                  <CategoryCard
                    category={category}
                    circlePx={circlePx}
                    singleLine={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── SAĞ SABİT KONTROL ALANI: (<) (>) TÜMÜNÜ GÖR -> ── */}
          <div className="relative z-20 shrink-0 flex items-center gap-2.5 sm:gap-3 pl-3 sm:pl-4 bg-gradient-to-r from-transparent via-[#f8fafc] to-[#f8fafc]">
            <div className="h-8 w-[1px] bg-slate-200/80 hidden sm:block mr-1" />

            {/* Sol / Sağ Kaydırma Butonları */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                disabled={!canScrollLeft}
                aria-label="Önceki Kategoriler"
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors shadow-2xs cursor-pointer ${
                  canScrollLeft
                    ? "border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:border-[#C98484] hover:text-[#C98484]"
                    : "border-slate-200/60 bg-slate-100/70 text-slate-300 cursor-not-allowed"
                }`}
                title="Sola Kaydır"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                disabled={!canScrollRight}
                aria-label="Sonraki Kategoriler"
                className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors shadow-2xs cursor-pointer ${
                  canScrollRight
                    ? "border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:border-[#C98484] hover:text-[#C98484]"
                    : "border-slate-200/60 bg-slate-100/70 text-slate-300 cursor-not-allowed"
                }`}
                title="Sağa Kaydır"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Tümünü Gör Linki */}
            <LocalizedClientLink
              href="/magaza"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-black text-[#C98484] hover:underline transition-all ml-1 shrink-0"
            >
              <span>Tümünü Gör</span>
              <ArrowRight className="w-4 h-4" />
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}
