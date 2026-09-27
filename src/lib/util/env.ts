/**
 * Returns the base URL of the application, automatically detected from environment.
 * Priority:
 *  1. NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_BASE_URL (if custom domain)
 *  2. Production default: https://www.zk-home.com
 *  3. Vercel fallback
 *  4. Local dev
 */
const isLocalURL = (value?: string | null) =>
  Boolean(value && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(value))

export const getBaseURL = (): string => {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL

  if (configured && !isLocalURL(configured) && !configured.includes(".vercel.app")) {
    return configured.replace(/\/$/, "")
  }

  if (process.env.NODE_ENV === "production") {
    return "https://www.zk-home.com"
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
  const port = process.env.PORT || "3000"
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
