const IYZICO_HOSTS = new Set([
  "api.iyzipay.com",
  "sandbox-api.iyzipay.com",
])

export function normalizeIyzicoBaseUrl(
  candidate: unknown,
  production: boolean
): string {
  const fallback = production
    ? "https://api.iyzipay.com"
    : "https://sandbox-api.iyzipay.com"

  try {
    const parsed = new URL(String(candidate || "").trim())
    if (
      parsed.protocol === "https:" &&
      IYZICO_HOSTS.has(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    ) {
      return parsed.origin
    }
  } catch {
    // Invalid or empty custom endpoint: use the official environment endpoint.
  }
  return fallback
}

export function normalizeIyzicoCallbackUrl(
  candidate: unknown,
  siteBaseUrl: string
): string {
  const fallback = `${siteBaseUrl.replace(/\/$/, "")}/api/payments/iyzico/callback`
  try {
    const parsed = new URL(String(candidate || "").trim())
    const site = new URL(siteBaseUrl)
    if (
      parsed.protocol === "https:" &&
      parsed.origin === site.origin &&
      parsed.pathname === "/api/payments/iyzico/callback"
    ) {
      return parsed.toString()
    }
  } catch {
    // Invalid callback: keep payment responses on the verified store domain.
  }
  return fallback
}
