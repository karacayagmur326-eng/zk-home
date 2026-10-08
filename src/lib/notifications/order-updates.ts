import "server-only"
import { createHash } from "crypto"
import type { PoolClient } from "pg"
import { deliveryPlanText, ZK_HOME_DELIVERY, type DeliveryPlan } from "@lib/util/local-delivery"

type OrderState = {
  id: string; display_id: string | number; email: string; status: string;
  payment_status: string; fulfillment_status: string; updated_at: string | Date;
  shipping_carrier?: string | null; tracking_number?: string | null; tracking_url?: string | null;
  metadata?: { delivery_plan?: DeliveryPlan } | null;
}
const snapshot = (order: OrderState) => JSON.stringify([
  order.status, order.payment_status, order.fulfillment_status,
  order.shipping_carrier || "", order.tracking_number || "", order.tracking_url || "",
  order.metadata?.delivery_plan?.date || "", order.metadata?.delivery_plan?.start || "", order.metadata?.delivery_plan?.end || "",
])

/** Queue once in the same transaction as the actual order change. */
export async function queueOrderUpdate(client: PoolClient, before: OrderState, after: OrderState): Promise<string | null> {
  if (snapshot(before) === snapshot(after) || !after.email) return null
  const cancelled = after.status === "cancelled"
  const plan = after.metadata?.delivery_plan
  const local = after.shipping_carrier === ZK_HOME_DELIVERY && plan
  const delivered = after.fulfillment_status === "delivered"
  const shipped = after.fulfillment_status === "shipped" && before.fulfillment_status !== "shipped"
  const paymentChanged = before.payment_status !== after.payment_status
  const type = cancelled ? "order_cancelled" : paymentChanged ? "order_status_updated" : delivered ? "order_delivered" : local ? "order_local_delivery" : shipped ? "order_shipped" : "order_status_updated"
  const subject = cancelled ? "Siparişiniz iptal edildi" : paymentChanged ? "Siparişinizin ödeme bilgileri güncellendi" : delivered ? "Siparişiniz teslim edildi" : local ? "ZK Home teslimat bilgileriniz güncellendi" : shipped ? "Siparişiniz kargoya verildi" : "Sipariş ve teslimat bilgileriniz güncellendi"
  const revision = createHash("sha256").update(`${before.updated_at}:${snapshot(after)}`).digest("hex").slice(0, 24)
  const id = cancelled ? `notif_order_cancelled_${after.id}` : `notif_order_update_${after.id}_${revision}`
  await client.query(`UPDATE notification_outbox SET status='superseded',updated_at=NOW()
    WHERE status IN ('pending','failed') AND type IN ('order_shipped','order_delivered','order_local_delivery','order_status_updated')
    AND payload->>'internal_order_id'=$1`, [after.id])
  await client.query(`INSERT INTO notification_outbox (id,type,recipient,subject,payload)
    VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`, [id, type, after.email, subject, {
    order_id: `#${after.display_id}`, internal_order_id: after.id,
    status: after.status === "processing" && after.fulfillment_status === "shipped" ? "shipped" : after.status,
    payment_status: after.payment_status, fulfillment_status: after.fulfillment_status,
    carrier: after.shipping_carrier, tracking_number: after.tracking_number, tracking_url: after.tracking_url,
    ...(local ? { delivery_plan: plan, delivery_window: deliveryPlanText(plan) } : {}),
  }])
  return id
}
