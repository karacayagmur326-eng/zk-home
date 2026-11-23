import { NextResponse } from "next/server"
import { getThemeSettings } from "@lib/content/theme-settings"
import { normalizeBingVerification } from "@lib/seo/google-settings"
import { escapeXml } from "@lib/seo/indexing"

export const dynamic = "force-dynamic"

export async function GET() {
  const settings = await getThemeSettings().catch(() => null)
  const code = normalizeBingVerification(settings?.seo_bing_verification || "")
  if (!code) {
    return new NextResponse("Not Found", { status: 404 })
  }
  const xml = `<?xml version="1.0"?>
<users>
  <user>${escapeXml(code)}</user>
</users>`

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
