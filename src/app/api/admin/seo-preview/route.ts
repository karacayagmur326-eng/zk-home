import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { listStoreProducts, listStoreCategories } from "@lib/commerce/repository"
import { getSiteSeoMetadata } from "@lib/seo/templates"
import { getBaseURL } from "@lib/util/env"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  try {
    const [settings, catalog, categories, brands, pages] = await Promise.all([
      query<any>("SELECT logo_text, seo_meta_title, seo_meta_description, footer_description FROM theme_settings WHERE id=1"),
      listStoreProducts({ status: "published", limit: 1 }),
      listStoreCategories(true),
      query<any>(`SELECT c.title FROM store_collection c
        WHERE COALESCE(c.metadata->>'active', 'true') <> 'false'
        AND EXISTS (SELECT 1 FROM store_product p WHERE p.collection_id=c.id AND p.status='published' AND p.deleted_at IS NULL)
        ORDER BY c.title LIMIT 1`),
      query<any>(`SELECT handle, content FROM content_pages
        WHERE COALESCE(content->>'status', 'published') = 'published'
        AND NULLIF(content->>'title', '') IS NOT NULL
        ORDER BY (handle = 'hakkimizda') DESC, handle LIMIT 1`),
    ])
    const product = catalog.products[0]
    const category = categories.find((item: any) => item.products?.length)
    const brand = brands[0]
    const page = pages[0]
    return NextResponse.json({
      site: { ...getSiteSeoMetadata(settings[0]), url: getBaseURL() },
      samples: {
        products: product ? {
          label: product.title,
          tokens: { urun_adi: product.title, kategori: product.categories?.[0]?.name || "", marka: product.metadata?.brand || product.collection?.title || "", sku: product.variants?.[0]?.sku || "" },
        } : null,
        categories: category ? { label: category.name, tokens: { kategori: category.name } } : null,
        brands: brand ? { label: brand.title, tokens: { marka: brand.title } } : null,
        pages: page ? { label: page.content.title, tokens: { sayfa_adi: page.content.title } } : null,
      },
    }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("SEO preview data error:", error)
    return NextResponse.json({ error: "Site verileri yüklenemedi." }, { status: 500 })
  }
}
