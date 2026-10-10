import { ensureBlogSeoSchema } from "@lib/seo/blog"
import { indexingEnabled } from "@lib/seo/indexing"
import { getThemeSettings } from "@lib/content/theme-settings"
import { emptySitemap } from "@lib/seo/sitemap-response"
import { query } from "@lib/admin/db"
import { getBaseURL } from "@lib/util/env"
import { NextResponse } from "next/server"
import { escapeXml, lastModifiedXml } from "@lib/seo/indexing"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
  if (!indexingEnabled(await getThemeSettings())) return emptySitemap()
  await ensureBlogSeoSchema()
  const baseUrl = getBaseURL()
  // 2. Fetch Published Blog Posts
  const blogPosts = await query<{ slug: string; title: string; image?: string; updated_at?: string; published_at?: string; created_at?: string }>(
    `SELECT slug, title, image, updated_at, published_at, created_at
     FROM blog_posts
     WHERE status = 'published' AND seo_metadata->>'seo_noindex' IS DISTINCT FROM 'true' AND seo_metadata->>'seo_sitemap' IS DISTINCT FROM 'false' AND (NULLIF(seo_metadata->>'seo_canonical','') IS NULL OR seo_metadata->>'seo_canonical' = $1 || '/blog/' || slug)
     ORDER BY published_at DESC, created_at DESC`, [baseUrl]
  )

  // Main Blog Index URL
  const mainBlogXml = `  <url>
    <loc>${baseUrl}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`

  // Article URLs with Image extensions
  const postXmlRows = blogPosts.map((post) => {
    const lastmod = lastModifiedXml(post.updated_at || post.published_at || post.created_at)
    const imgUrl = post.image ? (post.image.startsWith("http") ? post.image : `${baseUrl}${post.image}`) : null

    return `  <url>
    <loc>${escapeXml(`${baseUrl}/blog/${post.slug}`)}</loc>
    ${lastmod}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${
      imgUrl
        ? `\n    <image:image>\n      <image:loc>${escapeXml(imgUrl)}</image:loc>\n      <image:title>${escapeXml(post.title)}</image:title>\n    </image:image>`
        : ""
    }
  </url>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${postXmlRows.join("\n")}
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
