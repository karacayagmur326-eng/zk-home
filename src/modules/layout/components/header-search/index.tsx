"use client"

import { FormEvent, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Search, X, Loader2, ChevronRight, Tag, Lightbulb } from "@lib/icons"

interface SearchProduct {
  id: string
  title: string
  handle: string
  thumbnail: string
  price: number
  formatted_price: string
  category?: string | null
}

export default function HeaderSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<SearchProduct[]>([])
  const [totalResults, setTotalResults] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick)
    return () => document.removeEventListener("mousedown", closeOnOutsideClick)
  }, [])

  // Focus input on open
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Live instant search effect as user types
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setProducts([])
      setTotalResults(0)
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`)
        const data = await res.json()
        setProducts(data.products || [])
        setTotalResults(data.total || 0)
      } catch (err) {
        console.error("Search fetch error:", err)
      } finally {
        setLoading(false)
      }
    }, 180)

    return () => clearTimeout(timer)
  }, [query])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedQuery = query.trim()
    router.push(
      normalizedQuery
        ? `/magaza?q=${encodeURIComponent(normalizedQuery)}`
        : "/magaza"
    )
    setOpen(false)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false)
      }}
    >
      {/* Keep the compact search on narrower desktop screens. */}
      <button
        type="button"
        aria-label="Ürün aramasını aç"
        aria-expanded={open}
        aria-controls="header-search-panel"
        onClick={() => setOpen((value) => !value)}
        className={`flex h-9 sm:h-10 items-center justify-center 2xl:justify-between gap-2 rounded-circle border text-[12px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          open
            ? "border-primary bg-card text-foreground shadow-sm"
            : "border-border bg-input text-muted hover:border-primary hover:text-foreground"
        } w-9 sm:w-10 px-0 2xl:w-full 2xl:px-3.5`}
      >
        <span className="truncate hidden 2xl:inline">Ürün ara</span>
        <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
      </button>

      {/* Full-width Search Panel & Live Results Overlay */}
      {open && (
        <div
          id="header-search-panel"
          role="search"
          aria-label="Ürün arama"
          className="absolute right-0 top-[calc(100%+12px)] z-[100] w-[min(780px,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 p-4 sm:p-5 text-foreground shadow-[0_25px_60px_rgba(0,0,0,0.18)] transition-all animate-in fade-in slide-in-from-top-3 duration-200"
        >
          {/* Full-width Search Input Form */}
          <form onSubmit={submitSearch} className="relative w-full">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                />
                <input
                  ref={inputRef}
                  type="search"
                  name="q"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Ürün ara"
                  placeholder="Ürün adı, kategori veya marka yazın..."
                  autoComplete="off"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/80 dark:bg-slate-800/80 pl-11 pr-12 text-sm sm:text-base text-slate-900 dark:text-white outline-none placeholder:text-slate-400 focus:border-[#C98484] focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-[#C98484]/15 transition-all"
                />

                {loading ? (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-5 w-5 animate-spin text-[#C98484]" />
                  </div>
                ) : query ? (
                  <button
                    type="button"
                    aria-label="Aramayı temizle"
                    onClick={() => {
                      setQuery("")
                      inputRef.current?.focus()
                    }}
                    className="absolute right-3.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 transition-colors"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <button
                type="submit"
                className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C98484] px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-rose-600 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>Ara</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Live Search Results Dropdown List */}
          {query.trim().length >= 2 ? (
            <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              {loading && products.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2 font-medium">
                  <Loader2 className="h-4 w-4 animate-spin text-[#C98484]" />
                  <span>Sonuçlar aranıyor...</span>
                </div>
              ) : products.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      BULUNAN ÜRÜNLER ({totalResults})
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      Önizleme (Başlık ve Fiyat)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
                    {products.map((product) => (
                      <LocalizedClientLink
                        key={product.id}
                        href={`/urunler/${product.handle}`}
                        className="group flex items-center gap-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 p-2.5 transition-all hover:border-rose-200 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 hover:shadow-2xs"
                        onClick={() => setOpen(false)}
                      >
                        {/* Product Thumbnail */}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 bg-white p-1 overflow-hidden shadow-2xs">
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="h-full w-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Title & Category */}
                        <div className="min-w-0 flex-1">
                          {product.category && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#C98484] uppercase tracking-wider">
                              <Tag className="h-2.5 w-2.5" />
                              {product.category}
                            </span>
                          )}
                          <strong className="block text-xs font-bold leading-snug text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors line-clamp-1">
                            {product.title}
                          </strong>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0 pl-2">
                          <span className="block text-xs sm:text-sm font-extrabold text-[#C98484]">
                            {product.formatted_price}
                          </span>
                        </div>
                      </LocalizedClientLink>
                    ))}
                  </div>

                  {/* See all results button */}
                  <div className="pt-2 flex justify-center">
                    <LocalizedClientLink
                      href={`/magaza?q=${encodeURIComponent(query.trim())}`}
                      className="inline-flex items-center gap-2 text-xs font-bold text-[#C98484] hover:underline py-1"
                      onClick={() => setOpen(false)}
                    >
                      <span>Tüm {totalResults} sonucu gör</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </LocalizedClientLink>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    "{query}" ile eşleşen ürün bulunamadı.
                  </p>
                  <span className="mt-1 block text-[11px] text-slate-400">
                    Farklı bir arama terimi veya kelime yazmayı deneyebilirsiniz.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-3 flex items-start gap-2 px-1 text-[11px] text-slate-400 font-medium">
              <Lightbulb aria-hidden="true" className="h-4 w-4 shrink-0 text-[#C98484]" />
              <span>
                İpucu: En az 2 harf yazarak ürün adı, kategori veya marka
                araması yapabilirsiniz.
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
