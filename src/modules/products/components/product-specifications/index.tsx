"use client"

import { HttpTypes } from "@medusajs/types"
import { sanitizeRichTextHtml } from "@modules/common/components/rich-text-editor"
import { formatProductLabels } from "@lib/util/format-product-labels"

export default function ProductSpecifications({ product }: { product: HttpTypes.StoreProduct }) {
  const md = (product.metadata || {}) as Record<string, unknown>
  const raw = typeof md.features_content === "string" ? md.features_content : ""
  const html = formatProductLabels(sanitizeRichTextHtml(raw)
    .replace(/<(\/?)h1\b/gi, "<$1h2")
    .replace(/^\s*<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>\s*/i, "")
    .trim())
  const contentText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").toLocaleLowerCase("tr")
  const specs = Array.isArray(md.tech_specs) ? md.tech_specs : []
  const rows = specs.filter((spec): spec is { key: string; value: string | number } =>
    Boolean(spec && typeof spec.key === "string" && spec.key.trim() &&
      (typeof spec.value === "string" || typeof spec.value === "number") && String(spec.value).trim())
  ).filter(spec => !contentText.includes(`${spec.key}: ${spec.value}`.toLocaleLowerCase("tr")))
  const fallback = !html ? [
    ["Marka", md.brand_name || product.collection?.title || md.brand],
    ["Model", md.model],
    ["Üretici parça numarası", md.mpn],
  ].filter((row): row is [string, string] => typeof row[1] === "string" && Boolean(row[1].trim())) : []
  if (!html && !rows.length && !fallback.length) return null

  return (
    <section id="urun-ozellikleri" aria-labelledby="product-specifications-heading" className="product-features-summary mt-6 scroll-mt-24 border-t border-slate-100 pt-5">
      <h2 id="product-specifications-heading" className="mb-3 text-base font-extrabold text-slate-900">Ürün Özellikleri</h2>
      {html && <div className="product-rich-text text-sm leading-6 text-slate-700" dangerouslySetInnerHTML={{ __html: html }} />}
      {(rows.length > 0 || fallback.length > 0) && <dl className="product-feature-grid">
        {[...fallback.map(([key, value]) => ({ key, value })), ...rows].map((spec, index) => (
          <div key={`${spec.key}-${index}`} className="product-feature-card">
            <dt className="font-bold text-slate-800">{spec.key}</dt>
            <dd className="mt-1 text-slate-600">{spec.value}</dd>
          </div>
        ))}
      </dl>}
    </section>
  )
}
