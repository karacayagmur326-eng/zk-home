import { getBaseURL } from "@lib/util/env"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  const baseUrl = getBaseURL()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-categories.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-products.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-collections.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-blog.xml</loc>
  </sitemap>
</sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  })
}
