import "server-only"

import { ChatbotSettings } from "./config"
import { AiProviderSecret, listActiveAiProviderSecrets, recordAiError, recordAiTestSuccess, recordAiUsage } from "./providers"

type HistoryItem = { role: "user" | "bot"; text: string }
type GenerateArgs = { message: string; history: HistoryItem[]; settings: ChatbotSettings; grounding: string }
type AiResult = { answer: string; needs_human: boolean }
type Usage = { prompt: number; completion: number; total: number }
type ProviderCall = { result: AiResult | null; usage: Usage }

function redactSensitiveData(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-posta gizlendi]")
    .replace(/(?:\+?90|0)?\s*5\d{2}(?:[\s.-]*\d{3})(?:[\s.-]*\d{2})(?:[\s.-]*\d{2})/g, "[telefon gizlendi]")
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[kart numarası gizlendi]")
}

function systemPrompt(tone: string) {
  return `Sen Mağaza web sitesinin ürün ve bilgi asistanısın. Türkçe yanıt ver.
Üslup: ${tone}
Kullanıcının yazım hatalarını sessizce anlamlandır ve önce gerçek niyetini çöz. Sadece VERİLEN MAĞAZA BİLGİSİ içindeki Mağaza kanıtlarını kullan. Kanıt dışında teknik özellik, fiyat, stok, performans veya garanti bilgisi uydurma. Bilgi yoksa açıkça söyle ve needs_human=true yap.
Teknik değerleri ve birimleri asla sessizce değiştirme veya uydurma. İstenen değer katalogda yoksa bunu açıkça söyle; yalnızca verilen mağaza bilgisindeki en yakın gerçek değeri alternatif sun.
Arama sonucu dökmekle yetinme; kullanıcının asıl sorusunu açıklama, seçim gerekçesi, uygunluk veya karşılaştırma yönünden cevapla. Ürün kanıtı varsa ilgili ürünü soruyla açıkça ilişkilendir ve ilişkiyi hangi doğrulanmış özelliğin kurduğunu söyle. Kanıtta olmayan bir sonucu çıkarım olarak sunma; eksik bilgiyi açıkça belirt.
Soruyu doğrudan cevapla; kısa soruya 1-4 cümleyle kısa cevap ver. Gereksiz SEO metni, kategori listesi veya blog özeti dökme. Her cevaba aynı kalıp sözle başlama. Bir insan olduğunu iddia etme. Yanıtı en fazla 110 kelime ve iki kısa paragraf tut.
Yalnızca şu JSON biçiminde dön: {"answer":"...","needs_human":false}`
}

function userPrompt(args: GenerateArgs) {
  return redactSensitiveData(`VERİLEN MAĞAZA BİLGİSİ:\n${args.grounding.slice(0, 12000)}\n\nMÜŞTERİNİN SON MESAJI:\n${args.message}`)
}

function parseJsonResult(raw: string): AiResult | null {
  try {
    const parsed = JSON.parse(raw.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, ""))
    const answer = String(parsed?.answer || "").trim()
    return answer ? { answer: answer.slice(0, 1000), needs_human: parsed?.needs_human === true } : null
  } catch { return null }
}

function timeoutSignal(milliseconds = 12_000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), milliseconds)
  return { signal: controller.signal, clear: () => clearTimeout(timer) }
}

async function callGemini(args: GenerateArgs, record: AiProviderSecret): Promise<ProviderCall> {
  const timeout = timeoutSignal()
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(record.model)}:generateContent`, {
      method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": record.api_key }, signal: timeout.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(args.settings.ai_tone) }] },
        contents: [
          ...args.history.slice(-6).map((item) => ({ role: item.role === "bot" ? "model" : "user", parts: [{ text: redactSensitiveData(item.text.slice(0, 500)) }] })),
          { role: "user", parts: [{ text: userPrompt(args) }] },
        ],
        generationConfig: { temperature: 0.45, maxOutputTokens: 600, responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } },
      }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(`${response.status}: ${String(payload?.error?.message || "Gemini isteği başarısız")}`)
    const raw = payload?.candidates?.[0]?.content?.parts?.map((part: any) => String(part?.text || "")).join("") || ""
    const usage = payload?.usageMetadata || {}
    return { result: parseJsonResult(raw), usage: { prompt: Number(usage.promptTokenCount || 0), completion: Number(usage.candidatesTokenCount || 0), total: Number(usage.totalTokenCount || 0) } }
  } finally { timeout.clear() }
}

async function callOpenAi(args: GenerateArgs, record: AiProviderSecret): Promise<ProviderCall> {
  const timeout = timeoutSignal()
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${record.api_key}` }, signal: timeout.signal,
      body: JSON.stringify({
        model: record.model, instructions: systemPrompt(args.settings.ai_tone),
        input: [
          ...args.history.slice(-6).map((item) => ({ role: item.role === "bot" ? "assistant" : "user", content: redactSensitiveData(item.text.slice(0, 500)) })),
          { role: "user", content: userPrompt(args) },
        ],
        max_output_tokens: 600, store: false,
        text: { format: { type: "json_schema", name: "chatbot_answer", strict: true, schema: { type: "object", additionalProperties: false, properties: { answer: { type: "string" }, needs_human: { type: "boolean" } }, required: ["answer", "needs_human"] } } },
      }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(`${response.status}: ${String(payload?.error?.message || "OpenAI isteği başarısız")}`)
    const raw = (payload?.output || []).flatMap((item: any) => item?.content || []).map((item: any) => item?.text || "").join("")
    const usage = payload?.usage || {}
    return { result: parseJsonResult(raw), usage: { prompt: Number(usage.input_tokens || 0), completion: Number(usage.output_tokens || 0), total: Number(usage.total_tokens || 0) } }
  } finally { timeout.clear() }
}

