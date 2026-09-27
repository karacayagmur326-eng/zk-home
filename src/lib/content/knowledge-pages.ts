import { faqCategories, all500Faqs } from "./faq-data"

export type FaqCategory = { id: string; title: string; icon: string; sort_order: number }
export type FaqEntry = {
  id: string
  category_id: string
  question: string
  answer: string
  linkUrl?: string
  linkText?: string
  sort_order: number
  active: boolean
}
export type ArticleCategory = { id: string; title: string; icon: string; sort_order: number }
export type ArticleEntry = {
  id: string
  slug: string
  category_id: string
  title: string
  excerpt: string
  content: string
  image: string
  published_at: string
  reading_time: string
  featured: boolean
  active: boolean
  sort_order: number
}

export const defaultFaqCategories: FaqCategory[] = faqCategories
export const defaultFaqItems: FaqEntry[] = all500Faqs
export const defaultArticleCategories: ArticleCategory[] = []
export const defaultArticles: ArticleEntry[] = []

export const defaultFaqPageContent = {
  title: "Sık Sorulan Sorular",
  description: "Bu alan yönetim panelinden oluşturulacaktır.",
  hero_text: "Sık sorulan sorular yakında burada yer alacak.",
  hero_image: "",
  faq_categories: defaultFaqCategories,
  faq_items: defaultFaqItems,
  support_title: "Destek",
  support_description: "İletişim bilgileri yönetim panelinden eklenecektir.",
  support_phone: "",
  support_email: "",
  support_address: "",
  support_whatsapp: "",
  tracking_title: "Sipariş Takibi",
  tracking_description: "Siparişlerinizi hesabınızdan takip edebilirsiniz.",
  bottom_title: "Yardıma mı ihtiyacınız var?",
  bottom_description: "Destek kanalları yakında eklenecektir.",
}

export const defaultBlogPageContent = {
  title: "İçerikler",
  description: "Bu alan yönetim panelinden oluşturulacaktır.",
  hero_text: "Yeni içerikler yakında burada yer alacak.",
  hero_image: "",
  article_categories: defaultArticleCategories,
  articles: defaultArticles,
  featured_title: "Öne Çıkan İçerikler",
  popular_title: "Popüler Konular",
  banner_title: "ZK Home",
  banner_description: "İçerikler hazırlanıyor.",
  banner_image: "",
  newsletter_title: "Yeni İçeriklerden Haberdar Olun",
  newsletter_description: "E-posta bülteni ayarları yönetim panelinden yapılacaktır.",
}
