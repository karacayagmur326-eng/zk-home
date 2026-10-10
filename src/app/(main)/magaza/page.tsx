import { Metadata } from "next"

import { parseOptionValueIds } from "@lib/util/product-option-filters"
import { getCanonicalURL } from "@lib/util/env"
import { paginatedPath } from "@lib/seo/indexing"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"
import { contentPageMetadata, contentPageSeo } from "@lib/seo/content-page"

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const { page } = await searchParams
  return contentPageMetadata("magaza", "Tüm Ürünler", "ZK Home dekorasyon, sofra ve ev tekstili ürünlerini inceleyin. Ürünleri kategori, marka ve fiyata göre karşılaştırın.", paginatedPath("/magaza", page))
}

type StorePageSearchParams = Record<string, string | string[] | undefined> & {
  sortBy?: SortOptions
  page?: string
  collection_id?: string | string[]
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
  const seo = await contentPageSeo("magaza")
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
      title={seo.h1_title || "Tüm Ürünler"}
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
