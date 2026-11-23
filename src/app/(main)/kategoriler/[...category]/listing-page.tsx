import { indexingEnabled } from "@lib/seo/indexing"
import { entityMetadata, plainText } from "@lib/seo/entity"
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


import { getThemeSettings } from "@lib/content/theme-settings"
import { renderSeoTemplate } from "@lib/seo/templates"
import { getBaseURL } from "@lib/util/env"
import { paginatedPath } from "@lib/seo/indexing"
import { categoryIndexable, categoryPath, categorySeoText } from "@lib/seo/category"
import { isStoreReady } from "@lib/security/store-readiness"
import { serializeJsonLd } from "@lib/security/html"

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

    const siteName = settings?.logo_text || "Mağaza"
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
      "%kategori% modellerini, ürün özelliklerini ve güncel fiyatlarını %site_adi% üzerinde inceleyin."

    const customSeo = categorySeoText(productCategory)
    const title = customSeo.title || renderSeoTemplate(titleTemplate, tokens)
    const description = customSeo.description || productCategory.description || renderSeoTemplate(descTemplate, tokens)

    return entityMetadata({ title, description: plainText(description), path: paginatedPath(categoryPath(productCategory), page), metadata: productCategory.metadata || {}, image: String(productCategory.metadata?.hero_image_url || ""), index: categoryIndexable(productCategory) && indexingEnabled(settings) })

  } catch (error) {
    throw error
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

  const baseUrl = getBaseURL()
  const path = categoryPath(productCategory)
  const canonicalUrl = `${baseUrl}${path}`

  const breadcrumbElements: Array<{ position: number; name: string; item: string }> = [
    {
      position: 1,
      name: "Ana Sayfa",
      item: baseUrl,
    },
    {
      position: 2,
      name: "Mağaza",
      item: `${baseUrl}/magaza`,
    },
  ]

  let currentCategory: any = productCategory
  const catChain: any[] = []
  while (currentCategory) {
    catChain.unshift(currentCategory)
    currentCategory = currentCategory.parent_category
  }

  catChain.forEach((cat, idx) => {
    breadcrumbElements.push({
      position: idx + 3,
      name: cat.name,
      item: `${baseUrl}${categoryPath(cat)}`,
    })
  })

  const categoryJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: breadcrumbElements.map((el) => ({
          "@type": "ListItem",
          position: el.position,
          name: el.name,
          item: el.item,
        })),
      },
      {
        "@type": "CollectionPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: productCategory.name,
        description: plainText(
          productCategory.description || `${productCategory.name} koleksiyonu ve ürün modelleri ZK Home'da.`
        ),
        isPartOf: {
          "@type": "WebSite",
          "@id": `${baseUrl}/#website`,
        },
        breadcrumb: {
          "@id": `${canonicalUrl}#breadcrumb`,
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(categoryJsonLd) }}
      />
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
    </>
  )
}
