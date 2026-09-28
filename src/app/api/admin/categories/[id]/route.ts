import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import {
  deleteStoreCategory,
  updateStoreCategory,
} from "@lib/commerce/repository"

type Context = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Context) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  const category = await updateStoreCategory(
    (await params).id,
    await req.json()
  )
  if (!category)
    return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 404 })
  return NextResponse.json({ product_category: category })
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  const id = (await params).id
  try {
    const deleted = await deleteStoreCategory(id)
    return NextResponse.json({ id, deleted })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kategori silinemedi." }, { status: 409 })
  }
}
