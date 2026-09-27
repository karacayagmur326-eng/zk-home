import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import {
  getStoreCampaigns,
  createStoreCampaign,
  updateStoreCampaign,
  deleteStoreCampaign,
  type CampaignStatus,
  type CampaignType,
} from "@lib/commerce/repository"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"

export async function GET(req: NextRequest) {
  const session = await getAdminSession(["Admin", "Yönetici"])
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  await ensureCommerceSchema()
  const campaigns = await getStoreCampaigns()

  // Son 30 gün istatistikleri - gerçek sipariş verilerinden
  const [statsRows] = await Promise.all([
    query<any>(
      `SELECT
         COUNT(*)::int AS total_orders,
         COALESCE(SUM(total), 0) AS total_revenue
       FROM store_order
       WHERE created_at >= NOW() - INTERVAL '30 days'
         AND status != 'cancelled'`
    ),
  ])

  const stats30d = statsRows[0] || { total_orders: 0, total_revenue: 0 }

  const now = new Date()
  const activeCount = campaigns.filter(
    (c: any) =>
      c.status === "active" &&
      (!c.ends_at || new Date(c.ends_at) >= now)
  ).length

  return NextResponse.json({
    campaigns,
    stats: {
      total: campaigns.length,
      active: activeCount,
      planned: campaigns.filter((c: any) => c.status === "planned").length,
      completed: campaigns.filter((c: any) => c.status === "completed").length,
      draft: campaigns.filter((c: any) => c.status === "draft").length,
      // Son 30 gün gerçek sipariş verileri
      revenue_30d: Number(stats30d.total_revenue),
      orders_30d: Number(stats30d.total_orders),
    },
  })
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession(["Admin", "Yönetici"])
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "Kampanya adı zorunludur." }, { status: 400 })
  }

  try {
    const campaign = await createStoreCampaign({
      name: body.name,
      description: body.description || null,
      type: body.type || "discount",
      status: body.status || "draft",
      starts_at: body.starts_at || null,
      ends_at: body.ends_at || null,
      discount_type: body.discount_type || null,
      discount_value: body.discount_value != null ? Number(body.discount_value) : null,
      min_subtotal: body.min_subtotal != null ? Number(body.min_subtotal) : 0,
    })
    return NextResponse.json({ campaign })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Kampanya oluşturulamadı." }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getAdminSession(["Admin", "Yönetici"])
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.id) {
    return NextResponse.json({ error: "Kampanya kimliği zorunludur." }, { status: 400 })
  }

  try {
    const campaign = await updateStoreCampaign(body.id, {
      name: body.name,
      description: body.description,
      type: body.type,
      status: body.status,
      starts_at: body.starts_at,
      ends_at: body.ends_at,
      discount_type: body.discount_type,
      discount_value: body.discount_value,
      min_subtotal: body.min_subtotal,
    })
    if (!campaign) {
      return NextResponse.json({ error: "Kampanya bulunamadı." }, { status: 404 })
    }
    return NextResponse.json({ campaign })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Kampanya güncellenemedi." }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession(["Admin", "Yönetici"])
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Kampanya kimliği gerekli." }, { status: 400 })

  const deleted = await deleteStoreCampaign(id)
  if (!deleted) return NextResponse.json({ error: "Kampanya bulunamadı." }, { status: 404 })

  return NextResponse.json({ success: true })
}
