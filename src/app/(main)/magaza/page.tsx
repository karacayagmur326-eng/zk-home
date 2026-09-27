import { Metadata } from "next"

import { parseOptionValueIds } from "@lib/util/product-option-filters"
import { getCanonicalURL } from "@lib/util/env"
import { paginatedPath } from "@lib/seo/indexing"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const { page } = await searchParams
  return {
  title: "Mağaza | Tüm Ürünler",
  description:
    "Geniş ürün yelpazesi, kaliteli markalar, uygun fiyatlar ve güvenli alışveriş seçenekleriyle tüm ürünlerimizi keşfedin.",
  alternates: { canonical: getCanonicalURL(paginatedPath("/magaza", page)) },
  }
}

type StorePageSearchParams = Record<string, string | string[] | undefined> & {
  sortBy?: SortOptions
  page?: string
  collection_id?: string
  hide_out_of_stock?: string
  optionValueIds?: string | string[]
  price_min?: string
  price_max?: string
  q?: string
}

type Params = {
  searchParams: Promise<StorePageSearchParams>
}

export default async function StorePage(props: Params) {
  const searchParams = await props.searchParams
  const {
    sortBy,
    page,
    collection_id,
    hide_out_of_stock,
    price_min,
    price_max,
    viewMode,
    q,
  } = searchParams
  const optionValueIds = parseOptionValueIds(searchParams)

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode="tr"
      optionValueIds={optionValueIds}
      collectionId={collection_id}
      hideOutOfStock={hide_out_of_stock}
      priceMin={price_min}
      priceMax={price_max}
      searchQuery={q}
      viewMode={typeof viewMode === "string" ? viewMode : undefined}
    />
  )
}
