import { contentPageMetadata, contentPageSeo } from "@lib/seo/content-page"
import { Metadata } from "next"
import { query } from "@lib/admin/db"
import { defaultFaqPageContent } from "@lib/content/knowledge-pages"
import { getCanonicalURL } from "@lib/util/env"
import PageHero from "../../../components/common/PageHero"
import FaqContent from "./FaqContent"
import { serializeJsonLd } from "@lib/security/html"

export async function generateMetadata() { return contentPageMetadata("sss", "Sıkça Sorulan Sorular (SSS)", "Yemek takımı, kahve fincanı, dekorasyon, nevresim, havlu, kargo ve iade hakkında 100 sık sorulan sorunun yanıtını keşfedin.") }

const removedQuestions = new Set([
  "Porselen ve stoneware yemek takımı arasındaki fark nedir?",
  "Mikrodalgaya uygun yemek takımı nasıl anlaşılır?",
  "Ahşap servis ürünleri nasıl temizlenir?",
  "Mum nasıl güvenli kullanılır?",
  "Havlu gramajı neyi gösterir?",
])

export default async function FaqPage() {
  const dbContent = await query<{ content: Record<string, any> }>(
      "SELECT content FROM content_pages WHERE handle = 'sss' LIMIT 1"
    ).then((rows) => rows[0]?.content || {}).catch((): Record<string, any> => ({}))

  const replaceContactTokens = (value: string) => value
    .replace(/info@zkhome\.com\.tr/gi, "iletişim formu")
    .replace(/0 \(543\) 797 6968/g, "iletişim formu")

  const content = {
    ...defaultFaqPageContent,
    ...dbContent,
    faq_categories: Array.isArray(dbContent.faq_categories) ? dbContent.faq_categories : defaultFaqPageContent.faq_categories,
    faq_items: (Array.isArray(dbContent.faq_items) ? dbContent.faq_items : defaultFaqPageContent.faq_items).filter((item: any) => !removedQuestions.has(String(item.question || ""))).map((item: any) => ({
      ...item,
      answer: replaceContactTokens(String(item.answer || "")),
    })),
  }

  const faqItems = (content.faq_items || []).filter(
    (item: any) => item.active !== false
  )

  // Structured data mirrors the active answers available in the accordion.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.slice(0, 100).map((item: any) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }

  return (
    <main className="min-h-screen bg-[#fbfcfd] pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqSchema) }}
      />
      <PageHero seoHandle="sss"
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
