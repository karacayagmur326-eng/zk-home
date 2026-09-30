import { emptySitemap } from "@lib/seo/sitemap-response"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { getBaseURL } from "@lib/util/env"
import { NextResponse } from "next/server"
import { escapeXml, lastModifiedXml } from "@lib/seo/indexing"
import { isStoreReady } from "@lib/security/store-readiness"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!isStoreReady()) return emptySitemap()
  try {
  const baseUrl = getBaseURL()
  await ensureCommerceSchema()

  const categories = await query<{ handle: string; updated_at: string; metadata: Record<string, unknown> }>(
    `WITH RECURSIVE descendants(root_id, id) AS (
       SELECT id, id FROM store_category
       UNION ALL
       SELECT d.root_id, child.id FROM store_category child
       JOIN descendants d ON child.parent_id=d.id
     )
     SELECT c.handle, c.updated_at, c.metadata FROM store_category c
     WHERE c.active = true AND c.metadata->>'is_indexable' = 'true'
       AND NOT EXISTS (SELECT 1 FROM descendants d JOIN store_category ancestor ON ancestor.id=d.root_id
                       WHERE d.id=c.id AND ancestor.active=false)
       AND EXISTS (SELECT 1 FROM store_product_category pc JOIN store_product p ON p.id=pc.product_id
                   WHERE pc.category_id IN (SELECT id FROM descendants WHERE root_id=c.id)
                     AND p.status='published')
     ORDER BY c.rank, c.created_at`
  )

  const xmlRows = (isStoreReady() ? categories : []).map(
    (category) => `  <url>
    <loc>${escapeXml(`${baseUrl}${category.metadata?.pretty_url === true ? "" : "/kategoriler"}/${category.handle}`)}</loc>
    ${lastModifiedXml(category.updated_at)}
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
  } catch {
    // Report temporary data outages explicitly so crawlers retry later.
    return emptySitemap(503)
  }
}
