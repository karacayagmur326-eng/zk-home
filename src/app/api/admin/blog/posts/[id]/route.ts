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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }

  const { id } = await params
  try {
    const rows = await query("SELECT * FROM blog_posts WHERE id = $1 LIMIT 1", [id])
    if (rows.length === 0) {
      return NextResponse.json({ error: "Makale bulunamadı" }, { status: 404 })
    }
    const categories = await query("SELECT * FROM blog_categories ORDER BY sort_order ASC, name ASC")
    return NextResponse.json({ post: rows[0], categories })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }

  const { id } = await params
  try {
    const body = await req.json()
    const {
      title,
      slug: rawSlug,
      category_id,
      excerpt = "",
      content = "",
      image = "",
      author = "Editör",
      reading_time = "5 dk",
      status = "published",
      featured = false,
      seo_title,
      seo_description,
      published_at,
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Makale başlığı zorunludur." }, { status: 400 })
    }

    let slug = slugify(rawSlug || title)
    if (!slug) slug = `makale-${Date.now()}`

    // Check slug uniqueness excluding self
    const existing = await query<{ id: string }>("SELECT id FROM blog_posts WHERE slug = $1 AND id != $2", [slug, id])
    if (existing.length > 0) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    const pubDate = published_at ? new Date(published_at).toISOString() : new Date().toISOString()

    await query(
      `
      UPDATE blog_posts SET
        title = $1,
        slug = $2,
        category_id = $3,
        excerpt = $4,
        content = $5,
        image = $6,
        author = $7,
        reading_time = $8,
        status = $9,
        featured = $10,
        seo_title = $11,
        seo_description = $12,
        published_at = $13,
        updated_at = NOW()
      WHERE id = $14
    `,
      [
        title.trim(),
        slug,
        category_id || null,
        excerpt.trim(),
        content,
        image,
        author,
        reading_time,
        status,
        featured,
        seo_title || title.trim(),
        seo_description || excerpt.trim(),
        pubDate,
        id,
      ]
    )

    return NextResponse.json({ success: true, id, slug })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }

  const { id } = await params
  try {
    await query("DELETE FROM blog_posts WHERE id = $1", [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH -> For toggle status or duplicate
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }

  const { id } = await params
  try {
    const body = await req.json()
    const { action, status } = body

    if (action === "toggle_status") {
      await query("UPDATE blog_posts SET status = $1, updated_at = NOW() WHERE id = $2", [status, id])
      return NextResponse.json({ success: true })
    }

    if (action === "duplicate") {
      const orig = await query<any>("SELECT * FROM blog_posts WHERE id = $1 LIMIT 1", [id])
      if (orig.length === 0) return NextResponse.json({ error: "Makale bulunamadı" }, { status: 404 })
      const post = orig[0]
      const newId = `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const newSlug = `${post.slug}-kopya-${Date.now().toString().slice(-4)}`
      const newTitle = `${post.title} (Kopya)`

      await query(
        `
        INSERT INTO blog_posts (
          id, title, slug, category_id, excerpt, content, image,
          author, reading_time, status, featured, views,
          seo_title, seo_description, published_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, 'draft', $10, 0,
          $11, $12, NOW(), NOW(), NOW()
        )
      `,
        [
          newId,
          newTitle,
          newSlug,
          post.category_id,
          post.excerpt,
          post.content,
          post.image,
          post.author,
          post.reading_time,
          post.featured,
          post.seo_title,
          post.seo_description,
        ]
      )
      return NextResponse.json({ success: true, id: newId })
    }

    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
