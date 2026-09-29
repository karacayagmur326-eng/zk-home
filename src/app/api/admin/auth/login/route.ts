import { NextRequest, NextResponse } from "next/server"
import {
  signAdminToken,
  checkPassword,
  COOKIE_NAME,
  verifyAdminTotp,
} from "@lib/admin/auth"
import { checkRateLimit, requestIp } from "@lib/security/rate-limit"

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === "production") {
      const rate = await checkRateLimit(
        `admin-login:${requestIp(req)}`,
        8,
        15 * 60,
        { failClosed: true }
      )
      if (rate.unavailable) {
        return NextResponse.json(
          { error: "Giriş hizmeti şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin." },
          { status: 503 }
        )
      }
      if (!rate.allowed) {
        return NextResponse.json(
          { error: "Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin." },
          { status: 429 }
        )
      }
    }

    const body = await req.json().catch(() => ({}))
    const password = String(body.password || "").trim()

    if (!password) {
      return NextResponse.json({ error: "Şifre zorunludur." }, { status: 400 })
    }

    const isMaster = checkPassword(password) && verifyAdminTotp(String(body.otp || ""))
    if (isMaster) {
      const token = await signAdminToken(
        process.env.ADMIN_EMAIL || "admin@zk-home.com"
      )
      const response = NextResponse.json({ success: true })
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      })
      return response
    }

    return NextResponse.json({ error: "Geçersiz şifre." }, { status: 401 })
  } catch (error: any) {
    console.error("Login Route Error:", error)
    return NextResponse.json(
      { error: "Giriş işlemi şu anda tamamlanamadı." },
      { status: 500 }
    )
  }
}
