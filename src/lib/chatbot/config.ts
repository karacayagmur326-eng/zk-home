export type ChatbotQuestion = {
  id: string
  question: string
  answer: string
  keywords: string
  link_url?: string
  link_text?: string
  active: boolean
}

export type ChatbotSettings = {
  enabled: boolean
  ai_enabled: boolean
  ai_provider: "gemini"
  ai_model: string
  ai_tone: string
  catalog_search_enabled: boolean
  page_search_enabled: boolean
  max_product_results: number
  bot_name: string
  welcome_message: string
  input_placeholder: string
  fallback_message: string
  accent_color: string
  questions: ChatbotQuestion[]
}

// Yeni mağaza boş ve güvenli başlar. Katalog, içerikler ve AI sağlayıcısı
// yönetim panelinden yapılandırılmadan ziyaretçiye chatbot gösterilmez.
export const CHATBOT_DEFAULTS: ChatbotSettings = {
  enabled: false,
  ai_enabled: false,
  ai_provider: "gemini",
  ai_model: "gemini-2.5-flash-lite",
  ai_tone: "Açık, kısa, doğrulanabilir ve yardımcı yanıtlar ver. Bilmediğin bilgiyi varsayma.",
  catalog_search_enabled: true,
  page_search_enabled: false,
  max_product_results: 4,
  bot_name: "Yapay Zeka Asistan",
  welcome_message: "Merhaba! Size nasıl yardımcı olabilirim?",
  input_placeholder: "Sorunuzu yazın...",
  fallback_message: "Bu konuda doğrulanmış bir bilgi bulamadım.",
  accent_color: "#C98484",
  questions: [],
}
