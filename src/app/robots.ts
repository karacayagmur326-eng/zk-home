import { indexingEnabled } from "@lib/seo/indexing"
import { getBaseURL } from "@lib/util/env"
import { MetadataRoute } from "next"
import { getThemeSettings } from "@lib/content/theme-settings"
import { sitemapEnabled } from "@lib/seo/sitemap-settings"

export const dynamic = "force-dynamic"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = getBaseURL()
  const settings = await getThemeSettings().catch(() => null)
  const isPreview = process.env.VERCEL_ENV === "preview"
  const isIndexingDisabled = !indexingEnabled(settings) || isPreview

  if (isIndexingDisabled) {
    return {
      // Allow crawlers to observe the application's noindex directives.
      rules: [{ userAgent: "*", allow: "/" }],
      host: baseUrl,
    }
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private routes send noindex and require authentication where needed.
        // Blocking them here would prevent Google from reading that noindex.
      },
    ],
    sitemap: sitemapEnabled(settings) ? `${baseUrl}/sitemap.xml` : undefined,
    host: baseUrl,
  }
}
