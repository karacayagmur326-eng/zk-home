import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import RelatedProductsCarousel from "./carousel"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  const allProducts = await listProducts({
    queryParams: { limit: 24 },
    countryCode,
  })
    .then(({ response }) => {
      return (response.products || []).filter(
        (responseProduct) => responseProduct.id !== product.id
      )
    })
    .catch(() => [])

  const products = allProducts.slice(0, 8)
  const bestSellers = [...allProducts].reverse().slice(0, 8)
  const newArrivals = [...allProducts]
    .sort((a, b) => {
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0
      return timeB - timeA
    })
    .slice(0, 8)
  const discounted = allProducts
    .filter((p) => {
      const md = (p.metadata as Record<string, any>) || {}
      return md.discount_badge || md.badge || true
    })
    .slice(0, 8)

  const currencyCode = region?.currency_code || "TRY"

  return (
    <div className="w-full space-y-10 sm:space-y-0">
      {/* Main Carousel: BENZER ÜRÜNLER (Desktop & Mobile) */}
      <RelatedProductsCarousel
        products={products}
        currencyCode={currencyCode}
        title="BENZER ÜRÜNLER"
        subtitle="Atölyeniz ve işleriniz için en uyumlu tamamlayıcı seçimler."
      />

      {/* Mobile Only Carousels: Same Style below Benzer Ürünler */}
      <div className="block sm:hidden space-y-10 pt-4">
        {bestSellers.length > 0 && (
          <div className="pt-6 border-t border-slate-200/60">
            <RelatedProductsCarousel
              products={bestSellers}
              currencyCode={currencyCode}
              title="ÇOK SATAN ÜRÜNLER"
              subtitle="En çok tercih edilen ve performansıyla öne çıkan ürünler."
            />
          </div>
        )}

        {newArrivals.length > 0 && (
          <div className="pt-6 border-t border-slate-200/60">
            <RelatedProductsCarousel
              products={newArrivals}
              currencyCode={currencyCode}
              title="YENİ ÜRÜNLER"
              subtitle="Mağazaya yeni eklenen ürünleri inceleyin."
            />
          </div>
        )}

        {discounted.length > 0 && (
          <div className="pt-6 border-t border-slate-200/60">
            <RelatedProductsCarousel
              products={discounted}
              currencyCode={currencyCode}
              title="KAMPANYALI ÜRÜNLER"
              subtitle="Fırsat fiyatlı ve avantajlı indirimli ürün seçenekleri."
            />
          </div>
        )}
      </div>
    </div>
  )
}
