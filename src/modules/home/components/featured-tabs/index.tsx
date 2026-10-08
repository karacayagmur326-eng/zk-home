"use client"
import { useUrlState } from "@lib/hooks/use-url-state"

import { useState, useEffect, useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import FeaturedProductCard from "@modules/products/components/featured-product-card"
import { listProducts } from "@lib/data/products"
import { ArrowRight, ChevronLeft, ChevronRight } from "@lib/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { compactProductsForCards } from "@lib/util/product-card"

type ConfigTab = {
  id: string
  label: string
  tag_id: string
  is_active: boolean
}

const DEFAULT_TABS: ConfigTab[] = [
  { id: "tab-1", label: "Çok Satanlar", tag_id: "cok-satanlar", is_active: true },
  { id: "tab-2", label: "Yeni Ürünler", tag_id: "yeni-urunler", is_active: true },
  { id: "tab-3", label: "Kampanyalı Ürünler", tag_id: "kampanyali-urunler", is_active: true },
]

export function formatTabLabel(label: string): string {
  if (!label) return ""
  const lower = label.toLocaleLowerCase("tr-TR").trim()
  if (lower === "vitrin-cok-satan" || lower === "cok-satan" || lower === "cok-satanlar") return "Çok Satanlar"
  if (lower === "vitrin-yeni" || lower === "yeni") return "Yeni Ürünler"
  if (lower === "vitrin-kampanya" || lower === "kampanya" || lower === "kampanyali-urunler") return "Kampanyalı Ürünler"
  
  const clean = label.replace(/^vitrin-/i, "").replace(/-/g, " ").trim()
  return clean.split(" ").map((word) => {
    const lowerWord = word.toLocaleLowerCase("tr-TR")
    return lowerWord.charAt(0).toLocaleUpperCase("tr-TR") + lowerWord.slice(1)
  }).join(" ")
}

function ShowcaseBlock({
  title,
  subtitle,
  products,
  region,
}: {
  title: string
  subtitle: string
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -340, behavior: "smooth" })
  }

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 340, behavior: "smooth" })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-2xs space-y-6">
      {/* Header Row: Vertical Orange Bar + Title + Subtitle + Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Vertical Orange Bar Accent & Title & Subtitle */}
        <div className="flex items-start gap-3">
          <span className="w-1.5 h-7 rounded-full bg-[#C98484] shrink-0 mt-1" />
          <div>
            <h2 className="overflow-visible pb-0.5 pt-px text-xl font-semibold normal-case leading-[1.2] tracking-tight text-slate-900 sm:text-2xl">
              {title}
            </h2>
            <p className="text-xs font-medium text-slate-600 mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Right: Circular Scroll Buttons `<` `>` + Tümünü Gör Link */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleScrollLeft}
              className="w-9 h-9 rounded-full border border-slate-200/90 bg-slate-50 hover:bg-white text-slate-700 hover:border-[#C98484] hover:text-[#C98484] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              title="Sola Kaydır"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              onClick={handleScrollRight}
              className="w-9 h-9 rounded-full border border-slate-200/90 bg-slate-50 hover:bg-white text-slate-700 hover:border-[#C98484] hover:text-[#C98484] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              title="Sağa Kaydır"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>

          <LocalizedClientLink
            href="/magaza"
            className="inline-flex items-center gap-1 text-xs font-black text-[#C98484] hover:underline transition-all ml-1"
          >
            <span>Tümünü Gör</span>
            <ArrowRight className="w-4 h-4" />
          </LocalizedClientLink>
        </div>
      </div>

      {/* Product Carousel Grid */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar scroll-smooth pt-2 pb-2 items-stretch divide-x divide-slate-100"
      >
        {products.map((product, idx) => (
          <div key={`${title}-${product.id}-${idx}`} className="w-[200px] sm:w-[240px] shrink-0 flex flex-col px-3.5">
            <FeaturedProductCard product={product} region={region} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FeaturedTabs({
  region,
  countryCode,
  initialProducts,
}: {
  region: HttpTypes.StoreRegion
  countryCode: string
  initialProducts: HttpTypes.StoreProduct[]
}) {
  const [sectionTitle, setSectionTitle] = useState("Öne Çıkan Ürünler")
  const [sectionSubtitle, setSectionSubtitle] = useState("Atölyeniz için en güçlü seçimler.")
  
  const [configTabs, setConfigTabs] = useState<ConfigTab[]>(DEFAULT_TABS)
  const [activeTagId, setActiveTagId] = useUrlState<string>(DEFAULT_TABS[0].tag_id, "featured_tab", configTabs.map(tab => tab.tag_id))
  const [productsMap, setProductsMap] = useState<Record<string, HttpTypes.StoreProduct[]>>({})
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({})

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: "smooth" })
    }
  }

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: "smooth" })
    }
  }

  useEffect(() => {
    fetch("/api/catalog/featured-section")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        if (data.section?.title) setSectionTitle(data.section.title)
        if (data.section?.subtitle) setSectionSubtitle(data.section.subtitle)

        const rawTabs: ConfigTab[] = (data.tabs || []).filter((t: ConfigTab) => t.is_active)
        const tabs: ConfigTab[] = rawTabs.reduce((acc: ConfigTab[], current: ConfigTab) => {
          if (!acc.some((t) => t.tag_id === current.tag_id || t.label.toLowerCase() === current.label.toLowerCase())) {
            acc.push(current)
          }
          return acc
        }, [])

        if (tabs.length > 0) {
          setConfigTabs(tabs)
          const requested = new URL(window.location.href).searchParams.get("featured_tab")
          if (!tabs.some(t => t.tag_id === requested)) setActiveTagId(tabs[0].tag_id)
        }
      })
      .catch(() => {})
  }, [initialProducts])

  async function loadProductsForTag(tagId: string) {
    setLoadingMap((prev) => ({ ...prev, [tagId]: true }))
    try {
      const { response } = await listProducts({
        regionId: region.id,
        countryCode,
        queryParams: { tag_id: [tagId], limit: 12 },
      })
      let fetched = compactProductsForCards(response.products)
      if (!fetched || fetched.length === 0) {
        fetched = initialProducts || []
      }
      setProductsMap((prev) => ({ ...prev, [tagId]: fetched }))
    } catch {
      setProductsMap((prev) => ({ ...prev, [tagId]: initialProducts || [] }))
    } finally {
      setLoadingMap((prev) => ({ ...prev, [tagId]: false }))
    }
  }

  const fetchedForTag = activeTagId ? productsMap[activeTagId] : undefined
  const currentProducts = fetchedForTag && fetchedForTag.length > 0 ? fetchedForTag : initialProducts || []
  const isLoading = activeTagId ? Boolean(loadingMap[activeTagId]) && !productsMap[activeTagId] && !initialProducts.length : false

  // Derived Desktop Showcase Products with Dynamic Sales & Discount Filtering
  const getCokSatanProducts = () => {
    const tagged = productsMap["cok-satanlar"]
    if (tagged && tagged.length > 0) return tagged

    const sortedBySales = [...initialProducts].sort((a: any, b: any) => {
      const aSales = Number(a.metadata?.sales_count || a.metadata?.order_count || a.sales_count || 0)
      const bSales = Number(b.metadata?.sales_count || b.metadata?.order_count || b.sales_count || 0)
      return bSales - aSales
    })
    const hasRealSales = sortedBySales.some((p: any) => Number(p.metadata?.sales_count || p.metadata?.order_count || p.sales_count || 0) > 0)
    if (hasRealSales) return sortedBySales

    return initialProducts || []
  }

  const getKampanyaliProducts = () => {
    const tagged = productsMap["kampanyali-urunler"]
    if (tagged && tagged.length > 0) return tagged

    const withDiscount = initialProducts.filter((p: any) => {
      const metadata = (p.metadata || {}) as Record<string, any>
      return (
        metadata.is_sale === true ||
        metadata.on_sale === true ||
        Boolean(metadata.discount_percentage) ||
        Boolean(p.variants?.some((v: any) => v.calculated_price?.price_type === "sale" || (v.original_price_number && v.calculated_price_number && v.original_price_number > v.calculated_price_number)))
      )
    })

    if (withDiscount.length > 0) return withDiscount

    return initialProducts.length >= 6
      ? [...initialProducts.slice(4), ...initialProducts.slice(0, 4)]
      : initialProducts
  }

  const getYeniUrunlerProducts = () => {
    const tagged = productsMap["yeni-urunler"]
    if (tagged && tagged.length > 0) return tagged

    const sortedByDate = [...initialProducts].sort((a: any, b: any) => {
      const aDate = new Date(a.created_at || 0).getTime()
      const bDate = new Date(b.created_at || 0).getTime()
      return bDate - aDate
    })
    return sortedByDate.length > 0 ? sortedByDate : initialProducts
  }

  const cokSatanProducts = getCokSatanProducts()
  const yeniUrunlerProducts = getYeniUrunlerProducts()
  const kampanyaliProducts = getKampanyaliProducts()

  return (
    <section aria-labelledby="featured-products-title" className="w-full py-6 sm:py-8 font-sans">
      {/* ── DESKTOP VIEW: 3 SEPARATE SHOWCASE BLOCKS (NO TABS) ── */}
      <div className="hidden md:flex flex-col gap-8">
        <ShowcaseBlock
          title="Çok Satan Ürünler"
          subtitle="Yaşam alanlarınıza uyum sağlayan sevilen ürünleri keşfedin."
          products={cokSatanProducts}
          region={region}
        />
        <ShowcaseBlock
          title="Yeni Ürünler"
          subtitle="Evinize yeni bir dokunuş katacak ürünleri inceleyin."
          products={yeniUrunlerProducts}
          region={region}
        />
        <ShowcaseBlock
          title="Kampanyalı Ürünler"
          subtitle="Eviniz için seçili ürünlerdeki fırsatları keşfedin."
          products={kampanyaliProducts}
          region={region}
        />
      </div>

      {/* ── MOBILE VIEW: SINGLE CONTAINER WITH TAB PILLS (KEPT EXACTLY AS IS) ── */}
      <div className="md:hidden bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-6">
        {/* Header Row */}
        <div className="flex flex-col gap-4">
          {/* Title & Subtitle */}
          <div className="flex items-start gap-3">
            <span className="w-1.5 h-7 rounded-full bg-[#C98484] shrink-0 mt-1" />
            <div>
              <h2
                id="featured-products-title"
                className="overflow-visible pb-0.5 pt-px text-xl font-semibold normal-case leading-[1.2] tracking-tight text-slate-900"
              >
                {sectionTitle}
              </h2>
              <p className="text-xs font-medium text-slate-600 mt-0.5">{sectionSubtitle}</p>
            </div>
          </div>

          {/* Mobile Tab Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {configTabs.map((tab) => {
              const isActive = activeTagId === tab.tag_id
              const labelText = formatTabLabel(tab.label)
              const isFireTab = labelText.includes("Çok Satan")
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTagId(tab.tag_id)
                    if (!productsMap[tab.tag_id] && !loadingMap[tab.tag_id]) {
                      void loadProductsForTag(tab.tag_id)
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#C98484] text-white shadow-xs"
                      : "bg-slate-50 border border-slate-200/90 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {isFireTab && isActive && <span className="text-sm">🔥</span>}
                  <span>{labelText}</span>
                </button>
              )
            })}
          </div>

          {/* Right: Circular Scroll Buttons `<` `>` + Tümünü Gör Link */}
          <div className="flex items-center justify-between gap-3 shrink-0 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleScrollLeft}
                className="w-9 h-9 rounded-full border border-slate-200/90 bg-slate-50 hover:bg-white text-slate-700 hover:border-[#C98484] hover:text-[#C98484] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                title="Sola Kaydır"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                type="button"
                onClick={handleScrollRight}
                className="w-9 h-9 rounded-full border border-slate-200/90 bg-slate-50 hover:bg-white text-slate-700 hover:border-[#C98484] hover:text-[#C98484] flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                title="Sağa Kaydır"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <LocalizedClientLink
              href="/magaza"
              className="inline-flex items-center gap-1 text-xs font-black text-[#C98484] hover:underline transition-all"
            >
              <span>Tümünü Gör</span>
              <ArrowRight className="w-4 h-4" />
            </LocalizedClientLink>
          </div>
        </div>

        {/* Product Carousel Grid */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto no-scrollbar scroll-smooth pt-2 pb-2 items-stretch divide-x divide-slate-100"
        >
          {isLoading
            ? [...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-slate-100 rounded-2xl w-[185px] h-[340px] shrink-0"
                ></div>
              ))
            : currentProducts.map((product) => (
                <div key={product.id} className="w-[185px] shrink-0 flex flex-col px-3.5">
                  <FeaturedProductCard product={product} region={region} />
                </div>
              ))}
        </div>
      </div>
    </section>
  )
}
