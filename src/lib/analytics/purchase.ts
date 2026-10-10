type PurchaseOrder = {
  id?: string
  status?: string
  payment_status?: string
  total?: number | string
  tax_total?: number | string
  shipping_total?: number | string
  metadata?: Record<string, unknown> | null
}

export function isPaidPurchase(order: PurchaseOrder) {
  return Boolean(order.id) &&
    ["paid", "captured"].includes(String(order.payment_status || "").toLowerCase()) &&
    !["canceled", "cancelled", "refunded"].includes(String(order.status || "").toLowerCase())
}

// Amounts in the commerce database are in kuruş. GA4 revenue excludes
// shipping, VAT and payment service fees, and includes the actual discount.
export function purchaseValue(order: PurchaseOrder) {
  const amount = (value: unknown) => {
    const number = Number(value || 0)
    return Number.isFinite(number) ? Math.max(0, number) : 0
  }
  return Math.round(Math.max(0,
    amount(order.total) - amount(order.shipping_total) - amount(order.tax_total) -
    amount(order.metadata?.payment_fee)
  )) / 100
}

export function purchaseItems(order: PurchaseOrder, items: any[]) {
  const gross = items.reduce((sum, item) => sum +
    Number(item.unit_price || 0) * Number(item.quantity || 1), 0) / 100
  const ratio = gross > 0 ? purchaseValue(order) / gross : 0
  return items.map(item => ({
    item_id: item.variant_id || item.variant?.id || item.id,
    item_name: item.product_title || item.title,
    ...(item.variant_title || item.variant?.title
      ? { item_variant: item.variant_title || item.variant.title } : {}),
    price: Math.round(Number(item.unit_price || 0) / 100 * ratio * 1e6) / 1e6,
    quantity: Number(item.quantity || 1),
  }))
}
