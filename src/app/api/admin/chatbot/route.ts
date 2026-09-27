import { NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { CHATBOT_DEFAULTS, ChatbotQuestion, ChatbotSettings } from "@lib/chatbot/config"
import { getChatbotSettings } from "@lib/chatbot/settings"
import { getChatbotAiKey } from "@lib/chatbot/ai"
import { encryptSettings } from "@lib/security/encrypted-settings"

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  return NextResponse.json({
    settings: await getChatbotSettings(),
    ai_api_key_configured: Boolean(await getChatbotAiKey()),
  })
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const body = await request.json()
    const source = (body?.settings || {}) as Partial<ChatbotSettings>
    const questions = (Array.isArray(source.questions) ? source.questions : [])
      .slice(0, 100)
      .map((item: Partial<ChatbotQuestion>, index: number) => {
        const requestedUrl = String(item.link_url || "").trim().slice(0, 500)
        const safeUrl =
          (requestedUrl.startsWith("/") && !requestedUrl.startsWith("//")) ||
          /^https:\/\//i.test(requestedUrl)
            ? requestedUrl
            : ""
        return {
          id: String(item.id || `question-${Date.now()}-${index}`).slice(0, 80),
          question: String(item.question || "").trim().slice(0, 240),
          answer: String(item.answer || "").trim().slice(0, 2000),
          keywords: String(item.keywords || "").trim().slice(0, 500),
          link_url: safeUrl,
          link_text: String(item.link_text || "").trim().slice(0, 100),
          active: item.active !== false,
        }
      })
      .filter((item) => item.question && item.answer)

    const settings: ChatbotSettings = {
      enabled: source.enabled !== false,
      ai_enabled: source.ai_enabled === true,
      ai_provider: "gemini",
      ai_model: /^[a-z0-9._-]+$/i.test(String(source.ai_model || ""))
        ? String(source.ai_model)
        : CHATBOT_DEFAULTS.ai_model,
      ai_tone: String(source.ai_tone || CHATBOT_DEFAULTS.ai_tone).trim().slice(0, 500),
      catalog_search_enabled: source.catalog_search_enabled !== false,
      page_search_enabled: source.page_search_enabled !== false,
      max_product_results: Math.min(Math.max(Number(source.max_product_results || 4), 1), 8),
      bot_name: String(source.bot_name || CHATBOT_DEFAULTS.bot_name).trim().slice(0, 60),
      welcome_message: String(source.welcome_message || CHATBOT_DEFAULTS.welcome_message).trim().slice(0, 500),
      input_placeholder: String(source.input_placeholder || CHATBOT_DEFAULTS.input_placeholder).trim().slice(0, 100),
      fallback_message: String(source.fallback_message || CHATBOT_DEFAULTS.fallback_message).trim().slice(0, 500),
      accent_color: /^#[0-9a-f]{6}$/i.test(String(source.accent_color || ""))
        ? String(source.accent_color)
        : CHATBOT_DEFAULTS.accent_color,
      questions,
    }

    await query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    await query(
      `INSERT INTO store_settings (key,value,updated_at) VALUES ('chatbot_settings',$1,NOW())
       ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,
      [JSON.stringify(settings)]
    )
    const apiKey = String(body?.ai_api_key || "").trim()
    if (apiKey) {
      const encrypted = encryptSettings({ api_key: apiKey })
      await query(
        `INSERT INTO store_settings (key,value,updated_at) VALUES ('chatbot_ai_secret',$1,NOW())
         ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,
        [JSON.stringify(encrypted)]
      )
    }
    return NextResponse.json({
      ok: true,
      settings,
      ai_api_key_configured: Boolean(apiKey || await getChatbotAiKey()),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ayarlar kaydedilemedi." },
      { status: 500 }
    )
  }
}
