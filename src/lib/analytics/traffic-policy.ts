export const INTERNAL_TRAFFIC_COOKIE = "zkhome_internal_traffic"

export function isLocalAnalyticsHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "")
  return host === "localhost" || host.endsWith(".localhost") || host === "::1" ||
    /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
}

export function isAdminAnalyticsPath(pathname: string): boolean {
  let path = pathname.toLowerCase()
  try { path = decodeURIComponent(path) } catch { return true }
  return path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/admin/")
}

export function analyticsHostAllowed(hostname: string, productionHostname: string): boolean {
  return !isLocalAnalyticsHost(hostname) && !hostname.endsWith(".vercel.app") &&
    hostname.toLowerCase().replace(/^www\./, "") === productionHostname.toLowerCase().replace(/^www\./, "")
}

export function browserAnalyticsAllowed(): boolean {
  if (typeof window === "undefined") return false
  return document.body?.dataset.analyticsEnabled === "true" &&
    !isLocalAnalyticsHost(window.location.hostname) &&
    !isAdminAnalyticsPath(window.location.pathname) &&
    !document.cookie.split(";").some(value => value.trim() === `${INTERNAL_TRAFFIC_COOKIE}=1`)
}
