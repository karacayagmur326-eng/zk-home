import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"

const categories = ["orders", "returns", "customers"] as const
type Category = (typeof categories)[number]

async function ensureSeenTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS admin_notification_seen (
      admin_email TEXT NOT NULL,
      category TEXT NOT NULL,
      seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (admin_email, category)
    )
  `)
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  await ensureCommerceSchema()
  await ensureSeenTable()

  const rows = await query<any>(
    `SELECT
      (SELECT COUNT(*)::int FROM contact_messages WHERE status='new') AS contacts,
      (SELECT COUNT(*)::int FROM store_order o
       WHERE o.created_at > COALESCE((SELECT seen_at FROM admin_notification_seen WHERE admin_email=$1 AND category='orders'), 'epoch')) AS orders,
      (SELECT COUNT(*)::int FROM store_return_request r
       WHERE r.created_at > COALESCE((SELECT seen_at FROM admin_notification_seen WHERE admin_email=$1 AND category='returns'), 'epoch')) AS returns,
      (SELECT COUNT(*)::int FROM store_customer c
       WHERE COALESCE(c.role,'Müşteri')='Müşteri'
         AND c.created_at > COALESCE((SELECT seen_at FROM admin_notification_seen WHERE admin_email=$1 AND category='customers'), 'epoch')) AS customers`,
    [session.email.toLowerCase()]
  ).catch(() => [{ contacts: 0, orders: 0, returns: 0, customers: 0 }])

  return NextResponse.json({ counts: rows[0] || {} })
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  const body = await request.json().catch(() => null)
  const category = String(body?.category || "") as Category
  if (!categories.includes(category)) {
    return NextResponse.json({ error: "Geçersiz bildirim kategorisi." }, { status: 400 })
  }
  await ensureSeenTable()
  await query(
    `INSERT INTO admin_notification_seen (admin_email,category,seen_at)
     VALUES ($1,$2,NOW())
     ON CONFLICT (admin_email,category) DO UPDATE SET seen_at=NOW()`,
    [session.email.toLowerCase(), category]
  )
  return NextResponse.json({ ok: true })
}
