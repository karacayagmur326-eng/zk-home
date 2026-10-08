import { NextRequest, NextResponse } from "next/server"

import { getAdminSession } from "@lib/admin/auth"
import { query, withTransaction } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"

export async function GET() {
  if (!(await getAdminSession(["Admin", "Yönetici"]))) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  await ensureCommerceSchema()
  const [requests, cancellations, refunds] = await Promise.all([query(
    `SELECT r.*,o.display_id,o.email,o.total,o.currency_code,
       COALESCE((
         SELECT jsonb_agg(jsonb_build_object(
           'id',ri.id,'order_item_id',ri.order_item_id,
           'title',oi.title,'sku',oi.sku,'quantity',ri.quantity
         ) ORDER BY ri.created_at)
         FROM store_return_item ri
         JOIN store_order_item oi ON oi.id=ri.order_item_id
         WHERE ri.return_request_id=r.id
       ),'[]'::jsonb) AS items
     FROM store_return_request r JOIN store_order o ON o.id=r.order_id
     ORDER BY r.created_at DESC`
  ), query(
    `SELECT o.id,o.display_id,o.email,o.total,o.currency_code,o.payment_status,
       COALESCE(h.created_at,o.updated_at) AS created_at,CASE WHEN h.note ILIKE '%anında iade%' THEN 'Müşteri panelinden kargo öncesi sipariş iptali.' ELSE h.note END AS reason,
       COALESCE(r.amount,0) AS refund_amount,r.status AS refund_status,r.provider_reference
     FROM store_order o
     LEFT JOIN LATERAL (SELECT created_at,note FROM store_order_status_history WHERE order_id=o.id AND status='cancelled' ORDER BY created_at DESC LIMIT 1) h ON TRUE
     LEFT JOIN LATERAL (SELECT SUM(amount)::bigint AS amount,
       CASE WHEN BOOL_OR(status='pending') THEN 'pending' WHEN BOOL_OR(status='failed') THEN 'failed' WHEN BOOL_AND(status='completed') THEN 'completed' ELSE 'pending' END AS status,
       BOOL_AND(provider_reference IS NOT NULL AND provider_reference<>'') AS provider_reference
       FROM store_refund WHERE payment_id IN (SELECT id FROM store_payment WHERE order_id=o.id)) r ON TRUE
     WHERE o.status='cancelled' ORDER BY COALESCE(h.created_at,o.updated_at) DESC`
  ), query(
    `SELECT r.*,o.id AS order_id,o.display_id,o.email,o.currency_code,p.provider_id
     FROM store_refund r JOIN store_payment p ON p.id=r.payment_id
     JOIN store_order o ON o.id=p.order_id ORDER BY r.created_at DESC`
  )])
  return NextResponse.json({ requests, cancellations, refunds })
}

export async function PATCH(req: NextRequest) {
  if (!(await getAdminSession(["Admin", "Yönetici"]))) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  await ensureCommerceSchema()
  const body = await req.json().catch(() => null)
  const id = String(body?.id || "")
  const status = String(body?.status || "")
  if (!["requested", "approved", "rejected", "received", "refunded"].includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 })
  }
  const updated = await withTransaction(async (client) => {
    const locked = await client.query<{
      id: string
      order_id: string
      inventory_restored: boolean
    }>(
      `SELECT id,order_id,inventory_restored
       FROM store_return_request WHERE id=$1 FOR UPDATE`,
      [id]
    )
    const request = locked.rows[0]
    if (!request) return null

    const shouldRestore =
      ["received", "refunded"].includes(status) &&
      !request.inventory_restored
    if (shouldRestore) {
      const itemCount = await client.query<{ count: number }>(
        `SELECT COUNT(*)::integer AS count FROM store_return_item
         WHERE return_request_id=$1`,
        [id]
      )
      if (Number(itemCount.rows[0]?.count || 0) > 0) {
        await client.query(
          `UPDATE store_variant v
           SET stock=v.stock+returned.quantity,updated_at=NOW()
           FROM (
             SELECT oi.variant_id,SUM(ri.quantity)::integer AS quantity
             FROM store_return_item ri
             JOIN store_order_item oi ON oi.id=ri.order_item_id
             WHERE ri.return_request_id=$1
             GROUP BY oi.variant_id
           ) returned
           WHERE v.id=returned.variant_id AND v.manage_inventory=TRUE`,
          [id]
        )
      } else {
        await client.query(
          `UPDATE store_variant v
           SET stock=v.stock+oi.quantity,updated_at=NOW()
           FROM store_order_item oi
           WHERE oi.order_id=$1
             AND oi.variant_id=v.id
             AND v.manage_inventory=TRUE`,
          [request.order_id]
        )
      }
    }

    const rows = await client.query(
      `UPDATE store_return_request
       SET status=$2,admin_note=COALESCE($3,admin_note),
           inventory_restored=inventory_restored OR $4,
           updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [
        id,
        status,
        String(body?.admin_note || "") || null,
        shouldRestore,
      ]
    )
    if (status === "received") {
      await client.query(
        `UPDATE store_order
         SET fulfillment_status='returned',updated_at=NOW()
         WHERE id=$1`,
        [request.order_id]
      )
    }
    return rows.rows[0]
  })
  if (!updated) {
    return NextResponse.json({ error: "Talep bulunamadı." }, { status: 404 })
  }
  return NextResponse.json({ request: updated })
}
