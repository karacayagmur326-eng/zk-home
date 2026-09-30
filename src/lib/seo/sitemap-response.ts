import { NextResponse } from "next/server"

export function emptySitemap(status = 200) {
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
    { status, headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "no-store",
      ...(status === 503 ? { "Retry-After": "300" } : {}),
    } },
  )
}
