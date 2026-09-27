import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { testAiProvider } from "@lib/chatbot/ai"
import { getAiProviderSecret, listAiProviders } from "@lib/chatbot/providers"

export async function POST(request: Request) {
  if (!await getAdminSession()) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  try {
    const body = await request.json()
    const provider = await getAiProviderSecret(String(body?.id || ""))
    if (!provider) return NextResponse.json({ error: "AI bağlantısı bulunamadı." }, { status: 404 })
    const ok = await testAiProvider(provider)
    if (!ok) {
      const current = (await listAiProviders()).find((item) => item.id === provider.id)
      return NextResponse.json({ error: current?.last_error || "Bağlantı doğrulanamadı.", providers: await listAiProviders() }, { status: 400 })
    }
    return NextResponse.json({ ok: true, providers: await listAiProviders() })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Bağlantı testi tamamlanamadı." }, { status: 500 })
  }
}
