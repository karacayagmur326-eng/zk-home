import { indexingEnabled } from "@lib/seo/indexing"
import {
  normalizeSitemapSettings,
  type SitemapKind,
} from "@lib/seo/google-settings"

export function sitemapEnabled(settings: any, kind?: SitemapKind): boolean {
  const config = normalizeSitemapSettings(settings?.seo_sitemap_settings)
  return (
    indexingEnabled(settings) &&
    config.enabled &&
    (!kind || config.sections[kind].enabled)
  )
}

export function sitemapEntryOptions(settings: any, kind: SitemapKind): string {
  const section = normalizeSitemapSettings(settings?.seo_sitemap_settings)
    .sections[kind]
  return `<changefreq>${section.changefreq}</changefreq><priority>${section.priority}</priority>`
}
