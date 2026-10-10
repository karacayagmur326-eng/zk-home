import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { flushAllSiteCache } from "@lib/cache"
import { getBaseURL } from "@lib/util/env"
import {
  normalizeGoogleVerification,
  normalizeSitemapSettings,
} from "@lib/seo/google-settings"

async function ensureColumns() {
  await query(`ALTER TABLE theme_settings
    ADD COLUMN IF NOT EXISTS seo_google_verification TEXT,
    ADD COLUMN IF NOT EXISTS seo_ga4_id TEXT,
    ADD COLUMN IF NOT EXISTS seo_gtm_id TEXT,
    ADD COLUMN IF NOT EXISTS seo_sitemap_settings JSONB`)
}

export async function GET() {
  if (!(await getAdminSession(["Admin"])))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    await ensureColumns()
    const [settings] = await query<any>(
      "SELECT seo_google_verification, seo_ga4_id, seo_gtm_id, seo_sitemap_settings FROM theme_settings WHERE id=1"
    )
    return NextResponse.json(
      {
        verification: settings?.seo_google_verification || "",
        ga4: settings?.seo_ga4_id || "",
        gtm: settings?.seo_gtm_id || "",
        sitemap: normalizeSitemapSettings(settings?.seo_sitemap_settings),
        baseUrl: getBaseURL(),
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch {
    return NextResponse.json(
      { error: "Google ve sitemap ayarları yüklenemedi." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  if (!(await getAdminSession(["Admin"])))
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    const body = await request.json()
    const verification = normalizeGoogleVerification(
      String(body.verification || "")
    )
    const ga4 = String(body.ga4 || "")
      .trim()
      .toUpperCase()
    const gtm = String(body.gtm || "")
      .trim()
      .toUpperCase()
    const errors: Record<string, string> = {}
    if (verification && !/^[A-Za-z0-9_-]{10,256}$/.test(verification))
      errors.verification =
        "Doğrulama kodunu, google-site-verification= kaydını veya HTML meta etiketini girin."
    if (ga4 && !/^G-[A-Z0-9]+$/.test(ga4))
      errors.ga4 = "G- ile başlayan GA4 ölçüm kimliğini girin."
    if (gtm && !/^GTM-[A-Z0-9]+$/.test(gtm))
      errors.gtm = "GTM- ile başlayan konteyner kimliğini girin."
    if (Object.keys(errors).length)
      return NextResponse.json(
        { error: "Vurgulanan alanları düzeltin.", errors },
        { status: 400 }
      )
    await ensureColumns()
    await query(
      `INSERT INTO theme_settings (id, seo_google_verification, seo_ga4_id, seo_gtm_id, seo_sitemap_settings)
      VALUES (1,$1,$2,$3,$4::jsonb) ON CONFLICT (id) DO UPDATE SET
      seo_google_verification=EXCLUDED.seo_google_verification, seo_ga4_id=EXCLUDED.seo_ga4_id,
      seo_gtm_id=EXCLUDED.seo_gtm_id, seo_sitemap_settings=EXCLUDED.seo_sitemap_settings`,
      [
        verification || null,
        ga4 || null,
        gtm || null,
        JSON.stringify(normalizeSitemapSettings(body.sitemap)),
      ]
    )
    await flushAllSiteCache()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "Ayarlar kaydedilemedi. Tekrar deneyin." },
      { status: 500 }
    )
  }
}
