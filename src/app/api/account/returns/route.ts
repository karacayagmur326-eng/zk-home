import { NextRequest, NextResponse } from "next/server"

import { query, withTransaction } from "@lib/admin/db"
import { getCustomerSessionId } from "@lib/commerce/customer-auth"
import { createId } from "@lib/commerce/repository"
import { getEmailBrandSettings } from "@lib/email/brand-settings"
import { processNotificationOutbox } from "@lib/notifications/outbox"
import { ensureCommerceSchema } from "@lib/commerce/schema"

export async function GET() {
  const customerId = await getCustomerSessionId()
  if (!customerId) return NextResponse.json({ error: "Oturum açmanız gerekmektedir." }, { status: 401 })
  await ensureCommerceSchema()
  const requests = await query(
    `SELECT r.*,o.display_id,o.total,o.currency_code,
       COALESCE((
         SELECT jsonb_agg(jsonb_build_object(
           'id',ri.id,'order_item_id',ri.order_item_id,
           'title',oi.title,'sku',oi.sku,'quantity',ri.quantity
         ) ORDER BY ri.created_at)
         FROM store_return_item ri
         JOIN store_order_item oi ON oi.id=ri.order_item_id
         WHERE ri.return_request_id=r.id
       ),'[]'::jsonb) AS items
     FROM store_return_request r
     JOIN store_order o ON o.id=r.order_id
     WHERE r.customer_id=$1 ORDER BY r.created_at DESC`,
    [customerId]
  )
  return NextResponse.json({ requests })
}

export async function POST(req: NextRequest) {
  const customerId = await getCustomerSessionId()
  if (!customerId) return NextResponse.json({ error: "Oturum açmanız gerekmektedir." }, { status: 401 })
  await ensureCommerceSchema()
  const body = await req.json().catch(() => null)
  const orderId = String(body?.order_id || "")
  const reason = String(body?.reason || "").trim()
  const note = String(body?.note || "").trim()
  if (!orderId || !reason) {
    return NextResponse.json({ error: "Sipariş ve iade nedeni gereklidir." }, { status: 400 })
  }
  try {
    const created = await withTransaction(async (client) => {
      const order = await client.query<{ id: string }>(
        `SELECT id FROM store_order
         WHERE id=$1 AND customer_id=$2
           AND fulfillment_status='delivered'
           AND COALESCE(delivered_at,created_at)>=NOW()-INTERVAL '14 days'
         LIMIT 1 FOR UPDATE`,
        [orderId, customerId]
      )
      if (!order.rows[0]) {
        throw new Error(
          "Bu sipariş iade talebi için uygun değil veya 14 günlük süre dolmuş."
        )
      }
      const orderItems = await client.query<{
        id: string
        quantity: number
        returned_quantity: number
      }>(
        `SELECT oi.id,oi.quantity,
           COALESCE((
             SELECT SUM(ri.quantity)::integer
             FROM store_return_item ri
             JOIN store_return_request rr ON rr.id=ri.return_request_id
             WHERE ri.order_item_id=oi.id AND rr.status<>'rejected'
           ),0)::integer AS returned_quantity
         FROM store_order_item oi WHERE oi.order_id=$1 FOR UPDATE`,
        [orderId]
      )
      const requestedItems = Array.isArray(body?.items)
        ? body.items
        : orderItems.rows.map((item) => ({
            order_item_id: item.id,
            quantity: item.quantity - item.returned_quantity,
          }))
      const normalized = requestedItems
        .map((item: any) => ({
          order_item_id: String(item?.order_item_id || ""),
          quantity: Math.floor(Number(item?.quantity || 0)),
        }))
        .filter((item: any) => item.order_item_id && item.quantity > 0)
      if (!normalized.length) {
        throw new Error("İade edilecek ürün veya adet bulunamadı.")
      }
      for (const requested of normalized) {
        const item = orderItems.rows.find(
          (row) => row.id === requested.order_item_id
        )
        if (
          !item ||
          requested.quantity >
            Number(item.quantity) - Number(item.returned_quantity)
        ) {
          throw new Error("İade adedi siparişteki kullanılabilir adedi aşıyor.")
        }
      }
      const returnId = createId("return")
      const rows = await client.query(
        `INSERT INTO store_return_request
         (id,order_id,customer_id,reason,note)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [returnId, orderId, customerId, reason, note || null]
      )
      for (const item of normalized) {
        await client.query(
          `INSERT INTO store_return_item
           (id,return_request_id,order_item_id,quantity,reason)
           VALUES ($1,$2,$3,$4,$5)`,
          [
            createId("returnitem"),
            returnId,
            item.order_item_id,
            item.quantity,
            reason,
          ]
        )
      }
      return rows.rows[0]
    })
    const orderRows = await query<{ email: string; display_id: number }>(
      `SELECT email,display_id FROM store_order WHERE id=$1 LIMIT 1`,
      [orderId]
    )
    const order = orderRows[0]
    if (order) {
      const brand = await getEmailBrandSettings()
      const notificationIds: string[] = []
      for (const [index, adminEmail] of brand.adminEmails.entries()) {
        const notificationId = `notif_return_requested_${created.id}_${index}`
        await query(
          `INSERT INTO notification_outbox (id,type,recipient,subject,payload)
           VALUES ($1,'return_requested_admin',$2,$3,$4)
           ON CONFLICT (id) DO NOTHING`,
          [notificationId, adminEmail, `Yeni iade talebi — Sipariş #${order.display_id}`, {
            return_id: created.id,
            order_id: order.display_id,
            email: order.email,
            reason,
            note,
          }]
        )
        notificationIds.push(notificationId)
      }
      if (notificationIds.length) {
        await processNotificationOutbox(notificationIds.length, notificationIds).catch(() => {})
      }
    }
    return NextResponse.json({ request: created }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "İade talebi oluşturulamadı.",
      },
      { status: 409 }
    )
  }
}
