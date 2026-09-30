import { NextRequest, NextResponse } from "next/server"
import { isPrivatePath, isSearchOrFilterPage } from "./lib/seo/indexing"

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"])
const crossSitePostAllowlist = [
  "/api/webhooks/",
  "/api/payments/iyzico/callback",
  "/api/cron/",
]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const privatePage = isPrivatePath(pathname)
  const finish = (response: NextResponse) => {
    if (privatePage || process.env.VERCEL_ENV === "preview" || request.nextUrl.hostname.endsWith(".vercel.app")) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive")
    } else if (isSearchOrFilterPage(pathname, request.nextUrl.searchParams)) {
      response.headers.set("X-Robots-Tag", "noindex, follow")
    }
    if (privatePage) {
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

  return finish(NextResponse.next())
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
