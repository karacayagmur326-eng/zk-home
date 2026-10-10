import { indexingEnabled } from "@lib/seo/indexing"
import { getThemeSettings } from "@lib/content/theme-settings"
import { emptySitemap } from "@lib/seo/sitemap-response"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { getBaseURL } from "@lib/util/env"
import { NextRequest, NextResponse } from "next/server"
import { escapeXml, lastModifiedXml } from "@lib/seo/indexing"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
  if (!indexingEnabled(await getThemeSettings())) return emptySitemap()
  const baseUrl = getBaseURL()
  await ensureCommerceSchema()

  const part = Math.max(0, Math.min(10000, Math.floor(Number(request.nextUrl.searchParams.get("part")) || 0)))
  const products = await query<{ handle: string; updated_at: string; images: string[] }>(
    `SELECT p.handle, p.updated_at, ARRAY(SELECT url FROM store_product_image i WHERE i.product_id=p.id ORDER BY rank) AS images FROM store_product p
     WHERE status = 'published' AND deleted_at IS NULL
       AND metadata->>'seo_noindex' IS DISTINCT FROM 'true'
       AND metadata->>'seo_sitemap' IS DISTINCT FROM 'false'
       AND (NULLIF(metadata->>'seo_canonical','') IS NULL OR metadata->>'seo_canonical'=$1 || '/urunler/' || handle)
     ORDER BY p.id LIMIT 5000 OFFSET $2`, [baseUrl, part * 5000]
  )

  const xmlRows = products.map(
    (product) => `  <url>
    <loc>${escapeXml(`${baseUrl}/urunler/${product.handle}`)}</loc>
    ${lastModifiedXml(product.updated_at)}
    ${(product.images || []).map(url => `<image:image><image:loc>${escapeXml(new URL(url, baseUrl).href)}</image:loc></image:image>`).join("")}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlRows.join("\n")}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=60",
    },
  })
  } catch {
    // Report temporary data outages explicitly so crawlers retry later.
    return emptySitemap(503)
  }
}
