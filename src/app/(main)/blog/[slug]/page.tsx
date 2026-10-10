import { ensureBlogSeoSchema } from "@lib/seo/blog"
import { entityMetadata } from "@lib/seo/entity"
import { indexingEnabled } from "@lib/seo/indexing"
import { Metadata } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import Image from "@components/common/SmartImage"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  User,
  BookOpen,
  Tag
} from "lucide-react"
import { query } from "@lib/admin/db"
import { getBaseURL } from "@lib/util/env"
import PageHero from "../../../../components/common/PageHero"
import { getThemeSettings } from "@lib/content/theme-settings"
import { renderSeoTemplate } from "@lib/seo/templates"
import { sanitizePublicHtml, serializeJsonLd } from "@lib/security/html"

export const dynamic = "force-dynamic"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await ensureBlogSeoSchema()
  const { slug } = await params
  const [rows, settings] = await Promise.all([
    query<any>(
      "SELECT slug, title, excerpt, image, seo_title, seo_description, seo_metadata, published_at FROM blog_posts WHERE (slug = $1 OR seo_metadata->'slug_history' ? $1) AND status = 'published' LIMIT 1",
      [slug]
    ),
    getThemeSettings().catch(() => null),
  ])

  if (rows.length === 0) {
    return { title: "Makale Bulunamadı" }
  }

  const post = rows[0]
  if (post.slug !== slug) permanentRedirect(`/blog/${post.slug}`)
  const siteName = settings?.logo_text || "Mağaza"
  const separator = settings?.seo_title_separator || "|"

  const tokens = {
    yazi_basligi: post.title,
    blog_title: post.title,
    yazi_ozeti: post.excerpt || "",
    ozet: post.excerpt || "",
    site_adi: siteName,
    ayirici: separator,
  }

  const titleTemplate =
    settings?.seo_blog_title_template || "%yazi_basligi% %ayirici% %site_adi%"
  const descTemplate = settings?.seo_blog_desc_template || "%yazi_ozeti%"

  const title = post.seo_metadata?.seo_title || post.seo_title || renderSeoTemplate(titleTemplate, tokens)
  const description =
    post.seo_metadata?.seo_description || post.seo_description ||
    renderSeoTemplate(descTemplate, tokens) ||
    post.excerpt ||
    "Kapsamlı ürün kullanım ve seçim rehberi."
  const url = `${getBaseURL()}/blog/${slug}`

  const metadata = entityMetadata({ title, description, path: `/blog/${slug}`, metadata: post.seo_metadata || {}, image: post.image, index: indexingEnabled(settings) })
  return { ...metadata, openGraph: { ...metadata.openGraph, type: "article", publishedTime: post.published_at } }

}

