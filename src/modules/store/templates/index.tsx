import { Suspense } from "react"

import { OptionValueIds } from "@lib/util/product-option-filters"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getMenu } from "@lib/data/menus"
import { listCategories } from "@lib/data/categories"
import { query } from "@lib/admin/db"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  optionValueIds,
  collectionId,
  hideOutOfStock,
  priceMin,
  priceMax,
  searchQuery,
  viewMode,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  collectionId?: string
  hideOutOfStock?: string
  priceMin?: string
  priceMax?: string
  searchQuery?: string
  viewMode?: string
}) => {
  const [sidebarMenu, navigationCategories, navigationCollections] = await Promise.all([
    getMenu("category-sidebar").catch(() => null).then(async (m) => m || await getMenu("ikincil-menu").catch(() => null)),
    listCategories().catch(() => []),
    query<{ id: string; title: string; handle: string }>(
      `SELECT id,title,handle FROM store_collection ORDER BY title`,
    ).catch(() => []),
  ])
  const navigationGroups = navigationCategories.filter(
    (item) => Array.isArray(item.category_children) && item.category_children.length > 0,
  )
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="bg-[#f5f5f5] pb-24 md:pb-8">
      <div
        className="flex flex-col lg:flex-row lg:items-start pt-0 pb-2 sm:py-8 content-container gap-0 lg:gap-8"
        data-testid="category-container"
      >
        <RefinementList
          sortBy={sort}
          sidebarMenu={sidebarMenu}
          initialCategories={navigationGroups}
          initialCollections={navigationCollections}
        />
        <div className="w-full flex-1">
          <Suspense fallback={<SkeletonProductGrid />}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              collectionId={collectionId}
              countryCode={countryCode}
              optionValueIds={optionValueIds}
              hideOutOfStock={hideOutOfStock}
              priceMin={priceMin}
              priceMax={priceMax}
              searchQuery={searchQuery}
              viewMode={viewMode}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
