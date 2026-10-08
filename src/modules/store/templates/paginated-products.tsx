import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { OptionValueIds } from "@lib/util/product-option-filters"
import ProductPreview from "@modules/products/components/product-preview"
import EmptyState from "@modules/common/components/empty-state"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { Pagination } from "@modules/store/components/pagination"
import StoreHeader from "../components/store-header"
import MobileInfiniteScroll from "../components/mobile-infinite-scroll"
import { isStoreReady } from "@lib/security/store-readiness"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
  hide_out_of_stock?: string
  q?: string
  price_min?: string
  price_max?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  title,
  productsIds,
  countryCode,
  optionValueIds,
  hideOutOfStock,
  priceMin,
  priceMax,
  searchQuery,
  viewMode = "grid",
  headingLevel = 1,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string | string[]
  categoryId?: string
  title?: string
  productsIds?: string[]
  countryCode: string
  optionValueIds?: OptionValueIds
  hideOutOfStock?: string
  priceMin?: string
  priceMax?: string
  searchQuery?: string
  viewMode?: string
  headingLevel?: 1 | 2
}) {
  const isPriceFiltered = priceMin !== undefined || priceMax !== undefined

  const queryParams: PaginatedProductsParams = {
    limit: PRODUCT_LIMIT,
  }

  if (collectionId) {
    queryParams["collection_id"] = Array.isArray(collectionId) ? collectionId : [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  if (hideOutOfStock) {
    queryParams["hide_out_of_stock"] = hideOutOfStock
  }

  if (searchQuery?.trim()) {
    queryParams["q"] = searchQuery.trim()
  }

  if (priceMin) {
    queryParams["price_min"] = priceMin
  }

  if (priceMax) {
    queryParams["price_max"] = priceMax
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products: rawProducts, count: rawCount },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
    optionValueIds,
  })

  const products = rawProducts
  const count = rawCount

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)
  const hasActiveFilters = Boolean(
    isPriceFiltered || hideOutOfStock || searchQuery?.trim() ||
    (optionValueIds && Object.keys(optionValueIds).length > 0) || collectionId,
  )
  const emptyTitle = !isStoreReady()
    ? "Ürünler hazırlanıyor"
    : hasActiveFilters
      ? "Aradığınız ürün bulunamadı"
      : "Bu kategoride henüz ürün yok"
  const emptyDescription = !isStoreReady()
    ? "Mağaza seçkisi hazırlanıyor. Yeni ürünler eklendiğinde burada görebilirsiniz."
    : hasActiveFilters
      ? "Seçtiğiniz ölçütlere uygun ürün yok. Filtreleri değiştirerek yeniden deneyin."
      : "Yeni ürünler eklendiğinde burada görebilirsiniz."

  return (
    <>
      <StoreHeader
        sortBy={sortBy || "created_at"}
        productCount={count}
        searchQuery={searchQuery}
        title={title}
        headingLevel={headingLevel}
      />
      {products.length ? (
        <>
          {/* Mobile View: Clean 2-column Paginated Grid */}
          <div className="sm:hidden w-[calc(100%+2rem)] -mx-4">
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
                {Array.from({ length: Math.ceil(products.length / 2) }).map((_, rowIdx) => {
                  const row = products.slice(rowIdx * 2, rowIdx * 2 + 2)
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
          </div>

          {/* Desktop Grid */}
          <ul
            className={
              viewMode === "list"
              ? "hidden sm:grid grid-cols-1 lg:grid-cols-2 gap-4 w-full"
                : "hidden sm:grid grid-cols-2 w-full lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8"
            }
            data-testid="products-list"
          >
            {products.map((p) => {
              return (
                <li key={p.id}>
                  <ProductPreview
                    product={p}
                    region={region}
                    viewMode={viewMode}
                  />
                </li>
              )
            })}
          </ul>
        </>
      ) : (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          className="bg-card border-rose-100/80"
        />
      )}
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
