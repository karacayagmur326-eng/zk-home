"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import { Loader2, Check } from "@lib/icons"

type MobileInfiniteScrollProps = {
  initialProducts: HttpTypes.StoreProduct[]
  region: any
  viewMode?: string
  page: number
  totalPages: number
  sortBy?: string
  countryCode?: string
  collectionId?: string
  categoryId?: string
  searchQuery?: string
  hideOutOfStock?: string
  priceMin?: string
  priceMax?: string
}

export default function MobileInfiniteScroll({
  initialProducts = [],
  region,
  viewMode = "grid",
  page: initialPage = 1,
  totalPages: initialTotalPages = 1,
  sortBy = "created_at",
  countryCode = "tr",
  collectionId,
  categoryId,
  searchQuery,
  hideOutOfStock,
  priceMin,
  priceMax,
}: MobileInfiniteScrollProps) {
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>(initialProducts)
  const [loading, setLoading] = useState<boolean>(false)
  const [hasMore, setHasMore] = useState<boolean>(initialPage < initialTotalPages)

  const pageRef = useRef<number>(initialPage)
  const hasMoreRef = useRef<boolean>(initialPage < initialTotalPages)
  const isFetchingRef = useRef<boolean>(false)
  const observerTargetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  // Reset list ONLY when filter/query parameters change (not on parent re-renders)
  const filterKey = `${sortBy}-${collectionId || ""}-${categoryId || ""}-${searchQuery || ""}-${hideOutOfStock || ""}-${priceMin || ""}-${priceMax || ""}`
  const lastFilterKeyRef = useRef(filterKey)

  useEffect(() => {
    if (lastFilterKeyRef.current !== filterKey) {
      lastFilterKeyRef.current = filterKey
      setProducts(initialProducts)
      pageRef.current = initialPage
      setHasMore(initialPage < initialTotalPages)
      hasMoreRef.current = initialPage < initialTotalPages
      isFetchingRef.current = false
      setLoading(false)
    }
  }, [filterKey, initialProducts, initialPage, initialTotalPages])

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMoreRef.current) return
    isFetchingRef.current = true
    setLoading(true)

    try {
      const nextPage = pageRef.current + 1
      const params = new URLSearchParams({
        page: String(nextPage),
        sortBy: sortBy || "created_at",
        countryCode: countryCode || "tr",
      })

      if (collectionId) params.set("collectionId", collectionId)
      if (categoryId) params.set("categoryId", categoryId)
      if (searchQuery) params.set("searchQuery", searchQuery)
      if (hideOutOfStock) params.set("hideOutOfStock", hideOutOfStock)
      if (priceMin) params.set("priceMin", priceMin)
      if (priceMax) params.set("priceMax", priceMax)

      const res = await fetch(`/api/products/paginated?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        const newItems: HttpTypes.StoreProduct[] = data.products || []

        if (newItems.length > 0) {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id))
            const uniqueNew = newItems.filter((p) => !existingIds.has(p.id))
            return [...prev, ...uniqueNew]
          })
          pageRef.current = nextPage
          const canLoadMore = data.hasMore ?? nextPage < (data.totalPages || 1)
          setHasMore(canLoadMore)
          hasMoreRef.current = canLoadMore
        } else {
          setHasMore(false)
          hasMoreRef.current = false
        }
      }
    } catch {
      // Keep state on error
    } finally {
      setLoading(false)
      setTimeout(() => {
        isFetchingRef.current = false
      }, 300)
    }
  }, [sortBy, countryCode, collectionId, categoryId, searchQuery, hideOutOfStock, priceMin, priceMax])

  useEffect(() => {
    const target = observerTargetRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current && hasMoreRef.current) {
          void loadMore()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(target)
    return () => {
      observer.unobserve(target)
    }
  }, [loadMore])

  if (products.length === 0) return null

  // Chunk products into 2-item row pairs for grid view
  const productRows: HttpTypes.StoreProduct[][] = []
  for (let i = 0; i < products.length; i += 2) {
    productRows.push(products.slice(i, i + 2))
  }

  return (
    <div className="sm:hidden w-[calc(100%+2rem)] -mx-4">
      {/* Mobile Row Blocks with Vertical Gap between top and bottom product pairs */}
      {viewMode === "list" ? (
        <div className="flex flex-col gap-2.5">
          {products.map((p) => (
            <div key={p.id} className="bg-white p-2.5 flex flex-col justify-between border-y border-slate-200/80 shadow-2xs">
              <ProductPreview product={p} region={region} viewMode={viewMode} />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 bg-[#f5f5f5] py-1">
          {productRows.map((row) => {
            const rowKey = row.map((p) => p.id).join("-")
            return (
              <div
                key={rowKey}
                className="grid grid-cols-2 bg-white divide-x divide-slate-200/80 border-y border-slate-200/80 shadow-2xs overflow-hidden"
              >
                {row.map((p) => (
                  <div key={p.id} className="p-2.5 flex flex-col justify-between min-h-[290px]">
                    <ProductPreview product={p} region={region} viewMode={viewMode} />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Reserved Sentinel & Loading / Load More Container */}
      <div ref={observerTargetRef} className="min-h-[70px] w-full flex flex-col items-center justify-center my-3 px-4">
        {loading ? (
          <div className="flex items-center gap-2 text-xs font-bold text-[#C98484] bg-white px-5 py-3 rounded-full border border-rose-200 shadow-md animate-in fade-in">
            <Loader2 className="w-4 h-4 animate-spin text-[#C98484]" />
            <span>Daha fazla ürün yükleniyor...</span>
          </div>
        ) : hasMore ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="w-full max-w-xs py-3 px-6 bg-white hover:bg-rose-50 text-[#C98484] border border-rose-200 rounded-2xl text-xs font-extrabold shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Daha Fazla Ürün Yükle ({products.length} / {initialTotalPages * 12})</span>
          </button>
        ) : (
          products.length > 12 && (
            <div className="text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5 py-3">
              <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
              <span>Tüm ürünler görüntülendi ({products.length} Ürün)</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
