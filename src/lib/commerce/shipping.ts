import type { ShippingMethodSetting, ShippingPriceRange } from "./settings"

export function legacyShippingRanges(methods: ShippingMethodSetting[]): ShippingPriceRange[] {
  const method = methods.find(m => m.active && m.icon !== "store" && m.name.trim().toLocaleLowerCase("tr-TR") !== "ücretsiz kargo")
  const thresholds = methods.filter(m => m.active && m.freeThreshold !== null && (m === method || m.name.trim().toLocaleLowerCase("tr-TR") === "ücretsiz kargo")).map(m => m.freeThreshold!)
  const threshold = thresholds.length ? Math.min(...thresholds) : null
  const price = method?.price ?? 0
  return threshold !== null && threshold > 0 ? [{ id: "paid", min: 0, max: threshold, price }, { id: "free", min: threshold, max: null, price: 0 }] : [{ id: "all", min: 0, max: null, price: threshold === 0 ? 0 : price }]
}

export function rangeShippingAmount(subtotal: number, ranges: ShippingPriceRange[]) {
  return ranges.find(r => subtotal >= r.min && (r.max === null || subtotal < r.max))?.price
}

export function shippingRangesError(ranges: ShippingPriceRange[]): string | null {
  if (!ranges.length || ranges.length > 20) return "En az bir, en fazla 20 kargo aralığı girin."
  const sorted = [...ranges].sort((a, b) => a.min - b.min)
  let next = 0
  for (const [index, range] of sorted.entries()) {
    if (![range.min, range.price].every(v => Number.isSafeInteger(v) && v >= 0 && v <= 10_000_000_000) || (range.max !== null && (!Number.isSafeInteger(range.max) || range.max <= range.min || range.max > 10_000_000_000))) return "Kargo aralığı ve ücreti için geçerli tutarlar girin."
    if (range.min !== next || (range.max === null && index !== sorted.length - 1)) return "Aralıklar 0 TL’den başlamalı, boşluk bırakmadan ve çakışmadan birbirini takip etmelidir."
    next = range.max ?? 0
  }
  return sorted[sorted.length - 1].max !== null ? "Son aralığın üst sınırını boş bırakarak üzerindeki tüm tutarları kapsayın." : null
}

export function shippingAmount(subtotal: number, method: ShippingMethodSetting) {
  if (method.freeThreshold !== null && subtotal >= method.freeThreshold) return 0
  return Math.max(0, Number(method.price) || 0)
}

export function buildShippingOptions(subtotal: number, methods: ShippingMethodSetting[], ranges?: ShippingPriceRange[]) {
  if (ranges) {
    const amount = rangeShippingAmount(subtotal, ranges)
    const publicRanges = ranges.map(({ id, min, max, price }) => ({ id, min, max, price }))
    return amount === undefined ? [] : [{ id: "shipping_auto", shipping_option_id: "shipping_auto", name: "Kargo", amount, price_type: "flat", metadata: { method_id: "auto", coverage: "Tüm Türkiye", estimated_days: "", free_threshold: null, base_price: amount, price_ranges: publicRanges }, service_zone: { fulfillment_set: { type: "shipping" } } }]
  }
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

export function couponShippingOption<T extends { amount: number; metadata: object }>(option: T, freeShipping: boolean): T {
  return freeShipping ? { ...option, amount: 0, metadata: { ...option.metadata, coupon_free_shipping: true } } : option
}

export function selectedShippingOption(subtotal: number, methods: ShippingMethodSetting[], selected: any, ranges?: ShippingPriceRange[]) {
  if (ranges) return buildShippingOptions(subtotal, methods, ranges)[0]
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
