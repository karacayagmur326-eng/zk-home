import { getAdminSession } from "@lib/admin/auth"
import { testSmtpConnection } from "@lib/email/smtp"
import { query } from "@lib/admin/db"
import { decryptSettings } from "@lib/security/encrypted-settings"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const body = await request.json()
    if (!body.pass || body.pass === "••••••••") {
      const rows = await query<{ value: Record<string, any> }>(
        "SELECT value FROM store_settings WHERE key='smtp_settings' LIMIT 1"
      )
      const saved = rows[0]?.value
      // A saved credential is only sent to its original server and account.
      if (saved?.host === body.host && saved?.user === body.user) {
        body.pass = decryptSettings(saved.encrypted_pass).pass || saved.pass || ""
      } else {
        body.pass = ""
      }
    }
    const result = await testSmtpConnection(body)
    
    if (result.ok) {
      return NextResponse.json({ ok: true, message: "SMTP Sunucu bağlantısı başarılı!" })
    } else {
      return NextResponse.json({ error: result.error || "SMTP Bağlantısı kurulamadı." }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
