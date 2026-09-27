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

// ZK Home starts with an empty knowledge base. Categories and answers are
// created from the admin panel after the new catalogue and policies are ready.
export const faqCategories: ExtendedFaqCategory[] = []
export const all500Faqs: ExtendedFaqItem[] = []
