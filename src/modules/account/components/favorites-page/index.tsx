"use client"

import { Heart, ShoppingBag } from "@lib/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  AddToCartButton,
  FAVORITES_CHANGED_EVENT,
  FAVORITES_STORAGE_KEY,
  FavoriteProduct,
} from "@modules/products/components/product-card-actions"
import { useEffect, useState } from "react"

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])

  const loadFavorites = () => {
    try {
      const saved = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
      setFavorites(saved ? JSON.parse(saved) : [])
    } catch {
      setFavorites([])
    }
  }

  useEffect(() => {
    loadFavorites()
    window.addEventListener(FAVORITES_CHANGED_EVENT, loadFavorites)
    return () =>
      window.removeEventListener(FAVORITES_CHANGED_EVENT, loadFavorites)
  }, [])

  const removeFavorite = (id: string) => {
    const next = favorites.filter((item) => item.id !== id)
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next))
    setFavorites(next)
  }

  return (
    <main className="min-h-[65vh] bg-[#f5f5f5] py-8 sm:py-12">
      <div className="content-container">
        <div className="mb-8 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-rose-50 text-[#C98484]">
            <Heart className="h-5 w-5 fill-current" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-gray-950 sm:text-3xl">
              Favorilerim
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Beğendiğiniz ürünleri burada saklayabilirsiniz.
            </p>
          </div>
        </div>

        {favorites.length ? (
          <>
            {/* Mobile Layout: Single White Stage with Vertical Lines between Cards */}
            <div className="sm:hidden bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-slate-100 divide-y divide-slate-100">
                {favorites.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 flex flex-col justify-between relative bg-white"
                  >
                    <LocalizedClientLink
                      href={`/urunler/${product.handle}`}
                      className="block aspect-square bg-slate-50/50 rounded-xl p-2 mb-2"
                    >
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-slate-300">
                          <ShoppingBag className="h-8 w-8" />
                        </span>
                      )}
                    </LocalizedClientLink>

                    <div className="flex-1 flex flex-col justify-between space-y-2">
                      <LocalizedClientLink
                        href={`/urunler/${product.handle}`}
                        className="line-clamp-2 text-xs font-bold text-slate-900 leading-snug hover:text-[#C98484]"
                      >
                        {product.title}
                      </LocalizedClientLink>

                      <div className="flex items-center justify-between pt-1">
                        {product.price && (
                          <span className="text-xs font-black text-[#C98484]">
                            {product.price}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFavorite(product.id)}
                          aria-label="Favorilerden kaldır"
                          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-red-50 text-red-500 flex items-center justify-center transition-colors shrink-0"
                        >
                          <Heart className="h-3.5 w-3.5 fill-current" />
                        </button>
                      </div>

                      <AddToCartButton
                        variantId={product.variantId}
                        className="w-full text-xs py-1.5"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Layout Grid */}
            <ul className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favorites.map((product) => (
                <li
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between p-4"
                >
                  <LocalizedClientLink
                    href={`/urunler/${product.handle}`}
                    className="block aspect-square bg-slate-50/50 rounded-xl p-4 mb-3"
                  >
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.title}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-slate-300">
                        <ShoppingBag className="h-12 w-12" />
                      </span>
                    )}
                  </LocalizedClientLink>
                  <div className="space-y-2">
                    <LocalizedClientLink
                      href={`/urunler/${product.handle}`}
                      className="line-clamp-2 min-h-10 text-xs sm:text-sm font-bold text-slate-900 hover:text-[#C98484]"
                    >
                      {product.title}
                    </LocalizedClientLink>
                    {product.price && (
                      <p className="text-sm sm:text-base font-black text-[#C98484]">
                        {product.price}
                      </p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <AddToCartButton
                        variantId={product.variantId}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeFavorite(product.id)}
                        aria-label="Favorilerden kaldır"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 text-slate-400 hover:border-[#C98484] hover:text-[#C98484] transition-colors"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-gray-300" />
            <h2 className="mt-4 text-lg font-black text-gray-900">
              Henüz favori ürününüz yok
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Ürün kartlarındaki kalp simgesine dokunarak favori listenizi
              oluşturabilirsiniz.
            </p>
            <LocalizedClientLink
              href="/magaza"
              className="mt-6 inline-flex rounded-lg bg-[#C98484] px-5 py-3 text-sm font-bold text-white hover:bg-[#d94f00]"
            >
              Ürünleri İncele
            </LocalizedClientLink>
          </div>
        )}
      </div>
    </main>
  )
}
