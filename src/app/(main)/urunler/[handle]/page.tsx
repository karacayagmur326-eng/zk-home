import { getCommerceSettings } from "@lib/commerce/settings"
import { indexingEnabled } from "@lib/seo/indexing"
import EcommerceEvent from "@components/common/EcommerceEvent"
import { entityMetadata, productSeo } from "@lib/seo/entity"
import { productStructuredData } from "@lib/seo/product-schema"
import { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { getProductForStorefront } from "@lib/commerce/product-preview"
import { listCategories } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"
import { getBaseURL } from "@lib/util/env"
import ProductHistoryTracker from "@modules/products/components/product-history-tracker"
import { query, cachedQuery } from "@lib/admin/db"
import { getThemeSettings } from "@lib/content/theme-settings"
import { renderSeoTemplate } from "@lib/seo/templates"
import { sanitizePublicHtml, serializeJsonLd } from "@lib/security/html"
import { findProductRedirectHandle } from "@lib/seo/product-redirect"
import { categoryPath } from "@lib/seo/category"

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export const dynamic = "force-dynamic"

type BreadcrumbCategory = {
  id: string
  name: string
  handle: string
  metadata?: Record<string, unknown>
  parent_category_id?: string | null
  category_children?: BreadcrumbCategory[]
}

function buildCategoryBreadcrumbs(
  product: HttpTypes.StoreProduct,
  categories: BreadcrumbCategory[],
) {
  const categoryMap = new Map<string, BreadcrumbCategory>()

  const indexCategory = (category: BreadcrumbCategory) => {
    categoryMap.set(category.id, category)
    category.category_children?.forEach(indexCategory)
  }
  categories.forEach(indexCategory)

  const assignedCategory = product.categories?.[0] as
    | BreadcrumbCategory
    | undefined
  if (!assignedCategory) return []

  const hierarchy: BreadcrumbCategory[] = []
  const visited = new Set<string>()
  let current: BreadcrumbCategory | undefined =
    categoryMap.get(assignedCategory.id) || assignedCategory

  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    hierarchy.unshift(current)
    current = current.parent_category_id
      ? categoryMap.get(current.parent_category_id)
      : undefined
  }

  return hierarchy.map(({ id, name, handle, metadata }) => ({ id, name, handle, metadata }))
}

