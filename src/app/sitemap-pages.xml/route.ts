import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { getBaseURL } from "@lib/util/env"
import { NextResponse } from "next/server"
import { escapeXml, isPublicContentPath, lastModifiedXml } from "@lib/seo/indexing"
import legacyRedirects from "@lib/seo/legacy-redirects.json"
import { getPublicPageAliases } from "@lib/seo/page-aliases"
import { isStoreReady } from "@lib/security/store-readiness"

export const dynamic = "force-dynamic"

export async function GET() {
  const baseUrl = getBaseURL()
  await ensureCommerceSchema()

  const pages = await query<{ handle: string; updated_at: string; custom_slug: string | null }>(
    `SELECT handle, updated_at, content->>'custom_slug' AS custom_slug FROM content_pages
     WHERE COALESCE(content->>'status', 'published') = 'published'`
  )

  const staticConfig = [
    { path: "", priority: "1.0", changefreq: "daily" },
    { path: "/magaza", priority: "0.9", changefreq: "daily" },
    { path: "/markalar", priority: "0.8", changefreq: "weekly" },
    { path: "/blog", priority: "0.8", changefreq: "daily" },
    { path: "/toptan-ve-kurumsal-satis", priority: "0.6", changefreq: "monthly" },
    { path: "/hakkimizda", priority: "0.5", changefreq: "monthly" },
    { path: "/iletisim", priority: "0.5", changefreq: "monthly" },
    { path: "/sss", priority: "0.5", changefreq: "weekly" },
    { path: "/garanti-ve-teknik-servis", priority: "0.5", changefreq: "monthly" },
    { path: "/teslimat-ve-iade", priority: "0.5", changefreq: "monthly" },
    { path: "/kvkk", priority: "0.3", changefreq: "monthly" },
    { path: "/gizlilik-politikasi", priority: "0.3", changefreq: "monthly" },
    { path: "/cerez-politikasi", priority: "0.3", changefreq: "monthly" },
    { path: "/kullanim-kosullari", priority: "0.3", changefreq: "monthly" },
  ]

  const excludedDynamicHandles = new Set([
    "markalarimiz",
    "koleksiyonlarim",
    "toptan-satis",
    "on-bilgilendirme-formu",
    "mesafeli-satis-sozlesmesi",
    "siparis-takibi",
  ])

  const aliases = await getPublicPageAliases()
  for (const item of staticConfig) {
    const alias = aliases.find((alias) => alias.source === item.path)
    const page = pages.find((page) => `/${page.handle}` === item.path)
    const customPath = page?.custom_slug ? `/${page.custom_slug}` : ""
    if (alias) item.path = alias.path
    else if (isPublicContentPath(customPath)) item.path = customPath
  }
  const staticSet = new Set(staticConfig.map((item) => item.path))
  const redirectSources = new Set(
    (legacyRedirects as Array<{ source: string }>).map((item) => item.source)
  )
  const seen = new Set(staticSet)

  const staticXmlRows = staticConfig.map(
    (item) => `  <url>
    <loc>${baseUrl}${item.path}</loc>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
  )

  const dynamicXmlRows = pages
    .filter(
      (page) => {
        const path = `/${page.custom_slug || page.handle}`
        if (!isPublicContentPath(path) || seen.has(path) || redirectSources.has(path) || excludedDynamicHandles.has(page.handle)) return false
        seen.add(path)
        return true
      }
    )
    .map(
      (page) => `  <url>
    <loc>${escapeXml(`${baseUrl}/${page.custom_slug || page.handle}`)}</loc>
    ${lastModifiedXml(page.updated_at)}
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>`
    )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${(isStoreReady() ? [...staticXmlRows, ...dynamicXmlRows] : []).join("\n")}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  })
}
