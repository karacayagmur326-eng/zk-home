import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import {
  createStoreCategory,
  listStoreCategories,
} from "@lib/commerce/repository"

export async function GET() {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    const categories = await listStoreCategories(false)
    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error("GET Categories Error:", error)
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    const category = await createStoreCategory(await req.json())
    return NextResponse.json({ product_category: category }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
