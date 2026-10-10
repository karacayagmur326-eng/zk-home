export const INTERNAL_TRAFFIC_COOKIE = "zkhome_internal_traffic"

export function isLocalAnalyticsHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "")
  return host === "localhost" || host.endsWith(".localhost") || host === "::1" || host === "0.0.0.0" ||
    [".local", ".test", ".internal"].some(suffix => host.endsWith(suffix)) ||
    /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
}

export function isAnalyticsDebugTraffic(params: URLSearchParams, referrer = ""): boolean {
  // These are Tag Assistant / GTM preview parameters, not campaign parameters.
  if (["gtm_debug", "gtm_latency", "gtm_preview", "gtm_auth", "gtm_cookies_win", "debug_mode"]
    .some(key => params.has(key))) return true
  try { return new URL(referrer).hostname === "tagassistant.google.com" } catch { return false }
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
    !isAnalyticsDebugTraffic(new URLSearchParams(window.location.search), document.referrer) &&
    !document.cookie.split(";").some(value => value.trim() === `${INTERNAL_TRAFFIC_COOKIE}=1`)
}
