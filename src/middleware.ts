import { NextRequest, NextResponse } from "next/server"
import { isPrivatePath, isSearchOrFilterPage } from "./lib/seo/indexing"
import { analyticsHostAllowed, INTERNAL_TRAFFIC_COOKIE, isAdminAnalyticsPath, isLocalAnalyticsHost } from "./lib/analytics/traffic-policy"
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
  const internalTraffic = isAdminAnalyticsPath(pathname) || request.cookies.has("zkhome_admin_token") || request.cookies.get(INTERNAL_TRAFFIC_COOKIE)?.value === "1"
  const analyticsEnabled = process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview" &&
    analyticsHostAllowed(request.nextUrl.hostname, new URL(getBaseURL()).hostname) && !internalTraffic
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-zk-analytics-enabled", String(analyticsEnabled))
  const finish = (response: NextResponse) => {
    const prefetch = request.headers.get("next-router-prefetch") === "1" || request.headers.get("purpose") === "prefetch" || request.headers.get("sec-purpose")?.includes("prefetch")
    if (internalTraffic && !prefetch && request.cookies.get(INTERNAL_TRAFFIC_COOKIE)?.value !== "1") {
      response.cookies.set(INTERNAL_TRAFFIC_COOKIE, "1", { path: "/", sameSite: "lax", secure: request.nextUrl.protocol === "https:", maxAge: 365 * 86400 })
    }
    if (privatePage || isLocalAnalyticsHost(request.nextUrl.hostname) || process.env.VERCEL_ENV === "preview" || request.nextUrl.hostname.endsWith(".vercel.app")) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")
    } else if (isSearchOrFilterPage(pathname, request.nextUrl.searchParams)) {
      response.headers.set("X-Robots-Tag", "noindex, follow")
    }
    if (privatePage || internalTraffic) {
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

  return finish(NextResponse.next({ request: { headers: requestHeaders } }))
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
