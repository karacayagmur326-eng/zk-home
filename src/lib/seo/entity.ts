import type { Metadata } from "next"
import { getBaseURL } from "@lib/util/env"
import { renderSeoTemplate } from "./templates"

export function plainText(value: unknown): string {
  return String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim()
}

export function absoluteUrl(value: unknown, fallback = ""): string {
  if (!value && !fallback) return ""
  try {
    const url = new URL(String(value || fallback), getBaseURL())
    return /^https?:$/.test(url.protocol) ? url.href : ""
  } catch {
    return ""
  }
}

export function entityMetadata({
  title,
  description,
  path,
  metadata = {},
  image,
  index = true,
}: {
  title: string
  description: string
  path: string
  metadata?: Record<string, any>
  image?: string | null
  index?: boolean
}): Metadata {
  let canonical = absoluteUrl(metadata.seo_canonical, path)
  const pagination = new URL(path, getBaseURL()).searchParams.get("page")
  if (pagination && canonical) {
    const url = new URL(canonical)
    url.searchParams.set("page", pagination)
    canonical = url.href
  }
  const finalTitle = plainText(metadata.seo_title) || title
  const finalDescription =
    plainText(metadata.seo_description) || plainText(description)
  const ogTitle = plainText(metadata.og_title) || finalTitle
  const ogImage = absoluteUrl(metadata.og_image || image)
  return {
    title: { absolute: finalTitle },
    description: finalDescription,
    robots: { index: index && metadata.seo_noindex !== true, follow: true },
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description: finalDescription,
      url: canonical,
      type: "website",
      locale: "tr_TR",
      images: ogImage ? [{ url: ogImage, alt: finalTitle }] : [],
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: ogTitle,
      description: finalDescription,
      images: ogImage ? [ogImage] : [],
    },
  }
}

export function descriptionExcerpt(value: string, maximum = 160) {
  const text = plainText(value)
  if (text.length <= maximum) return text
  return (
    text
      .slice(0, maximum - 1)
      .replace(/\s+\S*$/, "")
      .replace(/[ ,;:.-]+$/, "") + "…"
  )
}

export function productSeo(product: any, settings: any = {}) {
  const md = product.metadata || {}
  const summary = plainText(
    md.product_summary ||
      md.short_description ||
      product.subtitle ||
      product.description
  )
  const variant = product.variants?.[0]
  const tokens = {
    urun_adi: product.title,
    kategori: product.categories?.[0]?.name || "",
    marka: md.brand_name || product.collection?.title || md.brand || "",
    fiyat: variant
      ? `${
          Number(
            variant.calculated_price?.calculated_amount ??
              variant.prices?.[0]?.amount ??
              0
          ) / 100
        } TL`
      : "",
    sku: variant?.sku || "",
    site_adi: settings.logo_text || "ZK Home",
    ayirici: settings.seo_title_separator || "|",
    ozet: summary,
  }
  const title =
    plainText(md.seo_title) ||
    renderSeoTemplate(
      settings.seo_product_title_template || "%urun_adi% %ayirici% %site_adi%",
      tokens
    )
  const description =
    plainText(md.seo_description) ||
    descriptionExcerpt(
      renderSeoTemplate(
        settings.seo_product_desc_template ||
          (summary
            ? "%urun_adi%. %ozet%"
            : "%urun_adi% ürününün özelliklerini, güncel fiyatını ve stok durumunu %site_adi% üzerinde inceleyin."),
        tokens
      )
    )
  return { title, description, tokens }
}

export function imageAlt(product: any, url: string, index = 0): string {
  return (
    plainText(product?.metadata?.image_alt_texts?.[url]) ||
    `${product?.title || "Ürün"}${index ? ` — ${index + 1}. görünüm` : ""}`
  )
}
