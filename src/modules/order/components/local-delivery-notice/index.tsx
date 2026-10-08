import { DeliveryPlan, deliveryPlanText, ZK_HOME_DELIVERY } from "@lib/util/local-delivery"

export default function LocalDeliveryNotice({ order }: { order: { metadata?: Record<string, unknown> | null; shipping_carrier?: string | null; fulfillment_status?: string } }) {
  const plan = order.metadata?.delivery_plan as DeliveryPlan | undefined
  if (order.shipping_carrier !== ZK_HOME_DELIVERY || !plan || !/^\d{4}-\d{2}-\d{2}$/.test(plan.date) || !/^\d{2}:\d{2}$/.test(plan.start) || !/^\d{2}:\d{2}$/.test(plan.end) || ["cancelled","canceled","returned"].includes(order.fulfillment_status || "")) return null
  return <div className="my-4 rounded-xl border border-[#ead5cf] bg-[#faf5f2] p-4"><p className="text-sm font-semibold text-[#986969]">ZK Home Teslimat{order.fulfillment_status === "delivered" ? " tamamlandı" : " planlandı"}</p><p className="mt-1 text-sm leading-relaxed text-slate-600">{order.fulfillment_status === "delivered" ? "Siparişiniz ZK Home ekibi tarafından teslim edildi." : `Siparişiniz ${deliveryPlanText(plan)} ZK Home ekibi tarafından adresinize bizzat teslim edilecektir.`}</p></div>
}
