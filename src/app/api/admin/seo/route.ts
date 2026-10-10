import { ensureBlogSeoSchema } from "@lib/seo/blog"
import { renderSeoTemplate } from "@lib/seo/templates"
import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query, withTransaction } from "@lib/admin/db"
import {
  listStoreProducts,
  listStoreCategories,
} from "@lib/commerce/repository"
import { getThemeSettings } from "@lib/content/theme-settings"
import {
  entityMetadata,
  productSeo,
  plainText,
  absoluteUrl,
} from "@lib/seo/entity"
import { productStructuredData } from "@lib/seo/product-schema"
import { productFieldIssues } from "@lib/commerce/product-validation"
import { categoryPath } from "@lib/seo/category"
import { flushAllSiteCache } from "@lib/cache"

const keys = [
  "seo_title",
  "seo_description",
  "h1_title",
  "seo_canonical",
  "seo_noindex",
  "seo_sitemap",
  "og_title",
  "og_image",
  "image_alt_texts",
  "image_alt",
  "lower_description",
  "model",
  "mpn",
  "google_product_category",
  "merchant_excluded",
  "complementary_product_ids",
  "is_indexable",
]
async function inventory() {
  await ensureBlogSeoSchema()
  const products: any[] = []
  for (let offset = 0; ; offset += 500) {
    const catalog = await listStoreProducts({ limit: 500, offset })
    products.push(...catalog.products)
    if (
      offset + catalog.products.length >= catalog.count ||
      !catalog.products.length
    )
      break
  }
  const [categories, pages, settings] = await Promise.all([
    listStoreCategories(false),
    query<any>("SELECT handle, content, updated_at FROM content_pages"),
    getThemeSettings(),
  ])
  const rows: any[] = products.map((product) => {
    const seo = productSeo(product, settings)
    const metadata = product.metadata || {}
    const images = Array.from(
      new Set<string>(
        [
          product.thumbnail,
          ...product.images.map((image: any) => image.url),
        ].filter(Boolean)
      )
    )
    return {
      kind: "product",
      id: product.id,
      title: product.title,
      status: product.status,
      handle: product.handle,
      path: `/urunler/${product.handle}`,
      metadata,
      images,
      description: product.description || "",
      summary: metadata.product_summary || "",
      seoTitle: seo.title,
      seoDescription: seo.description,
      issues: productFieldIssues(product).map((issue) => issue.message),
      schema: productStructuredData(product, settings),
      editUrl: `/admin/urunler/${product.id}`,
    }
  })
  for (const category of categories as any[]) {
    const metadata = category.metadata || {},
      tokens = {
        kategori: category.name,
        site_adi: settings?.logo_text || "ZK Home",
        ayirici: settings?.seo_title_separator || "|",
      },
      title =
        metadata.seo_title ||
        renderSeoTemplate(
          settings?.seo_category_title_template ||
            "%kategori% %ayirici% %site_adi%",
          tokens
        ),
      description = plainText(
        metadata.seo_description ||
          category.description ||
          renderSeoTemplate(
            settings?.seo_category_desc_template ||
              "%kategori% ürünlerini %site_adi% üzerinde inceleyin.",
            tokens
          )
      )
    rows.push({
      kind: "category",
      id: category.id,
      title: category.name,
      status: category.is_active ? "published" : "draft",
      handle: category.handle,
      path: categoryPath(category),
      metadata,
      images: [metadata.hero_image_url || metadata.image_url].filter(Boolean),
      description: category.description || "",
      seoTitle: title,
      seoDescription: description,
      issues: [],
      editUrl: "/admin/kategoriler",
      schema: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: category.name,
        url: absoluteUrl(categoryPath(category)),
      },
    })
  }
  for (const page of pages) {
    const metadata = page.content || {},
      title =
        metadata.seo_title ||
        renderSeoTemplate(
          settings?.seo_page_title_template ||
            "%sayfa_adi% %ayirici% %site_adi%",
          {
            sayfa_adi: metadata.title || page.handle,
            site_adi: settings?.logo_text || "ZK Home",
            ayirici: settings?.seo_title_separator || "|",
          }
        ),
      description = plainText(metadata.seo_description || metadata.description)
    rows.push({
      kind: "page",
      id: page.handle,
      title: metadata.title || page.handle,
      status: metadata.status || "published",
      handle: metadata.custom_slug || page.handle,
      path:
        page.handle === "kvkk-aydinlatma-metni"
          ? "/kvkk"
          : `/${metadata.custom_slug || page.handle}`,
      metadata,
      images: [metadata.hero_image_url || metadata.image].filter(Boolean),
      description: metadata.description || "",
      seoTitle: title,
      seoDescription: description,
      issues: [],
      editUrl: "/admin/sayfalar",
      schema: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: metadata.title,
        url: absoluteUrl(`/${metadata.custom_slug || page.handle}`),
      },
    })
  }
  const [brands, posts] = await Promise.all([
    query<any>("SELECT id,title,handle,metadata FROM store_collection"),
    query<any>(
      "SELECT id,title,slug,status,excerpt,image,seo_title,seo_description,seo_metadata FROM blog_posts"
    ),
  ])
  for (const brand of brands) {
    const metadata = brand.metadata || {},
      tokens = {
        marka: brand.title,
        site_adi: settings?.logo_text || "ZK Home",
        ayirici: settings?.seo_title_separator || "|",
      }
    rows.push({
      kind: "brand",
      id: brand.id,
      title: brand.title,
      status: metadata.active === false ? "draft" : "published",
      handle: brand.handle,
      path: `/markalar/${brand.handle}`,
      metadata,
      images: [metadata.image || metadata.image_url].filter(Boolean),
      description: metadata.description || "",
      seoTitle:
        metadata.seo_title ||
        renderSeoTemplate(
          settings?.seo_brand_title_template ||
            "%marka% Ürünleri ve Fiyatları %ayirici% %site_adi%",
          tokens
        ),
      seoDescription:
        metadata.seo_description ||
        renderSeoTemplate(
          settings?.seo_brand_desc_template ||
            "%marka% ürünlerini %site_adi% üzerinde inceleyin.",
          tokens
        ),
      issues: [],
      editUrl: "/admin/urunler/markalar",
      schema: {
        "@context": "https://schema.org",
        "@type": "Brand",
        name: brand.title,
      },
    })
  }
  for (const post of posts) {
    const metadata = {
      seo_title: post.seo_title || "",
      seo_description: post.seo_description || "",
      ...post.seo_metadata,
    }
    const tokens = {
      yazi_basligi: post.title,
      yazi_ozeti: post.excerpt || "",
      site_adi: settings?.logo_text || "ZK Home",
      ayirici: settings?.seo_title_separator || "|",
    }
    rows.push({
      kind: "blog",
      id: String(post.id),
      title: post.title,
      status: post.status,
      handle: post.slug,
      path: `/blog/${post.slug}`,
      metadata,
      images: [post.image].filter(Boolean),
      description: post.excerpt || "",
      seoTitle:
        metadata.seo_title ||
        renderSeoTemplate(
          settings?.seo_blog_title_template ||
            "%yazi_basligi% %ayirici% %site_adi%",
          tokens
        ),
      seoDescription: metadata.seo_description || post.excerpt || "",
      issues: [],
      editUrl: "/admin/blog",
      schema: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        url: absoluteUrl(`/blog/${post.slug}`),
      },
    })
  }
  const duplicate = (key: string) => {
    const counts = new Map<string, number>()
    for (const row of rows.filter((row) => row.status === "published")) {
      const value = plainText(row[key]).toLocaleLowerCase("tr-TR")
      if (value) counts.set(value, (counts.get(value) || 0) + 1)
    }
    return counts
  }
  const titles = duplicate("seoTitle"),
    descriptions = duplicate("seoDescription")
  for (const row of rows) {
    if (row.kind === "product") {
      const capacity = plainText(row.title).match(
        /\b(\d+(?:[.,]\d+)?)\s*ml\b/i
      )?.[1]
      const summaryCapacities = [
        ...plainText(row.summary).matchAll(/\b(\d+(?:[.,]\d+)?)\s*ml\b/gi),
      ].map((match) => match[1])
      if (capacity && summaryCapacities.some((value) => value !== capacity))
        row.issues.push(
          "Ürün adı ile özetteki ml ölçüsü farklı; gerçek kapasiteyi kontrol edin"
        )
      if (row.schema.hasVariant && !row.schema.variesBy?.length)
        row.issues.push(
          "Varyantların renk / beden bilgileri eksik; gerçek varyant özelliklerini girin"
        )
    }
    if (
      ["category", "brand"].includes(row.kind) &&
      row.metadata.is_indexable !== true
    )
      row.issues.push("Sayfaya özel indeksleme kapalı; ayarlardan açılabilir")
    if (!row.seoDescription) row.issues.push("Meta açıklaması eksik")
    if (
      (titles.get(plainText(row.seoTitle).toLocaleLowerCase("tr-TR")) || 0) > 1
    )
      row.issues.push("SEO başlığı yineleniyor")
    if (
      (descriptions.get(
        plainText(row.seoDescription).toLocaleLowerCase("tr-TR")
      ) || 0) > 1
    )
      row.issues.push("Meta açıklaması yineleniyor")
    if (
      row.kind === "product" &&
      row.images.some(
        (url: string) => !plainText(row.metadata.image_alt_texts?.[url])
      )
    )
      row.issues.push(
        "Özel görsel ALT metni eksik; ürün adı otomatik kullanılıyor"
      )
    if (
      row.metadata.seo_canonical &&
      absoluteUrl(row.metadata.seo_canonical) !== absoluteUrl(row.path)
    )
      row.issues.push(
        "Canonical başka adresi gösteriyor; sitemap dışına alınır"
      )
    if (
      row.kind === "product" &&
      !row.schema.gtin8 &&
      !row.schema.gtin12 &&
      !row.schema.gtin13 &&
      !row.schema.gtin14 &&
      !row.schema.hasVariant
    )
      row.issues.push("Geçerli GTIN yok; ürünün gerçek barkodu varsa girin")
  }
  return {
    rows,
    integrations: {
      searchConsole: Boolean(settings?.seo_google_verification),
      ga4: Boolean(settings?.seo_ga4_id),
      gtm: Boolean(settings?.seo_gtm_id),
      indexing: settings?.seo_indexing_enabled === true,
    },
    feed: absoluteUrl("/merchant-feed.xml"),
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}

