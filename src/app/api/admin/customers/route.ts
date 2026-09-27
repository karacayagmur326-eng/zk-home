import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query, withTransaction } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { hashPassword } from "@lib/commerce/customer-auth"
import { createId } from "@lib/commerce/repository"

async function authorized() {
  const session = await getAdminSession(["Admin"])
  return Boolean(session)
}

export async function GET(req: NextRequest) {
  if (!(await authorized()))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  await ensureCommerceSchema()
  const searchParams = new URL(req.url).searchParams
  const id = searchParams.get("id")

  if (id) {
    const customers = await query(
      `SELECT c.id, c.username, c.email, c.email_verified, c.first_name, c.last_name, c.phone,
              c.company_name, COALESCE(c.role, 'Müşteri') AS role, COALESCE(c.status, 'Aktif') AS status,
              c.last_login_at, c.created_at, c.updated_at,
              (c.password_hash IS NOT NULL) AS has_account,
              COUNT(o.id)::int AS order_count
       FROM store_customer c
       LEFT JOIN store_order o ON o.customer_id = c.id
       WHERE c.id = $1
       GROUP BY c.id LIMIT 1`,
      [id]
    )
    if (!customers[0])
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 })

    const [addresses, orders] = await Promise.all([
      query(
        `SELECT * FROM store_customer_address
         WHERE customer_id=$1 ORDER BY is_default_shipping DESC, created_at DESC`,
        [id]
      ),
      query(
        `SELECT id, display_id, status, payment_status, fulfillment_status, total,
                currency_code, created_at
         FROM store_order WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 50`,
        [id]
      ),
    ])
    return NextResponse.json({ customer: customers[0], addresses, orders })
  }

  const page = Math.max(Number(searchParams.get("page") || 1), 1)
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 20), 1), 200)
  const term = (searchParams.get("search") || searchParams.get("q") || "").trim()
  const roleFilter = searchParams.get("role") || ""
  const statusFilter = searchParams.get("status") || ""
  const verifiedFilter = searchParams.get("verified") || ""

  const conditions: string[] = []
  const params: unknown[] = []

  if (term) {
    params.push(`%${term}%`)
    conditions.push(
      `(c.email ILIKE $${params.length} OR c.username ILIKE $${params.length} OR c.first_name ILIKE $${params.length} OR c.last_name ILIKE $${params.length} OR c.phone ILIKE $${params.length})`
    )
  }

  if (roleFilter && roleFilter !== "Tümü") {
    params.push(roleFilter)
    conditions.push(`COALESCE(c.role, 'Müşteri') = $${params.length}`)
  }

  if (statusFilter && statusFilter !== "Tümü") {
    params.push(statusFilter)
    conditions.push(`COALESCE(c.status, 'Aktif') = $${params.length}`)
  }

  if (verifiedFilter && verifiedFilter !== "Tümü") {
    const isVerified = verifiedFilter === "Doğrulanmış" || verifiedFilter === "Doğrulandı" || verifiedFilter === "true"
    params.push(isVerified)
    conditions.push(`c.email_verified = $${params.length}`)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

  // Aggregate KPI stats
  const statsRows = await query<any>(`
    SELECT
      COUNT(*)::int AS total_count,
      COUNT(*) FILTER (WHERE COALESCE(role, 'Müşteri') = 'Admin')::int AS admin_count,
      COUNT(*) FILTER (WHERE COALESCE(role, 'Müşteri') IN ('Editör', 'Yönetici'))::int AS editor_count,
      COUNT(*) FILTER (WHERE email_verified = FALSE)::int AS unverified_count
    FROM store_customer
  `)

  const stats = statsRows[0] || {
    total_count: 0,
    admin_count: 0,
    editor_count: 0,
    unverified_count: 0,
  }

  const countRows = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM store_customer c ${whereClause}`,
    params
  )

  const paginationParams = [...params, limit, (page - 1) * limit]
  const limitParamIdx = paginationParams.length - 1
  const offsetParamIdx = paginationParams.length

  const customers = await query(
    `SELECT c.id, c.username, c.email, c.email_verified, c.first_name, c.last_name, c.phone,
            c.company_name, COALESCE(c.role, 'Müşteri') AS role, COALESCE(c.status, 'Aktif') AS status,
            c.last_login_at, c.created_at, c.updated_at,
            (c.password_hash IS NOT NULL) AS has_account,
            COUNT(o.id)::int AS order_count
     FROM store_customer c
     LEFT JOIN store_order o ON o.customer_id = c.id
     ${whereClause}
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
    paginationParams
  )

  return NextResponse.json({
    customers,
    count: countRows[0]?.count || 0,
    stats,
    page,
    limit,
  })
}

