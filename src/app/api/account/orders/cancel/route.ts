import { NextRequest, NextResponse } from "next/server"
import { query, withTransaction } from "@lib/admin/db"
import { getCustomerSessionId } from "@lib/commerce/customer-auth"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { createId } from "@lib/commerce/repository"
import { refundIyzicoPayment } from "@lib/payments/iyzico"
import { queueOrderUpdate } from "@lib/notifications/order-updates"
import { processNotificationOutbox } from "@lib/notifications/outbox"
import { requestIp } from "@lib/security/rate-limit"

export async function POST(req: NextRequest) {
  const customerId = await getCustomerSessionId()
  if (!customerId) {
    return NextResponse.json({ error: "Oturum açmanız gerekmektedir." }, { status: 401 })
  }
  await ensureCommerceSchema()
  const body = await req.json().catch(() => null)
  const orderId = String(body?.order_id || "")

  if (!orderId) {
    return NextResponse.json({ error: "Sipariş kimliği gereklidir." }, { status: 400 })
  }

  // Get customer email for matching
  const cust = await query<{ email: string }>(`SELECT email FROM store_customer WHERE id=$1`, [customerId])
  const customerEmail = cust[0]?.email || ""

  const orderRows = await query<any>(
    `SELECT id,status,payment_status,fulfillment_status,created_at,total,email
     FROM store_order WHERE id=$1 AND (customer_id=$2 OR (LOWER(email)=LOWER($3) AND $3 <> '')) LIMIT 1`,
    [orderId, customerId, customerEmail]
  )

  if (!orderRows[0]) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 })
  }

  const order = orderRows[0]

  if (order.status === "cancelled") {
    return NextResponse.json({ error: "Bu sipariş zaten iptal edilmiş." }, { status: 400 })
  }

  if (order.fulfillment_status === "shipped" || order.fulfillment_status === "delivered") {
    return NextResponse.json(
      { error: "Kargoya verilmiş veya teslim edilmiş siparişler doğrudan iptal edilemez. Lütfen teslimat sonrası iade talebi oluşturun." },
      { status: 400 }
    )
  }

  let autoRefundDone = false
  let notificationId: string | null = null

  try {
    await withTransaction(async (client) => {
      const locked = await client.query<any>(
        `SELECT *
         FROM store_order
         WHERE id=$1 FOR UPDATE`,
        [orderId]
      )
      const current = locked.rows[0]
      if (!current || current.status === "cancelled") return
      if (["shipped", "delivered"].includes(current.fulfillment_status)) {
        throw new Error("Sipariş kargoya verildiği için doğrudan iptal edilemez. Teslimat sonrası iade talebinde bulunabilirsiniz.")
      }

      // Restock products
      await client.query(
        `UPDATE store_variant v
         SET stock=v.stock+oi.quantity,updated_at=NOW()
         FROM store_order_item oi
         WHERE oi.order_id=$1 AND oi.variant_id=v.id AND v.manage_inventory=TRUE`,
        [orderId]
      )

      // Restore coupon if used
      if (current.coupon_code) {
        await client.query(
          `UPDATE store_coupon
           SET usage_count=GREATEST(usage_count-1,0),updated_at=NOW()
           WHERE UPPER(code)=UPPER($1)`,
          [current.coupon_code]
        )
      }

      const wasPaid = current.payment_status === "paid"
      let refundRefId: string | null = null

      // If paid, check payment provider and attempt automatic iyzico refund
      if (wasPaid) {
        const paymentRes = await client.query<{
          id: string
          provider_id: string
          provider_reference: string | null
          amount: string
        }>(
          `SELECT id, provider_id, provider_reference, amount
           FROM store_payment
           WHERE order_id=$1
           ORDER BY created_at DESC
           LIMIT 1`,
          [orderId]
        )
        const payment = paymentRes.rows[0]

        if (payment) {
          const refundId = createId("ref")
          const refundAmount = Number(current.total || payment.amount || 0)

          if (["pp_iyzico_iyzico", "iyzico"].includes(payment.provider_id) && payment.provider_reference) {
            try {
              const ip = requestIp(req)
              const refundRes = await refundIyzicoPayment({
                paymentId: payment.provider_reference,
                amount: refundAmount,
                conversationId: `cancel_${orderId}_${Date.now()}`,
                ip,
              })
              if (refundRes?.status === "succeeded") {
                autoRefundDone = true
                refundRefId = refundRes.id
              }
            } catch (iyzicoErr) {
              console.error("[Cancel Order] iyzico automatic refund error:", iyzicoErr)
            }
          }

          await client.query(
            `INSERT INTO store_refund (id, payment_id, amount, reason, status, provider_reference, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
             ON CONFLICT (id) DO NOTHING`,
            [
              refundId,
              payment.id,
              refundAmount,
              autoRefundDone
                ? "Müşteri panelinden iptal - iyzico kart iadesi otomatik tamamlandı."
                : "Müşteri panelinden kargo öncesi sipariş iptal talebi.",
              autoRefundDone ? "completed" : "pending",
              refundRefId,
            ]
          )

          await client.query(
            `UPDATE store_payment
             SET status=$2, updated_at=NOW()
             WHERE id=$1`,
            [payment.id, autoRefundDone ? "refunded" : "refund_pending"]
          )
        }
      }

      // Update store order
      await client.query(
        `UPDATE store_order
         SET status='cancelled',
             fulfillment_status='not_fulfilled',
             payment_status=CASE
               WHEN payment_status='paid' AND $2=TRUE THEN 'refunded'
               WHEN payment_status='paid' AND $2=FALSE THEN 'refund_pending'
               WHEN payment_status='pending' THEN 'failed'
               ELSE payment_status
             END,
             updated_at=NOW()
         WHERE id=$1`,
        [orderId, autoRefundDone]
      )

      await client.query(
        `UPDATE store_invoice
         SET status='cancelled',updated_at=NOW()
         WHERE order_id=$1 AND status IN ('awaiting_payment','pending')`,
        [orderId]
      )

      await client.query(
        `INSERT INTO store_order_status_history(id,order_id,status,note)
         VALUES($1,$2,'cancelled',$3)`,
        [
          createId("ordhist"),
          orderId,
          wasPaid
            ? autoRefundDone
              ? "Müşteri panelinden kargo öncesi iptal edildi. İade ödeme kuruluşu tarafından onaylandı; karta yansıma süresi bankaya bağlıdır."
              : "Müşteri panelinden kargo öncesi iptal edildi. Ödeme iadesi kaydı oluşturuldu."
            : "Müşteri tarafından tahsilat yapılmadan iptal edildi.",
        ]
      )
      const updated = await client.query<any>("SELECT * FROM store_order WHERE id=$1", [orderId])
      notificationId = await queueOrderUpdate(client, current, updated.rows[0])
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Sipariş iptal edilemedi.",
      },
      { status: 409 }
    )
  }

  const emailDelivery = notificationId ? await processNotificationOutbox(1, [notificationId]) : null
  return NextResponse.json({
    success: true,
    email_delivery: emailDelivery,
    message: autoRefundDone ? "Siparişiniz iptal edildi. İade ödeme kuruluşu tarafından onaylandı; kartınıza yansıma süresi bankanıza bağlıdır." : "Siparişiniz iptal edildi. Varsa ödeme iadesi durumunu hesabınızdan takip edebilirsiniz.",
  })
}
