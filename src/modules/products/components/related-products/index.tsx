import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { cachedQuery } from "@lib/admin/db"
import { HttpTypes } from "@medusajs/types"
import RelatedProductsCarousel from "./carousel"

export default async function RelatedProducts({ product, countryCode }: { product: HttpTypes.StoreProduct; countryCode: string }) {
  const md = product.metadata as Record<string, any> || {}
  const complementaryIds = Array.isArray(md.complementary_product_ids) ? md.complementary_product_ids.filter((id: unknown) => typeof id === "string" && id !== product.id).slice(0, 24) : []
  const [region, related, newest, complementary, sales] = await Promise.all([
    getRegion(countryCode),
    product.categories?.length ? listProducts({ queryParams: { limit: 9, category_id: product.categories.map(category => category.id) }, countryCode }).then(result => result.response.products.filter(item => item.id !== product.id).slice(0, 8)) : Promise.resolve([]),
    listProducts({ queryParams: { limit: 24, sort: "created_at" }, countryCode }).then(result => result.response.products.filter(item => item.id !== product.id)),
    complementaryIds.length ? listProducts({ queryParams: { limit: 24, id: complementaryIds }, countryCode }).then(result => result.response.products) : Promise.resolve([]),
    cachedQuery<{ product_id: string }>("seo-bestsellers", "SELECT i.product_id FROM store_order_item i JOIN store_order o ON o.id=i.order_id WHERE o.payment_status IN ('paid','captured') AND o.status NOT IN ('cancelled','canceled') GROUP BY i.product_id ORDER BY SUM(i.quantity) DESC LIMIT 9", [], 120).catch(() => []),
  ])
  const bestSellers = sales.length ? (await listProducts({ queryParams: { limit: 9, id: sales.map(item => item.product_id) }, countryCode })).response.products.filter(item => item.id !== product.id).sort((a,b) => sales.findIndex(item => item.product_id===a.id)-sales.findIndex(item => item.product_id===b.id)).slice(0,8) : []
  const discounted = newest.filter(item => item.variants?.some(variant => Number(variant.calculated_price?.original_amount) > Number(variant.calculated_price?.calculated_amount) && Number(variant.calculated_price?.calculated_amount) > 0)).slice(0,8)
  const currencyCode = region?.currency_code || "TRY"
  return <div className="w-full space-y-10">
    <RelatedProductsCarousel products={related} currencyCode={currencyCode} title="BENZER ÜRÜNLER" subtitle="Aynı kategorideki diğer ürünleri keşfedin." />
    <RelatedProductsCarousel products={complementary} currencyCode={currencyCode} title="TAMAMLAYICI ÜRÜNLER" subtitle="Bu ürünle birlikte değerlendirebileceğiniz seçenekler." />
    <div className="block sm:hidden space-y-10 pt-4">
      <RelatedProductsCarousel products={bestSellers} currencyCode={currencyCode} title="ÇOK SATAN ÜRÜNLER" subtitle="Tamamlanan satışlarda en çok tercih edilen ürünler." />
      <RelatedProductsCarousel products={newest.slice(0,8)} currencyCode={currencyCode} title="YENİ ÜRÜNLER" subtitle="Mağazaya yeni eklenen ürünleri inceleyin." />
      <RelatedProductsCarousel products={discounted} currencyCode={currencyCode} title="KAMPANYALI ÜRÜNLER" subtitle="Güncel indirimli ürün seçenekleri." />
    </div>
  </div>
}
