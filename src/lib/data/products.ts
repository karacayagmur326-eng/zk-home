"use server"

import { OptionValueIds } from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import {
  getStoreProduct,
  listStoreProducts,
} from "@lib/commerce/repository"

type ProductListQueryParams = (HttpTypes.FindParams &
  HttpTypes.StoreProductListParams) & {
  sort?: SortOptions
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
  if (process.env.NODE_ENV === "production" && !process.env.ZK_SUPABASE_POSTGRES_URL && !process.env.DATABASE_URL) {
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
    sort: queryParams?.sort,
    includeCounts: false,
    stock: queryParams?.hide_out_of_stock === "true" ? "available" : undefined,
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
  return {
    response: { products: products as unknown as HttpTypes.StoreProduct[], count },
    nextPage: count > offset + limit ? page + 1 : null,
    queryParams,
  }
}

export async function retrieveProduct(idOrHandle: string) {
  if (process.env.NODE_ENV === "production" && !process.env.ZK_SUPABASE_POSTGRES_URL && !process.env.DATABASE_URL) {
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
  return listProducts({
    pageParam: page,
    queryParams: { ...queryParams, limit, sort: sortBy },
    countryCode,
  })
}
