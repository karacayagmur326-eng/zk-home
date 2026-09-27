import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { createId, slugify } from "@lib/commerce/repository"
import { revalidatePath } from "next/cache"

function revalidateBrandPages(handle?: string) {
  revalidatePath("/markalar")
  revalidatePath("/markalarimiz")
  if (handle) revalidatePath(`/markalar/${handle}`)
}

export async function GET() {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  const collections = await query(
    `SELECT * FROM store_collection ORDER BY created_at DESC`
  )
  return NextResponse.json({ collections, count: collections.length })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  const body = await req.json()
  const title = String(body.title || "").trim()
  if (!title)
    return NextResponse.json(
      { error: "Koleksiyon adı zorunludur." },
      { status: 400 }
    )
  const rows = await query<any>(
    `INSERT INTO store_collection (id,title,handle,metadata)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [
      createId("pcol"),
      title,
      slugify(body.handle || title),
      body.metadata || {},
    ]
  )
  revalidateBrandPages(rows[0]?.handle)
  return NextResponse.json({ collection: rows[0] }, { status: 201 })
}
