/**
 * Returns the base URL of the application, automatically detected from environment.
 * Priority:
 *  1. Explicit canonical / site / base URL
 *  2. Vercel production alias / deployment fallback
 *  3. Local dev
 */
const isLocalURL = (value?: string | null) =>
  Boolean(value && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(value))

export const getBaseURL = (): string => {
  const configured =
    process.env.NEXT_PUBLIC_CANONICAL_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL

  if (configured && !isLocalURL(configured)) {
    return configured.replace(/\/$/, "")
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  const port = process.env.PORT || "8015"
  return `http://localhost:${port}`
}

export const getCanonicalURL = (configured?: string | null) => {
  if (!configured) return getBaseURL()
  if (/^https?:\/\//i.test(configured)) {
    return isLocalURL(configured) && process.env.NODE_ENV === "production"
      ? getBaseURL()
      : configured.replace(/\/$/, "")
  }
  const path = configured.startsWith("/") ? configured : `/${configured}`
  return `${getBaseURL()}${path}`
}
