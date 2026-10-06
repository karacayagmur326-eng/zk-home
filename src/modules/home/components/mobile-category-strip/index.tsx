"use client"

import { useState, type CSSProperties } from "react"
import type { HttpTypes } from "@medusajs/types"
import { Pause, Play } from "@lib/icons"
import CategoryCard from "../category-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import useMotionEnabled, { enableSiteMotion } from "../use-motion-enabled"

export default function MobileCategoryStrip({ categories }: {
  categories: HttpTypes.StoreProductCategory[]
}) {
  const [paused, setPaused] = useState(false)
  const motionEnabled = useMotionEnabled()
  if (!categories.length) return null

  return (
    <section aria-label="Ürün kategorileri" className="mobile-category-strip border-b border-slate-200/60 bg-[#FCF7F6] py-3" data-paused={paused}>
      <div className="mb-2 flex items-center justify-between px-4">
        <h2 className="text-sm font-bold text-slate-900">Kategoriler</h2>
        <div className="flex items-center gap-2">
          <LocalizedClientLink href="/magaza" className="text-xs font-semibold text-[#A95E5E]">Tümünü Gör</LocalizedClientLink>
          <button type="button" className="mobile-category-motion grid h-9 w-9 place-items-center rounded-full border border-[#C98484]/30 bg-white text-[#A95E5E]"
            aria-label={!motionEnabled ? "Site animasyonlarını başlat" : paused ? "Kategorileri kaydırmaya devam et" : "Kategori kaymasını duraklat"}
            onClick={() => { if (!motionEnabled) { enableSiteMotion(); setPaused(false) } else setPaused((value) => !value) }}>
            {paused || !motionEnabled ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <div className="mobile-category-window overflow-hidden" tabIndex={-1}>
        <div className="mobile-category-track flex w-max" style={{ "--category-duration": `${Math.max(24, categories.length * 6)}s` } as CSSProperties}>
          {[0, 1].map((copy) => (
            <div key={copy} className="mobile-category-group flex shrink-0 items-start gap-3 px-1.5" aria-hidden={copy === 1 ? true : undefined}>
              {categories.map((category) => (
                <div key={category.id} className="w-[88px] shrink-0">
                  <CategoryCard category={category} circlePx={72} tabIndex={copy === 1 ? -1 : undefined} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
