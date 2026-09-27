import "server-only"

/**
 * Real orders and indexing stay disabled until the operator explicitly confirms
 * that company, legal, fulfilment and payment settings have been reviewed.
 */
export function isStoreReady() {
  return process.env.STORE_READY === "true"
}

export function sanitizePublicSettings<T extends Record<string, unknown>>(
  settings: T | null,
) {
  if (!settings || isStoreReady()) return settings
  const safe = { ...settings }
  for (const key of Object.keys(safe)) {
    const value = (safe as Record<string, unknown>)[key]
    if (
      /mersis|kep/i.test(key) ||
      /^contact_(phone|email|address)$/i.test(key) ||
      key === "footer_features"
    ) {
      ;(safe as Record<string, unknown>)[key] = key === "footer_features" ? [] : ""
    } else if (
      typeof value === "string" &&
      /7\/24|256\s?bit|tüm ürün(?:lerimiz)?de.{0,20}2 yıl/i.test(value)
    ) {
      ;(safe as Record<string, unknown>)[key] = ""
    }
  }
  return safe
}
