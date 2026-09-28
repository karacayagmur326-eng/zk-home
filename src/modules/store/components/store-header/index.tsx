"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { SortOptions } from "../refinement-list/sort-products"
import { LayoutGrid, List, ChevronDown } from "@lib/icons"
import clx from "clsx"

const SORT_OPTIONS = [
  { value: "created_at", label: "En Yeni" },
  { value: "price_asc", label: "Artan Fiyat" },
  { value: "price_desc", label: "Azalan Fiyat" },
]

export default function StoreHeader({
  sortBy,
  productCount,
  searchQuery,
  title,
  headingLevel = 1,
}: {
  sortBy: SortOptions
  productCount?: number
  searchQuery?: string
  title?: string
  headingLevel?: 1 | 2
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [open, setOpen] = useState(false)
  const viewMode = searchParams.get("viewMode") || "grid"

  const setQueryParams = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      params.delete("page")
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const selectedOption =
    SORT_OPTIONS.find((o) => o.value === sortBy) || SORT_OPTIONS[0]

  const renderTitleContent = () => {
    if (searchQuery) {
      return <span>“{searchQuery}” arama sonuçları</span>
    }
    if (title) {
      return <span className="text-[#C98484] font-semibold">{title}</span>
    }
    return <span>Tüm Ürünler</span>
  }

  return (
    <div className="relative z-30 flex flex-row items-center justify-between mb-2 sm:mb-7 my-1 sm:my-0 py-2.5 px-3.5 sm:p-4.5 sm:px-6 bg-white sm:bg-white border-y sm:border sm:border-slate-200/80 -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full shadow-2xs sm:shadow-2xs sm:rounded-2xl gap-3">
      <div className="min-w-0 flex-1">
        {headingLevel === 1 ? (
          <h1 data-testid="store-page-title" className="font-semibold text-gray-900 text-sm sm:text-2xl mb-0.5 sm:mb-1 normal-case tracking-tight line-clamp-1">
            {renderTitleContent()}
          </h1>
        ) : (
          <h2 data-testid="store-page-title" className="font-semibold text-gray-900 text-sm sm:text-2xl mb-0.5 sm:mb-1 normal-case tracking-tight line-clamp-1">
            {renderTitleContent()}
          </h2>
        )}
        {Boolean(productCount) && (
          <p className="text-[11px] sm:text-sm text-slate-500 font-medium">
            {productCount} ürün bulundu
          </p>
        )}
      </div>

      {Boolean(productCount) && <div className="flex items-center gap-3 shrink-0">
        {/* Unified Sorting Select (Right side of Tüm Ürünler on mobile) */}
        <div className="flex items-center gap-2">
          <span className="hidden text-sm font-medium text-gray-500 md:inline">Sırala:</span>
          <div className="relative z-[100]">
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold bg-slate-50/70 hover:bg-white text-gray-800 min-w-[125px] sm:min-w-[150px] flex items-center justify-between hover:border-[#C98484] transition-colors shadow-2xs cursor-pointer"
            >
              <span>{selectedOption.label}</span>
              <ChevronDown className="w-4 h-4 ml-1.5 text-gray-500" />
            </button>

            {open && (
              <>
                <div
                  className="fixed inset-0 z-[1000]"
                  onClick={() => setOpen(false)}
                />
                <div className="absolute top-full right-0 mt-1.5 w-full min-w-[140px] bg-white border border-slate-200 rounded-xl shadow-2xl z-[1001] overflow-hidden py-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setQueryParams("sortBy", opt.value)
                        setOpen(false)
                      }}
                      className={clx(
                        "w-full text-left px-3 py-2 text-xs sm:text-sm cursor-pointer transition-colors block",
                        sortBy === opt.value
                          ? "bg-rose-50 text-[#C98484] font-bold"
                          : "text-gray-700 hover:bg-rose-50 hover:text-[#C98484]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* View Mode Toggle (Hidden on Mobile, Visible on Desktop) */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="hidden text-sm font-medium text-gray-500 md:inline">Görünüm:</span>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setQueryParams("viewMode", "grid")}
              className={clx(
                "p-1.5 rounded-md transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-[#C98484] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
              title="Izgara Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setQueryParams("viewMode", "list")}
              className={clx(
                "p-1.5 rounded-md transition-all cursor-pointer",
                viewMode === "list"
                  ? "bg-[#C98484] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
              title="Liste Görünümü"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>}
    </div>
  )
}
