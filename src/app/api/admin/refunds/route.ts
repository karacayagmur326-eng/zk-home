import { NextRequest, NextResponse } from "next/server"

import { getAdminSession } from "@lib/admin/auth"
import { query, withTransaction } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { createId } from "@lib/commerce/repository"
import { refundStripePayment } from "@lib/payments/stripe"
import { refundIyzicoPayment } from "@lib/payments/iyzico"
import { queueOrderUpdate } from "@lib/notifications/order-updates"
import { processNotificationOutbox } from "@lib/notifications/outbox"
import { requestIp } from "@lib/security/rate-limit"
import { convertToLocale } from "@lib/util/money"

export async function POST(req: NextRequest) {
  if (!(await getAdminSession(["Admin", "Yönetici"]))) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }

  await ensureCommerceSchema()
  const body = await req.json().catch(() => null)
  const orderId = String(body?.order_id || "")
  const amount = Math.round(Number(body?.amount || 0))
  const reason = String(body?.reason || "").trim()
  if (!orderId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: "Sipariş ve geçerli iade tutarı gereklidir." },
      { status: 400 }
    )
  }

  try {
    const prepared = await withTransaction(async (client) => {
      const paymentResult = await client.query<{
        id: string
        provider_id: string
        provider_reference: string | null
        status: string
        amount: string
      }>(
        `SELECT id,provider_id,provider_reference,status,amount
         FROM store_payment
         WHERE order_id=$1
         ORDER BY created_at DESC
         LIMIT 1 FOR UPDATE`,
        [orderId]
      )
      const payment = paymentResult.rows[0]
      if (!payment || !["paid", "partially_refunded"].includes(payment.status)) {
        throw new Error("Doğrulanmış bir tahsilat bulunamadı. İade başlatılamaz.")
      }
      if (!payment.provider_reference || !["pp_stripe_stripe", "pp_iyzico_iyzico", "iyzico"].includes(payment.provider_id)) {
        throw new Error("Ödeme kuruluşu işlem referansı bulunamadı. Para iadesi doğrulanamaz; ödeme kaydını sağlayıcı panelinden kontrol edin.")
      }

      const refundedResult = await client.query<{ total: string; pending: string }>(
        `SELECT COALESCE(SUM(amount),0)::text AS total, COUNT(*) FILTER (WHERE status='pending')::text AS pending
         FROM store_refund
         WHERE payment_id=$1 AND status IN ('pending','completed')`,
        [payment.id]
      )
      if (Number(refundedResult.rows[0]?.pending || 0) > 0) {
        throw new Error("Sonucu beklenen bir iade işlemi var. Yeni iade başlatmadan önce bu işlemi sağlayıcı panelinden doğrulayın.")
      }
      const refundable =
        Number(payment.amount) - Number(refundedResult.rows[0]?.total || 0)
      if (amount > refundable) {
        throw new Error("İade tutarı kalan tahsilat tutarını aşamaz.")
      }

      const refundId = createId("refund")
      const refundStatus = "pending"
      const fullyRefunded = amount >= refundable
      const paymentStatus = fullyRefunded ? "refunded" : "partially_refunded"

      await client.query(
        `INSERT INTO store_refund(id,payment_id,amount,reason,status)
         VALUES ($1,$2,$3,$4,$5)`,
        [refundId, payment.id, amount, reason || null, refundStatus]
      )

      await client.query(
        `INSERT INTO store_order_status_history(id,order_id,status,note)
         VALUES ($1,$2,$3,$4)`,
        [
          createId("ordhist"),
          orderId,
          "refund_pending",
          `${convertToLocale({ amount, currency_code: "TRY" })} tutarında para iadesi talebi oluşturuldu; sağlayıcı sonucu bekleniyor.${reason ? ` Gerekçe: ${reason}` : ""}`,
        ]
      )

      return {
        refundId,
        refundStatus,
        paymentId: payment.id,
        providerId: payment.provider_id,
        providerReference: payment.provider_reference,
        paymentStatus,
      }
    })

    try {
      const providerRefund =
        prepared.providerId === "pp_stripe_stripe"
          ? await refundStripePayment(
              String(prepared.providerReference),
              amount,
              reason
            )
          : await refundIyzicoPayment({
              paymentId: String(prepared.providerReference),
              amount,
              conversationId: prepared.refundId,
              ip: requestIp(req),
            })
      const completed = providerRefund.status === "succeeded"
      const failed = ["failed", "canceled"].includes(
        String(providerRefund.status)
      )
      const localStatus = completed ? "completed" : failed ? "failed" : "pending"
      const failureReason =
        "failure_reason" in providerRefund
          ? providerRefund.failure_reason || null
          : null

      const notificationId = await withTransaction(async (client) => {
        const before = await client.query<any>("SELECT * FROM store_order WHERE id=$1 FOR UPDATE", [orderId])
        await client.query(
          `UPDATE store_refund
           SET status=$2,provider_reference=$3,error_message=$4,updated_at=NOW()
           WHERE id=$1`,
          [
            prepared.refundId,
            localStatus,
            providerRefund.id,
            failureReason,
          ]
        )
        if (completed) {
          await client.query(
            `UPDATE store_payment SET status=$2,updated_at=NOW() WHERE id=$1`,
            [prepared.paymentId, prepared.paymentStatus]
          )
          await client.query(
            `UPDATE store_order SET payment_status=$2,updated_at=NOW() WHERE id=$1`,
            [orderId, prepared.paymentStatus]
          )
        }
        if (completed && before.rows[0]) {
          const after = await client.query<any>("SELECT * FROM store_order WHERE id=$1", [orderId])
          return queueOrderUpdate(client, before.rows[0], after.rows[0])
        }
        return null
      })

      if (notificationId) await processNotificationOutbox(1, [notificationId]).catch(() => null)
      if (failed) {
        return NextResponse.json(
          {
            error:
              failureReason ||
              "Kart iadesi ödeme kuruluşu tarafından reddedildi.",
          },
          { status: 502 }
        )
      }
      return NextResponse.json({
        success: true,
        refund_id: prepared.refundId,
        status: localStatus,
        message: completed ? "İade işlemi ödeme kuruluşu tarafından onaylandı. Tutarın kartınıza yansıması bankanızın işlem süresine bağlıdır." : "İade talebi ödeme kuruluşuna iletildi; işlem sonucu bekleniyor.",
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Kart iadesi ödeme kuruluşuna iletilemedi."

      await query(
        `UPDATE store_refund
         SET status='pending',error_message=$2,updated_at=NOW() WHERE id=$1`,
        [prepared.refundId, message]
      ).catch(() => {})
      return NextResponse.json({ error: `${message} İade sonucu doğrulanamadı. Yeniden iade göndermeden önce sağlayıcı panelini kontrol edin.` }, { status: 502 })
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "İade oluşturulamadı.",
      },
      { status: 400 }
    )
  }
}
