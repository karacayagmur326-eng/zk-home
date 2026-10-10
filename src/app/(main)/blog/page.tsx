import { contentPageMetadata, contentPageSeo } from "@lib/seo/content-page"
import { Metadata } from "next"
import Image from "@components/common/SmartImage"
import Link from "next/link"
import { ArrowRight, Mail, BookOpen } from "lucide-react"
import { query } from "@lib/admin/db"
import { AppIcon } from "@lib/icons"
import { defaultBlogPageContent } from "@lib/content/knowledge-pages"
import PageHero from "../../../components/common/PageHero"
import { getBaseURL } from "@lib/util/env"

export const dynamic = "force-dynamic"

export async function generateMetadata() { return contentPageMetadata("blog", "Blog ve Rehber Makaleleri", "Ürün kullanım rehberleri, ürün seçimi ipuçları, bakım önerileri ve faydalı makaleler. Doğru bilgiyle en iyi performansı elde edin.") }

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; q?: string }>
}) {
  const { kategori, q } = await searchParams

  // Fetch page settings (Hero, Titles, Banner, Newsletter)
  const pageContent: Record<string, any> = await query<{ content: Record<string, any> }>(
    "SELECT content FROM content_pages WHERE handle = 'blog' LIMIT 1"
  )
    .then((rows) => ({ ...defaultBlogPageContent, ...(rows[0]?.content || {}) }))
    .catch(() => defaultBlogPageContent as Record<string, any>)

  // Fetch categories with live post counts
  const categories = await query<any>(`
    SELECT c.*, count(p.id) as post_count
    FROM blog_categories c
    LEFT JOIN blog_posts p ON c.id = p.category_id AND p.status = 'published'
    GROUP BY c.id
    ORDER BY c.sort_order ASC, c.name ASC
  `).catch(() => [])

  // Fetch articles with filters
  let whereConditions = ["p.status = 'published'"]
  let params: any[] = []
  let pIdx = 1

  if (kategori) {
    whereConditions.push(`(c.slug = $${pIdx} OR c.id = $${pIdx})`)
    params.push(kategori)
    pIdx++
  }

  if (q) {
    whereConditions.push(`(p.title ILIKE $${pIdx} OR p.excerpt ILIKE $${pIdx} OR p.content ILIKE $${pIdx})`)
    params.push(`%${q}%`)
    pIdx++
  }

  const listQuery = `
    SELECT 
      p.id,
      p.title,
      p.slug,
      p.category_id,
      c.name as category_name,
      c.slug as category_slug,
      p.excerpt,
      p.image,
      p.author,
      p.reading_time,
      p.published_at,
      p.featured
    FROM blog_posts p
    LEFT JOIN blog_categories c ON p.category_id = c.id
    WHERE ${whereConditions.join(" AND ")}
    ORDER BY p.featured DESC, p.published_at DESC, p.created_at DESC
  `
  const articles = await query<any>(listQuery, params).catch(() => [])

  const selectedCatObj = categories.find((c: any) => c.slug === kategori || c.id === kategori)

  return (
    <main className="min-h-screen bg-[#fbfcfd] pb-16">
      {/* 1. Hero Alanı (Admin'den Yönetilen Başlık, Açıklama ve Görsel) */}
      <PageHero seoHandle="blog"
        breadcrumb={[{ title: pageContent.title || "Ürün Rehberi & Blog" }]}
        title={pageContent.title || "Ürün Rehberi ve Makaleler"}
        paragraphs={[pageContent.hero_text || pageContent.description || "Profesyonel işlerinizde size yardımcı olacak ipuçları, kullanım rehberleri ve sektörel içerikler."]}
        heroImage={pageContent.hero_image || "/brand/placeholder.svg"}
        heroImageAlt={pageContent.title || "Blog & Rehber"}
      />

      <div className="content-container space-y-8 py-8 sm:py-10">
        
        {/* 2. Kategorilere Göre Keşfedin Alanı */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900">
              {pageContent.categories_title || "Kategorilere Göre Keşfedin"}
            </h2>
            {kategori && (
              <Link href="/blog" className="text-xs font-bold text-[#C98484] hover:underline">
                Tümünü Göster ✕
              </Link>
            )}
          </div>

          <div className="flex sm:grid sm:grid-cols-4 lg:grid-cols-8 gap-2.5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-none">
            {categories.map((category: any) => {
              const isSelected = category.slug === kategori || category.id === kategori
              return (
                <Link
                  key={category.id}
                  href={isSelected ? "/blog" : `/blog?kategori=${category.slug}`}
                  className={`shrink-0 min-w-[110px] sm:min-w-0 flex flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition-all ${
                    isSelected
                      ? "border-[#C98484] bg-rose-50/90 text-[#C98484] font-black shadow-xs ring-2 ring-[#C98484]/20"
                      : "border-slate-100 bg-slate-50/50 hover:border-rose-200 hover:bg-rose-50 text-slate-700 font-bold"
                  }`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${isSelected ? "bg-rose-100/80 text-[#C98484]" : "bg-white text-[#C98484] shadow-2xs"}`}>
                    <AppIcon name={category.icon || "file-text"} className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] leading-tight line-clamp-2">{category.name}</span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* 3. Öne Çıkan İçerikler & Makale Listesi */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">
              {selectedCatObj ? `${selectedCatObj.name} Makaleleri` : (pageContent.featured_title || "Öne Çıkan İçerikler")}
            </h2>
            <span className="text-xs font-bold text-[#C98484]">{articles.length} makale</span>
          </div>

          {articles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700">Bu kategoride henüz makale bulunmuyor.</p>
              <Link href="/blog" className="text-xs text-[#C98484] font-bold hover:underline block">
                Tüm makaleleri görüntüleyin →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {articles.map((article: any) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  category={article.category_name || "Rehber"}
                />
              ))}
            </div>
          )}
        </section>

        {/* 4. Popüler Konular & Alt Banner (Admin'den Yönetilen) */}
        <section className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-black text-slate-900">
              {pageContent.popular_title || "Popüler Konular"}
            </h2>
            <div className="mt-3 divide-y divide-slate-100">
              {categories.slice(0, 6).map((category: any) => (
                <Link
                  key={category.id}
                  href={`/blog?kategori=${category.slug}`}
                  className="flex items-center justify-between py-2.5 text-xs font-semibold text-slate-600 hover:text-[#C98484] transition"
                >
                  <span>{category.name}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>

          {/* Alt Banner */}
          <div className="relative min-h-52 overflow-hidden rounded-2xl bg-slate-950 p-7 text-white shadow-xs">
            <Image
              src={pageContent.banner_image || "/brand/placeholder.svg"}
              alt={pageContent.banner_title || "Profesyonel kullanım rehberleri"}
              fill
              className="object-cover opacity-50"
            />
            <div className="relative z-10 max-w-md">
              <h2 className="text-2xl font-black">
                {pageContent.banner_title || "Doğru Bilgi, Güvenli İş"}
              </h2>
              <p className="mt-3 text-xs leading-6 text-white/75">
                {pageContent.banner_description || "Ürünlerinizden en iyi performansı almanız için hazırladığımız rehberler ve ipuçlarıyla işinizi kolaylaştırıyoruz."}
              </p>
              <Link
                href={pageContent.banner_button_href || "/blog"}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#C98484] px-4 py-3 text-xs font-extrabold hover:bg-[#A95E5E] transition"
              >
                {pageContent.banner_button_text || "Tüm Rehberlere Göz Atın"} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* 5. E-Bülten Alanı (Admin'den Yönetilen) */}
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
          <span className="rounded-full bg-[#C98484] p-4 text-white">
            <Mail className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h2 className="text-base font-black text-slate-900">
              {pageContent.newsletter_title || "Yeni İçeriklerden Haberdar Olun"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {pageContent.newsletter_description || "İpuçları, rehberler ve kampanyalardan ilk siz haberdar olun."}
            </p>
          </div>
          <form action="/api/newsletter" method="post" className="flex w-full flex-wrap gap-2 sm:w-auto sm:max-w-md">
            <input
              required
              type="email"
              name="email"
              placeholder="E-posta adresinizi girin"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-xs outline-none focus:border-[#C98484] sm:w-64"
            />
            <button className="rounded-xl bg-[#C98484] px-5 py-3 text-xs font-extrabold text-white hover:bg-[#A95E5E] transition cursor-pointer">
              Abone Ol
            </button>
            <label className="flex w-full items-start gap-2 text-[11px] text-slate-500"><input type="checkbox" name="consent" required className="mt-0.5 accent-[#C98484]" />Kampanya ve yenilikler için e-posta almak istiyorum.</label>
          </form>
        </section>

      </div>
    </main>
  )
}

function ArticleCard({ article, category }: { article: any; category: string }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between">
      <div>
        <Link href={`/blog/${article.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
          {article.image ? (
            <Image
              src={article.image}
              alt={article.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <BookOpen className="w-8 h-8" />
            </div>
          )}
          <span className="absolute bottom-2 left-2 rounded-md bg-[#C98484] px-2 py-1 text-[9px] font-black uppercase text-white shadow-xs">
            {category}
          </span>
        </Link>

        <div className="p-4">
          <Link href={`/blog/${article.slug}`}>
            <h3 className="line-clamp-2 text-sm font-black leading-5 text-slate-900 group-hover:text-[#C98484] transition">
              {article.title}
            </h3>
          </Link>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
            {article.excerpt}
          </p>
        </div>
      </div>

      <div className="px-4 pb-4 pt-1 flex items-center justify-between text-[10px] font-semibold text-slate-400 border-t border-slate-50">
        <time>
          {article.published_at
            ? new Intl.DateTimeFormat("tr-TR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(new Date(article.published_at))
            : ""}
        </time>
        <span>{article.reading_time || "5 dk"}</span>
      </div>
    </article>
  )
}
