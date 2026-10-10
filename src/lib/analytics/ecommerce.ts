"use client"
import { browserAnalyticsAllowed } from "./traffic-policy"

export function analyticsAllowed() {
  if (!browserAnalyticsAllowed()) return false
  try {
    const consent = JSON.parse(
      localStorage.getItem("zkhome_cookie_consent_v2") || "{}"
    )
    return (
      consent.analytics === true &&
      Date.now() - Number(consent.timestamp || 0) < 180 * 86400000
    )
  } catch {
    return false
  }
}
export function trackEcommerce(
  event: "view_item" | "add_to_cart" | "begin_checkout" | "purchase",
  data: Record<string, any>,
  once?: string
) {
  if (!analyticsAllowed()) return false
  try {
    if (once && sessionStorage.getItem(`zk-analytics:${once}`)) return true
  } catch {}
  const browser = window as any
  if (typeof browser.gtag !== "function" && !browser.__zkGtmReady) return false
  browser.dataLayer = browser.dataLayer || []
  // Native GA4 consumes gtag commands; GTM can also use the ecommerce object.
  browser.dataLayer.push({ ecommerce: null })
  if (typeof browser.gtag === "function") browser.gtag("event", event, data)
  else {
    browser.dataLayer.push({ event, ecommerce: data })
  }
  if (once) {
    try {
      sessionStorage.setItem(`zk-analytics:${once}`, "1")
    } catch {}
  }
  return true
}
export function analyticsItems(items: any[]) {
  return items.map((item) => ({
    item_id: item.variant_id || item.variant?.id || item.id,
    item_name: item.product_title || item.title,
    ...(item.variant_title || item.variant?.title
      ? { item_variant: item.variant_title || item.variant.title }
      : {}),
    price: Number(item.unit_price || 0) / 100,
    quantity: Number(item.quantity || 1),
  }))
}
