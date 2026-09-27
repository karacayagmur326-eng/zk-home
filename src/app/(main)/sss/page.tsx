import { Metadata } from "next"
import { query } from "@lib/admin/db"
import { defaultFaqPageContent } from "@lib/content/knowledge-pages"
import { getCanonicalURL, getBaseURL } from "@lib/util/env"
import PageHero from "../../../components/common/PageHero"
import FaqContent from "./FaqContent"
import { getContactInfo } from "@lib/content/contact-info"
import { serializeJsonLd } from "@lib/security/html"

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular (SSS)",
  description: "Sipariş, kargo, ödeme, garanti, iade ve ürünlerimiz hakkında en çok merak edilen soruların yanıtları.",
  alternates: {
    canonical: getCanonicalURL("/sss"),
  },
}

export default async function FaqPage() {
  const [dbContent, contact] = await Promise.all([
    query<{ content: Record<string, any> }>(
      "SELECT content FROM content_pages WHERE handle = 'sss' LIMIT 1"
    ).then((rows) => rows[0]?.content || {}).catch(() => ({})),
    getContactInfo(),
  ])

  const replaceContactTokens = (value: string) => value
    .replace(/info@zkhome\.com\.tr/gi, contact.email)
    .replace(/0 \(543\) 797 6968/g, contact.phone)

  const content = {
    ...defaultFaqPageContent,
    ...dbContent,
    faq_categories: defaultFaqPageContent.faq_categories,
    faq_items: defaultFaqPageContent.faq_items.map((item) => ({
      ...item,
      answer: replaceContactTokens(item.answer),
    })),
    support_phone: contact.phone,
    support_email: contact.email,
    support_address: contact.full_address,
  }

  const faqItems = (content.faq_items || []).filter(
    (item: any) => item.active !== false
  )

  // Generate Google FAQPage JSON-LD Schema for Search Engine Rich Snippets
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.slice(0, 100).map((item: any) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${item.answer} ${
          item.linkUrl ? `<a href="${getBaseURL()}${item.linkUrl}">${item.linkText || "İlgili Ürünü İncele"}</a>` : ""
        }`,
      },
    })),
  }

  return (
    <main className="min-h-screen bg-[#fbfcfd] pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
      />
      <PageHero
        breadcrumb={[{ title: content.title || "Sıkça Sorulan Sorular" }]}
        title={content.title || "Sıkça Sorulan Sorular"}
        paragraphs={[content.hero_text || content.description]}
        heroImage={content.hero_image}
        heroImageAlt={content.title}
      />
      <section className="content-container py-8 sm:py-10">
        <FaqContent content={content} />
      </section>
    </main>
  )
}
