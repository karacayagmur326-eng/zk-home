export const ZK_HOME_DELIVERY = "ZK Home Teslimat"
export type DeliveryPlan = { date: string; start: string; end: string; timezone: "Europe/Istanbul" }

export function validateDeliveryPlan(value: unknown, now = Date.now()): DeliveryPlan {
  const plan = value as Partial<DeliveryPlan> | null
  if (!plan || !/^\d{4}-\d{2}-\d{2}$/.test(plan.date || "") || !/^([01]\d|2[0-3]):[0-5]\d$/.test(plan.start || "") || !/^([01]\d|2[0-3]):[0-5]\d$/.test(plan.end || "")) {
    throw new Error("Teslimat tarihi ile başlangıç ve bitiş saatlerini seçin.")
  }
  const date = plan.date!, start = plan.start!, end = plan.end!
  const startsAt = new Date(`${date}T${start}:00+03:00`)
  if (!Number.isFinite(startsAt.getTime()) || new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(startsAt) !== date) throw new Error("Geçerli bir teslimat tarihi seçin.")
  if (start >= end) throw new Error("Bitiş saati başlangıç saatinden sonra olmalıdır.")
  if (startsAt.getTime() < now) throw new Error("Teslimat başlangıcı geçmiş bir tarih veya saat olamaz.")
  return { date, start, end, timezone: "Europe/Istanbul" }
}

export function deliveryPlanText(plan: DeliveryPlan) {
  const date = new Date(`${plan.date}T12:00:00+03:00`).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", year: "numeric" })
  return `${date} tarihinde ${plan.start}–${plan.end} saatleri arasında (Türkiye saati)`
}
