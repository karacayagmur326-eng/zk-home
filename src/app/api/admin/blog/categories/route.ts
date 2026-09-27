import { NextRequest, NextResponse } from "next/server"
import { query } from "@lib/admin/db"
import { getAdminSession } from "@lib/admin/auth"

export const dynamic = "force-dynamic"

function slugify(text: string): string {
  if (!text) return ""
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[şŞ]/g, "s")
    .replace(/[üÜ]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }
  try {
    const categories = await query(`
      SELECT c.*, count(p.id) as post_count
      FROM blog_categories c
      LEFT JOIN blog_posts p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `)
    return NextResponse.json({ categories })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, name, slug: rawSlug, icon = "file-text", description = "", sort_order = 0 } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Kategori adı zorunludur" }, { status: 400 })
    }

    let slug = slugify(rawSlug || name)
    const categoryId = id || `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    await query(
      `
      INSERT INTO blog_categories (id, name, slug, icon, description, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        icon = EXCLUDED.icon,
        description = EXCLUDED.description,
        sort_order = EXCLUDED.sort_order
    `,
      [categoryId, name.trim(), slug, icon, description.trim(), sort_order || 0]
    )

    return NextResponse.json({ success: true, id: categoryId, slug })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Kategori ID zorunludur" }, { status: 400 })

    await query("DELETE FROM blog_categories WHERE id = $1", [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
