"use client"

import React, { useEffect, useState, useMemo } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useToast } from "@modules/common/components/feedback"
import { addToCart } from "@lib/util/cart-feedback"
import {
  Heart,
  ShoppingBag,
  Tag,
  Search,
  ChevronDown,
  Star,
  Eye,
  ShoppingCart,
  Headphones,
  ArrowRight,
  Package,
  LayoutGrid,
  List,
} from "@lib/icons"
import type { MobileSettings } from "@lib/content/mobile-settings"
import {
  FAVORITES_STORAGE_KEY,
  FAVORITES_CHANGED_EVENT,
  FavoriteProduct,
  mergeFavoritesWithAccount,
  writeFavorites,
} from "@modules/products/components/product-card-actions"


export default function FavoritesTemplate({ mobileSettings }: { mobileSettings?: MobileSettings }) {
  const [favorites, setFavorites] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "sale" | "in_stock">("all")
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "discount">("newest")
  const [mobileView, setMobileView] = useState<"grid" | "list">("grid")
  const { toast } = useToast()

  const loadFavorites = () => {
    try {
      const saved = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
      const list = saved ? JSON.parse(saved) : []
      setFavorites(list && list.length > 0 ? list : [])
    } catch {
      setFavorites([])
    }
  }

  useEffect(() => {
    loadFavorites()
    void mergeFavoritesWithAccount().then((merged) => {
      if (merged) setFavorites(merged)
    })
    window.addEventListener(FAVORITES_CHANGED_EVENT, loadFavorites)
    return () =>
      window.removeEventListener(FAVORITES_CHANGED_EVENT, loadFavorites)
  }, [])

  const removeFavorite = (id: string, title: string) => {
    const next = favorites.filter((item) => item.id !== id)
    writeFavorites(next)
    setFavorites(next)
    void fetch(
      `/api/account/favorites?productId=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    )
    toast({
      title: "Favorilerden kaldırıldı",
      description: title,
      variant: "info",
    })
  }

  const handleAddToCart = async (product: any) => {
    try {
      if (product.variantId) {
        const newCount = await addToCart({
          variantId: product.variantId,
          quantity: 1,
          countryCode: "tr",
        })
        if (newCount === null) return
      }
      toast({
        title: "Sepete eklendi",
        description: product.title,
        variant: "success",
      })
    } catch {
      toast({
        title: "Sepete eklenemedi",
        description: "Lütfen tekrar deneyin.",
        variant: "danger",
      })
    }
  }

  // Statistics
  const totalFavorites = favorites.length
  const onSaleCount = useMemo(() => {
    return favorites.filter((item) => item.originalPrice || item.discountPercentage).length
  }, [favorites])

  const inStockCount = useMemo(() => {
    return favorites.filter((item) => item.stockStatus !== "out_of_stock").length
  }, [favorites])

  // Filtered & Sorted items
  const filteredFavorites = useMemo(() => {
    return favorites
      .filter((item) => {
        const matchesSearch =
          !searchQuery ||
          item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchQuery.toLowerCase())

        if (!matchesSearch) return false

        if (activeFilter === "sale") {
          return Boolean(item.originalPrice || item.discountPercentage)
        }
        if (activeFilter === "in_stock") {
          return item.stockStatus !== "out_of_stock"
        }
        return true
      })
      .sort((a, b) => {
        const priceA = parseFloat((a.price || "0").replace(/[^0-9,]/g, "").replace(",", ".")) || 0
        const priceB = parseFloat((b.price || "0").replace(/[^0-9,]/g, "").replace(",", ".")) || 0

        if (sortBy === "price_asc") return priceA - priceB
        if (sortBy === "price_desc") return priceB - priceA
        if (sortBy === "discount") {
          const discA = parseFloat((a.discountPercentage || "0").replace(/[^0-9]/g, "")) || 0
          const discB = parseFloat((b.discountPercentage || "0").replace(/[^0-9]/g, "")) || 0
          return discB - discA
        }
        return 0
      })
  }, [favorites, searchQuery, activeFilter, sortBy])

  return (<>
    {mobileSettings?.enabled && <div className="-mx-4 mt-0 pt-1 min-h-screen bg-[#f5f6f7] pb-24 md:hidden overflow-x-hidden w-full max-w-full">
      <div className="flex items-center justify-between bg-white px-4 py-3.5 border-b border-slate-100">
        <div>
          <h1 className="text-lg font-black text-slate-950">{mobileSettings.favorites.title}</h1>
          <p className="mt-0.5 text-[11px] font-medium text-slate-500">Beğendiğiniz ürünleri kaydedin.</p>
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200/80 p-0.5 bg-slate-50 shrink-0">
          <button
            onClick={() => setMobileView("grid")}
            aria-label="Izgara Görünümü"
            className={`grid h-7 w-7 place-items-center rounded-md transition-all cursor-pointer ${
              mobileView === "grid"
                ? "bg-[#C98484] text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            onClick={() => setMobileView("list")}
            aria-label="Liste Görünümü"
            className={`grid h-7 w-7 place-items-center rounded-md transition-all cursor-pointer ${
              mobileView === "list"
                ? "bg-[#C98484] text-white shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto bg-white px-4 pb-3 pt-2 [scrollbar-width:none] border-b border-slate-100">{mobileSettings.favorites.tabs.map((tabName, index) => <button key={tabName} onClick={() => setActiveFilter(index === 1 ? "sale" : index === 2 ? "in_stock" : "all")} className={`shrink-0 rounded-xl border px-3.5 py-1.5 text-[11px] font-bold transition-all ${activeFilter === (index === 1 ? "sale" : index === 2 ? "in_stock" : "all") ? "border-[#C98484] bg-rose-50 text-[#C98484]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{tabName}</button>)}</div>

      {filteredFavorites.length ? (
        mobileView === "grid" ? (
          <div className="w-full pt-1 pb-4">
            <div className="bg-white border-y border-slate-200/80 w-full overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-y divide-slate-100">
                {filteredFavorites.map((product) => (
                  <article key={product.id} className="relative flex flex-col justify-between bg-white p-2.5">
                    <div>
                      <button
                        onClick={() => removeFavorite(product.id, product.title)}
                        className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-[#C98484] shadow-2xs border border-slate-100 cursor-pointer"
                      >
                        <Heart className="h-3.5 w-3.5 fill-current" />
                      </button>

                      <LocalizedClientLink href={`/urunler/${product.handle}`} className="block aspect-square w-full bg-white p-1 relative overflow-hidden">
                        {product.discountPercentage && (
                          <span className="absolute top-1.5 left-1.5 z-10 rounded-md bg-[#e02b27] px-1.5 py-0.5 text-[9px] font-black text-white">
                            {product.discountPercentage}
                          </span>
                        )}
                        {product.thumbnail ? (
                          <img src={product.thumbnail} alt={product.title} className="h-full w-full object-contain p-1" />
                        ) : (
                          <ShoppingBag className="m-auto h-full w-10 text-slate-300" />
                        )}
                      </LocalizedClientLink>

                      <LocalizedClientLink href={`/urunler/${product.handle}`} className="block mt-1">
                        <h2 className="line-clamp-2 min-h-[30px] text-[11px] font-semibold leading-snug text-slate-900">
                          {product.title}
                        </h2>
                      </LocalizedClientLink>
                    </div>

                    <div className="mt-2 pt-1">
                      <div className="flex flex-col min-w-0 mb-1.5">
                        {product.originalPrice && (
                          <span className="text-[10px] text-slate-400 line-through leading-none">
                            {product.originalPrice}
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-black text-[#C98484]">
                          {product.price || "Fiyatı incele"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full rounded-lg bg-[#C98484] py-2 text-[11px] font-extrabold text-white flex items-center justify-center gap-1 active:scale-98 transition-all cursor-pointer"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Sepete Ekle</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full pt-1 pb-4">
            <div className="bg-white border-y border-slate-200/80 w-full overflow-hidden divide-y divide-slate-100">
              {filteredFavorites.map((product) => (
                <article key={product.id} className="grid grid-cols-[90px_1fr] bg-white p-2.5 gap-2.5 relative">
                  <LocalizedClientLink href={`/urunler/${product.handle}`} className="grid aspect-square place-items-center bg-white p-1">
                    {product.thumbnail ? (
                      <img src={product.thumbnail} alt={product.title} className="h-full w-full object-contain" />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-slate-300" />
                    )}
                  </LocalizedClientLink>
                  <div className="flex flex-col justify-between relative">
                    <button onClick={() => removeFavorite(product.id, product.title)} className="absolute right-0 top-0 text-[#C98484] cursor-pointer">
                      <Heart className="h-4 w-4 fill-current" />
                    </button>
                    <div>
                      <h2 className="line-clamp-2 pr-6 text-xs font-semibold text-slate-900 leading-snug">{product.title}</h2>
                      <div className="mt-1 flex items-center gap-1.5">
                        {product.originalPrice && <span className="text-[10px] text-slate-400 line-through">{product.originalPrice}</span>}
                        <span className="text-xs font-extrabold text-[#C98484]">{product.price || "Fiyatı incele"}</span>
                      </div>
                    </div>
                    <button onClick={() => handleAddToCart(product)} className="mt-2 w-full rounded-lg bg-[#C98484] py-1.5 text-[11px] font-extrabold text-white flex items-center justify-center gap-1 cursor-pointer">
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Sepete Ekle</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="m-3 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-2xs">
          <Heart className="h-12 w-12 text-[#C98484]" />
          <h2 className="mt-4 text-lg font-black">{mobileSettings.favorites.emptyTitle}</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{mobileSettings.favorites.emptyDescription}</p>
          <LocalizedClientLink href={mobileSettings.favorites.emptyButtonHref} className="mt-5 rounded-xl bg-[#C98484] px-5 py-3 text-xs font-extrabold text-white">
            {mobileSettings.favorites.emptyButtonLabel}
          </LocalizedClientLink>
        </div>
      )}
    </div>}
    <div className={`${mobileSettings?.enabled ? "hidden md:block" : "block"} w-full space-y-6 text-slate-900 font-sans`} data-testid="favorites-page-wrapper">
      {/* Header & KPI Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Favorilerim</h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Beğendiğiniz ürünleri kaydedin, karşılaştırın ve dilediğiniz zaman sepete ekleyin.
          </p>
        </div>

        {/* 3 KPI Summary Cards Grid matching screenshot */}
        <div className="grid grid-cols-3 gap-3.5 shrink-0">
          {/* Card 1: Toplam Favori */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#C98484] border border-rose-100/60 shadow-2xs">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Toplam Favori
              </span>
              <span className="block text-lg font-extrabold text-slate-900 mt-0.5">
                {totalFavorites}
              </span>
            </div>
          </div>

          {/* Card 2: İndirimde */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#C98484] border border-rose-100/60 shadow-2xs">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                İndirimde
              </span>
              <span className="block text-lg font-extrabold text-slate-900 mt-0.5">
                {onSaleCount}
              </span>
            </div>
          </div>

          {/* Card 3: Stokta Olan */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-soft flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#C98484] border border-rose-100/60 shadow-2xs">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Stokta Olan
              </span>
              <span className="block text-lg font-extrabold text-slate-900 mt-0.5">
                {inStockCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar (Search, Sort & Filters matching screenshot) */}
      <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-soft flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search & Sort Group */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Favorilerimde ara..."
              className="w-full h-10 rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
            />
          </div>

          {/* Sort Select */}
          <div className="relative shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sırala:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-10 rounded-2xl border border-slate-200 bg-white pl-3.5 pr-8 text-xs font-bold text-slate-800 outline-none focus:border-[#C98484] transition-colors appearance-none cursor-pointer"
              >
                <option value="newest">En Yeni</option>
                <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
                <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
                <option value="discount">En Çok İndirim</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filter Pills matching screenshot */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-white text-[#C98484] border border-[#C98484] shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tümü
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("sale")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "sale"
                ? "bg-white text-[#C98484] border border-[#C98484] shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>İndirimdekiler</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("in_stock")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "in_stock"
                ? "bg-white text-[#C98484] border border-[#C98484] shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Stokta Olanlar</span>
          </button>
        </div>
      </div>

      {/* Favorites Product Cards Grid matching screenshot media__1785150543156.png */}
      {filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFavorites.map((product) => (
            <div
              key={product.id}
              className="group rounded-3xl border border-slate-100 bg-white p-5 shadow-soft hover:shadow-md transition-all flex flex-col justify-between relative"
            >
              <div>
                {/* Header Row: Category Tag & Favorite Heart Button */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {product.category || "Genel"}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFavorite(product.id, product.title)}
                    aria-label="Favorilerden çıkar"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>
                </div>

                {/* Product Image */}
                <LocalizedClientLink
                  href={`/urunler/${product.handle}`}
                  className="block aspect-square w-full rounded-2xl bg-slate-50/50 p-4 mb-4 overflow-hidden relative"
                >
                  {product.thumbnail ? (
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-300">
                      <ShoppingBag className="h-12 w-12" />
                    </div>
                  )}
                </LocalizedClientLink>

                {/* Product Title */}
                <LocalizedClientLink
                  href={`/urunler/${product.handle}`}
                  className="block text-sm font-bold text-slate-900 group-hover:text-[#C98484] transition-colors line-clamp-2 min-h-[40px]"
                >
                  {product.title}
                </LocalizedClientLink>

                {/* Rating Stars */}
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex items-center text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    ({product.reviewCount || 128})
                  </span>
                </div>

                {/* Price Row */}
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-lg font-extrabold text-slate-900">
                    {product.price || "1.490,00 TL"}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs font-medium text-slate-400 line-through">
                      {product.originalPrice}
                    </span>
                  )}
                  {product.discountPercentage && (
                    <span className="px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600 font-bold text-[11px]">
                      {product.discountPercentage}
                    </span>
                  )}
                </div>

                {/* Stock Badge */}
                <div className="mt-2.5 mb-4">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                      product.stockStatus === "low_stock"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {product.stockText || "Stokta"}
                  </span>
                </div>
              </div>

              {/* Action Buttons Stack */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleAddToCart(product)}
                  className="w-full h-10 rounded-2xl bg-[#C98484] hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Sepete Ekle</span>
                </button>

                <LocalizedClientLink
                  href={`/urunler/${product.handle}`}
                  className="w-full h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <Eye className="h-4 w-4 text-slate-400" />
                  <span>Ürünü İncele</span>
                </LocalizedClientLink>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div
          className="rounded-3xl border border-slate-100 bg-white p-10 sm:p-14 text-center shadow-soft flex flex-col items-center justify-center space-y-4 mb-6"
          data-testid="no-favorites-container"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-500 border border-rose-100 shadow-xs mb-1">
            <Heart className="h-10 w-10 fill-current" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Henüz favori ürününüz yok
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
            Ürün kartlarındaki kalp simgesine dokunarak favori listenizi oluşturabilirsiniz.
          </p>

          <div className="pt-2">
            <LocalizedClientLink
              href="/magaza"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#C98484] hover:bg-rose-600 px-8 py-3.5 text-xs font-bold text-white shadow-md shadow-rose-500/20 transition-all cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Ürünleri İncele</span>
            </LocalizedClientLink>
          </div>
        </div>
      )}
    </div>
  </>)
}
