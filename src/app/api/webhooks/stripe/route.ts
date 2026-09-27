import { createHmac, timingSafeEqual } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { withTransaction } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"

function validSignature(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, value] = part.split("=")
      return [key, value]
    })
  )
  const timestamp = Number(parts.t || 0)
  if (!timestamp || Math.abs(Date.now() / 1000 - timestamp) > 300) return false
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex")
  const received = parts.v1 || ""
  if (received.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected))
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!secret) {
    return NextResponse.json({ error: "Webhook yapılandırılmamış." }, { status: 503 })
  }
  const payload = await req.text()
  const signature = req.headers.get("stripe-signature") || ""
  if (!validSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Geçersiz imza." }, { status: 401 })
  }

  const event = JSON.parse(payload)
  const intent = event?.data?.object
  if (!intent?.id) return NextResponse.json({ received: true })
  await ensureCommerceSchema()

  const statusByEvent: Record<string, string> = {
    "payment_intent.succeeded": "paid",
    "payment_intent.payment_failed": "failed",
    "payment_intent.canceled": "failed",
  }
  const paymentStatus = statusByEvent[event.type]
  if (paymentStatus) {
    await withTransaction(async (client) => {
      const updated = await client.query<{ order_id: string }>(
        `UPDATE store_payment
         SET status=$2,error_message=$3,updated_at=NOW()
         WHERE provider_id='pp_stripe_stripe'
           AND provider_reference=$1
           AND amount=$4
           AND LOWER(currency_code)=LOWER($5)
         RETURNING order_id`,
        [
          intent.id,
          paymentStatus,
          intent.last_payment_error?.message || null,
          Number(intent.amount_received ?? intent.amount ?? -1),
          String(intent.currency || ""),
        ]
      )
      if (!updated.rows[0]) return
      await client.query(
        `UPDATE store_order
         SET payment_status=$2,
             status=CASE WHEN $2='paid' AND status='awaiting_payment'
               THEN 'processing' ELSE status END,
             updated_at=NOW()
         WHERE id=$1`,
        [updated.rows[0].order_id, paymentStatus]
      )
      if (paymentStatus === "paid") {
        await client.query(
          `UPDATE store_invoice
           SET status=CASE WHEN status='awaiting_payment' THEN 'pending' ELSE status END,
               updated_at=NOW()
           WHERE order_id=$1`,
          [updated.rows[0].order_id]
        )
      }
    })
  }

  return NextResponse.json({ received: true })
}