export async function POST(req: NextRequest) {
  if (!(await authorized()))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  await ensureCommerceSchema()
  const body = await req.json()
  const email = String(body.email || "").trim().toLowerCase()
  const username = String(body.username || "").trim() || null
  const password = String(body.password || "").trim()
  const role = String(body.role || "Müşteri").trim()
  const status = String(body.status || "Aktif").trim()
  if (!["Müşteri", "Editör", "Yönetici", "Admin"].includes(role)) {
    return NextResponse.json({ error: "Geçersiz kullanıcı rolü." }, { status: 400 })
  }
  if (!["Aktif", "Pasif", "Engelli"].includes(status)) {
    return NextResponse.json({ error: "Geçersiz kullanıcı durumu." }, { status: 400 })
  }

  if (!email)
    return NextResponse.json({ error: "E-posta adresi zorunludur." }, { status: 400 })

  if (!password || password.length < 10)
    return NextResponse.json({ error: "Şifre en az 10 karakter olmalıdır." }, { status: 400 })

  try {
    const id = createId("cust")
    const passwordHash = hashPassword(password)

    const rows = await query(
      `INSERT INTO store_customer
       (id, username, email, password_hash, first_name, last_name, phone, company_name, role, status, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, username, email, email_verified, first_name, last_name, phone, company_name, role, status, created_at`,
      [
        id,
        username,
        email,
        passwordHash,
        String(body.first_name || "").trim() || null,
        String(body.last_name || "").trim() || null,
        String(body.phone || "").trim() || null,
        String(body.company_name || "").trim() || null,
        role,
        status,
        Boolean(body.email_verified ?? true),
      ]
    )

    return NextResponse.json({
      success: true,
      customer: rows[0],
      message: "Yeni kullanıcı başarıyla eklendi.",
    })
  } catch (error: any) {
    if (error?.code === "23505")
      return NextResponse.json(
        { error: "Bu e-posta veya kullanıcı adı sisteme zaten kayıtlı." },
        { status: 409 }
      )
    return NextResponse.json({ error: error.message || "Kullanıcı oluşturulamadı." }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await authorized()))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  await ensureCommerceSchema()
  const body = await req.json()
  const id = String(body.id || "")

  if (!id)
    return NextResponse.json({ error: "Kullanıcı ID'si zorunludur." }, { status: 400 })

  try {
    const updates: string[] = []
    const params: any[] = [id]

    if (body.email !== undefined) {
      params.push(String(body.email).trim().toLowerCase())
      updates.push(`email = $${params.length}`)
    }
    if (body.username !== undefined) {
      params.push(String(body.username).trim() || null)
      updates.push(`username = $${params.length}`)
    }
    if (body.first_name !== undefined) {
      params.push(String(body.first_name).trim() || null)
      updates.push(`first_name = $${params.length}`)
    }
    if (body.last_name !== undefined) {
      params.push(String(body.last_name).trim() || null)
      updates.push(`last_name = $${params.length}`)
    }
    if (body.phone !== undefined) {
      params.push(String(body.phone).trim() || null)
      updates.push(`phone = $${params.length}`)
    }
    if (body.company_name !== undefined) {
      params.push(String(body.company_name).trim() || null)
      updates.push(`company_name = $${params.length}`)
    }
    if (body.role !== undefined) {
      const role = String(body.role).trim()
      if (!["Müşteri", "Editör", "Yönetici", "Admin"].includes(role)) {
        return NextResponse.json(
          { error: "Geçersiz kullanıcı rolü." },
          { status: 400 }
        )
      }
      params.push(role)
      updates.push(`role = $${params.length}`)
    }
    if (body.status !== undefined) {
      const status = String(body.status).trim()
      if (!["Aktif", "Pasif", "Engelli"].includes(status)) {
        return NextResponse.json(
          { error: "Geçersiz kullanıcı durumu." },
          { status: 400 }
        )
      }
      params.push(status)
      updates.push(`status = $${params.length}`)
    }
    if (body.email_verified !== undefined) {
      params.push(Boolean(body.email_verified))
      updates.push(`email_verified = $${params.length}`)
    }
    if (body.new_password || body.password) {
      const pwd = String(body.new_password || body.password).trim()
      if (pwd.length >= 10) {
        params.push(hashPassword(pwd))
        updates.push(`password_hash = $${params.length}`)
      } else {
        return NextResponse.json(
          { error: "Şifre en az 10 karakter olmalıdır." },
          { status: 400 }
        )
      }
    }

    if (!updates.length)
      return NextResponse.json({ error: "Güncellenecek alan bulunamadı." }, { status: 400 })

    updates.push("updated_at = NOW()")

    const updateQuery = `UPDATE store_customer SET ${updates.join(", ")} WHERE id = $1 RETURNING id, username, email, email_verified, first_name, last_name, phone, company_name, role, status, updated_at`

    const rows = await query(updateQuery, params)
    if (!rows[0])
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 })

    return NextResponse.json({
      success: true,
      customer: rows[0],
      message: "Kullanıcı bilgileri güncellendi.",
    })
  } catch (error: any) {
    if (error?.code === "23505")
      return NextResponse.json(
        { error: "Bu e-posta veya kullanıcı adı başka bir kullanıcıya ait." },
        { status: 409 }
      )
    return NextResponse.json({ error: error.message || "Güncelleme başarısız." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await authorized()))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  await ensureCommerceSchema()
  const ids = (new URL(req.url).searchParams.get("ids") || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)

  if (!ids.length)
    return NextResponse.json({ error: "Silinecek kullanıcı seçilmedi." }, { status: 400 })
  if (ids.includes("cust_admin_master")) {
    return NextResponse.json(
      { error: "Ana yönetici hesabı silinemez." },
      { status: 400 }
    )
  }

  const removed = await withTransaction(async (client) => {
    await client.query("UPDATE store_order SET customer_id=NULL WHERE customer_id=ANY($1::text[])", [ids])
    const result = await client.query("DELETE FROM store_customer WHERE id=ANY($1::text[]) RETURNING id", [ids])
    return result.rowCount || 0
  })

  return NextResponse.json({
    success: true,
    removed,
    message: `${removed} kullanıcı silindi.`,
  })
}
