export type ImportedDescriptionParts = {
  full: string
  summary: string
  features: string
}

const LEADING_BREAKS = /^(?:\s|<br\s*\/?>|&nbsp;)+/gi
const TRAILING_BREAKS = /(?:\s|<br\s*\/?>|&nbsp;)+$/gi

function trimHtmlSection(value: string) {
  return value.replace(LEADING_BREAKS, "").replace(TRAILING_BREAKS, "").trim()
}

function headingPattern(label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(
    `(?:<strong>\\s*)?${escaped}(?![\\p{L}\\p{N}_])\\s*:?\\s*(?:<\\/strong>)?`,
    "iu"
  )
}

/**
 * Excel'deki tek açıklama alanını yönetim panelindeki üç alana böler.
 * Bölümler yalnızca açık başlıklar bulunduğunda türetilir; böylece başlıksız
 * açıklamalar otomatik olarak özet veya özellik alanına kopyalanmaz.
 */
export function splitImportedDescriptionHtml(
  html: string
): ImportedDescriptionParts {
  const full = trimHtmlSection(html)
  const featuresHeading = headingPattern("Özellikler").exec(full)

  if (!featuresHeading || featuresHeading.index === undefined) {
    return { full, summary: "", features: "" }
  }

  const summary = trimHtmlSection(full.slice(0, featuresHeading.index))
  const featuresStart = featuresHeading.index + featuresHeading[0].length
  const afterFeatures = full.slice(featuresStart)
  const usageHeading = headingPattern("Kullanım Alanları ve Avantajlar").exec(
    afterFeatures
  )
  const features = trimHtmlSection(
    usageHeading && usageHeading.index !== undefined
      ? afterFeatures.slice(0, usageHeading.index)
      : afterFeatures
  )

  return { full, summary, features }
}
