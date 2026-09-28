import faqSeed from "./faq-data.json"

export type ExtendedFaqItem = {
  id: string
  category_id: string
  question: string
  answer: string
  linkUrl?: string
  linkText?: string
  sort_order: number
  active: boolean
}

export type ExtendedFaqCategory = {
  id: string
  title: string
  icon: string
  sort_order: number
}

export const faqCategories: ExtendedFaqCategory[] = faqSeed.categories.map((category, index) => ({
  id: category.id,
  title: category.title,
  icon: category.icon,
  sort_order: index + 1,
}))

export const all500Faqs: ExtendedFaqItem[] = faqSeed.categories.flatMap((category) =>
  category.questions.map(([question, answer], index) => ({
    id: `${category.id}-${String(index + 1).padStart(2, "0")}`,
    category_id: category.id,
    question,
    answer,
    linkUrl: category.linkUrl,
    linkText: category.linkText,
    sort_order: 0,
    active: true,
  }))
).map((item, index) => ({ ...item, sort_order: index + 1 }))