function getImagesForVariant(
  product: HttpTypes.StoreProduct,
  selectedVariantId?: string,
) {
  if (!selectedVariantId || !product.variants) {
    return product.images
  }

  const variant = product.variants.find((v) => v.id === selectedVariantId)
  if (!variant || !variant.images || !variant.images.length) {
    const thumbnail = variant?.thumbnail
    return thumbnail ? [{ id: `variant-${variant.id}`, url: thumbnail, rank: 0 }, ...(product.images || []).filter(image => image.url !== thumbnail)] : product.images
  }

  const imageIdsMap = new Map(variant.images.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const [view, settings] = await Promise.all([
    getProductForStorefront(handle),
    getThemeSettings().catch(() => null),
  ])
  const { product, isPreview } = view

  if (!product) {
    const redirectHandle = await findProductRedirectHandle(handle)
    if (redirectHandle) {
      permanentRedirect(`/urunler/${redirectHandle}`)
    }
    return {
      title: "Ürün Detayı",
    }
  }

  const seo = productSeo(product, settings)
  return entityMetadata({ ...seo, path: `/urunler/${product.handle}`, metadata: product.metadata || {}, image: product.thumbnail, index: !isPreview && indexingEnabled(settings) })

}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const selectedVariantId = searchParams.v_id

  const [region, view, rawCategories] = await Promise.all([
    getRegion("tr"),
    getProductForStorefront(params.handle),
    listCategories().catch(() => []),
  ])
  const { product: pricedProduct, isPreview } = view

  if (!pricedProduct || !region) {
    const redirectHandle = await findProductRedirectHandle(params.handle)
    if (redirectHandle) {
      permanentRedirect(`/urunler/${redirectHandle}`)
    }
    notFound()
  }

  const categories = rawCategories as BreadcrumbCategory[]
  const breadcrumbCategories = buildCategoryBreadcrumbs(
    pricedProduct,
    categories,
  )

  const images = getImagesForVariant(pricedProduct, selectedVariantId)

  // Calculate price for Schema.org
  const variant = (pricedProduct.variants?.find((item) => item.id === selectedVariantId) || pricedProduct.variants?.[0]) as
    | (HttpTypes.StoreProductVariant & {
        prices?: Array<{ amount: number }>
      })
    | undefined
  let schemaPrice = "0"
  if (variant?.calculated_price?.calculated_amount) {
    schemaPrice = (variant.calculated_price.calculated_amount / 100).toFixed(2)
  } else if (variant?.prices?.[0]?.amount) {
    schemaPrice = (variant.prices[0].amount / 100).toFixed(2)
  }

  // Fetch approved reviews from DB or metadata for Google Search Console & Rich Snippets
  const md = (pricedProduct.metadata as Record<string, any>) || {}
  const safeProduct = {
    ...pricedProduct,
    description: sanitizePublicHtml((pricedProduct.description || "").replace(/<h1(\b[^>]*)>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>")),
    metadata: {
      ...md,
      product_summary: sanitizePublicHtml(md.product_summary),
      features_content: sanitizePublicHtml(md.features_content),
    },
  }
  const dbReviews = await cachedQuery<{
    author: string
    rating: number
    comment: string
    created_at: string
  }>(
    `product-reviews:${pricedProduct.id}`,
    `SELECT author, rating, comment, created_at
     FROM product_reviews
     WHERE product_id = $1 AND status = 'approved' AND type = 'review'
     ORDER BY created_at DESC`,
    [pricedProduct.id],
    120
  ).catch(() => [])

  const [theme, commerce] = await Promise.all([getThemeSettings(), getCommerceSettings()])
  const jsonLdProduct = productStructuredData(pricedProduct, { ...theme, commerce }, dbReviews, selectedVariantId)

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Ana Sayfa",
        item: getBaseURL(),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Ürün Kategorileri",
        item: `${getBaseURL()}/magaza`,
      },
      ...breadcrumbCategories.map((category, index) => ({
        "@type": "ListItem",
        position: index + 3,
        name: category.name,
        item: `${getBaseURL()}${categoryPath(category)}`,
      })),
      {
        "@type": "ListItem",
        position: breadcrumbCategories.length + 3,
        name: pricedProduct.title,
        item: `${getBaseURL()}/urunler/${pricedProduct.handle}`,
      },
    ],
  }

  return (
    <>
      {!isPreview && <EcommerceEvent event="view_item" data={{ currency: "TRY", value: Number(schemaPrice), items: [{ item_id: variant?.id || pricedProduct.id, item_name: pricedProduct.title, price: Number(schemaPrice), quantity: 1, item_brand: pricedProduct.collection?.title || md.brand_name || md.brand || "" }] }} />}
      {isPreview && (
        <div role="status" className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-center text-sm text-rose-900">
          <strong>Taslak ürün ön izlemesi</strong> — Bu ürün henüz yayımlanmadı. Yalnızca yönetici oturumuyla görüntülenebilir.
        </div>
      )}
      {!isPreview && <ProductHistoryTracker product={{ id: pricedProduct.id, title: pricedProduct.title, handle: pricedProduct.handle, thumbnail: pricedProduct.thumbnail, price: schemaPrice !== "0" ? `${Number(schemaPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL` : null }} />}
      {/* Schema.org Structured Data for Google Rich Snippets */}
      {!isPreview && <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdProduct) }}
      />}
      {!isPreview && <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdBreadcrumb) }}
      />}

      <ProductTemplate
        product={safeProduct}
        region={region}
        countryCode="tr"
        images={images ?? []}
        breadcrumbCategories={breadcrumbCategories}
      />
    </>
  )
}
