import { NextResponse } from "next/server"
import { query } from "@lib/admin/db"
import { getMobileSettings } from "@lib/content/mobile-settings"
import { getAdminSession } from "@lib/admin/auth"

export async function GET() {
  const session = await getAdminSession(["Admin"])
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
  }

  try {
    const products = await query(`SELECT count(*) FROM store_product`).catch((e) => [{ count: "error: " + e.message }])
    const categories = await query(`SELECT count(*) FROM store_category`).catch((e) => [{ count: "error: " + e.message }])
    const brands = await query(`SELECT count(*) FROM store_brand`).catch((e) => [{ count: "error: " + e.message }])
    const sliders = await query(`SELECT count(*) FROM store_slider`).catch((e) => [{ count: "error: " + e.message }])
    const pages = await query(`SELECT count(*) FROM store_page_content`).catch((e) => [{ count: "error: " + e.message }])
    const mobileSettings = await getMobileSettings().catch(() => null)

    return NextResponse.json({
      success: true,
      counts: {
        products: products[0]?.count || 0,
        categories: categories[0]?.count || 0,
        brands: brands[0]?.count || 0,
        sliders: sliders[0]?.count || 0,
        pages: pages[0]?.count || 0,
      },
      mobileSettingsEnabled: mobileSettings?.enabled ?? null,
    })
  } catch (error: any) {
    console.error("Database diagnostics error:", error)
    return NextResponse.json({ success: false, error: "Veritabanı durumu okunamadı." }, { status: 500 })
  }
}
