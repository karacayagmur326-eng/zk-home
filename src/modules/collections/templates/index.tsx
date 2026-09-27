import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { listCategories } from "@lib/data/categories"
import { getMenu } from "@lib/data/menus"
import { query } from "@lib/admin/db"

export default async function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  optionValueIds,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const [sidebarMenu, navigationCategories, navigationCollections] = await Promise.all([
    getMenu("category-sidebar").catch(() => null).then(async (m) => m || await getMenu("ikincil-menu").catch(() => null)),
    listCategories().catch(() => []),
    query<{ id: string; title: string; handle: string }>(
      `SELECT id,title,handle FROM store_collection ORDER BY title`,
    ).catch(() => []),
  ])
  const navigationGroups = navigationCategories.filter(
    (item) =>
      Array.isArray(item.category_children) &&
      item.category_children.length > 0
  )

  return (
    <div className="flex flex-col lg:flex-row lg:items-start py-6 content-container">
      <RefinementList
        sortBy={sort}
        sidebarMenu={sidebarMenu}
        hideOptionsPicker
        initialCategories={navigationGroups}
        initialCollections={navigationCollections}
      />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1>{collection.title}</h1>
        </div>
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={collection.products?.length}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            collectionId={collection.id}
            countryCode={countryCode}
            optionValueIds={optionValueIds}
          />
        </Suspense>
      </div>
    </div>
  )
}
