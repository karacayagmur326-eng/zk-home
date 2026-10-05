import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import {
  createId,
  createStoreCategory,
  createStoreProduct,
  listStoreCategories,
  listStoreProducts,
  slugify,
} from "@lib/commerce/repository"
import { query } from "@lib/admin/db"
import { splitImportCategories, normalizedName } from "@lib/commerce/import-catalog"
import { splitImportedDescriptionHtml } from "@lib/commerce/import-description"
import * as fs from "fs"
import * as path from "path"
import { lookup } from "dns/promises"
import { isIP } from "net"
import * as xlsx from "@e965/xlsx"

const MAX_EXCEL_SIZE = 10 * 1024 * 1024
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_ROWS = 5000
const DESCRIPTION_HEADERS = ["Ürün Açıklaması", "ÃœrÃ¼n AÃ§Ä±klamasÄ±"]

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function cleanExcelRichText(value: string) {
  const withoutUnsafeBlocks = value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")

  return withoutUnsafeBlocks
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (!part.startsWith("<")) return part
      if (/^<br\s*\/?\s*>$/i.test(part)) return "<br />"
      if (/^<b(?:\s[^>]*)?>$/i.test(part) || /^<strong(?:\s[^>]*)?>$/i.test(part)) {
        return "<strong>"
      }
      if (/^<\/b\s*>$/i.test(part) || /^<\/strong\s*>$/i.test(part)) {
        return "</strong>"
      }
      if (/^<i(?:\s[^>]*)?>$/i.test(part) || /^<em(?:\s[^>]*)?>$/i.test(part)) {
        return "<em>"
      }
      if (/^<\/i\s*>$/i.test(part) || /^<\/em\s*>$/i.test(part)) {
        return "</em>"
      }
      if (/^<u(?:\s[^>]*)?>$/i.test(part)) return "<u>"
      if (/^<\/u\s*>$/i.test(part)) return "</u>"
      return ""
    })
    .join("")
    .replace(/\r\n?|\n/g, "<br />")
    .replace(/(?:<br \/>){3,}/g, "<br /><br />")
    .trim()
}

function importedDescription(
  row: Record<string, any>,
  worksheet: xlsx.WorkSheet,
  descriptionColumn: number | null,
  fallback: string
) {
  const rowNumber = Number(row.__rowNum__)
  const cell =
    descriptionColumn !== null && Number.isInteger(rowNumber)
      ? worksheet[xlsx.utils.encode_cell({ r: rowNumber, c: descriptionColumn })]
      : undefined

  if (typeof cell?.h === "string" && cell.h.trim()) {
    const richText = cleanExcelRichText(cell.h)
    if (richText) return richText
  }

  const plainText = String(value(row, DESCRIPTION_HEADERS) || fallback)
    .replace(/\r\n?/g, "\n")
    .trim()
  return escapeHtml(plainText).replace(/\n/g, "<br />")
}

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase()
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number)
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    )
  }
  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  )
}

async function safeImageUrl(value: string) {
  const url = new URL(value)
  if (url.protocol !== "https:" || url.username || url.password) return null
  const addresses = await lookup(url.hostname, { all: true })
  if (!addresses.length || addresses.some((item) => isPrivateAddress(item.address))) {
    return null
  }
  return url
}

async function downloadImage(url: string, localPath: string) {
  try {
    const safeUrl = await safeImageUrl(url)
    if (!safeUrl) return false
    const response = await fetch(safeUrl, {
      headers: { "User-Agent": "Store Product Import" },
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) return false
    if (!String(response.headers.get("content-type") || "").startsWith("image/")) {
      return false
    }
    const declaredSize = Number(response.headers.get("content-length") || 0)
    if (declaredSize > MAX_IMAGE_SIZE) return false
    const image = Buffer.from(await response.arrayBuffer())
    if (!image.length || image.length > MAX_IMAGE_SIZE) return false
    await fs.promises.writeFile(localPath, image)
    return true
  } catch {
    return false
  }
}

function value(row: Record<string, any>, names: string[]) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null) return row[name]
  }
  return ""
}

