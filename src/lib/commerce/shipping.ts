import type { ShippingMethodSetting } from "./settings"

export function shippingAmount(subtotal: number, method: ShippingMethodSetting) {
  if (method.freeThreshold !== null && subtotal >= method.freeThreshold) return 0
  return Math.max(0, Number(method.price) || 0)
}

export function buildShippingOptions(subtotal: number, methods: ShippingMethodSetting[]) {
  return methods.filter((method) => method.active).map((method) => ({
    id: `shipping_method_${method.id}`,
    shipping_option_id: `shipping_method_${method.id}`,
    name: method.name,
    amount: shippingAmount(subtotal, method),
    price_type: "flat",
    metadata: { method_id: method.id, coverage: method.coverage, estimated_days: method.estimatedDays },
    service_zone: { fulfillment_set: { type: method.icon === "store" ? "pickup" : "shipping" } },
  }))
}

export function selectedShippingOption(subtotal: number, methods: ShippingMethodSetting[], selected: any) {
  if (!selected) return undefined
  const options = buildShippingOptions(subtotal, methods)
  const id = selected.shipping_option_id || selected.id
  if (id === "shipping_standard") {
    const legacyMethod = methods.find((method) => method.icon !== "store" && !/mağazadan|teslim alma|pickup/i.test(method.name))
    return options.find((option) => option.metadata.method_id === legacyMethod?.id)
  }
  return options.find((option) => option.id === id)
}
