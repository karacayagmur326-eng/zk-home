"use client"

import { useEffect, useMemo, useState } from "react"
import type { HttpTypes } from "@medusajs/types"
import type { MobileSettings } from "@lib/content/mobile-settings"
import { Heart, Tag, Package, Search, Headphones, ArrowRight } from "@lib/icons"
import { getProductPrice } from "@lib/util/get-product-price"
import { parseTryPriceInput } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"
import { FAVORITES_CHANGED_EVENT, FAVORITES_STORAGE_KEY, FavoriteProduct, mergeFavoritesWithAccount, readFavorites } from "@modules/products/components/product-card-actions"

function productForFavorite(item: FavoriteProduct): HttpTypes.StoreProduct {
  if (item.product) return item.product
  // Local snapshots keep guest favorites usable while account data loads.
  const amount = (parseTryPriceInput(item.price || "") || 0) * 100
  return { id: item.id, title: item.title, handle: item.handle, thumbnail: item.thumbnail,
    variants: item.variantId ? [{ id: item.variantId, manage_inventory: false, prices: amount ? [{ amount, currency_code: "try" }] : [] }] : [],
  } as unknown as HttpTypes.StoreProduct
}

export default function FavoritesTemplate({ mobileSettings }: { mobileSettings?: MobileSettings }) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState("newest")

  useEffect(() => {
    let alive = true
    let revision = 0
    const sync = () => {
      const current = ++revision
      const snapshots = readFavorites()
      setFavorites(previous => snapshots.map(snapshot => ({ ...snapshot, product: previous.find(item => item.id === snapshot.id)?.product })))
      void fetch("/api/account/favorites", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(data => {
        if (alive && current === revision && data && data.authenticated !== false && Array.isArray(data.favorites)) {
          const ids = new Set(readFavorites().map(item => item.id))
          setFavorites(data.favorites.filter((item: FavoriteProduct) => ids.has(item.id)))
        }
      }).catch(() => {})
    }
    sync()
    void mergeFavoritesWithAccount().catch(() => {})
    const storage = (event: StorageEvent) => { if (event.key === FAVORITES_STORAGE_KEY) sync() }
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync)
    window.addEventListener("storage", storage)
    return () => { alive = false; revision++; window.removeEventListener(FAVORITES_CHANGED_EVENT, sync); window.removeEventListener("storage", storage) }
  }, [])

  const products = useMemo(() => favorites.map(item => {
    const product = productForFavorite(item)
    const price = getProductPrice({ product }).cheapestPrice
    const inStock = Boolean(product.variants?.some(variant => !variant.manage_inventory || variant.allow_backorder || variant.inventory_quantity == null || variant.inventory_quantity > 0))
    return { product, price: price?.calculated_price_number || 0, sale: Number(price?.percentage_diff || 0), inStock }
  }), [favorites])
  const visible = useMemo(() => products.filter(item =>
    item.product.title.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr")) &&
    (filter !== "sale" || item.sale > 0) && (filter !== "stock" || item.inStock)
  ).sort((a, b) => sort === "price_asc" ? a.price - b.price : sort === "price_desc" ? b.price - a.price : sort === "discount" ? b.sale - a.sale : 0), [products, search, filter, sort])

  return <section className="min-w-0 space-y-6 pb-8">
    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
      <div><h1 className="text-2xl font-semibold tracking-tight text-slate-950">{mobileSettings?.enabled ? mobileSettings.favorites.title : "Favorilerim"}</h1><p className="mt-1 max-w-lg text-sm text-slate-500">Beğendiğiniz ürünleri kaydedin, karşılaştırın ve dilediğiniz zaman sepete ekleyin.</p></div>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[{ label: "Toplam favori", count: products.length, Icon: Heart }, { label: "İndirimde", count: products.filter(item => item.sale > 0).length, Icon: Tag }, { label: "Stokta olan", count: products.filter(item => item.inStock).length, Icon: Package }].map(({ label, count, Icon }) =>
          <div key={label} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-sm sm:px-4"><Icon className="h-5 w-5 shrink-0 text-[#B98787]"/><div><p className="text-[10px] text-slate-500">{label}</p><p className="text-base font-semibold">{count}</p></div></div>)}
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm sm:p-4">
      <label className="relative min-w-0 flex-1 basis-52"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input aria-label="Favorilerimde ara" value={search} onChange={event => setSearch(event.target.value)} placeholder="Favorilerimde ara..." className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/40 pl-9 pr-3 text-sm"/></label>
      <select aria-label="Favorileri sırala" value={sort} onChange={event => setSort(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-sm"><option value="newest">En yeni</option><option value="price_asc">Fiyat: düşükten yükseğe</option><option value="price_desc">Fiyat: yüksekten düşüğe</option><option value="discount">İndirim oranı</option></select>
      <div className="flex flex-wrap gap-2">{[{ value: "all", label: "Tümü" }, { value: "sale", label: "İndirimdekiler" }, { value: "stock", label: "Stokta olanlar" }].map(item => <button type="button" key={item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)} className={`rounded-lg border px-3 py-2 text-xs transition-colors ${filter === item.value ? "border-[#B98787] bg-[#faf3f1] text-[#986969]" : "border-transparent bg-slate-50 text-slate-600"}`}>{item.label}</button>)}</div>
    </div>
    {visible.length ? <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{visible.map(({ product }) => <ProductPreview key={product.id} product={product}/>)}</div> : <div className="rounded-2xl border border-slate-100 bg-white px-6 py-12 text-center"><Heart className="mx-auto h-8 w-8 text-[#B98787]"/><p className="mt-3 text-sm text-slate-600">{favorites.length ? "Bu filtrelere uygun favori ürün bulunamadı." : "Henüz favori ürününüz bulunmuyor."}</p><LocalizedClientLink href="/kategoriler" className="mt-4 inline-flex text-sm font-medium text-[#986969]">Ürünleri keşfet <ArrowRight className="ml-2 h-4 w-4"/></LocalizedClientLink></div>}
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><Headphones className="h-6 w-6 text-[#B98787]"/><div><p className="font-medium">Sorunuz mu var?</p><p className="text-xs text-slate-500">Ürünlerimizle ilgili sorularınızı bize iletin.</p></div></div><LocalizedClientLink href="/iletisim" className="rounded-xl bg-[#B98787] px-5 py-3 text-sm text-white">Satıcıya sor</LocalizedClientLink></div>
  </section>
}
