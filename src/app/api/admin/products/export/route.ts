import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { listStoreProducts } from "@lib/commerce/repository"
import { createCatalogWorkbook } from "@lib/commerce/export-catalog"

export const runtime = "nodejs"

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  const products: any[] = []
  let offset = 0
  while (true) {
    const result = await listStoreProducts({ limit: 500, offset })
    products.push(...result.products)
    offset += result.products.length
    if (offset >= result.count || !result.products.length) break
  }
  const workbook = await createCatalogWorkbook(products)
  const buffer = await workbook.xlsx.writeBuffer()
  return new Response(new Uint8Array(buffer), { headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": 'attachment; filename="ZK-HOME-Urunler.xlsx"',
    "Cache-Control": "private, no-store",
  } })
}