function numeric(input: unknown) {
  const result = Number(
    String(input || "0")
      .replace(/\./g, "")
      .replace(",", ".")
  )
  return Number.isFinite(result) ? result : 0
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file)
      return NextResponse.json(
        { error: "Lütfen bir Excel dosyası yükleyin." },
        { status: 400 }
      )

    if (
      file.size <= 0 ||
      file.size > MAX_EXCEL_SIZE ||
      !file.name.toLocaleLowerCase("tr-TR").endsWith(".xlsx")
    ) {
      return NextResponse.json(
        { error: "En fazla 10 MB boyutunda geçerli bir .xlsx dosyası yükleyin." },
        { status: 400 }
      )
    }
    const workbook = xlsx.read(Buffer.from(await file.arrayBuffer()), {
      type: "buffer",
      cellFormula: false,
      // Hücre içindeki kalın parçalar ve satır sonları cell.h alanında korunur.
      cellHTML: true,
      cellStyles: false,
      sheetRows: MAX_ROWS + 1,
    })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!worksheet) {
      return NextResponse.json(
        { error: "Excel dosyasında çalışma sayfası bulunamadı." },
        { status: 400 }
      )
    }
    const rows = xlsx.utils
      .sheet_to_json<Record<string, any>>(worksheet, {
        raw: true,
        defval: "",
      })
      .slice(0, MAX_ROWS)
    if (!rows.length)
      return NextResponse.json(
        { error: "Excel dosyasında veri bulunamadı." },
        { status: 400 }
      )

    const worksheetRange = xlsx.utils.decode_range(worksheet["!ref"] || "A1:A1")
    let descriptionColumn: number | null = null
    for (let column = worksheetRange.s.c; column <= worksheetRange.e.c; column++) {
      const headerCell = worksheet[
        xlsx.utils.encode_cell({ r: worksheetRange.s.r, c: column })
      ]
      const header = String(headerCell?.v ?? headerCell?.w ?? "").trim()
      if (DESCRIPTION_HEADERS.includes(header)) {
        descriptionColumn = column
        break
      }
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await fs.promises.mkdir(uploadDir, { recursive: true })

    const categories = await listStoreCategories(false)
    const categoryMap = new Map(
      categories.map((category) => [
        normalizedName(category.name),
        category.id,
      ])
    )
    const existing = await listStoreProducts({ limit: 500 })
    const collections = await query<{ id: string; title: string }>(
      "SELECT id,title FROM store_collection ORDER BY title"
    )
    const brandMap = new Map(
      collections.map((brand) => [
        brand.title.toLocaleLowerCase("tr-TR").trim(),
        brand.id,
      ])
    )
    const productBySku = new Map<string, any>()
    for (const product of existing.products) {
      for (const variant of product.variants || []) {
        if (variant.sku) productBySku.set(String(variant.sku).trim(), product)
      }
    }
    const handles = new Set(existing.products.map((product) => product.handle))
    const titles = new Set(
      existing.products.map((product) =>
        product.title.toLocaleLowerCase("tr-TR").trim()
      )
    )

    let createdCount = 0
    let skippedCount = 0
    let createdBrandCount = 0
    let linkedBrandCount = 0

    for (const [index, row] of rows.entries()) {
      const title = String(
        value(row, ["Ürün Adı", "ÃœrÃ¼n AdÄ±"]) || `Ürün ${index + 1}`
      ).trim()
      const sku = String(
        value(row, ["Tedarikçi Stok Kodu", "Stok Kodu", "Barkod"]) || ""
      ).trim()
      if (!sku) {
        skippedCount++
        continue
      }
      const handle = `${slugify(title)}-${slugify(sku)}`.slice(0, 120)
      const brandName = String(value(row, ["Marka"]) || "Genel").trim()
      const brandKey = brandName.toLocaleLowerCase("tr-TR")
      let brandId = brandMap.get(brandKey)
      if (!brandId) {
        brandId = createId("pcol")
        await query(
          `INSERT INTO store_collection (id,title,handle,metadata)
           VALUES ($1,$2,$3,$4::jsonb)`,
          [brandId, brandName, slugify(brandName), JSON.stringify({ source: "excel" })]
        )
        brandMap.set(brandKey, brandId)
        createdBrandCount++
      }
      const categoryNames = splitImportCategories(String(value(row, ["Kategori İsmi", "Kategori", "Kategori Ä°smi"]) || "Genel"))
      const categoryIds: string[] = []
      for (const categoryName of categoryNames) {
        const categoryKey = normalizedName(categoryName)
        let categoryId = categoryMap.get(categoryKey)
        if (!categoryId) {
          const category = await createStoreCategory({ name: categoryName, is_active: true })
          categoryId = category.id
          categoryMap.set(categoryKey, category.id)
        }
        categoryIds.push(categoryId)
      }

      const existingProduct =
        productBySku.get(sku) ||
        existing.products.find(
          (product) =>
            product.handle === handle ||
            product.title.toLocaleLowerCase("tr-TR").trim() ===
              title.toLocaleLowerCase("tr-TR").trim()
        )
      if (
        existingProduct ||
        handles.has(handle) ||
        titles.has(title.toLocaleLowerCase("tr-TR"))
      ) {
        if (existingProduct) {
          await query(
            `UPDATE store_product
             SET collection_id=$2,
                 metadata=jsonb_set(metadata,'{brand}',to_jsonb($3::text),true),
                 updated_at=NOW()
             WHERE id=$1`,
            [existingProduct.id, brandId, brandName]
          )
          for (const categoryId of categoryIds) {
            await query("INSERT INTO store_product_category (product_id,category_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [existingProduct.id, categoryId])
          }
          linkedBrandCount++
        }
        skippedCount++
        continue
      }

      const barcode = String(value(row, ["Barkod"]) || sku)
      const safeName = barcode.replace(/[^a-zA-Z0-9]/g, "_")
      const images: string[] = []
      for (let imageIndex = 1; imageIndex <= 8; imageIndex++) {
        const remoteUrl = value(row, [`Görsel ${imageIndex}`, `GÃ¶rsel ${imageIndex}`])
        if (!String(remoteUrl).startsWith("http")) continue
        const filename = `${safeName}_${imageIndex}.jpg`
        const localPath = path.join(uploadDir, filename)
        const exists =
          fs.existsSync(localPath) && fs.statSync(localPath).size > 0
        if (exists || (await downloadImage(String(remoteUrl), localPath))) {
          images.push(`/uploads/${filename}`)
        }
      }

      const marketPrice = numeric(
        value(row, ["Piyasa Satış Fiyatı (KDV Dahil)"])
      )
      const salePrice =
        numeric(value(row, ["Trendyol'da Satılacak Fiyat (KDV Dahil)"])) ||
        marketPrice

      const importStatus =
        salePrice > 0 && images.length > 0 ? "published" : "draft"
      const stockValue = value(row, ["Stok", "Stok Adedi", "Mevcut Stok"])
      const hasStockValue = String(stockValue).trim() !== ""
      const stock = Math.max(0, Math.floor(numeric(stockValue)))

      const descriptionParts = splitImportedDescriptionHtml(
        importedDescription(row, worksheet, descriptionColumn, title)
      )

      await createStoreProduct({
        title,
        handle,
        description: descriptionParts.full,
        status: importStatus,
        collection_id: brandId,
        thumbnail: images[0] || "/images/placeholder.svg",
        images: images.map((url) => ({ url })),
        categories: categoryIds.map(id => ({ id })),
        variants: [
          {
            title: "Standart",
            sku,
            barcode,
            manage_inventory: hasStockValue,
            inventory_quantity: hasStockValue ? stock : 999,
            // Mağazada bütün parasal değerler kuruş olarak saklanır.
            prices: [{ amount: Math.round(salePrice * 100), currency_code: "try" }],
          },
        ],
        metadata: {
          brand: brandName,
          model_code: value(row, ["Model Kodu"]),
          original_price: marketPrice ? Math.round(marketPrice * 100) : undefined,
          product_summary: descriptionParts.summary,
          features_content: descriptionParts.features,
        },
      })
      handles.add(handle)
      titles.add(title.toLocaleLowerCase("tr-TR"))
      createdCount++
    }

    return NextResponse.json({
      success: true,
      createdCount,
      skippedCount,
      createdBrandCount,
      linkedBrandCount,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
