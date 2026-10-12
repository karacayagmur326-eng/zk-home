"use client"

import { HttpTypes } from "@medusajs/types"
import { sanitizeRichTextHtml } from "@modules/common/components/rich-text-editor"
import { formatProductLabels } from "@lib/util/format-product-labels"
import { useEffect, useRef } from "react"

const isRepeatedLabel = (label: string) => /^(marka(?: adı)?|brand(?: name)?|ürün kodu|stok kodu|sku)$/i.test(label.replace(/&nbsp;/gi, " ").replace(/:$/, "").trim())

function omitRepeatedFeatures(html: string) {
  return html.replace(/<(li|p|tr)\b[^>]*>[\s\S]*?<\/\1>/gi, block => {
    const text = block.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    const label = text.split(":")[0].trim()
    const firstCell = block.match(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/i)?.[1].replace(/<[^>]*>/g, "").trim()
    return isRepeatedLabel(label) || (firstCell && isRepeatedLabel(firstCell)) ? "" : block
  }).replace(/<(ul|ol)\b[^>]*>\s*<\/\1>/gi, "")
}

export default function ProductSpecifications({ product }: { product: HttpTypes.StoreProduct }) {
  const sectionRef = useRef<HTMLElement>(null)
  const md = (product.metadata || {}) as Record<string, unknown>
  const raw = typeof md.features_content === "string" ? md.features_content : ""
  const html = formatProductLabels(sanitizeRichTextHtml(omitRepeatedFeatures(raw))
    .replace(/<(\/?)h1\b/gi, "<$1h2")
    .replace(/^\s*<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>\s*/i, "")
    .trim())
  const contentText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").toLocaleLowerCase("tr")
  const specs = Array.isArray(md.tech_specs) ? md.tech_specs : []
  const rows = specs.filter((spec): spec is { key: string; value: string | number } =>
    Boolean(spec && typeof spec.key === "string" && spec.key.trim() &&
      (typeof spec.value === "string" || typeof spec.value === "number") && String(spec.value).trim())
  ).filter(spec => !isRepeatedLabel(spec.key) && !contentText.includes(`${spec.key}: ${spec.value}`.toLocaleLowerCase("tr")))
  const fallback = !html ? [
    ["Model", md.model],
    ["Üretici parça numarası", md.mpn],
  ].filter((row): row is [string, string] => typeof row[1] === "string" && Boolean(row[1].trim())) : []
  const extraRowsKey = JSON.stringify([fallback, rows])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    let frame = 0
    let disposed = false
    const measure = () => {
      section.querySelectorAll<HTMLElement>(".product-rich-text ul, .product-feature-grid").forEach(grid => {
        const cards = Array.from(grid.children) as HTMLElement[]
        // Measure at the normal card width before redistributing unused final-row space.
        grid.style.removeProperty("grid-template-columns")
        cards.forEach(card => { card.style.gridColumn = "span 1" })
        const columns = getComputedStyle(grid).gridTemplateColumns.split(/\s+/).filter(Boolean).length
        const measured = cards.map((card, index) => {
          const lineCenters: number[] = []
          const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT)
          const range = document.createRange()
          const tolerance = (parseFloat(getComputedStyle(card).lineHeight) || 24) / 2
          let node: Node | null
          while ((node = walker.nextNode())) {
            if (!node.textContent?.trim()) continue
            range.selectNodeContents(node)
            for (const rect of Array.from(range.getClientRects())) {
              if (!rect.width || !rect.height) continue
              const center = rect.top + rect.height / 2
              if (!lineCenters.some(line => Math.abs(line - center) < tolerance)) lineCenters.push(center)
            }
          }
          return { card, index, lines: lineCenters.length }
        })
        // Equal-length cards retain the author's order; wrapped cards gather in the final rows.
        measured.sort((a, b) => a.lines - b.lines || a.index - b.index)
        measured.forEach(({ card }, order) => { card.style.order = String(order) })
        if (columns > 1) {
          // A shared multiple lets every row divide evenly, regardless of its card count.
          let tracks = 1
          for (let size = 2; size <= columns; size++) {
            let a = tracks, b = size
            while (b) { const remainder = a % b; a = b; b = remainder }
            tracks = tracks * size / a
          }
          grid.style.gridTemplateColumns = `repeat(${tracks}, minmax(0, 1fr))`
          const compact = measured.filter(item => item.lines < 3)
          const expanded = measured.filter(item => item.lines >= 3)
          const rowCount = Math.ceil(compact.length / columns)
          let offset = 0
          for (let row = 0; row < rowCount; row++) {
            const size = Math.ceil((compact.length - offset) / (rowCount - row))
            compact.slice(offset, offset + size).forEach(({ card }) => {
              card.style.gridColumn = `span ${tracks / size}`
            })
            offset += size
          }
          expanded.forEach(({ card }) => { card.style.gridColumn = `span ${tracks}` })
        }
      })
    }
    const schedule = () => {
      if (disposed) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(section)
    schedule()
    document.fonts.ready.then(schedule)
    return () => { disposed = true; observer.disconnect(); cancelAnimationFrame(frame) }
  }, [html, extraRowsKey])

  if (!html && !rows.length && !fallback.length) return null

  return (
    <section ref={sectionRef} id="urun-ozellikleri" aria-labelledby="product-specifications-heading" className="product-features-summary mt-6 scroll-mt-24 border-t border-slate-100 pt-5">
      <h2 id="product-specifications-heading" className="mb-4 flex items-center gap-3 rounded-xl border border-primary/15 border-l-4 border-l-primary bg-primary/5 px-4 py-3 text-lg font-extrabold tracking-tight text-slate-900">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 shrink-0 text-primary"><path d="m3 6 2 2 3-4M11 6h10M3 13l2 2 3-4M11 13h10M3 20l2 2 3-4M11 20h10" /></svg>
        Ürün Özellikleri
      </h2>
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
