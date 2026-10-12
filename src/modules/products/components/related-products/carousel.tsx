"use client"

import { useId } from "react"
import FeaturedProductCard from "@modules/products/components/featured-product-card"
import EditorialProductCarousel from "@modules/home/components/home-editorial/product-carousel"
import { HttpTypes } from "@medusajs/types"

export default function RelatedProductsCarousel({
  products = [], currencyCode = "TRY", title = "BENZER ÜRÜNLER",
  subtitle = "Aynı kategorideki diğer ürünleri keşfedin.",
}: { products?: HttpTypes.StoreProduct[]; currencyCode?: string; title?: string; subtitle?: string }) {
  const titleId = useId()
  if (!products.length) return null

  return <section aria-labelledby={titleId} className="w-full font-sans">
    <EditorialProductCarousel label={title} linkLabel="Tümünü Gör" intro={
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span className="mt-1 h-5 w-1.5 shrink-0 rounded-full bg-primary sm:h-7" />
        <div>
          <h2 id={titleId} className="text-base font-black uppercase leading-tight tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500 sm:text-xs">{subtitle}</p>
        </div>
      </div>
    }>
      {products.map(product => <FeaturedProductCard key={product.id} product={product} showSummary region={{ id: "local-fallback", currency_code: currencyCode.toLowerCase() } as any} />)}
    </EditorialProductCarousel>
  </section>
}
