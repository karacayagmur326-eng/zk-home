import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"

export async function GET() {
  await ensureCommerceSchema()

  const isAuthed = Boolean(await getAdminSession(["Admin", "Yönetici"]))

  if (!isAuthed) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }

  // 1. Core KPIs (Total revenue in TL by dividing kuruş / 100)
  const [stats] = await query<any>(
    `SELECT
      (SELECT COUNT(*)::int FROM store_order) AS orders,
      (SELECT COUNT(*)::int FROM store_product) AS products,
      (SELECT COUNT(*)::int FROM store_customer) AS customers,
      COALESCE((SELECT SUM(total)::bigint FROM store_order), 0) AS revenue,
      (SELECT COUNT(*)::int FROM store_order WHERE created_at >= CURRENT_DATE) AS today_orders,
      (SELECT COUNT(*)::int FROM store_order WHERE status IN ('pending', 'awaiting_payment', 'requires_action') OR payment_status = 'pending') AS pending_orders,
      (SELECT COUNT(DISTINCT product_id)::int FROM store_variant WHERE manage_inventory = TRUE AND stock <= 5) AS low_stock_count,
      (SELECT COUNT(*)::int FROM product_reviews WHERE status = 'pending') AS pending_reviews`
  )

  // 2. Recent Orders (Raw kuruş amount matching store_order standard)
  const rawRecentOrders = await query<any>(
    `SELECT id, display_id, status, email, currency_code, total, created_at
     FROM store_order ORDER BY created_at DESC LIMIT 10`
  )

  const recentOrders = rawRecentOrders.map((o: any) => ({
    ...o,
    total: String(o.total || 0),
  }))

  // 3. Low Stock Items
  const lowStockItems = await query<any>(
    `SELECT p.title, v.stock, v.id AS variant_id
     FROM store_variant v
     JOIN store_product p ON p.id = v.product_id
     WHERE v.manage_inventory = TRUE AND v.stock <= 5
     ORDER BY v.stock ASC
     LIMIT 5`
  )

  // 4. Sales Chart Data (Last 30 Days converted to TL)
  const rawSalesHistory = await query<any>(
    `SELECT DATE(created_at) AS date,
            COALESCE(SUM(total), 0) / 100.0 AS sales,
            COUNT(*)::int AS count
     FROM store_order
     WHERE created_at >= NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at)
     ORDER BY DATE(created_at) ASC`
  )

  const salesHistory = rawSalesHistory.map((s: any) => ({
    ...s,
    sales: Number(s.sales || 0),
  }))

  const orderCount = Number(stats.orders || 0)
  const totalRevenue = Number(stats.revenue || 0)
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0

  return NextResponse.json({
    stats: {
      orders: orderCount,
      products: Number(stats.products || 0),
      customers: Number(stats.customers || 0),
      revenue: totalRevenue,
      today_orders: Number(stats.today_orders || 0),
      pending_orders: Number(stats.pending_orders || 0),
      low_stock_count: Number(stats.low_stock_count || 0),
      avg_order_value: avgOrderValue,
    },
    recentOrders,
    lowStockItems,
    salesHistory,
  })
}
