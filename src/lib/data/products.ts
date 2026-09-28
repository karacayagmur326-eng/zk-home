"use server"

import { OptionValueIds } from "@lib/util/product-option-filters"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import {
  getStoreProduct,
  listStoreProducts,
} from "@lib/commerce/repository"

type ProductListQueryParams = (HttpTypes.FindParams &
  HttpTypes.StoreProductListParams) & {
  options?: string[]
  option_value_id?: string | string[]
  hide_out_of_stock?: string
  tag_id?: string | string[]
  status?: string
  price_min?: string | number
  price_max?: string | number
}

function values(value: unknown) {
  if (!value) return undefined
  return Array.isArray(value) ? value.map(String) : [String(value)]
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
}: {
  pageParam?: number
  queryParams?: ProductListQueryParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
      queryParams,
    }
  }

  const limit = Number(queryParams?.limit || 12)
  const page = Math.max(pageParam, 1)
  const offset =
    queryParams?.offset !== undefined
      ? Number(queryParams.offset)
      : (page - 1) * limit
  const categoryVals = values(queryParams?.category_id)
  const categorySingle = categoryVals?.length === 1 ? categoryVals[0] : undefined
  const categoryMultiple = categoryVals && categoryVals.length > 1 ? categoryVals : undefined

  const pMin = queryParams?.price_min !== undefined && queryParams?.price_min !== ""
    ? Number(queryParams.price_min)
    : undefined

  const pMax = queryParams?.price_max !== undefined && queryParams?.price_max !== ""
    ? Number(queryParams.price_max)
    : undefined

  const { products, count } = await listStoreProducts({
    q: queryParams?.q,
    status: String(queryParams?.status || "published"),
    categoryId: categorySingle || (categoryVals?.length === 1 ? categoryVals[0] : categoryVals?.[0]),
    categoryIds: categoryMultiple,
    collectionIds: values(queryParams?.collection_id),
    ids: values(queryParams?.id),
    handles: values(queryParams?.handle),
    tagIds: values(queryParams?.tag_id),
    priceMin: pMin,
    priceMax: pMax,
    limit,
    offset,
  })
  const filtered =
    queryParams?.hide_out_of_stock === "true"
      ? products.filter((product) =>
          product.variants?.some(
            (variant: any) =>
              variant.inventory_quantity > 0 || variant.allow_backorder
          )
        )
      : products
  return {
    response: {
      products: filtered as unknown as HttpTypes.StoreProduct[],
      count:
        queryParams?.hide_out_of_stock === "true" ? filtered.length : count,
    },
    nextPage: count > offset + limit ? page + 1 : null,
    queryParams,
  }
}

export async function retrieveProduct(idOrHandle: string) {
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
    return null
  }
  return (await getStoreProduct(idOrHandle)) as
    | HttpTypes.StoreProduct
    | null
}

export const listProductsWithSort = async ({
  page = 1,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: ProductListQueryParams
  sortBy?: SortOptions
  countryCode: string
  optionValueIds?: OptionValueIds
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  const limit = Number(queryParams?.limit || 12)
  const all = await listProducts({
    pageParam: 1,
    queryParams: { ...queryParams, limit: 500, offset: 0 },
    countryCode,
  })
  const sorted = sortProducts(all.response.products, sortBy)
  const start = Math.max(page - 1, 0) * limit
  const paginated = sorted.slice(start, start + limit)
  return {
    response: { products: paginated, count: sorted.length },
    nextPage: sorted.length > start + limit ? page + 1 : null,
    queryParams,
  }
}
