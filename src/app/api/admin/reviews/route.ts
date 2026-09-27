import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { NextRequest, NextResponse } from "next/server"

async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS product_reviews (
      id BIGSERIAL PRIMARY KEY,
      product_id TEXT NOT NULL,
      author TEXT NOT NULL,
      email TEXT NOT NULL,
      rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL,
      title TEXT,
      ip_address TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS ip_address TEXT DEFAULT NULL;
    ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS title TEXT DEFAULT NULL;
  `)
}

async function authorized() {
  return Boolean(await getAdminSession())
}

export async function GET(request: NextRequest) {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  await ensureTable()

  const status = request.nextUrl.searchParams.get("status")
  const search = request.nextUrl.searchParams.get("q")?.trim()
  const rating = request.nextUrl.searchParams.get("rating")
  const productId = request.nextUrl.searchParams.get("productId")

  const whereClauses: string[] = []
  const params: unknown[] = []

  let idx = 1

  if (status && status !== "all") {
    whereClauses.push(`r.status = $${idx++}`)
    params.push(status)
  }

  if (rating && rating !== "all") {
    whereClauses.push(`r.rating = $${idx++}`)
    params.push(Number(rating))
  }

  if (productId && productId !== "all") {
    whereClauses.push(`r.product_id = $${idx++}`)
    params.push(productId)
  }

  if (search) {
    whereClauses.push(`(
      r.author ILIKE $${idx} OR
      r.email ILIKE $${idx} OR
      r.comment ILIKE $${idx} OR
      p.title ILIKE $${idx} OR
      COALESCE(r.ip_address, '') ILIKE $${idx}
    )`)
    params.push(`%${search}%`)
    idx++
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : ""

  const rows = await query<any>(
    `SELECT r.id, r.product_id, r.author, r.email, r.rating, r.comment, r.title, r.ip_address,
            r.status, r.created_at, p.title AS product_title
     FROM product_reviews r
     LEFT JOIN store_product p ON p.id = r.product_id
     ${whereSql}
     ORDER BY r.created_at DESC
     LIMIT 500`,
    params
  )

  // Compute live stats from DB
  const statsRows = await query<any>(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
      COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
      COALESCE(ROUND(AVG(rating), 1), 5.0)::float AS average
    FROM product_reviews
  `)

  return NextResponse.json({
    reviews: rows,
    stats: statsRows[0] || { total: 0, pending: 0, approved: 0, rejected: 0, average: 5.0 }
  })
}

export async function POST(request: NextRequest) {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  await ensureTable()

  const body = await request.json().catch(() => null)
  const productId = String(body?.productId || "")
  const author = String(body?.author || "").trim()
  const email = String(body?.email || "").trim()
  const rating = Math.min(Math.max(Number(body?.rating || 5), 1), 5)
  const comment = String(body?.comment || "").trim()
  const status = String(body?.status || "approved")

  if (!productId || !author || !comment) {
    return NextResponse.json({ error: "Lütfen ürün, yazar adı ve yorum alanlarını doldurun." }, { status: 400 })
  }

  const rows = await query(
    `INSERT INTO product_reviews (product_id, author, email, rating, comment, status, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, product_id, author, email, rating, comment, status, created_at`,
    [productId, author, email || "admin@magazam.com", rating, comment, status, request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"]
  )

  return NextResponse.json({ review: rows[0] }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  await ensureTable()

  const body = await request.json().catch(() => null)
  const id = String(body?.id || "")
  const status = body?.status ? String(body.status) : undefined
  const comment = body?.comment !== undefined ? String(body.comment) : undefined
  const rating = body?.rating !== undefined ? Number(body.rating) : undefined

  if (!id) {
    return NextResponse.json({ error: "Geçersiz yorum kimliği." }, { status: 400 })
  }

  const updates: string[] = []
  const params: unknown[] = [id]
  let idx = 2

  if (status && ["pending", "approved", "rejected"].includes(status)) {
    updates.push(`status = $${idx++}`)
    params.push(status)
  }

  if (comment !== undefined) {
    updates.push(`comment = $${idx++}`)
    params.push(comment)
  }

  if (rating !== undefined && rating >= 1 && rating <= 5) {
    updates.push(`rating = $${idx++}`)
    params.push(rating)
  }

  if (!updates.length) {
    return NextResponse.json({ error: "Güncellenecek veri yok." }, { status: 400 })
  }

  const rows = await query(
    `UPDATE product_reviews SET ${updates.join(", ")} WHERE id = $1 RETURNING *`,
    params
  )

  if (!rows.length) {
    return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 })
  }

  return NextResponse.json({ review: rows[0] })
}

export async function DELETE(request: NextRequest) {
  if (!(await authorized())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  await ensureTable()

  const id = request.nextUrl.searchParams.get("id")
  if (!id) {
    return NextResponse.json({ error: "Yorum kimliği gerekli." }, { status: 400 })
  }

  await query("DELETE FROM product_reviews WHERE id = $1", [id])
  return NextResponse.json({ success: true })
}
