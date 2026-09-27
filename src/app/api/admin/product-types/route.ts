import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"

export async function GET() {
  const session = await getAdminSession()
  if (!session)
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  const types = await query(
    `SELECT DISTINCT type_id AS id, type_value AS value
     FROM store_product
     WHERE type_id IS NOT NULL
     ORDER BY type_value`
  )
  return NextResponse.json({ types, count: types.length })
}
