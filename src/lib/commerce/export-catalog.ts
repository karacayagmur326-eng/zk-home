import ExcelJS from "exceljs"

export function catalogPlainText(value: unknown) {
  const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”" }
  return String(value || "").replace(/<br\s*\/?\s*>/gi, "\n").replace(/<\/(p|div|li|h[1-6])>/gi, "\n").replace(/<[^>]+>/g, "")
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
      if (entity.startsWith("#")) {
        const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1))
        return code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match
      }
      return entities[entity.toLowerCase()] ?? match
    }).replace(/\n{3,}/g, "\n\n").trim()
}

export async function createCatalogWorkbook(products: any[]) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "ZK HOME"
  const sheet = workbook.addWorksheet("Ürünler", { views: [{ state: "frozen", ySplit: 1 }] })
  const discounted = products.some(p => p.variants?.some((v: any) => Number(p.metadata?.original_price) > Number(v.prices?.[0]?.amount)))
  sheet.columns = [
    { header: "Marka", key: "brand", width: 20 },
    { header: "Kategori", key: "categories", width: 35 },
    { header: "Stok Kodu", key: "sku", width: 22 },
    { header: "Adet", key: "stock", width: 9 },
    { header: "Ürün Adı", key: "title", width: 48 },
    { header: "Ürün Özeti", key: "summary", width: 65 },
    { header: "Ürün Açıklaması", key: "description", width: 65 },
    { header: "Normal Fiyat (KDV Dahil, TL)", key: "price", width: 25 },
    ...(discounted ? [{ header: "İndirimli Fiyat", key: "sale", width: 22 }] : []),
  ]
  const allCategories = new Map<string, any>()
  products.forEach(p => (p.categories || []).forEach((c: any) => allCategories.set(c.id, c)))
  const depth = (category: any) => { let n = 0; const seen = new Set<string>(); while (category?.parent_category_id && !seen.has(category.id)) { seen.add(category.id); n++; category = allCategories.get(category.parent_category_id) } return n }
  for (const product of products) {
    const summary = catalogPlainText(product.metadata?.product_summary || product.subtitle)
    const full = catalogPlainText(product.description)
    const features = catalogPlainText(product.metadata?.features_content)
    const description = features && !full.includes(features) ? [full, features].filter(Boolean).join("\n\n") : full
    const categories = [...(product.categories || [])].sort((a, b) => depth(a) - depth(b) || a.name.localeCompare(b.name, "tr"))
    for (const variant of product.variants || []) {
      const current = Number(variant.prices?.[0]?.amount || 0)
      const original = Math.max(current, Number(product.metadata?.original_price) || 0)
      const row = sheet.addRow({ brand: product.collection?.title || product.metadata?.brand || "", categories: categories.map(c => `*${c.name}*`).join(" "), sku: String(variant.sku || ""), stock: variant.manage_inventory ? Number(variant.inventory_quantity ?? variant.stock ?? 0) : null, title: product.title, summary, description, price: original / 100, sale: original > current ? current / 100 : null })
      row.height = Math.min(409, Math.max(55, Math.ceil(Math.max(summary.length / 60, description.length / 60, String(row.getCell(2).value).length / 30)) * 14 + 16))
      row.eachCell({ includeEmpty: true }, cell => {
        cell.font = { name: "Calibri", size: 11 }
        cell.alignment = { vertical: "top", wrapText: true }
        cell.border = { top: { style: "thin", color: { argb: "FFD5D5D5" } }, bottom: { style: "thin", color: { argb: "FFD5D5D5" } }, left: { style: "thin", color: { argb: "FFD5D5D5" } }, right: { style: "thin", color: { argb: "FFD5D5D5" } } }
      })
      row.getCell(3).numFmt = "@"
      row.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF92D050" } }
      row.getCell(8).numFmt = '#,##0.00" TL"'
      if (discounted) row.getCell(9).numFmt = '#,##0.00" TL"'
    }
  }
  sheet.getRow(1).height = 32
  sheet.getRow(1).eachCell(cell => { cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC98484" } }; cell.alignment = { vertical: "middle", wrapText: true } })
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: sheet.rowCount, column: sheet.columnCount } }
  return workbook
}
