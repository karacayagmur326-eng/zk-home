import * as xlsx from "@e965/xlsx"
import { parseTryPriceInput } from "@lib/util/money"

export const IMPORT_FIELDS = [
  ["sku", "Stok kodu (SKU)"], ["title", "Ürün adı"], ["brand", "Marka"],
  ["categories", "Ürün kategorileri"], ["stock", "Stok adedi"],
  ["regularPrice", "Normal fiyat (KDV dahil, TL)"], ["salePrice", "İndirimli fiyat (TL)"],
  ["summary", "Ürün özeti"], ["description", "Ürün açıklaması"],
  ["features", "Teknik özellikler"], ["barcode", "Barkod (GTIN/EAN)"],
] as const
export type ImportField = typeof IMPORT_FIELDS[number][0]
export type ColumnMapping = Record<ImportField, number | null>
export type CatalogRow = {
  sourceRow: number; sku: string; title: string; brand: string; categories: string[]
  stock: number | null; regularPrice: number; salePrice: number | null
  summary: string; description: string; features: string; barcode: string; issues: string[]
}
export const normalizedName = (value: string) => value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR")
export const normalizedSku = (value: string) => value.trim().toUpperCase()
export function splitImportCategories(value: string) {
  const parts = value.includes("*") ? value.split(/\*|;/) : value.split(/;|\r?\n/)
  const unique = new Map<string, string>()
  for (const part of parts) {
    const name = part.trim().replace(/\s+/g, " ")
    if (name) unique.set(normalizedName(name), name)
  }
  return [...unique.values()]
}
export function importColumns(sheet: xlsx.WorkSheet) {
  const range = xlsx.utils.decode_range(sheet["!ref"] || "A1:A1")
  return Array.from({ length: Math.min(range.e.c + 1, 200) }, (_, index) => ({
    index, label: `${xlsx.utils.encode_col(index)} — ${String(sheet[xlsx.utils.encode_cell({r:range.s.r,c:index})]?.v || "Başlıksız sütun").trim()}`,
    name: normalizedName(String(sheet[xlsx.utils.encode_cell({r:range.s.r,c:index})]?.v || "")),
  }))
}
export function defaultColumnMapping(sheet: xlsx.WorkSheet): ColumnMapping {
  const columns = importColumns(sheet)
  const find = (...names: string[]) => columns.find(column => names.map(normalizedName).includes(column.name))?.index ?? null
  const descriptions = columns.filter(column => column.name === normalizedName("Ürün Açıklaması"))
  return {
    sku: find("Stok Kodu", "Ürün Kodu", "Tedarikçi Stok Kodu"), title: find("Ürün", "Ürün Adı"),
    brand: find("Marka"), categories: find("Kategori", "Kategori İsmi"), stock: find("Adet", "Stok", "Stok Adedi", "Mevcut Stok"),
    regularPrice: find("Normal Fiyat (KDV Dahil, TL)", "Fiyat (kdv dahil)", "Fiyat (TL)", "Normal Fiyat", "Piyasa Satış Fiyatı (KDV Dahil)"),
    salePrice: find("İndirimli Fiyat", "Trendyol'da Satılacak Fiyat (KDV Dahil)"),
    summary: find("Ürün Özeti") ?? descriptions[0]?.index ?? null,
    description: find("Ürün Özeti") !== null ? descriptions[0]?.index ?? null : descriptions[1]?.index ?? descriptions[0]?.index ?? null,
    features: find("Teknik Özellikler"), barcode: find("Barkod", "GTIN", "EAN"),
  }
}
export function parseCatalogRows(sheet: xlsx.WorkSheet, mapping: ColumnMapping): CatalogRow[] {
  const range = xlsx.utils.decode_range(sheet["!ref"] || "A1:A1")
  const rows: CatalogRow[] = []
  const seen = new Set<string>()
  for (let r = range.s.r + 1; r <= Math.min(range.e.r, range.s.r + 5000); r++) {
    const cell = (field: ImportField) => mapping[field] === null ? undefined : sheet[xlsx.utils.encode_cell({r,c:mapping[field]!})]
    const text = (field: ImportField) => String(cell(field)?.w ?? cell(field)?.v ?? "").trim()
    const number = (field: ImportField) => parseTryPriceInput(cell(field)?.v ?? "")
    if (IMPORT_FIELDS.every(([field]) => !text(field))) continue
    const sku = text("sku"), title = text("title"), issues: string[] = []
    if (!sku) issues.push("Stok kodu eksik.")
    if (!title) issues.push("Ürün adı eksik.")
    if (sku && seen.has(normalizedSku(sku))) issues.push("Excel içinde bu stok kodu tekrarlanıyor.")
    if (sku) seen.add(normalizedSku(sku))
    const regularPrice = number("regularPrice")
    const salePrice = text("salePrice") ? number("salePrice") : null
    const stock = text("stock") ? number("stock") : null
    if (!Number.isFinite(regularPrice) || regularPrice < 0 || (salePrice !== null && (!Number.isFinite(salePrice) || salePrice <= 0))) issues.push("Fiyat geçersiz.")
    if (text("regularPrice") && regularPrice === 0 && !/^0(?:[.,]0+)?(?:\s*TL)?$/i.test(text("regularPrice"))) issues.push("Normal fiyat okunamadı.")
    if (stock !== null && (!Number.isInteger(stock) || stock < 0 || !/^\d+(?:[.,]0+)?$/.test(text("stock")))) issues.push("Stok adedi pozitif tam sayı veya sıfır olmalı.")
    rows.push({sourceRow:r+1,sku,title,brand:text("brand"),categories:splitImportCategories(text("categories")),stock,regularPrice,salePrice,
      summary:text("summary"),description:text("description"),features:text("features"),barcode:text("barcode"),issues})
  }
  return rows
}

export function matchSkuImages<T extends {name:string; webkitRelativePath?:string}>(files: T[], sku: string): T[] {
  const key = normalizedSku(sku)
  if (!key) return []
  return files.filter(file => {
    if (!/\.(jpe?g|png|webp|avif)$/i.test(file.name)) return false
    const parts = (file.webkitRelativePath || file.name).replace(/\\/g,"/").split("/")
    // Use the image's own folder, not an ancestor SKU: catalogs can contain
    // another product folder nested inside a product's directory.
    if (parts.length > 1) return normalizedSku(parts[parts.length - 2]) === key
    const stem = file.name.replace(/\.[^.]+$/, "")
    return normalizedSku(stem) === key || normalizedSku(stem).startsWith(`${key}_`) || normalizedSku(stem).startsWith(`${key} (`)
  }).sort((a,b) => (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name,"tr",{numeric:true}))
}
