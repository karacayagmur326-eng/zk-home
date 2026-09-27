import { query } from "@lib/admin/db"
import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"

const ensureTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS featured_section (
      id TEXT PRIMARY KEY DEFAULT 'main',
      title TEXT NOT NULL DEFAULT 'ÖNE ÇIKAN ÜRÜNLER',
      subtitle TEXT NOT NULL DEFAULT 'Mağazada öne çıkan ürünler.',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
  await query(`
    CREATE TABLE IF NOT EXISTS featured_tabs (
      id BIGSERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // Seed default section if empty
  await query(`
    INSERT INTO featured_section (id, title, subtitle)
    VALUES ('main', 'ÖNE ÇIKAN ÜRÜNLER', 'Mağazada öne çıkan ürünler.')
    ON CONFLICT (id) DO NOTHING
  `)

}

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  await ensureTable()

  const sections = await query<{ title: string; subtitle: string }>(
    `SELECT title, subtitle FROM featured_section WHERE id = 'main'`
  )
  const tabs = await query<{
    id: string
    label: string
    tag_id: string
    position: number
    is_active: boolean
  }>(
    `SELECT id, label, tag_id, position, is_active
     FROM featured_tabs
     ORDER BY position ASC`
  )

  return NextResponse.json({
    section: sections[0] || { title: "ÖNE ÇIKAN ÜRÜNLER", subtitle: "Mağazada öne çıkan ürünler." },
    tabs,
  })
}

export async function POST(request: Request) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  await ensureTable()
  const body = await request.json().catch(() => null)

  if (body?.action === "update_section") {
    const title = String(body.title || "").trim()
    const subtitle = String(body.subtitle || "").trim()
    if (!title) return NextResponse.json({ error: "Başlık boş olamaz." }, { status: 400 })
    await query(
      `UPDATE featured_section SET title = $1, subtitle = $2, updated_at = NOW() WHERE id = 'main'`,
      [title, subtitle]
    )
    return NextResponse.json({ success: true })
  }

  if (body?.action === "add_tab") {
    const label = String(body.label || "").trim()
    const tag_id = String(body.tag_id || "").trim()
    if (!label || !tag_id) return NextResponse.json({ error: "Etiket adı ve ID gerekli." }, { status: 400 })
    const countRows = await query<{ count: string }>(`SELECT COUNT(*) as count FROM featured_tabs`)
    const pos = parseInt(countRows[0]?.count || "0")
    const rows = await query<{ id: string }>(
      `INSERT INTO featured_tabs (label, tag_id, position) VALUES ($1, $2, $3) RETURNING id`,
      [label, tag_id, pos]
    )
    return NextResponse.json({ success: true, id: rows[0].id })
  }

  if (body?.action === "update_tab") {
    const id = String(body.id || "").trim()
    const label = String(body.label || "").trim()
    const tag_id = String(body.tag_id || "").trim()
    const is_active = body.is_active !== false
    if (!id || !label || !tag_id) return NextResponse.json({ error: "Eksik alan." }, { status: 400 })
    await query(
      `UPDATE featured_tabs SET label = $1, tag_id = $2, is_active = $3 WHERE id = $4`,
      [label, tag_id, is_active, id]
    )
    return NextResponse.json({ success: true })
  }

  if (body?.action === "reorder") {
    const ids: string[] = body.ids || []
    for (let i = 0; i < ids.length; i++) {
      await query(`UPDATE featured_tabs SET position = $1 WHERE id = $2`, [i, ids[i]])
    }
    return NextResponse.json({ success: true })
  }

  if (body?.action === "delete_tab") {
    const id = String(body.id || "").trim()
    if (!id) return NextResponse.json({ error: "ID gerekli." }, { status: 400 })
    await query(`DELETE FROM featured_tabs WHERE id = $1`, [id])
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 })
}
