import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionByHandle, listCollections } from "@lib/data/collections"
import { StoreCollection } from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { parseOptionValueIds } from "@lib/util/product-option-filters"

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<
    Record<string, string | string[] | undefined> & {
      page?: string
      sortBy?: SortOptions
      optionValueIds?: string | string[]
    }
  >
}

export const dynamic = "force-dynamic"

import { getThemeSettings } from "@lib/content/theme-settings"
import { renderSeoTemplate } from "@lib/seo/templates"
import { getBaseURL } from "@lib/util/env"
import { paginatedPath } from "@lib/seo/indexing"

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { page } = await props.searchParams
  const [collection, settings] = await Promise.all([
    getCollectionByHandle(params.handle),
    getThemeSettings().catch(() => null),
  ])

  if (!collection) {
    notFound()
  }

  const siteName = settings?.logo_text || "ZK Home"
  const separator = settings?.seo_title_separator || "|"

  const tokens = {
    marka: collection.title,
    brand: collection.title,
    site_adi: siteName,
    ayirici: separator,
  }

  const titleTemplate =
    settings?.seo_brand_title_template ||
    "%marka% Ürünleri ve Fiyatları %ayirici% %site_adi%"
  const descTemplate =
    settings?.seo_brand_desc_template ||
    "%marka% ürünlerini %site_adi% üzerinde inceleyin."

  const title = renderSeoTemplate(titleTemplate, tokens)
  const description = renderSeoTemplate(descTemplate, tokens)

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: getBaseURL() + paginatedPath(`/markalar/${params.handle}`, page),
    },
  } as Metadata
}

export default async function CollectionPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams
  const optionValueIds = parseOptionValueIds(searchParams)

  const collection = await getCollectionByHandle(params.handle).then(
    (collection) => collection
  )

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode="tr"
      optionValueIds={optionValueIds}
    />
  )
}
