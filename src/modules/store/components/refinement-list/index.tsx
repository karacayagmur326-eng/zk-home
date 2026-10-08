"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo, useEffect, useRef, useState } from "react"
import clx from "clsx"
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "@lib/icons"
import { Checkbox, Input } from "@modules/common/components/ui"

import {
  OPTION_VALUE_QUERY_KEY,
  parseOptionValueIds,
} from "@lib/util/product-option-filters"
import OptionsPicker from "./options-picker"
import SortProducts, { SortOptions } from "./sort-products"

import MobileTopCategoriesStrip from "@modules/store/components/mobile-top-categories-strip"
import { categoryPath } from "@lib/seo/category"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  hideOptionsPicker?: boolean
  sidebarMenu?: any
  secondaryMenu?: any
  initialCategories?: any[]
  fixedCollectionId?: string
  initialCollections?: any[]
  "data-testid"?: string
}

let globalNavCache: {
  categories: any[]
  categoryGroups: any[]
  collections: any[]
} | null = null

const RefinementList = ({
  sortBy,
  hideOptionsPicker = true,
  sidebarMenu,
  secondaryMenu,
  initialCategories = [],
  initialCollections = [],
  fixedCollectionId,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [customSidebarMenu, setCustomSidebarMenu] = useState<any>(
    () => sidebarMenu || secondaryMenu || null
  )

  const [categories, setCategories] = useState<any[]>(
    () => globalNavCache?.categoryGroups || initialCategories
  )
  const [collections, setCollections] = useState<any[]>(
    () => globalNavCache?.collections || initialCollections
  )
  const [brandSearch, setBrandSearch] = useState("")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const filterTriggerRef = useRef<HTMLButtonElement>(null)
  const filterPanelRef = useRef<HTMLElement>(null)
  const [showAllBrands, setShowAllBrands] = useState(false)
  const [openCategoryGroups, setOpenCategoryGroups] = useState<
    Record<string, boolean>
  >({})
  const [openSections, setOpenSections] = useState({
    categories: true,
    filter: true,
    brand: true,
    stock: true,
  })

  const [priceMin, setPriceMin] = useState(searchParams.get("price_min") || "")
  const [priceMax, setPriceMax] = useState(searchParams.get("price_max") || "")

  // Sync state if URL changes externally
  useEffect(() => {
    setPriceMin(searchParams.get("price_min") || "")
    setPriceMax(searchParams.get("price_max") || "")
  }, [searchParams])

  useEffect(() => {
    if (!mobileFiltersOpen) return

    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileFiltersOpen(false)
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", closeOnEscape)
    filterPanelRef.current?.querySelector<HTMLElement>("button")?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
      filterTriggerRef.current?.focus()
    }
  }, [mobileFiltersOpen])

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  useEffect(() => {
    if (sidebarMenu || secondaryMenu) {
      setCustomSidebarMenu(sidebarMenu || secondaryMenu)
    }
  }, [sidebarMenu, secondaryMenu])

  const hasCustomSidebar = Boolean(
    customSidebarMenu?.items && customSidebarMenu.items.length > 0
  )

  const isItemActive = useCallback(
    (url?: string) => {
      if (!url || url === "#") return false
      const cleanUrl = url.split("?")[0].replace(/\/$/, "")
      const cleanPath = pathname.replace(/\/$/, "")
      if (cleanPath === cleanUrl) return true
      if (
        cleanUrl !== "" &&
        cleanUrl !== "/" &&
        cleanPath.startsWith(cleanUrl + "/")
      ) {
        return true
      }
      return false
    },
    [pathname]
  )

  const hasActiveChild = useCallback(
    (item: any): boolean => {
      if (isItemActive(item.url)) return true
      if (Array.isArray(item.children)) {
        return item.children.some((child: any) => hasActiveChild(child))
      }
      return false
    },
    [isItemActive]
  )

  useEffect(() => {
    if (hasCustomSidebar && customSidebarMenu?.items) {
      setOpenCategoryGroups((prev) => {
        const next = { ...prev }
        const expandActive = (items: any[]) => {
          items.forEach((it: any, idx: number) => {
            const key = it.id || `menu_item_${idx}`
            if (Array.isArray(it.children) && it.children.length > 0) {
              if (it.children.some((child: any) => hasActiveChild(child))) {
                next[key] = true
              } else if (next[key] === undefined) {
                next[key] = false
              }
              expandActive(it.children)
            }
          })
        }
        expandActive(customSidebarMenu.items)
        return next
      })
    }
  }, [hasCustomSidebar, customSidebarMenu, hasActiveChild])

  const renderSidebarItem = (item: any, depth = 0, index = 0) => {
    const itemKey = item.id || `item_${depth}_${index}`
    const children = Array.isArray(item.children) ? item.children : []
    const hasChildren = children.length > 0
    const isActive = isItemActive(item.url)
    const isOpen = Boolean(openCategoryGroups[itemKey])

    return (
      <li
        key={itemKey}
        className={clx(
          depth === 0 && "border-t border-gray-100 first:border-t-0 pt-1"
        )}
      >
        <div
          className={clx(
            "flex items-center rounded-lg transition-colors hover:bg-rose-50",
            isActive && "bg-rose-50 text-[#C98484]"
          )}
        >
          <button
            type="button"
            onClick={() => {
              if (item.url && item.url !== "#") {
                router.push(item.url)
                setMobileFiltersOpen(false)
              } else if (hasChildren) {
                setOpenCategoryGroups((current) => ({
                  ...current,
                  [itemKey]: !current[itemKey],
                }))
              }
            }}
            className={clx(
              "min-w-0 flex-1 px-2 py-2 text-left truncate transition-colors",
              depth === 0
                ? "text-[12.5px] xl:text-[13px]"
                : "text-[12px] xl:text-[12.5px]",
              isActive
                ? "font-bold text-[#C98484]"
                : depth === 0
                ? "font-bold text-gray-900 hover:text-[#C98484]"
                : "font-medium text-gray-700 hover:text-[#C98484]"
            )}
          >
            {item.label}
          </button>

          {hasChildren && (
            <button
              type="button"
              aria-label={`${item.label} alt menüsünü ${
                isOpen ? "kapat" : "aç"
              }`}
              aria-expanded={isOpen}
              onClick={(e) => {
                e.stopPropagation()
                setOpenCategoryGroups((current) => ({
                  ...current,
                  [itemKey]: !current[itemKey],
                }))
              }}
              className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-[#C98484]"
            >
              {isOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {isOpen && hasChildren && (
          <ul className="mb-1 ml-3 border-l border-rose-200 pl-2 flex flex-col gap-0.5">
            {children.map((child: any, cIdx: number) =>
              renderSidebarItem(child, depth + 1, cIdx)
            )}
          </ul>
        )}
      </li>
    )
  }

  useEffect(() => {
    const updateGroups = (groups: any[]) => {
      setOpenCategoryGroups((prev) => {
        const nextState = { ...prev }
        groups.forEach((category: any) => {
          const isCurrentActive =
            pathname.includes(categoryPath(category)) ||
            category.category_children?.some((child: any) =>
              pathname.includes(categoryPath(child)) ||
              child.category_children?.some((grandchild: any) => pathname.includes(categoryPath(grandchild)))
            )
          if (isCurrentActive) {
            nextState[category.id] = true
          } else if (nextState[category.id] === undefined) {
            nextState[category.id] = false
          }
        })
        return nextState
      })
    }

    if (!globalNavCache && (initialCategories.length || initialCollections.length)) {
      globalNavCache = {
        categories: initialCategories,
        categoryGroups: initialCategories,
        collections: initialCollections,
      }
    }

    if (globalNavCache) {
      updateGroups(globalNavCache.categoryGroups)
      return
    }

    fetch("/api/catalog/navigation")
      .then((response) => response.json())
      .then((res) => {
        if (res.sidebarMenu) {
          setCustomSidebarMenu((prev: any) => prev || res.sidebarMenu)
        }
        if (res.categories) {
          const categoryGroups = res.categories.filter(
            (category: any) => !category.parent_category_id && !category.parent_category
          )
          globalNavCache = {
            categories: res.categories,
            categoryGroups,
            collections: res.collections || [],
          }
          setCategories(categoryGroups)
          setCollections(res.collections || [])
          updateGroups(categoryGroups)
        }
      })
      .catch((err) => console.error("Categories fetch error:", err))
  }, [pathname, initialCategories, initialCollections])

  const updateQueryParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      updater(params)

      params.delete("page")

      const queryString = params.toString()
      const currentQuery = searchParams.toString()
      const nextPath = queryString ? `${pathname}?${queryString}` : pathname
      const currentPath = currentQuery
        ? `${pathname}?${currentQuery}`
        : pathname

      if (nextPath !== currentPath) {
        router.push(nextPath)
      }
    },
    [pathname, router, searchParams],
  )

  const setQueryParams = (name: string, value: string) =>
    updateQueryParams((params) => {
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
    })

  const applyPriceFilter = () => {
    updateQueryParams((params) => {
      if (priceMin) params.set("price_min", priceMin)
      else params.delete("price_min")

      if (priceMax) params.set("price_max", priceMax)
      else params.delete("price_max")
    })
  }

  const selectedOptionValueIds = useMemo(
    () => parseOptionValueIds(searchParams),
    [searchParams],
  )

  const setOptionValueIds = (valueIds: string[]) =>
    updateQueryParams((params) => {
      params.delete(OPTION_VALUE_QUERY_KEY)
      valueIds.forEach((valueId) =>
        params.append(OPTION_VALUE_QUERY_KEY, valueId),
      )
    })

  const selectedCollectionIds = fixedCollectionId ? [fixedCollectionId] : searchParams.getAll("collection_id")
  const hideOutOfStock = searchParams.get("hide_out_of_stock") === "true"

  const toggleCollection = (id: string) => {
    if (fixedCollectionId) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("page")
      params.delete("collection_id")
      if (id !== fixedCollectionId) params.set("collection_id", id)
      router.push(`/magaza${params.size ? `?${params}` : ""}`)
      return
    }
    updateQueryParams((params) => {
      const nextIds = new Set(params.getAll("collection_id"))
      if (nextIds.has(id)) nextIds.delete(id)
      else nextIds.add(id)
      params.delete("collection_id")
      nextIds.forEach((collectionId) => params.append("collection_id", collectionId))
    })
  }

  const toggleStock = () => {
    updateQueryParams((params) => {
      if (hideOutOfStock) {
        params.delete("hide_out_of_stock")
      } else {
        params.set("hide_out_of_stock", "true")
      }
    })
  }

  const clearFilters = () => {
    updateQueryParams((params) => {
      params.delete("collection_id")
      params.delete("hide_out_of_stock")
      params.delete(OPTION_VALUE_QUERY_KEY)
      params.delete("price_min")
      params.delete("price_max")
    })
    setPriceMin("")
    setPriceMax("")
    setBrandSearch("")
  }

  const filteredCollections = collections.filter((c) =>
    c.title.toLowerCase().includes(brandSearch.toLowerCase()),
  )
  const visibleCollections = showAllBrands
    ? filteredCollections
    : filteredCollections.slice(0, 6)

  return (
    <>
      {/* Mobile Only: Top Categories Horizontal Circle Strip */}
      <MobileTopCategoriesStrip categories={initialCategories} />

      {mobileFiltersOpen && (
        <button
          type="button"
          aria-label="Filtreleri kapat"
          onClick={() => setMobileFiltersOpen(false)}
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[1px] lg:hidden"
        />
      )}

      <aside
        ref={filterPanelRef}
        id="store-filters"
        role={mobileFiltersOpen ? "dialog" : undefined}
        aria-modal={mobileFiltersOpen ? true : undefined}
        aria-label="Ürün filtreleri"
        className={clx(
          "fixed inset-y-0 left-0 z-[90] flex w-[min(340px,90vw)] flex-col gap-0 overflow-y-auto border-r border-gray-100 bg-white p-5 shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:mb-8 lg:w-[275px] xl:w-[285px] lg:flex-shrink-0 lg:translate-x-0 lg:rounded-xl lg:border lg:p-5 lg:shadow-sm",
          mobileFiltersOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-5 flex items-center justify-between border-b border-gray-200 pb-4 lg:hidden">
          <span className="inline-flex items-center gap-2 text-base font-black text-gray-900">
            <SlidersHorizontal className="h-4 w-4 text-[#C98484]" />
            Filtreler
          </span>
          <button
            type="button"
            aria-label="Filtreleri kapat"
            onClick={() => setMobileFiltersOpen(false)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Kategoriler Section */}
        <div className="border-b border-gray-200 pb-4 mb-4 px-1">
          <button
            onClick={() => toggleSection("categories")}
            className="flex items-center justify-between w-full text-left font-bold text-[15px] text-gray-900 mb-4"
          >
            {hasCustomSidebar ? (customSidebarMenu.name || "Kategoriler") : "Kategoriler"}
            {openSections.categories ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {openSections.categories && (
            <ul className="flex flex-col gap-1 text-[13px] text-gray-600">
              {hasCustomSidebar ? (
                customSidebarMenu.items.map((item: any, idx: number) =>
                  renderSidebarItem(item, 0, idx)
                )
              ) : (
                <>
                  <li>
                    <button
                      type="button"
                      onClick={() => router.push("/magaza")}
                      className={clx(
                        "w-full rounded-lg px-2 py-2 text-left text-[12.5px] xl:text-[13px] transition-colors hover:bg-rose-50 hover:text-[#C98484]",
                        !pathname.includes("/kategoriler") &&
                          "font-bold text-[#C98484]",
                      )}
                    >
                      Tüm Kategoriler
                    </button>
                  </li>
                  {categories.map((cat) => {
                    const children = Array.isArray(cat.category_children)
                      ? cat.category_children
                      : []
                    const isActive = pathname.includes(categoryPath(cat))
                    const isOpen = Boolean(openCategoryGroups[cat.id])

                    return (
                      <li key={cat.id} className="border-t border-gray-100 pt-1">
                        <div
                          className={clx(
                            "flex items-center rounded-lg transition-colors hover:bg-rose-50",
                            isActive && "bg-rose-50 text-[#C98484]",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              router.push(categoryPath(cat))
                            }
                            className="min-w-0 flex-1 px-2 py-2 text-left font-bold text-[12.5px] xl:text-[13px] text-gray-900 hover:text-[#C98484] truncate"
                          >
                            {cat.name}
                          </button>
                          {children.length > 0 && (
                            <button
                              type="button"
                              aria-label={`${cat.name} alt kategorilerini ${
                                isOpen ? "kapat" : "aç"
                              }`}
                              aria-expanded={isOpen}
                              onClick={() =>
                                setOpenCategoryGroups((current) => ({
                                  ...current,
                                  [cat.id]: !current[cat.id],
                                }))
                              }
                              className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-[#C98484]"
                            >
                              {isOpen ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        {isOpen && children.length > 0 && (
                          <ul className="mb-1 ml-3 border-l border-rose-200 pl-2">
                            {children.map((child: any) => {
                              const childActive = pathname.includes(categoryPath(child))
                              const grandchildren = Array.isArray(child.category_children) ? child.category_children : []
                              const descendantActive = grandchildren.some((grandchild: any) => pathname.includes(categoryPath(grandchild)))
                              return (
                                <li key={child.id}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      router.push(
                                        categoryPath(child),
                                      )
                                    }
                                    className={clx(
                                      "w-full rounded-md px-2 py-2 text-left text-[12.5px] transition-colors hover:bg-rose-50 hover:text-[#C98484]",
                                      (childActive || descendantActive) &&
                                        "bg-rose-50 font-bold text-[#C98484]",
                                    )}
                                  >
                                    {child.name}
                                  </button>
                                  {grandchildren.length > 0 && (
                                    <ul className="mb-1 ml-2 border-l border-rose-200 pl-2">
                                      {grandchildren.map((grandchild: any) => (
                                        <li key={grandchild.id}>
                                          <button
                                            type="button"
                                            onClick={() => router.push(categoryPath(grandchild))}
                                            className={clx(
                                              "w-full rounded-md px-2 py-1.5 text-left text-xs text-gray-600 transition-colors hover:bg-rose-50 hover:text-[#C98484]",
                                              pathname.includes(categoryPath(grandchild)) && "font-semibold text-[#C98484]",
                                            )}
                                          >
                                            {grandchild.name}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </>
              )}
            </ul>
          )}
        </div>

        <div className="px-2 font-bold text-[15px] text-gray-900 mb-4">
          Filtrele
        </div>

        {/* Fiyat Section with Dual Range Slider matching Image 1 */}
        <div className="border-b border-gray-200 pb-5 mb-5 px-2">
          <button
            onClick={() => toggleSection("filter")}
            className="flex items-center justify-between w-full text-left font-bold text-[13px] text-gray-800 mb-4"
          >
            Fiyat
            {openSections.filter ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {openSections.filter && (
            <div className="flex flex-col gap-4">
              {/* Visual Orange Dual Range Slider */}
              <div className="relative w-full py-2 flex items-center">
                {/* Track background */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full relative">
                  {/* Active orange bar */}
                  <div
                    className="absolute h-1.5 bg-[#C98484] rounded-full"
                    style={{
                      left: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((priceMin ? Number(priceMin) : 250) / 10000) * 100,
                        ),
                      )}%`,
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((priceMax ? Number(priceMax) : 7500) / 10000) * 100,
                        ) -
                          Math.max(
                            0,
                            Math.min(
                              100,
                              ((priceMin ? Number(priceMin) : 250) / 10000) *
                                100,
                            ),
                          ),
                      )}%`,
                    }}
                  />
                </div>

                {/* Range Dual Input 1 (Min) */}
                <input
                  type="range"
                  min={0}
                  max={10000}
                  step={50}
                  value={priceMin !== "" ? Number(priceMin) : 250}
                  onChange={(e) => {
                    const val = Math.min(
                      Number(e.target.value),
                      (priceMax !== "" ? Number(priceMax) : 7500) - 100,
                    )
                    setPriceMin(String(val))
                  }}
                  onMouseUp={applyPriceFilter}
                  onTouchEnd={applyPriceFilter}
                  className="absolute w-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C98484] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none"
                />

                {/* Range Dual Input 2 (Max) */}
                <input
                  type="range"
                  min={0}
                  max={10000}
                  step={50}
                  value={priceMax !== "" ? Number(priceMax) : 7500}
                  onChange={(e) => {
                    const val = Math.max(
                      Number(e.target.value),
                      (priceMin !== "" ? Number(priceMin) : 250) + 100,
                    )
                    setPriceMax(String(val))
                  }}
                  onMouseUp={applyPriceFilter}
                  onTouchEnd={applyPriceFilter}
                  className="absolute w-full appearance-none bg-transparent pointer-events-none cursor-pointer [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C98484] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none"
                />
              </div>

              {/* Price Input Boxes matching Image 1 */}
              <div className="flex items-center justify-between gap-2">
                <div className="border border-gray-200 rounded-lg px-2.5 py-1.5 flex-1 flex items-center bg-gray-50/50 focus-within:border-[#C98484] focus-within:bg-white transition-colors">
                  <span className="text-gray-400 text-xs mr-1 font-medium">
                    TL
                  </span>
                  <Input
                    type="number"
                    aria-label="En düşük fiyat"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    onBlur={applyPriceFilter}
                    placeholder="250"
                    unstyled
                    containerClassName="flex-1"
                    className="w-full text-xs text-center outline-none bg-transparent font-medium text-gray-700"
                  />
                </div>
                <span className="text-gray-400 text-xs font-bold">-</span>
                <div className="border border-gray-200 rounded-lg px-2.5 py-1.5 flex-1 flex items-center bg-gray-50/50 focus-within:border-[#C98484] focus-within:bg-white transition-colors">
                  <span className="text-gray-400 text-xs mr-1 font-medium">
                    TL
                  </span>
                  <Input
                    type="number"
                    aria-label="En yüksek fiyat"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    onBlur={applyPriceFilter}
                    placeholder="7.500+"
                    unstyled
                    containerClassName="flex-1"
                    className="w-full text-xs text-center outline-none bg-transparent font-medium text-gray-700"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={applyPriceFilter}
                className="w-full rounded-md bg-[#C98484] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#A95E5E]"
              >
                Fiyatı Uygula
              </button>
            </div>
          )}
        </div>

        {!hideOptionsPicker && (
          <div className="border-b border-gray-200 pb-5 mb-5 px-2">
            <OptionsPicker
              selectedValueIds={selectedOptionValueIds}
              setOptionValueIds={setOptionValueIds}
            />
          </div>
        )}

        {/* Marka Section */}
        <div className="border-b border-gray-200 pb-5 mb-5 px-2">
          <button
            onClick={() => toggleSection("brand")}
            className="flex items-center justify-between w-full text-left font-bold text-[13px] text-gray-800 mb-3"
          >
            Marka
            {openSections.brand ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {openSections.brand && (
            <div className="flex flex-col gap-3">
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                <Input
                  type="text"
                  aria-label="Marka ara"
                  placeholder="Marka ara..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  unstyled
                  containerClassName="w-full"
                  className="w-full border border-gray-200 rounded text-xs py-2 pl-8 pr-2 outline-none focus:border-[#C98484] bg-white"
                />
              </div>
              <div className="flex flex-col gap-3 max-h-[160px] overflow-y-auto custom-scrollbar pt-1.5 pr-1">
                {collections.length === 0 ? (
                  <span className="text-gray-400 text-xs">Yükleniyor...</span>
                ) : (
                  visibleCollections.map((col) => {
                    return (
                      <Checkbox
                        key={col.id}
                        id={`brand-${col.id}`}
                        checked={selectedCollectionIds.includes(col.id)}
                        onChange={() => toggleCollection(col.id)}
                        labelClassName={
                          selectedCollectionIds.includes(col.id)
                            ? "text-gray-900 font-bold"
                            : "text-gray-600 font-normal"
                        }
                        label={col.title}
                      />
                    )
                  })
                )}
              </div>
              {filteredCollections.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllBrands((show) => !show)}
                  className="mt-1 flex items-center gap-1 text-left text-xs font-bold text-[#C98484] hover:underline"
                >
                  {showAllBrands ? "Daha Az Göster" : "Tümünü Göster"}
                  {showAllBrands ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stok Durumu */}
        <div className="border-b border-gray-200 pb-5 mb-5 px-2">
          <button
            onClick={() => toggleSection("stock")}
            className="flex items-center justify-between w-full text-left font-bold text-[13px] text-gray-800 mb-3"
          >
            Stok Durumu
            {openSections.stock ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {openSections.stock && (
            <div className="flex flex-col gap-2.5 mt-1">
              <Checkbox
                id="stock-all"
                checked={!hideOutOfStock}
                onChange={() => hideOutOfStock && toggleStock()}
                labelClassName={
                  !hideOutOfStock ? "text-gray-900 font-bold" : "text-gray-600 font-normal"
                }
                label="Tümü"
              />
              <Checkbox
                id="stock-available"
                checked={hideOutOfStock}
                onChange={() => !hideOutOfStock && toggleStock()}
                labelClassName={
                  hideOutOfStock ? "text-gray-900 font-bold" : "text-gray-600 font-normal"
                }
                label="Stokta Olanlar"
              />
            </div>
          )}
        </div>

        <div className="px-2">
          <button
            onClick={clearFilters}
            className="w-full border border-[#C98484] text-[#C98484] hover:bg-[#C98484] hover:text-white transition-colors font-bold text-[13px] py-2 rounded flex items-center justify-center gap-2"
          >
            <RotateCcw
              aria-hidden="true"
              className="h-3.5 w-3.5"
              strokeWidth={2.5}
            />
            Filtreleri Temizle
          </button>
        </div>
      </aside>
    </>
  )
}

export default RefinementList
