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

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() || ""
  const category = searchParams.get("category")?.trim() || ""
  const status = searchParams.get("status")?.trim() || ""
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))
  const offset = (page - 1) * limit

  try {
    let whereConditions: string[] = []
    let params: any[] = []
    let pIdx = 1

    if (q) {
      whereConditions.push(`(p.title ILIKE $${pIdx} OR p.excerpt ILIKE $${pIdx} OR p.content ILIKE $${pIdx})`)
      params.push(`%${q}%`)
      pIdx++
    }

    if (category && category !== "all") {
      whereConditions.push(`(p.category_id = $${pIdx} OR c.slug = $${pIdx})`)
      params.push(category)
      pIdx++
    }

    if (status && status !== "all") {
      whereConditions.push(`p.status = $${pIdx}`)
      params.push(status)
      pIdx++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""

    const countQuery = `
      SELECT count(*) as total
      FROM blog_posts p
      LEFT JOIN blog_categories c ON p.category_id = c.id
      ${whereClause}
    `
    const countRes = await query<{ total: string }>(countQuery, params)
    const total = parseInt(countRes[0]?.total || "0")

    const listQuery = `
      SELECT 
        p.id,
        p.title,
        p.slug,
        p.category_id,
        c.name as category_name,
        c.slug as category_slug,
        c.icon as category_icon,
        p.excerpt,
        p.image,
        p.author,
        p.reading_time,
        p.status,
        p.featured,
        p.views,
        p.published_at,
        p.created_at,
        p.updated_at
      FROM blog_posts p
      LEFT JOIN blog_categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.published_at DESC, p.created_at DESC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `
    const listParams = [...params, limit, offset]
    const posts = await query(listQuery, listParams)

    const categories = await query(`SELECT * FROM blog_categories ORDER BY sort_order ASC, name ASC`)

    return NextResponse.json({
      posts,
      categories,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error("Blog posts fetch error:", error)
    return NextResponse.json({ error: error.message || "Makaleler yüklenemedi" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
  }

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

    const id = `post-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    let slug = slugify(rawSlug || title)
    if (!slug) slug = `makale-${Date.now()}`

    const existing = await query<{ id: string }>("SELECT id FROM blog_posts WHERE slug = $1", [slug])
    if (existing.length > 0) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    const pubDate = published_at ? new Date(published_at).toISOString() : new Date().toISOString()

    await query(
      `
      INSERT INTO blog_posts (
        id, title, slug, category_id, excerpt, content, image,
        author, reading_time, status, featured, views,
        seo_title, seo_description, published_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, 0,
        $12, $13, $14, NOW(), NOW()
      )
    `,
      [
        id,
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
      ]
    )

    return NextResponse.json({ success: true, id, slug })
  } catch (error: any) {
    console.error("Create blog post error:", error)
    return NextResponse.json({ error: error.message || "Makale kaydedilemedi" }, { status: 500 })
  }
}
