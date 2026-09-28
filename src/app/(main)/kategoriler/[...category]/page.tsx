import { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"

import { getCategoryByHandle } from "@lib/data/categories"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { parseOptionValueIds } from "@lib/util/product-option-filters"

type Props = {
  params: Promise<{ category: string[] }>
  searchParams: Promise<
    Record<string, string | string[] | undefined> & {
      sortBy?: SortOptions
      page?: string
      collection_id?: string | string[]
      hide_out_of_stock?: string
      price_min?: string
      price_max?: string
      optionValueIds?: string | string[]
    }
  >
}

export const dynamic = "force-dynamic"

import { getThemeSettings } from "@lib/content/theme-settings"
import { renderSeoTemplate } from "@lib/seo/templates"
import { getBaseURL } from "@lib/util/env"
import { paginatedPath } from "@lib/seo/indexing"
import { categoryIndexable, categoryPath, categorySeoText } from "@lib/seo/category"
import { isStoreReady } from "@lib/security/store-readiness"

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { page } = await props.searchParams
  try {
    const [productCategory, settings] = await Promise.all([
      getCategoryByHandle(params.category),
      getThemeSettings().catch(() => null),
    ])
    if (!productCategory) {
      notFound()
    }

    const siteName = settings?.logo_text || "ZK Home"
    const separator = settings?.seo_title_separator || "|"

    const tokens = {
      kategori: productCategory.name,
      category: productCategory.name,
      site_adi: siteName,
      ayirici: separator,
      ozet: productCategory.description || "",
    }

    const titleTemplate =
      settings?.seo_category_title_template ||
      "%kategori% Modelleri ve Fiyatları %ayirici% %site_adi%"
    const descTemplate =
      settings?.seo_category_desc_template ||
      "En kaliteli %kategori% çeşitleri uygun fiyatlar, taksit seçenekleri ve hızlı kargo avantajıyla %site_adi% üzerinde!"

    const customSeo = categorySeoText(productCategory)
    const title = customSeo.title || renderSeoTemplate(titleTemplate, tokens)
    const description = customSeo.description || productCategory.description || renderSeoTemplate(descTemplate, tokens)

    return {
      title: { absolute: title },
      description,
      robots: { index: isStoreReady() && categoryIndexable(productCategory), follow: true },
      alternates: {
        canonical: getBaseURL() + paginatedPath(categoryPath(productCategory), page),
      },
    }
  } catch {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const {
    sortBy,
    page,
    collection_id,
    hide_out_of_stock,
    price_min,
    price_max,
    viewMode,
  } = searchParams
  const optionValueIds = parseOptionValueIds(searchParams)

  const productCategory = await getCategoryByHandle(params.category)

  if (!productCategory) {
    notFound()
  }

  if (categoryPath(productCategory) !== `/kategoriler/${params.category.join("/")}`) {
    permanentRedirect(categoryPath(productCategory))
  }

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      countryCode="tr"
      optionValueIds={optionValueIds}
      collectionId={collection_id}
      hideOutOfStock={hide_out_of_stock}
      priceMin={price_min}
      priceMax={price_max}
      viewMode={typeof viewMode === "string" ? viewMode : undefined}
    />
  )
}
