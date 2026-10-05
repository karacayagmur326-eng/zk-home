import type { ShippingMethodSetting } from "./settings"

export function shippingAmount(subtotal: number, method: ShippingMethodSetting) {
  if (method.freeThreshold !== null && subtotal >= method.freeThreshold) return 0
  return Math.max(0, Number(method.price) || 0)
}

export function buildShippingOptions(subtotal: number, methods: ShippingMethodSetting[]) {
  // A separate "Ücretsiz Kargo" row defines a store-wide threshold, not
  // another delivery service that the customer must choose manually.
  const isFreeShippingRule = (method: ShippingMethodSetting) =>
    method.name.trim().toLocaleLowerCase("tr-TR") === "ücretsiz kargo"
  const thresholds = methods.filter((method) => method.active && isFreeShippingRule(method) && method.freeThreshold !== null).map((method) => method.freeThreshold!)
  const globalThreshold = thresholds.length ? Math.min(...thresholds) : null
  return methods.filter((method) => method.active && !isFreeShippingRule(method)).map((method) => {
    const threshold = method.icon === "store" ? method.freeThreshold
      : globalThreshold === null ? method.freeThreshold
      : method.freeThreshold === null ? globalThreshold : Math.min(globalThreshold, method.freeThreshold)
    return {
    id: `shipping_method_${method.id}`,
    shipping_option_id: `shipping_method_${method.id}`,
    name: method.name,
    amount: shippingAmount(subtotal, { ...method, freeThreshold: threshold }),
    price_type: "flat",
    metadata: { method_id: method.id, coverage: method.coverage, estimated_days: method.estimatedDays, free_threshold: threshold, base_price: method.price },
    service_zone: { fulfillment_set: { type: method.icon === "store" ? "pickup" : "shipping" } },
    }
  })
}

export function selectedShippingOption(subtotal: number, methods: ShippingMethodSetting[], selected: any) {
  if (!selected) return undefined
  const options = buildShippingOptions(subtotal, methods)
  const id = selected.shipping_option_id || selected.id
  if (id === "shipping_standard") {
    const legacyMethod = methods.find((method) => method.icon !== "store" && !/mağazadan|teslim alma|pickup/i.test(method.name))
    return options.find((option) => option.metadata.method_id === legacyMethod?.id)
  }
  const match = options.find((option) => option.id === id)
  if (match) return match
  const previousMethod = methods.find((method) => `shipping_method_${method.id}` === id)
  if (previousMethod?.name.trim().toLocaleLowerCase("tr-TR") === "ücretsiz kargo") {
    return options.find((option) => option.service_zone.fulfillment_set.type === "shipping")
  }
  return undefined
}
