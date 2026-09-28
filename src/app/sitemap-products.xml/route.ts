import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { getBaseURL } from "@lib/util/env"
import { NextResponse } from "next/server"
import { escapeXml, lastModifiedXml } from "@lib/seo/indexing"
import { isStoreReady } from "@lib/security/store-readiness"

export const dynamic = "force-dynamic"

export async function GET() {
  const baseUrl = getBaseURL()
  await ensureCommerceSchema()

  const products = await query<{ handle: string; updated_at: string }>(
    `SELECT handle, updated_at FROM store_product
     WHERE status = 'published' AND deleted_at IS NULL ORDER BY updated_at DESC`
  )

  const xmlRows = (isStoreReady() ? products : []).map(
    (product) => `  <url>
    <loc>${escapeXml(`${baseUrl}/urunler/${product.handle}`)}</loc>
    ${lastModifiedXml(product.updated_at)}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlRows.join("\n")}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  })
}
