import { query as databaseQuery } from "@lib/admin/db"
import { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import PageHero from "../../../components/common/PageHero"
import ContactPage from "../iletisim/page"
import AboutPage from "../hakkimizda/page"
import BrandsPage from "../markalar/page"

// Optional CMS content must not turn an unknown URL into a server error.
async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  try { return await databaseQuery<T>(sql, params) }
  catch { return [] }
}

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

import { getThemeSettings } from "@lib/content/theme-settings"
import { renderSeoTemplate } from "@lib/seo/templates"
import { getBaseURL } from "@lib/util/env"
import { sanitizePublicHtml } from "@lib/security/html"
import { isPublicContentPath } from "@lib/seo/indexing"
import { getPublicPageAliases } from "@lib/seo/page-aliases"
import { getCategoryByHandle } from "@lib/data/categories"
import { categoryPath } from "@lib/seo/category"
import CategoryTemplate from "@modules/categories/templates"
import { generateMetadata as getCategoryMetadata } from "../kategoriler/[...category]/page"
import { parseOptionValueIds } from "@lib/util/product-option-filters"
import type { SortOptions } from "@modules/store/components/refinement-list/sort-products"

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params
  if (slug.startsWith("_") || slug === "api" || slug === "admin" || slug.includes(".")) {
    return { title: "Sayfa" }
  }
  const category = await getCategoryByHandle([slug])
  if (category && categoryPath(category) === `/${slug}`) {
    return getCategoryMetadata({
      params: Promise.resolve({ category: [slug] }),
      searchParams,
    })
  }
  const [rows, settings] = await Promise.all([
    query<{ content: any }>(
      "SELECT content FROM content_pages WHERE (handle = $1 OR content->>'custom_slug' = $1) AND COALESCE(content->>'status', 'published') = 'published' LIMIT 1",
      [slug]
    ),
    getThemeSettings().catch(() => null),
  ])
  const page = rows[0]?.content
  if (!page) {
    const alias = (await getPublicPageAliases()).find((item) => item.path === `/${slug}`)
    return alias
      ? { title: alias.title, alternates: { canonical: `${getBaseURL()}${alias.path}` } }
      : { title: "Sayfa Bulunamadı", robots: { index: false, follow: true } }
  }

  const pageTitle = page.title || slug
  const siteName = settings?.logo_text || "ZK Home"
  const separator = settings?.seo_title_separator || "|"

  const tokens = {
    sayfa_adi: pageTitle,
    page_title: pageTitle,
    site_adi: siteName,
    ayirici: separator,
    ozet: page.description || "",
  }

  const titleTemplate =
    settings?.seo_page_title_template || "%sayfa_adi% %ayirici% %site_adi%"

  const title = page.seo_title || renderSeoTemplate(titleTemplate, tokens)
  const description = page.seo_description || page.description || ""

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${getBaseURL()}/${page.custom_slug && isPublicContentPath(`/${page.custom_slug}`) ? page.custom_slug : slug}`,
    },
  }
}

export default async function DynamicSlugPage({ params, searchParams }: PageProps) {
  const { slug } = await params

  // Exclude system static paths and Next.js internal routes
  if (
    slug.startsWith("_") ||
    slug === "api" ||
    slug === "admin" ||
    slug === "brand" ||
    slug === "uploads" ||
    slug.includes(".")
  ) {
    notFound()
  }

  const category = await getCategoryByHandle([slug])
  if (category && categoryPath(category) === `/${slug}`) {
    const filters = await searchParams
    return <CategoryTemplate
      category={category}
      countryCode="tr"
      sortBy={filters.sortBy as SortOptions | undefined}
      page={typeof filters.page === "string" ? filters.page : undefined}
      optionValueIds={parseOptionValueIds(filters)}
      collectionId={filters.collection_id}
      hideOutOfStock={typeof filters.hide_out_of_stock === "string" ? filters.hide_out_of_stock : undefined}
      priceMin={typeof filters.price_min === "string" ? filters.price_min : undefined}
      priceMax={typeof filters.price_max === "string" ? filters.price_max : undefined}
      viewMode={typeof filters.viewMode === "string" ? filters.viewMode : undefined}
    />
  }

  // 1. Fetch store settings for custom slugs
  const [contactRows, brandsRows, deliveryRows, wholesaleRows] = await Promise.all([
    query<{ value: any }>("SELECT value FROM store_settings WHERE key = 'contact_info' LIMIT 1"),
    query<{ value: any }>("SELECT value FROM store_settings WHERE key = 'brands_info' LIMIT 1"),
    query<{ value: any }>("SELECT value FROM store_settings WHERE key = 'delivery_returns_info' LIMIT 1"),
    query<{ value: any }>("SELECT value FROM store_settings WHERE key = 'wholesale_info' LIMIT 1"),
  ])

  const contactInfo = contactRows[0]?.value || {}
  const brandsInfo = brandsRows[0]?.value || {}
  const deliveryInfo = deliveryRows[0]?.value || {}
  const wholesaleInfo = wholesaleRows[0]?.value || {}

  // 2. Fetch page from content_pages DB
  let pageRows = await query<{ handle: string; content: any }>(
    "SELECT handle, content FROM content_pages WHERE (handle = $1 OR content->>'custom_slug' = $1) AND COALESCE(content->>'status', 'published') = 'published' LIMIT 1",
    [slug]
  )

  let page = pageRows[0]?.content
  let handle = pageRows[0]?.handle || slug
  if (page?.custom_slug && page.custom_slug !== slug && isPublicContentPath(`/${page.custom_slug}`)) {
    permanentRedirect(`/${page.custom_slug}`)
  }

  // Match special pages by handle or custom_slug
  if (handle === "iletisim" || slug === "iletisim" || contactInfo.custom_slug === slug) {
    return <ContactPage searchParams={Promise.resolve({ render: "custom-slug" })} />
  }

  if (handle === "hakkimizda" || slug === "hakkimizda") {
    return <AboutPage searchParams={Promise.resolve({ render: "custom-slug" })} />
  }

  if (handle === "markalar" || handle === "markalarimiz" || slug === "markalar" || brandsInfo.custom_slug === slug) {
    return <BrandsPage searchParams={Promise.resolve({ render: "custom-slug" })} />
  }

  // 3. Render Delivery & Returns Page
  if (handle === "teslimat-ve-iade" || deliveryInfo.custom_slug === slug) {
    permanentRedirect("/teslimat-ve-iade")
  }

  // 4. Render Wholesale & Corporate Sales Page
  if (handle === "toptan-ve-kurumsal-satis" || handle === "toptan-satis" || wholesaleInfo.custom_slug === slug) {
    permanentRedirect("/toptan-ve-kurumsal-satis")
  }

  if (!page) {
    notFound()
  }

  // 5. Generic / Legal Page Fallback
  const heroDesc = sanitizePublicHtml(page.description || "")
  return (
    <div className="bg-white min-h-screen pb-20">
      <PageHero
        breadcrumb={[{ title: page.title }]}
        title={heroDesc && /<[a-z][\s\S]*>/i.test(heroDesc) ? undefined : page.title}
        paragraphs={[heroDesc]}
        htmlContent={heroDesc && /<[a-z][\s\S]*>/i.test(heroDesc) ? heroDesc : undefined}
      />
      <div className="content-container py-10">
        <div className="prose max-w-none text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: heroDesc }} />
      </div>
    </div>
  )
}
