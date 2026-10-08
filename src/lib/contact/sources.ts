export const CONTACT_SOURCES = {
  contact: { label: "İletişim Formu", badge: "bg-sky-50 text-sky-800 border-sky-200" },
  gifts: { label: "Hediye Talebi", badge: "bg-rose-50 text-rose-800 border-rose-200" },
  questions: { label: "Soru & Cevap", badge: "bg-violet-50 text-violet-800 border-violet-200" },
  reviews: { label: "Ürün Yorumu", badge: "bg-amber-50 text-amber-800 border-amber-200" },
} as const

export type ContactSource = keyof typeof CONTACT_SOURCES

export function contactSource(message: { source_kind?: string; product_question_id?: unknown; product_review_id?: unknown; subject?: string }): ContactSource {
  if (message.product_question_id) return "questions"
  if (message.product_review_id) return "reviews"
  if (message.source_kind === "gifts" || message.subject === "Kurumsal hediye talebi") return "gifts"
  return "contact"
}
