import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { flushAllSiteCache } from "@lib/cache"
import {
  createStoreProduct,
  listStoreProducts,
} from "@lib/commerce/repository"
import { deleteProductsWithMedia } from "@lib/commerce/product-deletion"

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1)
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "20"), 1),
    200
  )
  try {
    const { products, count, counts } = await listStoreProducts({
      q: searchParams.get("search") || searchParams.get("q") || undefined,
      status: searchParams.get("status") || undefined,
      categoryId: searchParams.get("category_id") || undefined,
      collectionId: searchParams.get("collection_id") || undefined,
      typeId: searchParams.get("type_id") || undefined,
      stock: searchParams.get("stock") || undefined,
      limit,
      offset: (page - 1) * limit,
    })
    return NextResponse.json({ products, total: count, count, counts, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    const product = await createStoreProduct(await req.json())
    await flushAllSiteCache().catch(() => {})
    return NextResponse.json({ product }, { status: 201 })
  } catch (error: any) {
    const status = String(error.message).includes("duplicate") ? 409 : 400
    return NextResponse.json({ error: error.message }, { status })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const body = await req.json() as {
      ids?: string[]
      permanent?: boolean
      deleteMedia?: boolean
    }
    if (!Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json({ error: "Silinecek ürün seçilmedi." }, { status: 400 })
    }

    const result = await deleteProductsWithMedia(body.ids, {
      permanent: Boolean(body.permanent),
      deleteMedia: Boolean(body.deleteMedia),
    })
    await flushAllSiteCache().catch(() => {})
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Ürünler silinemedi." },
      { status: 500 },
    )
  }
}
