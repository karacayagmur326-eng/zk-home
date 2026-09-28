import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { defaultHomeEditorialContent } from "@lib/content/home-editorial"
import { NextRequest, NextResponse } from "next/server"

async function ensureTable() {
  await query(`CREATE TABLE IF NOT EXISTS homepage_editorial (
    id TEXT PRIMARY KEY,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
}

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureTable()
  const rows = await query<{ content: Record<string, unknown> }>("SELECT content FROM homepage_editorial WHERE id = 'main' LIMIT 1")
  return NextResponse.json({ content: { ...defaultHomeEditorialContent, ...(rows[0]?.content || {}) } })
}

export async function POST(request: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  const body = await request.json().catch(() => null)
  if (!body?.content || typeof body.content !== "object" || Array.isArray(body.content)) {
    return NextResponse.json({ error: "Geçersiz içerik." }, { status: 400 })
  }
  const content = { ...defaultHomeEditorialContent, ...body.content }
  for (const key of ["collection_cards", "highlight_cards", "room_cards"] as const) {
    if (!Array.isArray(content[key]) || content[key].length > 30) {
      return NextResponse.json({ error: `${key} listesi geçersiz.` }, { status: 400 })
    }
  }
  await ensureTable()
  await query(
    `INSERT INTO homepage_editorial (id, content, updated_at) VALUES ('main', $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
    [JSON.stringify(content)]
  )
  return NextResponse.json({ success: true })
}