async function callAnthropic(args: GenerateArgs, record: AiProviderSecret): Promise<ProviderCall> {
  const timeout = timeoutSignal()
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "content-type": "application/json", "x-api-key": record.api_key, "anthropic-version": "2023-06-01" }, signal: timeout.signal,
      body: JSON.stringify({
        model: record.model, system: systemPrompt(args.settings.ai_tone), max_tokens: 600, temperature: 0.45,
        messages: [
          ...args.history.slice(-6).map((item) => ({ role: item.role === "bot" ? "assistant" : "user", content: redactSensitiveData(item.text.slice(0, 500)) })),
          { role: "user", content: userPrompt(args) },
        ],
      }),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(`${response.status}: ${String(payload?.error?.message || "Anthropic isteği başarısız")}`)
    const raw = (payload?.content || []).filter((item: any) => item?.type === "text").map((item: any) => item.text || "").join("")
    const usage = payload?.usage || {}
    const prompt = Number(usage.input_tokens || 0) + Number(usage.cache_creation_input_tokens || 0) + Number(usage.cache_read_input_tokens || 0)
    const completion = Number(usage.output_tokens || 0)
    return { result: parseJsonResult(raw), usage: { prompt, completion, total: prompt + completion } }
  } finally { timeout.clear() }
}

async function callProvider(args: GenerateArgs, record: AiProviderSecret) {
  if (record.provider === "openai") return callOpenAi(args, record)
  if (record.provider === "anthropic") return callAnthropic(args, record)
  return callGemini(args, record)
}

export async function generateAiChatbotAnswer(args: GenerateArgs) {
  if (!args.settings.ai_enabled) return null
  for (const provider of await listActiveAiProviderSecrets()) {
    try {
      const response = await callProvider(args, provider)
      if (response.usage.total > 0) await recordAiUsage(provider.id, response.usage)
      if (response.result) return response.result
      await recordAiError(provider.id, "Sağlayıcı geçerli JSON yanıtı döndürmedi.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bilinmeyen sağlayıcı hatası"
      console.warn(`[chatbot-ai] ${provider.provider} unavailable`, message.slice(0, 160))
      await recordAiError(provider.id, message)
    }
  }
  return null
}

export async function testAiProvider(record: AiProviderSecret) {
  const settings = { ...({} as ChatbotSettings), ai_tone: "Kısa ve doğal konuş." }
  try {
    const response = await callProvider({ message: "Kısa bir test yanıtı ver.", history: [], settings, grounding: "Mağaza adı: Mağaza." }, record)
    if (!response.result?.answer) throw new Error("Geçerli yanıt alınamadı.")
    if (response.usage.total > 0) await recordAiUsage(record.id, response.usage)
    await recordAiTestSuccess(record.id)
    return true
  } catch (error) {
    await recordAiError(record.id, error instanceof Error ? error.message : "Bağlantı testi başarısız", true)
    return false
  }
}

export async function getChatbotAiKey() {
  return (await listActiveAiProviderSecrets()).find((item) => item.provider === "gemini")?.api_key || ""
}

export async function testGeminiConnection(apiKey: string, model: string) {
  const temporary = { id: "temporary", provider: "gemini", model, api_key: apiKey } as AiProviderSecret
  const settings = { ...({} as ChatbotSettings), ai_tone: "Kısa ve doğal konuş." }
  try {
    const response = await callGemini({ message: "Kısa bir test yanıtı ver.", history: [], settings, grounding: "Mağaza adı: Mağaza." }, temporary)
    return Boolean(response.result?.answer)
  } catch { return false }
}
