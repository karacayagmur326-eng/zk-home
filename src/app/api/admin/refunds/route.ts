import { NextRequest, NextResponse } from "next/server"

import { getAdminSession } from "@lib/admin/auth"
import { query, withTransaction } from "@lib/admin/db"
import { ensureCommerceSchema } from "@lib/commerce/schema"
import { createId } from "@lib/commerce/repository"
import { refundStripePayment } from "@lib/payments/stripe"
import { refundIyzicoPayment } from "@lib/payments/iyzico"
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
      let payment = paymentResult.rows[0]
      if (!payment) {
        const pId = createId("pay")
        const orderRows = await client.query<{ total: string }>(`SELECT total FROM store_order WHERE id=$1`, [orderId])
        const ordTotal = orderRows.rows[0]?.total || String(amount)
        await client.query(
          `INSERT INTO store_payment(id, order_id, provider_id, amount, status, created_at, updated_at)
           VALUES ($1, $2, 'pp_iyzico_iyzico', $3, 'paid', NOW(), NOW())`,
          [pId, orderId, ordTotal]
        )
        payment = { id: pId, provider_id: "pp_iyzico_iyzico", provider_reference: null, status: "paid", amount: String(ordTotal) }
      } else if (!["paid", "partially_refunded"].includes(payment.status)) {
        await client.query(`UPDATE store_payment SET status='paid' WHERE id=$1`, [payment.id])
        await client.query(`UPDATE store_order SET payment_status='paid' WHERE id=$1`, [orderId])
        payment.status = "paid"
      }

      const refundedResult = await client.query<{ total: string }>(
        `SELECT COALESCE(SUM(amount),0)::text AS total
         FROM store_refund
         WHERE payment_id=$1 AND status IN ('pending','completed')`,
        [payment.id]
      )
      const refundable =
        Number(payment.amount) - Number(refundedResult.rows[0]?.total || 0)
      if (amount > Math.max(refundable, Number(payment.amount))) {
        throw new Error("İade tutarı kalan tahsilat tutarını aşamaz.")
      }

      const hasLiveProvider = Boolean(
        payment.provider_reference &&
        ["pp_stripe_stripe", "pp_iyzico_iyzico", "iyzico"].includes(payment.provider_id)
      )

      const refundId = createId("refund")
      const refundStatus = hasLiveProvider ? "pending" : "completed"
      const fullyRefunded = amount >= refundable || amount >= Number(payment.amount)
      const paymentStatus = fullyRefunded ? "refunded" : "partially_refunded"

      await client.query(
        `INSERT INTO store_refund(id,payment_id,amount,reason,status)
         VALUES ($1,$2,$3,$4,$5)`,
        [refundId, payment.id, amount, reason || null, refundStatus]
      )

      if (!hasLiveProvider) {
        await client.query(
          `UPDATE store_payment SET status=$2,updated_at=NOW() WHERE id=$1`,
          [payment.id, paymentStatus]
        )
        await client.query(
          `UPDATE store_order SET payment_status=$2,updated_at=NOW() WHERE id=$1`,
          [orderId, paymentStatus]
        )
      }

      await client.query(
        `INSERT INTO store_order_status_history(id,order_id,status,note)
         VALUES ($1,$2,$3,$4)`,
        [
          createId("ordhist"),
          orderId,
          paymentStatus,
          `${convertToLocale({ amount, currency_code: "TRY" })} tutarında ${hasLiveProvider ? "sağlayıcı üzerinden " : ""}para iadesi işlendi.${reason ? ` Gerekçe: ${reason}` : ""}`,
        ]
      )

      return {
        refundId,
        refundStatus,
        paymentId: payment.id,
        providerId: payment.provider_id,
        providerReference: payment.provider_reference,
        paymentStatus,
        hasLiveProvider,
      }
    })

    if (!prepared.hasLiveProvider) {
      return NextResponse.json({
        success: true,
        refund_id: prepared.refundId,
        status: prepared.refundStatus,
      })
    }

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

      await withTransaction(async (client) => {
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
      })

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
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Kart iadesi ödeme kuruluşuna iletilemedi."

      const isAlreadyRefunded =
        message.includes("önceden iptal") ||
        message.includes("already") ||
        message.includes("daha önce")

      if (isAlreadyRefunded) {
        await query(
          `UPDATE store_refund SET status='completed',error_message=NULL,updated_at=NOW() WHERE id=$1`,
          [prepared.refundId]
        ).catch(() => {})
        await query(
          `UPDATE store_payment SET status=$2,updated_at=NOW() WHERE id=$1`,
          [prepared.paymentId, prepared.paymentStatus]
        ).catch(() => {})
        await query(
          `UPDATE store_order SET payment_status=$2,updated_at=NOW() WHERE id=$1`,
          [orderId, prepared.paymentStatus]
        ).catch(() => {})

        return NextResponse.json({
          success: true,
          refund_id: prepared.refundId,
          status: "completed",
          message: "Bu ödeme iyzico üzerinden daha önce iade edilmişti. Sipariş kaydı güncellendi.",
        })
      }

      await query(
        `UPDATE store_refund
         SET status='failed',error_message=$2,updated_at=NOW() WHERE id=$1`,
        [prepared.refundId, message]
      ).catch(() => {})
      return NextResponse.json({ error: message }, { status: 502 })
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
