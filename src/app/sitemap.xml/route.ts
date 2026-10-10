import { sitemapEnabled } from "@lib/seo/sitemap-settings"
import { sitemapKinds } from "@lib/seo/google-settings"
import { escapeXml } from "@lib/seo/indexing"
import { query } from "@lib/admin/db"
import { getThemeSettings } from "@lib/content/theme-settings"
import { getBaseURL } from "@lib/util/env"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const baseUrl = getBaseURL()
  const settings = await getThemeSettings()
  if (!sitemapEnabled(settings)) return new NextResponse('<?xml version="1.0"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>', { headers: { "Content-Type": "application/xml" } })
  const counts = await query<{ count: string }>("SELECT COUNT(*) AS count FROM store_product WHERE status='published' AND deleted_at IS NULL")
  const productParts = Math.max(1, Math.ceil(Number(counts[0]?.count || 0) / 5000))

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemapKinds.filter(kind => sitemapEnabled(settings, kind)).flatMap(kind =>
    Array.from({ length: kind === "products" ? productParts : 1 }, (_, part) =>
      `<sitemap><loc>${escapeXml(`${baseUrl}/sitemap-${kind}.xml${part ? `?part=${part}` : ""}`)}</loc></sitemap>`)
  ).join("\n")}
</sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=60",
    },
  })
}
