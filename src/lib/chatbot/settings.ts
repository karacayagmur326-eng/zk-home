import "server-only"

import { query } from "@lib/admin/db"
import { CHATBOT_DEFAULTS, ChatbotSettings } from "./config"
import { correctLikelyTypos, normalizeQuery } from "./understanding"

export async function getChatbotSettings(): Promise<ChatbotSettings> {
  try {
    const rows = await query<{ value: Partial<ChatbotSettings> }>(
      `SELECT value FROM store_settings WHERE key='chatbot_settings' LIMIT 1`
    )
    const value = rows[0]?.value
    if (!value) return CHATBOT_DEFAULTS
    return {
      ...CHATBOT_DEFAULTS,
      ...value,
      questions: Array.isArray(value.questions)
        ? value.questions
        : CHATBOT_DEFAULTS.questions,
    }
  } catch {
    return CHATBOT_DEFAULTS
  }
}

export function normalizeChatbotText(value: unknown) {
  return normalizeQuery(value)
}

export function findChatbotAnswer(settings: ChatbotSettings, message: string) {
  const normalized = correctLikelyTypos(normalizeChatbotText(message))
  const messageTokens = new Set(normalized.split(" ").filter((token) => token.length > 2))
  let best: { question: ChatbotSettings["questions"][number]; score: number } | null = null

  for (const question of settings.questions.filter((item) => item.active)) {
    const normalizedQuestion = correctLikelyTypos(normalizeChatbotText(question.question))
    const keywords = correctLikelyTypos(normalizeChatbotText(question.keywords))
      .split(" ")
      .filter((token) => token.length > 2)
    const questionTokens = normalizedQuestion
      .split(" ")
      .filter((token) => token.length > 2)
    const keywordHits = keywords.filter((token) => messageTokens.has(token)).length
    const questionHits = questionTokens.filter((token) => messageTokens.has(token)).length
    const phraseBonus = normalized.includes(normalizedQuestion) || normalizedQuestion.includes(normalized) ? 4 : 0
    const score = keywordHits * 2 + questionHits + phraseBonus
    if (!best || score > best.score) best = { question, score }
  }

  return best && best.score >= 2 ? best.question : null
}

const SITE_PAGE_GUIDES: Array<{ id: string; patterns: RegExp[] }> = [
  { id: "legal-kvkk", patterns: [/\bkvk+k\b/, /\bkvvk\b/, /kisisel veri.*aydinlatma/] },
  { id: "legal-privacy", patterns: [/gizlilik politika/, /veri gizliligi/] },
  { id: "legal-cookie", patterns: [/cerez politika/, /cookie policy/, /cerez tercih/] },
  { id: "legal-distance-sales", patterns: [/mesafeli satis/, /satis sozlesmesi/] },
  { id: "legal-preinformation", patterns: [/on bilgilendirme/, /onbilgilendirme/] },
  { id: "legal-terms", patterns: [/kullanim kosullari/, /site kosullari/] },
  { id: "delivery-policy", patterns: [/teslimat.*iade/, /iade.*teslimat/, /iade kosullari/, /iptal.*iade/, /degisim kosullari/] },
  { id: "warranty", patterns: [/garanti/, /teknik servis/, /servis talebi/] },
  { id: "general-faq", patterns: [/sik sorulan/, /\bsss\b/, /yardim konulari/] },
  { id: "wholesale-guidance", patterns: [/toptan satis/, /kurumsal satis/, /bayilik/] },
  { id: "about-guidance", patterns: [/hakkimizda/, /firmanizi tani/, /zk home kim/] },
  { id: "brands-guidance", patterns: [/hangi marka/, /markalariniz/, /marka secenekleri/] },
  { id: "blog-guidance", patterns: [/urun rehber/, /kullanim rehber/, /blog/, /makale/] },
  { id: "order-tracking-page", patterns: [/siparis takip sayfasi/, /siparis takip formu/, /siparisi sorgula/] },
]

export function findSitePageGuide(settings: ChatbotSettings, message: string) {
  const normalized = correctLikelyTypos(normalizeChatbotText(message))
  const rule = SITE_PAGE_GUIDES.find((item) => item.patterns.some((pattern) => pattern.test(normalized)))
  if (!rule) return null
  return settings.questions.find((question) => question.id === rule.id && question.active) || null
}

export function getConversationalReply(message: string) {
  const normalized = correctLikelyTypos(normalizeChatbotText(message))
  if (/^(merhaba|selam|selamlar|gunaydin|iyi gunler|iyi aksamlar|hey)( nasilsin)?$/.test(normalized)) {
    return "Merhaba, hoş geldiniz! Size nasıl yardımcı olabilirim?"
  }
  if (/^(tesekkur|tesekkurler|sag ol|sagol|cok tesekkur ederim)$/.test(normalized)) {
    return "Rica ederim, yardımcı olabildiysem ne mutlu. Başka bir ürün ya da sipariş konusunda aklınıza takılan bir şey olursa buradayım."
  }
  if (/^(nasilsin|ne haber|nabersin)$/.test(normalized)) {
    return "Teşekkür ederim, size yardımcı olmaya hazırım. Bugün ürün seçimiyle mi, yoksa mevcut bir siparişinizle mi ilgileniyoruz?"
  }
  if (/^(sorun ne|ne sorun var|problem ne)$/.test(normalized)) {
    return "Benim tarafımda bir sorun yok 🙂 Size yanlış veya ilgisiz bir yanıt verdiysem sorunuzu yeniden yazabilirsiniz; ürün, sipariş ya da site kullanımı konusunda hemen yardımcı olayım."
  }
  if (/^(naber|napiyon)$/.test(normalized)) {
    return "İyidir 🙂 ZK Home ürünleriyle ilgili neye bakıyoruz?"
  }
  if (/^(tamam|ok|okay|anladim|olur)$/.test(normalized)) {
    return "Tamamdır. İsterseniz başka bir ürün veya sipariş konusunda da yardımcı olabilirim."
  }
  if (/^(gorusuruz|hosca kal|bay bay|bye)$/.test(normalized)) {
    return "Görüşmek üzere, iyi günler dilerim. İhtiyacınız olduğunda buradayım."
  }
  return null
}
