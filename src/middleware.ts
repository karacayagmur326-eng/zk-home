import { NextRequest, NextResponse } from "next/server"
import { isPrivatePath, isSearchOrFilterPage } from "./lib/seo/indexing"
import { analyticsHostAllowed, INTERNAL_TRAFFIC_COOKIE, isAdminAnalyticsPath, isAnalyticsDebugTraffic, isLocalAnalyticsHost } from "./lib/analytics/traffic-policy"
import { getBaseURL } from "./lib/util/env"

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"])
const crossSitePostAllowlist = [
  "/api/webhooks/",
  "/api/payments/iyzico/callback",
  "/api/cron/",
]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const privatePage = isPrivatePath(pathname)
  // Only these cookie-independent GET endpoints are public catalog responses.
  const publicCatalog = (request.method === "GET" || request.method === "HEAD") &&
    ["/api/catalog/navigation", "/api/catalog/sliders", "/api/catalog/featured-section"].includes(pathname)
  const debugTraffic = isAnalyticsDebugTraffic(request.nextUrl.searchParams, request.headers.get("referer") || "")
  const internalTraffic = debugTraffic || isAdminAnalyticsPath(pathname) || request.cookies.has("zkhome_admin_token") || request.cookies.get(INTERNAL_TRAFFIC_COOKIE)?.value === "1"
  // A standalone installation can use its own public request host without a
  // Vercel-specific variable or a domain embedded in the theme.
  const configuredHost = new URL(getBaseURL()).hostname
  const productionHost = isLocalAnalyticsHost(configuredHost) ? request.nextUrl.hostname : configuredHost
  const analyticsEnabled = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview" &&
    analyticsHostAllowed(request.nextUrl.hostname, productionHost) && !internalTraffic
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-zk-analytics-enabled", String(analyticsEnabled))
  const finish = (response: NextResponse) => {
    const prefetch = request.headers.get("next-router-prefetch") === "1" || request.headers.get("purpose") === "prefetch" || request.headers.get("sec-purpose")?.includes("prefetch")
    if (internalTraffic && !prefetch && request.cookies.get(INTERNAL_TRAFFIC_COOKIE)?.value !== "1") {
      response.cookies.set(INTERNAL_TRAFFIC_COOKIE, "1", { path: "/", sameSite: "lax", secure: request.nextUrl.protocol === "https:", maxAge: 365 * 86400 })
    }
    if (privatePage || isLocalAnalyticsHost(request.nextUrl.hostname) || process.env.VERCEL_ENV === "preview" || request.nextUrl.hostname.endsWith(".vercel.app")) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")
    } else if (debugTraffic || isSearchOrFilterPage(pathname, request.nextUrl.searchParams)) {
      response.headers.set("X-Robots-Tag", "noindex, follow")
    }
    if ((privatePage && !publicCatalog) || internalTraffic) {
      response.headers.set("Cache-Control", "private, no-store, max-age=0")
      response.headers.set("Vary", "Cookie")
    }
    return response
  }
  if (
    unsafeMethods.has(request.method) &&
    !crossSitePostAllowlist.some((path) => request.nextUrl.pathname.startsWith(path))
  ) {
    const origin = request.headers.get("origin")
    const fetchSite = request.headers.get("sec-fetch-site")
    const expectedOrigin = request.nextUrl.origin

    if (
      (origin && origin !== expectedOrigin) ||
      fetchSite === "cross-site"
    ) {
      return finish(NextResponse.json(
        { error: "İstek kaynağı doğrulanamadı." },
        { status: 403 },
      ))
    }
  }

  const product = pathname.match(/^\/urunler\/([^/]+)$/)
  if (product && (request.cookies.has("zkhome_admin_token") || request.nextUrl.searchParams.get("preview") === "1")) {
    // Draft previews have their own authenticated, uncached renderer. A draft
    // or a private cookie can never enter the public product ISR entry.
    const url = request.nextUrl.clone()
    url.pathname = `/product-preview/${product[1]}`
    const response = finish(NextResponse.rewrite(url, { request: { headers: requestHeaders } }))
    response.headers.set("Cache-Control", "private, no-store, max-age=0")
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")
    return response
  }
  return finish(NextResponse.next({ request: { headers: requestHeaders } }))
}

export const config = {
  // Exclude actual static directories, rather than all dotted paths: API and
  // payment/source validation must still run even if a URL has an extension.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|hero/|category-images/|category-icons/|editorial/).*)"],
}
