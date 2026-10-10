import { entityMetadata } from "@lib/seo/entity"
import { indexingEnabled } from "@lib/seo/indexing"
import { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"

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
import { isStoreReady } from "@lib/security/store-readiness"

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
  if (collection.handle !== params.handle) permanentRedirect(`/markalar/${collection.handle}`)
  if ((collection.metadata as Record<string, unknown> | undefined)?.active === false) notFound()

  const siteName = settings?.logo_text || "Mağaza"
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

  const brandMetadata = (collection.metadata || {}) as Record<string, unknown>
  const title = typeof brandMetadata.seo_title === "string" && brandMetadata.seo_title.trim()
    ? brandMetadata.seo_title.trim() : renderSeoTemplate(titleTemplate, tokens)
  const description = typeof brandMetadata.seo_description === "string" && brandMetadata.seo_description.trim()
    ? brandMetadata.seo_description.trim() : renderSeoTemplate(descTemplate, tokens)

  return entityMetadata({ title, description, path: paginatedPath(`/markalar/${params.handle}`, page), metadata: brandMetadata, image: String(brandMetadata.image_url || ""), index: indexingEnabled(settings) && brandMetadata.is_indexable === true && Boolean(collection.products?.length) })

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
  if (collection.handle !== params.handle) permanentRedirect(`/markalar/${collection.handle}`)
  if ((collection.metadata as Record<string, unknown> | undefined)?.active === false) notFound()

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode="tr"
      optionValueIds={optionValueIds}
      hideOutOfStock={typeof searchParams.hide_out_of_stock === "string" ? searchParams.hide_out_of_stock : undefined}
      priceMin={typeof searchParams.price_min === "string" ? searchParams.price_min : undefined}
      priceMax={typeof searchParams.price_max === "string" ? searchParams.price_max : undefined}
      searchQuery={typeof searchParams.q === "string" ? searchParams.q : undefined}
      viewMode={typeof searchParams.viewMode === "string" ? searchParams.viewMode : undefined}
    />
  )
}
