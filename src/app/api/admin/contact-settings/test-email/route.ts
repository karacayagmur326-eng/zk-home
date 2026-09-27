import { getAdminSession } from "@lib/admin/auth"
import { testSmtpConnection } from "@lib/email/smtp"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const body = await request.json()
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