export async function GET() {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    return NextResponse.json(await inventory(), {
      headers: { "Cache-Control": "private, no-store" },
    })
  } catch (error) {
    console.error("SEO inventory:", error)
    return NextResponse.json(
      { error: "SEO raporu alınamadı." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!(await getAdminSession()))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    await ensureBlogSeoSchema()
    const body = await request.json()
    const changes = Array.isArray(body.changes) ? body.changes : [body]
    if (!changes.length || changes.length > 500)
      return NextResponse.json(
        { error: "Tek seferde 1–500 kayıt düzenleyin." },
        { status: 400 }
      )
    const saved = await withTransaction(async (client) => {
      const result: string[] = []
      for (const change of changes) {
        if (
          !["product", "category", "page", "brand", "blog"].includes(
            change.kind
          ) ||
          typeof change.id !== "string"
        )
          throw new Error("Geçersiz kayıt.")
        const config =
          change.kind === "product"
            ? { table: "store_product", column: "metadata", id: "id" }
            : change.kind === "category"
            ? { table: "store_category", column: "metadata", id: "id" }
            : change.kind === "brand"
            ? { table: "store_collection", column: "metadata", id: "id" }
            : change.kind === "blog"
            ? { table: "blog_posts", column: "seo_metadata", id: "id" }
            : { table: "content_pages", column: "content", id: "handle" }
        const rows = await client.query(
          `SELECT ${config.column} AS metadata FROM ${config.table} WHERE ${config.id}=$1 FOR UPDATE`,
          [change.id]
        )
        if (!rows.rows[0]) throw new Error("Kayıt bulunamadı.")
        const old = rows.rows[0].metadata || {},
          next = { ...old }
        for (const key of keys)
          if (
            Object.prototype.hasOwnProperty.call(change.metadata || {}, key)
          ) {
            const value = change.metadata[key]
            if (
              [
                "seo_noindex",
                "seo_sitemap",
                "merchant_excluded",
                "is_indexable",
              ].includes(key) &&
              typeof value !== "boolean"
            )
              throw new Error("İndeksleme alanı doğru/yanlış olmalıdır.")
            if (
              !["image_alt_texts", "complementary_product_ids"].includes(key) &&
              typeof value !== "boolean" &&
              (typeof value !== "string" || value.length > 50000)
            )
              throw new Error("Geçersiz SEO alanı.")
            if (
              ["seo_canonical", "og_image"].includes(key) &&
              value &&
              (!absoluteUrl(value) || !/^https?:\/\//i.test(value))
            )
              throw new Error(
                "Canonical ve paylaşım görseli için tam HTTP/HTTPS adresi girin."
              )
            if (
              key === "image_alt_texts" &&
              (!value ||
                Array.isArray(value) ||
                typeof value !== "object" ||
                Object.entries(value).some(
                  ([url, alt]) =>
                    url.length > 2048 ||
                    typeof alt !== "string" ||
                    alt.length > 1000
                ))
            )
              throw new Error(
                "ALT metinlerini görsel adresi ve metin olarak girin."
              )
            if (
              key === "complementary_product_ids" &&
              (!Array.isArray(value) ||
                value.length > 24 ||
                value.some((id) => typeof id !== "string" || id.length > 100))
            )
              throw new Error("En fazla 24 ürün kimliği seçin.")
            next[key] = value
          }
        next.seo_history = [
          ...(Array.isArray(old.seo_history) ? old.seo_history : []),
          {
            at: new Date().toISOString(),
            before: Object.fromEntries(
              keys.map((key) => [key, old[key] ?? null])
            ),
            after: Object.fromEntries(
              keys.map((key) => [key, next[key] ?? null])
            ),
          },
        ].slice(-50)
        await client.query(
          `UPDATE ${config.table} SET ${config.column}=$2, updated_at=NOW() WHERE ${config.id}=$1`,
          [change.id, next]
        )
        result.push(change.id)
      }
      return result
    })
    await flushAllSiteCache()
    return NextResponse.json({ saved })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "SEO kaydedilemedi." },
      { status: 400 }
    )
  }
}