export default async function ArticlePage({ params }: Props) {
  await ensureBlogSeoSchema()
  const { slug } = await params

  const rows = await query<any>(`
    SELECT 
      p.*,
      c.name as category_name,
      c.slug as category_slug
    FROM blog_posts p
    LEFT JOIN blog_categories c ON p.category_id = c.id
    WHERE (p.slug = $1 OR p.seo_metadata->'slug_history' ? $1) AND p.status = 'published'
    LIMIT 1
  `, [slug])

  if (rows.length === 0) {
    notFound()
  }

  const theme = await getThemeSettings()
  const configuredLogo = String(theme?.header_logo_url || "")
  const publisherLogo = configuredLogo ? (/^https?:\/\//.test(configuredLogo) ? configuredLogo : `${getBaseURL()}${configuredLogo}`) : undefined
  const article = rows[0]

  // Increment view count asynchronously
  query("UPDATE blog_posts SET views = views + 1 WHERE id = $1", [article.id]).catch(() => null)

  // Fetch related articles
  const relatedArticles = await query<any>(`
    SELECT id, title, slug, image, excerpt, published_at, reading_time
    FROM blog_posts
    WHERE status = 'published' AND id != $1
    ORDER BY (category_id = $2) DESC, published_at DESC
    LIMIT 4
  `, [article.id, article.category_id || '']).catch(() => [])

  // Dynamic Content Formatter: Guarantees exact SSS Accordion layout across all 64 articles
  let formattedContent = article.content || ""
  
  // Convert any remaining raw FAQ boxes to <details open class="faq-accordion">
  formattedContent = formattedContent.replace(
    /<div class="(?:faq-box|my-4 p-4 rounded-xl bg-slate-50[^"]*|[^"]*bg-slate-50[^"]*)">\s*<h3[^>]*>(?:<span[^>]*>[^<]*<\/span>\s*)?([^<]+)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/gi,
    (match: string, q: string, a: string) => {
      const cleanQ = q.replace(/^[?❓\s]+/, "").trim()
      const cleanA = a.trim()
      return `
<details open class="faq-accordion">
  <summary>${cleanQ}</summary>
  <div class="faq-body">
    <p>${cleanA}</p>
    <div class="faq-footer">
      <span class="faq-footer-guarantee">Orijinal Ürün & Hizmet Güvencesi</span>
      <a href="/magaza" class="faq-footer-link">Tüm Ürünleri İnceleyin →</a>
    </div>
  </div>
</details>`
    }
  )
  formattedContent = sanitizePublicHtml(formattedContent)

  // JSON-LD Schema.org Article
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.excerpt,
    "image": article.image || `${getBaseURL()}/brand/placeholder.svg`,
    "author": {
      "@type": "Person",
      "name": article.author || "Editör"
    },
    "publisher": {
      "@type": "Organization",
      "name": theme?.logo_text || "Mağaza",
      "logo": {
        "@type": "ImageObject",
        "url": publisherLogo
      }
    },
    "datePublished": article.published_at,
    "dateModified": article.updated_at || article.published_at,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${getBaseURL()}/blog/${article.slug}`
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfcfd] pb-20 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* ── 1. STANDART HERO VİTRİN ALANI (ÖNE ÇIKAN MAKALE GÖRSELİ, ÜST VE ALT META BİLGİLERİ) ── */}
      <PageHero
        breadcrumb={[
          { title: "Ürün Rehberi ve Makaleler", href: "/blog" },
        ]}
        title={article.title}
        paragraphs={article.excerpt ? [article.excerpt] : []}
        heroImage={article.image || "/brand/placeholder.svg"}
        heroImageAlt={article.title}
        topMeta={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#C98484] transition bg-white/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#C98484]" />
              <span>Tüm Rehberler</span>
            </Link>
            {article.category_name && (
              <Link
                href={`/blog?kategori=${article.category_slug || article.category_id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100/90 text-[#C98484] font-extrabold text-xs hover:bg-rose-200 transition shadow-2xs"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{article.category_name}</span>
              </Link>
            )}
          </div>
        }
        bottomMeta={
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
            {article.published_at && (
              <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                <CalendarDays className="h-4 w-4 text-[#C98484]" />
                {new Intl.DateTimeFormat("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(article.published_at))}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-slate-600">
              <Clock3 className="h-4 w-4 text-slate-400" />
              {article.reading_time || "5 dk okuma"}
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <User className="h-4 w-4 text-slate-400" />
              {article.author || "Editör"}
            </span>
          </div>
        }
      />

      {/* ── 2. SİTE GENİŞLİĞİNDE MAKALE İÇERİK ALANI ── */}
      <div className="content-container py-6 sm:py-8 space-y-8">
        {/* Ana Makale Metni (Tam Site Genişliğinde Ferah Kart) */}
        <article className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-8 lg:p-12 shadow-xs space-y-8 overflow-hidden">
          {/* HTML Article Content (Blog Styled with Standard Bullets & Striking Tables) */}
          <div
            className="blog-content wp-editor-content max-w-none text-base"
            dangerouslySetInnerHTML={{ __html: formattedContent }}
          />

          {/* Footer Call-to-action bar */}
          <div className="pt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900">
                Yayına Hazırlayan: <span className="text-[#C98484]">{article.author || "Editör Ekibi"}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Uzman teknik destek ve editör ekibimiz tarafından titizlikle hazırlanmıştır.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/blog"
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs"
              >
                Diğer Makaleler
              </Link>
              <Link
                href="/magaza"
                className="px-5 py-2.5 bg-[#C98484] hover:bg-[#A95E5E] text-white rounded-xl text-xs font-extrabold transition shadow-sm"
              >
                Tüm Ürünleri İncele →
              </Link>
            </div>
          </div>
        </article>

        {/* 3. İlgili / Diğer Rehberler (4 Kolonlu Grid) */}
        {relatedArticles.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">
                İlginizi Çekebilecek Diğer Rehberler
              </h2>
              <Link href="/blog" className="text-xs font-bold text-[#C98484] hover:underline">
                Tümünü Gör →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedArticles.map((rel: any) => (
                <article
                  key={rel.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <Link href={`/blog/${rel.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
                      {rel.image ? (
                        <Image
                          src={rel.image}
                          alt={rel.title}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <BookOpen className="w-8 h-8" />
                        </div>
                      )}
                    </Link>

                    <div className="p-4">
                      <Link href={`/blog/${rel.slug}`}>
                        <h3 className="line-clamp-2 text-xs font-black leading-5 text-slate-900 group-hover:text-[#C98484] transition">
                          {rel.title}
                        </h3>
                      </Link>
                      <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-slate-500">
                        {rel.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-4 pb-3.5 pt-1 flex items-center justify-between text-[10px] font-semibold text-slate-400 border-t border-slate-50">
                    <time>
                      {rel.published_at
                        ? new Intl.DateTimeFormat("tr-TR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(rel.published_at))
                        : ""}
                    </time>
                    <span>{rel.reading_time || "5 dk"}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  )
}
