import { cache } from "react"
import { query } from "@lib/admin/db"
import { getThemeSettings } from "@lib/content/theme-settings"
import { renderSeoTemplate } from "./templates"
import { entityMetadata, descriptionExcerpt } from "./entity"
import { indexingEnabled } from "./indexing"

export const contentPageSeo = cache(async (handle: string) => {
  const rows = await query<{ content: Record<string, any> }>(
    "SELECT content FROM content_pages WHERE handle=$1 LIMIT 1",
    [handle]
  )
  return rows[0]?.content || {}
})
export async function contentPageMetadata(
  handle: string,
  title: string,
  description: string,
  path = `/${handle}`
) {
  const [content, settings] = await Promise.all([
    contentPageSeo(handle),
    getThemeSettings(),
  ])
  const rendered = renderSeoTemplate(
    settings?.seo_page_title_template || "%sayfa_adi% %ayirici% %site_adi%",
    {
      sayfa_adi: content.title || title,
      site_adi: settings?.logo_text || "ZK Home",
      ayirici: settings?.seo_title_separator || "|",
    }
  )
  const contractual = [
    "on-bilgilendirme-formu",
    "mesafeli-satis-sozlesmesi",
  ].includes(handle)
  return entityMetadata({
    title: rendered,
    description: descriptionExcerpt(content.description || description),
    path,
    metadata: content,
    image: content.hero_image || content.image,
    index:
      indexingEnabled(settings) && content.status !== "draft" && !contractual,
  })
}
