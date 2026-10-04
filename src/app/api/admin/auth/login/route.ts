import { NextRequest, NextResponse } from "next/server"
import {
  signAdminToken,
  checkPassword,
  COOKIE_NAME,
  verifyAdminTotp,
  type AdminRole,
} from "@lib/admin/auth"
import { checkRateLimit, requestIp } from "@lib/security/rate-limit"
import { findLoginAccount } from "@lib/commerce/login-identity"
import { verifyPassword } from "@lib/commerce/customer-auth"

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
    const identifier = String(body.username || body.email || "").trim().toLowerCase()
    const password = String(body.password || "").trim()

    if (!identifier || identifier.length > 254 || !password || password.length > 256) {
      return NextResponse.json({ error: "Kullanıcı adı veya e-posta ve şifre zorunludur." }, { status: 400 })
    }

    const masterEmail = (process.env.ADMIN_EMAIL || "admin@zk-home.com").trim().toLowerCase()
    const masterUsername = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase()
    const matchesMaster = identifier === masterUsername || identifier === masterEmail
    let email: string | null = null
    let role: AdminRole = "Admin"
    if (matchesMaster && checkPassword(password)) {
      email = masterEmail
    } else {
      const account = await findLoginAccount(identifier)
      if (account?.id === "cust_admin_master") {
        // Always use the current configured password, never the legacy bootstrap hash.
        if (checkPassword(password)) email = account.email
      } else if (account && account.email_verified &&
        ["Admin", "Yönetici", "Editör"].includes(account.role || "") &&
        verifyPassword(password, account.password_hash)) {
        email = account.email
        role = account.role as AdminRole
      }
    }
    if (email && verifyAdminTotp(String(body.otp || ""))) {
      const token = await signAdminToken(email, role)
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

    return NextResponse.json({ error: "Kullanıcı adı, e-posta, şifre veya doğrulama kodu hatalı." }, { status: 401 })
  } catch (error: any) {
    console.error("Login Route Error:", error)
    return NextResponse.json(
      { error: "Giriş işlemi şu anda tamamlanamadı." },
      { status: 500 }
    )
  }
}
