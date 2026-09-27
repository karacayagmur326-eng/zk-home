import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { getChatbotAiKey, testGeminiConnection } from "@lib/chatbot/ai"

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    const body = await request.json()
    const apiKey = String(body?.api_key || "").trim() || await getChatbotAiKey()
    if (!apiKey) {
      return NextResponse.json({ error: "Önce Gemini API anahtarını girin." }, { status: 400 })
    }
    const model = String(body?.model || "gemini-2.5-flash-lite")
    const ok = await testGeminiConnection(apiKey, model)
    if (!ok) return NextResponse.json({ error: "Gemini bağlantısı doğrulanamadı. Anahtar ve modeli kontrol edin." }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Bağlantı testi tamamlanamadı." }, { status: 500 })
  }
}
