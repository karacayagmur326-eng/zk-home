import Link from "next/link"
import { HttpTypes } from "@medusajs/types"
import { AppIcon } from "@lib/icons"
import type { MobileSettings } from "@lib/content/mobile-settings"
import FeaturedProductCard from "@modules/products/components/featured-product-card"

function resolveSectionProducts(title: string, products: HttpTypes.StoreProduct[], sectionIndex: number) {
  const lower = title.toLowerCase()

  // 1. Çok Satanlar -> Sort by sales count / order count
  if (lower.includes("satan") || lower.includes("popüler") || lower.includes("trend")) {
    const sortedBySales = [...products].sort((a: any, b: any) => {
      const aSales = Number(a.metadata?.sales_count || a.metadata?.order_count || a.sales_count || 0)
      const bSales = Number(b.metadata?.sales_count || b.metadata?.order_count || b.sales_count || 0)
      return bSales - aSales
    })
    const hasRealSales = sortedBySales.some((p: any) => Number(p.metadata?.sales_count || p.metadata?.order_count || p.sales_count || 0) > 0)
    if (hasRealSales) return sortedBySales
  }

  // 2. Kampanyalı / İndirimli Ürünler -> Filter products with real discounts
  if (lower.includes("kampanya") || lower.includes("indirim") || lower.includes("fırsat")) {
    const withDiscount = products.filter((p: any) => {
      const metadata = (p.metadata || {}) as Record<string, any>
      return (
        metadata.is_sale === true ||
        metadata.on_sale === true ||
        Boolean(metadata.discount_percentage) ||
        Boolean(p.variants?.some((v: any) => v.calculated_price?.price_type === "sale" || (v.original_price_number && v.calculated_price_number && v.original_price_number > v.calculated_price_number)))
      )
    })
    if (withDiscount.length > 0) return withDiscount
  }

  // 3. Yeni Ürünler -> Sort by creation date
  if (lower.includes("yeni")) {
    const sortedByDate = [...products].sort((a: any, b: any) => {
      const aDate = new Date(a.created_at || 0).getTime()
      const bDate = new Date(b.created_at || 0).getTime()
      return bDate - aDate
    })
    if (sortedByDate.length > 0) return sortedByDate
  }

  // Fallback slice
  const sliced = products.slice(sectionIndex * 2, sectionIndex * 2 + 6)
  return sliced.length > 0 ? sliced : products
}

import MobileHeroSlider from "@modules/home/components/mobile-hero-slider"

export default function MobileHomeExperience({
  settings,
  products,
  region,
  categories,
  prioritizeHero = true,
}: {
  settings: MobileSettings
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  categories: HttpTypes.StoreProductCategory[]
  prioritizeHero?: boolean
}) {
  const slides = settings.slides
    .filter((slide) => slide.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="bg-[#f5f6f7] pb-3 md:hidden font-sans">
      {/* ── Top Hero Slider with Autoplay & Bottom Right Dots ── */}
      <MobileHeroSlider slides={slides} prioritize={prioritizeHero} />

      {/* ── Shortcut Categories Strip ── */}
      <div className="mt-2 flex gap-4 overflow-x-auto bg-white px-3.5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {settings.shortcuts
          .filter((item) => item.active)
          .map((item) => {
            const handle = item.href.match(/^\/kategoriler\/([^/?#]+)/)?.[1]
            const category = handle
              ? categories.find((entry) => entry.handle === handle)
              : undefined
            const metadata = (category?.metadata || {}) as Record<string, unknown>
            const categoryImage =
              (typeof metadata.card_image_url === "string" && metadata.card_image_url) ||
              (typeof metadata.image_url === "string" && metadata.image_url) ||
              (typeof metadata.banner_url === "string" && metadata.banner_url) ||
              item.image ||
              ""
            const categoryIcon =
              (typeof metadata.icon === "string" && metadata.icon) || item.icon

            return (
            <Link
              href={item.href || "/"}
              key={item.id}
              aria-label={`${item.label} kategorisini incele`}
              className="w-[84px] shrink-0 text-center text-[11px] font-extrabold text-slate-800 hover:text-[#C98484] transition-colors group"
            >
              <span className="mx-auto mb-2 grid h-[66px] w-[66px] place-items-center rounded-full bg-slate-100/80 border border-slate-200/60 text-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] group-hover:bg-rose-50 group-hover:border-rose-200 group-hover:text-[#C98484] transition-all duration-200 group-hover:scale-105">
                <AppIcon name={categoryImage || categoryIcon} className="h-10 w-10 object-contain transition-transform group-hover:scale-110" />
              </span>
              <span className="line-clamp-2 block leading-tight">{item.label}</span>
            </Link>
            )
          })}
      </div>

      {/* ── Product Showcase Sections (Full Width White Background) ── */}
      {settings.homeSections
        .filter((section) => section.active)
        .map((section, sectionIndex) => (
          <section
            key={section.id}
            className="mt-2.5 bg-white py-2 shadow-2xs [content-visibility:auto] [contain-intrinsic-size:420px]"
          >
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <h2 className="text-base font-black text-slate-950">{section.title}</h2>
              <Link
                href={section.linkHref || "/magaza"}
                prefetch={false}
                aria-label={`${section.linkLabel}: ${section.title}`}
                className="text-[11px] font-extrabold text-[#C98484] hover:underline p-1"
              >
                {section.linkLabel} →
              </Link>
            </div>
            
            {/* Horizontal Scroll Product Track (With Vertical Divider Lines) */}
            <div className="flex overflow-x-auto px-1 pb-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden items-stretch divide-x divide-slate-100">
              {resolveSectionProducts(section.title, products, sectionIndex)
                .map((product, index) => (
                  <div
                    key={`${section.id}-${product.id}-${index}`}
                    className="w-[185px] sm:w-[210px] shrink-0 flex flex-col px-3"
                  >
                    <FeaturedProductCard product={product} region={region} />
                  </div>
                ))}
            </div>
          </section>
        ))}
    </div>
  )
}
