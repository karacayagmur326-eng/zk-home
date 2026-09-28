import { NextRequest, NextResponse } from "next/server"
import { query } from "@lib/admin/db"
import { checkRateLimit, requestIp } from "@lib/security/rate-limit"

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(
    `newsletter:${requestIp(request)}`,
    5,
    60 * 60
  )
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Çok fazla abonelik denemesi yapıldı. Lütfen daha sonra tekrar deneyin." },
      { status: 429 }
    )
  }

  const form = await request.formData()
  const email = String(form.get("email") || "").trim().toLowerCase().slice(0, 254)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 })
  await query(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (email TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
  await query("INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING", [email])
  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ success: true })
  }
  return NextResponse.redirect(new URL("/blog?abonelik=basarili", request.url), 303)
}
