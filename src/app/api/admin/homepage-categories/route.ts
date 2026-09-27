import { query } from "@lib/admin/db"
import { getAdminSession } from "@lib/admin/auth"
import { NextResponse } from "next/server"

const ensureTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS homepage_categories (
      category_id TEXT PRIMARY KEY,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  await ensureTable()
  const rows = await query<{ category_id: string; position: number }>(
    `SELECT category_id, position FROM homepage_categories ORDER BY position ASC`
  )
  return NextResponse.json({ category_ids: rows.map(r => r.category_id) })
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  await ensureTable()
  const body = await request.json().catch(() => null)
  const ids: string[] = Array.isArray(body?.category_ids) ? body.category_ids : []

  await query(`DELETE FROM homepage_categories`)
  for (let i = 0; i < ids.length; i++) {
    await query(
      `INSERT INTO homepage_categories (category_id, position) VALUES ($1, $2) ON CONFLICT (category_id) DO UPDATE SET position = $2`,
      [ids[i], i]
    )
  }
  return NextResponse.json({ success: true, count: ids.length })
}
