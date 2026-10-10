import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { slugify } from "@lib/commerce/repository"
import { revalidatePath } from "next/cache"

function revalidateBrandPages(handle?: string) {
  revalidatePath("/markalar")
  revalidatePath("/markalarimiz")
  if (handle) revalidatePath(`/markalar/${handle}`)
}

type Context = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Context) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  const body = await req.json()
  const id = (await params).id
  const previous = (await query<any>("SELECT * FROM store_collection WHERE id=$1", [id]))[0]
  const nextHandle = body.handle ? slugify(body.handle) : previous?.handle || slugify(body.title || "")
  body.metadata = { ...previous?.metadata, ...body.metadata }
  if (previous?.handle && previous.handle !== nextHandle) body.metadata.slug_history = Array.from(new Set([...(previous.metadata?.slug_history || []), previous.handle])).filter(value => value !== nextHandle).slice(-100)
  const rows = await query<any>(
    `UPDATE store_collection SET
       title=COALESCE($2,title), handle=COALESCE($3,handle),
       metadata=COALESCE($4,metadata), updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [
      (await params).id,
      body.title || null,
      nextHandle || null,
      body.metadata || null,
    ]
  )
  revalidateBrandPages(rows[0]?.handle)
  return NextResponse.json({ collection: rows[0] || null })
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  const id = (await params).id
  await query(`UPDATE store_product SET collection_id=NULL WHERE collection_id=$1`, [id])
  const deleted = await query<{ handle: string }>(
    `DELETE FROM store_collection WHERE id=$1 RETURNING handle`,
    [id]
  )
  revalidateBrandPages(deleted[0]?.handle)
  return NextResponse.json({ id, deleted: true })
}
