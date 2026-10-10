import { sitemapEnabled, sitemapEntryOptions } from "@lib/seo/sitemap-settings"
import { normalizeSitemapSettings } from "@lib/seo/google-settings"
import { getThemeSettings } from "@lib/content/theme-settings"
import { emptySitemap } from "@lib/seo/sitemap-response"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { getBaseURL } from "@lib/util/env"
import { NextResponse } from "next/server"
import { escapeXml, isPublicContentPath, lastModifiedXml } from "@lib/seo/indexing"
import legacyRedirects from "@lib/seo/legacy-redirects.json"
import { getPublicPageAliases } from "@lib/seo/page-aliases"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
  const settings = await getThemeSettings()
  if (!sitemapEnabled(settings, "pages")) return emptySitemap()
  const sitemapConfig = normalizeSitemapSettings(settings?.seo_sitemap_settings)
  const baseUrl = getBaseURL()
  await ensureCommerceSchema()

  const pages = await query<{ handle: string; updated_at: string; custom_slug: string | null; content: Record<string, any> }>(
    `SELECT handle, updated_at, content, content->>'custom_slug' AS custom_slug FROM content_pages`
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
    "kvkk-aydinlatma-metni",
  ])

  const aliases = await getPublicPageAliases()
  for (const item of staticConfig) {
    const alias = aliases.find((alias) => alias.source === item.path)
    const page = pages.find((page) => `/${page.handle}` === item.path)
    const customPath = page?.custom_slug ? `/${page.custom_slug}` : ""
    if (alias) item.path = alias.path
    else if (isPublicContentPath(customPath)) item.path = customPath
  }
  const pagePath = (page: typeof pages[number]) => page.handle === "kvkk-aydinlatma-metni" ? "/kvkk" : `/${page.custom_slug || page.handle}`
  const blocked = pages.filter(page => page.content.status === "draft" || page.content.seo_noindex === true || page.content.seo_sitemap === false || (page.content.seo_canonical && page.content.seo_canonical !== `${baseUrl}${pagePath(page)}`)).map(pagePath)
  for (let index = staticConfig.length - 1; index >= 0; index--) if (blocked.includes(staticConfig[index].path)) staticConfig.splice(index, 1)
  if (!sitemapConfig.home) {
    const homeIndex = staticConfig.findIndex(item => item.path === "")
    if (homeIndex >= 0) staticConfig.splice(homeIndex, 1)
  }
  const staticSet = new Set(staticConfig.map((item) => item.path))
  const redirectSources = new Set(
    (legacyRedirects as Array<{ source: string }>).map((item) => item.source)
  )
  const seen = new Set(staticSet)

  const staticXmlRows = staticConfig.map(
    (item) => `  <url>
    <loc>${baseUrl}${item.path}</loc>
    ${item.path === "" ? `<changefreq>${sitemapConfig.homeChangefreq}</changefreq><priority>${sitemapConfig.homePriority}</priority>` : sitemapEntryOptions(settings, "pages")}
  </url>`
  )

  const dynamicXmlRows = pages
    .filter(
      (page) => {
        const path = `/${page.custom_slug || page.handle}`
        if (page.content.status === "draft" || page.content.seo_noindex === true || page.content.seo_sitemap === false || (page.content.seo_canonical && page.content.seo_canonical !== `${baseUrl}/${page.custom_slug || page.handle}`) || !isPublicContentPath(path) || seen.has(path) || redirectSources.has(path) || excludedDynamicHandles.has(page.handle)) return false
        seen.add(path)
        return true
      }
    )
    .map(
      (page) => `  <url>
    <loc>${escapeXml(`${baseUrl}/${page.custom_slug || page.handle}`)}</loc>
    ${lastModifiedXml(page.updated_at)}
    ${sitemapEntryOptions(settings, "pages")}
  </url>`
    )

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticXmlRows, ...dynamicXmlRows].join("\n")}
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
