import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { flushAllSiteCache } from "@lib/cache"
import {
  getStoreProduct,
  restoreStoreProduct,
  updateStoreProduct,
} from "@lib/commerce/repository"
import {
  deleteProductsWithMedia,
  restoreProductMedia,
} from "@lib/commerce/product-deletion"

type Context = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Context) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  const product = await getStoreProduct((await params).id)
  if (!product)
    return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
  return NextResponse.json({ product })
}

export async function POST(req: NextRequest, { params }: Context) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    const id = (await params).id
    const body = await req.json()
    if (body.action === "restore") {
      const restored = await restoreStoreProduct(id)
      const restoredMedia = restored ? await restoreProductMedia([id]) : 0
      await flushAllSiteCache().catch(() => {})
      return NextResponse.json({ id, restored, restoredMedia })
    }
    const product = await updateStoreProduct(id, body)
    if (!product)
      return NextResponse.json({ error: "Ürün bulunamadı." }, { status: 404 })
    await flushAllSiteCache().catch(() => {})
    return NextResponse.json({ product })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  const id = (await params).id
  const { searchParams } = new URL(req.url)
  const permanent = searchParams.get("permanent") === "true"
  const result = await deleteProductsWithMedia([id], {
    permanent,
    deleteMedia: searchParams.get("delete_media") === "true",
  })
  await flushAllSiteCache().catch(() => {})
  return NextResponse.json({
    id,
    deleted: result.deletedProducts > 0,
    permanent,
    ...result,
  })
}
