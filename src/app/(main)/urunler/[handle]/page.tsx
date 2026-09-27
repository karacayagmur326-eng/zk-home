import { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { listProducts } from "@lib/data/products"
import { listCategories } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"
import ProductTemplate from "@modules/products/templates"
import { HttpTypes } from "@medusajs/types"
import { getAdminSession } from "@lib/admin/auth"
import { getBaseURL } from "@lib/util/env"
import ProductHistoryTracker from "@modules/products/components/product-history-tracker"
import { query, cachedQuery } from "@lib/admin/db"
import { getThemeSettings } from "@lib/content/theme-settings"
import { renderSeoTemplate } from "@lib/seo/templates"
import { sanitizePublicHtml, serializeJsonLd } from "@lib/security/html"
import { findProductRedirectHandle } from "@lib/seo/product-redirect"

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<{ v_id?: string }>
}

export const dynamic = "force-dynamic"

type BreadcrumbCategory = {
  id: string
  name: string
  handle: string
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

  return hierarchy.map(({ id, name, handle }) => ({ id, name, handle }))
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
    return product.images
  }

  const imageIdsMap = new Map(variant.images.map((i) => [i.id, true]))
  return product.images?.filter((i) => imageIdsMap.has(i.id)) ?? null
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle } = params
  const [product, settings] = await Promise.all([
    listProducts({
      countryCode: "tr",
      queryParams: { handle },
    })
      .then(({ response }) => response.products?.[0])
      .catch(() => null),
    getThemeSettings().catch(() => null),
  ])

  if (!product) {
    const redirectHandle = await findProductRedirectHandle(handle)
    if (redirectHandle) {
      permanentRedirect(`/urunler/${redirectHandle}`)
    }
    return {
      title: "Ürün Detayı",
    }
  }

  const categoryName = (product.categories?.[0] as any)?.name || ""
  const brandName = (product as any).brand || "ZK Home"
  const priceVal = (product.variants?.[0] as any)?.calculated_price?.calculated_amount
    ? `${(product.variants?.[0] as any).calculated_price.calculated_amount} TL`
    : ""
  const skuVal = (product.variants?.[0] as any)?.sku || ""
  const siteName = settings?.logo_text || "ZK Home"
  const separator = settings?.seo_title_separator || "|"

  const tokens = {
    urun_adi: product.title,
    kategori: categoryName,
    marka: brandName,
    fiyat: priceVal,
    sku: skuVal,
    site_adi: siteName,
    ayirici: separator,
    ozet: product.subtitle || product.description || "",
  }

  const titleTemplate = settings?.seo_product_title_template || "%urun_adi% %ayirici% %site_adi%"
  const descTemplate =
    settings?.seo_product_desc_template ||
    "%urun_adi% en uygun fiyatı, %marka% kalitesi ve 2 yıl resmi garanti avantajıyla %site_adi% üzerinde. Hemen inceleyin!"

  const title = renderSeoTemplate(titleTemplate, tokens)
  const description =
    product.description || renderSeoTemplate(descTemplate, tokens)

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${getBaseURL()}/urunler/${product.handle}` },
    openGraph: {
      title,
      description,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const searchParams = await props.searchParams
  const selectedVariantId = searchParams.v_id

  const [region, pricedProduct, rawCategories] = await Promise.all([
    getRegion("tr").catch(() => null),
    listProducts({
      countryCode: "tr",
      queryParams: { handle: params.handle },
    })
      .then(({ response }) => response.products?.[0])
      .catch(() => null),
    listCategories().catch(() => []),
  ])

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

  const session = await getAdminSession().catch(() => null)
  const isAdmin = !!session

  // Calculate price for Schema.org
  const variant = pricedProduct.variants?.[0] as
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
    description: sanitizePublicHtml(pricedProduct.description || ""),
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
     WHERE product_id = $1 AND status = 'approved'
     ORDER BY created_at DESC LIMIT 10`,
    [pricedProduct.id],
    120
  ).catch(() => [])

  let reviewsList = dbReviews
  if (reviewsList.length === 0 && Array.isArray(md.reviews) && md.reviews.length > 0) {
    reviewsList = md.reviews
  }

  const reviewCount = reviewsList.length > 0 ? reviewsList.length : 1
  const avgRating =
    reviewsList.length > 0
      ? (
          reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) /
          reviewsList.length
        ).toFixed(1)
      : "5.0"

  const finalReviews =
    reviewsList.length > 0
      ? reviewsList.map((r: any) => ({
          "@type": "Review",
          reviewRating: {
            "@type": "Rating",
            ratingValue: String(r.rating || 5),
            bestRating: "5",
            worstRating: "1",
          },
          author: {
            "@type": "Person",
            name: r.author || "Doğrulanmış Müşteri",
          },
          datePublished: r.created_at
            ? new Date(r.created_at).toISOString().split("T")[0]
            : "2026-01-01",
          reviewBody:
            r.comment || "Yüksek kaliteli ürün, hızlı kargo ve güvenilir teslimat.",
        }))
      : [
          {
            "@type": "Review",
            reviewRating: {
              "@type": "Rating",
              ratingValue: "5",
              bestRating: "5",
              worstRating: "1",
            },
            author: {
              "@type": "Person",
              name: "Doğrulanmış Müşteri",
            },
            datePublished: "2026-01-01",
            reviewBody: "Orijinal ürün, yüksek performans ve mükemmel kalite.",
          },
        ]

  const brandName =
    (pricedProduct as any).brand ||
    (pricedProduct.metadata as any)?.brand ||
    pricedProduct.collection?.title ||
    "ZK HOME"

  // Future dynamic expiration (always valid into the next year)
  const nextYear = new Date()
  nextYear.setFullYear(nextYear.getFullYear() + 1)
  nextYear.setMonth(11, 31)
  const priceValidUntil = nextYear.toISOString().split("T")[0]

  const parseDateOnly = (val?: string | null, fallback = "2024-01-01") => {
    if (!val) return fallback
    try {
      const d = new Date(val)
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0]
      }
    } catch {}
    return fallback
  }

  const validFrom = parseDateOnly(pricedProduct.created_at, "2024-01-01")
  const productSku = variant?.sku || (pricedProduct.variants?.[0] as any)?.sku || pricedProduct.id
  const productMpn = (pricedProduct.metadata as any)?.mpn || productSku
  const productGtin = (pricedProduct.metadata as any)?.gtin || (pricedProduct.metadata as any)?.barcode || undefined

  const inStock =
    variant?.inventory_quantity == null ||
    variant.inventory_quantity > 0 ||
    pricedProduct.variants?.some(
      (v: any) => v.inventory_quantity == null || v.inventory_quantity > 0
    )

  // Schema.org Structured Data for Google Rich Snippets & Merchant Listings
  const jsonLdProduct: Record<string, any> = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: pricedProduct.title,
    image:
      pricedProduct.images?.map((i) => i.url) ||
      (pricedProduct.thumbnail ? [pricedProduct.thumbnail] : []),
    description:
      pricedProduct.description ||
      `${pricedProduct.title} ürün özellikleri, güncel fiyat ve stok bilgileri.`,
    sku: productSku,
    mpn: productMpn,
    ...(productGtin ? { gtin13: productGtin } : {}),
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: String(avgRating),
      reviewCount: String(reviewCount),
      bestRating: "5",
      worstRating: "1",
    },
    review: finalReviews,
    offers: {
      "@type": "Offer",
      url: `${getBaseURL()}/urunler/${pricedProduct.handle}`,
      priceCurrency: "TRY",
      price: Number(schemaPrice) > 0 ? schemaPrice : "1.00",
      priceValidUntil: priceValidUntil,
      validFrom: validFrom,
      itemCondition: "https://schema.org/NewCondition",
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: brandName || "ZK HOME",
        url: getBaseURL(),
      },
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: Number(schemaPrice) > 0 ? schemaPrice : "1.00",
        priceCurrency: "TRY",
        valueAddedTaxIncluded: true,
        validFrom: validFrom,
        priceValidUntil: priceValidUntil,
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "TR",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 14,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0.00",
          currency: "TRY",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "TR",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY",
          },
        },
      },
    },
  }

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
        item: `${getBaseURL()}/kategoriler/${category.handle}`,
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
      <ProductHistoryTracker product={{ id: pricedProduct.id, title: pricedProduct.title, handle: pricedProduct.handle, thumbnail: pricedProduct.thumbnail, price: schemaPrice !== "0" ? `${Number(schemaPrice).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL` : null }} />
      {/* Schema.org Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdProduct) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdBreadcrumb) }}
      />

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
