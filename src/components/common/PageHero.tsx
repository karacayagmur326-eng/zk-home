import { contentPageSeo } from "@lib/seo/content-page"
import Link from "next/link"
import Image from "@components/common/SmartImage"
import { Home, ArrowRight, ChevronRight } from "lucide-react"
import { sanitizePublicHtml } from "@lib/security/html"

export interface PageHeroProps {
  seoHandle?: string
  breadcrumb?: Array<{ title: string; href?: string }>
  title?: string
  subtitle?: string
  paragraphs?: string[]
  htmlContent?: string
  topMeta?: React.ReactNode
  bottomMeta?: React.ReactNode
  ctaText?: string
  ctaHref?: string
  secondaryCtaText?: string
  secondaryCtaHref?: string
  heroImage?: string
  heroImageAlt?: string
}

export default async function PageHero({
  seoHandle,
  breadcrumb = [],
  title,
  subtitle,
  paragraphs = [],
  htmlContent,
  topMeta,
  bottomMeta,
  ctaText,
  ctaHref = "/iletisim",
  secondaryCtaText,
  secondaryCtaHref,
  heroImage,
  heroImageAlt = "Mağaza Hero",
}: PageHeroProps) {
  if (seoHandle) { const seo = await contentPageSeo(seoHandle); title = seo.h1_title || title; heroImageAlt = seo.image_alt || heroImageAlt }
  // If paragraphs or htmlContent contains HTML tags, render rich HTML
  const hasRawHtml = htmlContent || (paragraphs.length > 0 && /<[a-z][\s\S]*>/i.test(paragraphs.join("")))
  const sourceHtml = htmlContent || paragraphs.join("\n")
  const richHeading = sourceHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)
  const heading = title || richHeading?.[1]?.replace(/<[^>]*>/g, "").trim() || breadcrumb.at(-1)?.title
  const rawHtmlText = sanitizePublicHtml(sourceHtml.replace(/<h1(\b[^>]*)>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>"))

  return (
    <section className="w-full bg-[#f8fafc] border-b border-slate-200/60 py-0 my-0">
      {/* Hero genişliği üst menüyle aynı; ortak site konteynırını kullanır. */}
      <div className="content-container">
        {/* 1. Kenarları Oval Olmayan Düz Dikdörtgen Konteynır (rounded-none) */}
        <div className="relative w-full rounded-none overflow-hidden min-h-[360px] sm:min-h-[400px] flex items-center bg-[#f8fafc]">
          
          {/* 2. Hero Görseli (Kategori Hero Banneri ile Birebir Aynı Çapraz Kesim & Kaplama) */}
          {heroImage ? (
            <div className="absolute right-0 top-0 bottom-0 w-full sm:w-2/3 lg:w-1/2 h-full z-0 overflow-hidden lg:[clip-path:polygon(14%_0,100%_0,100%_100%,0_100%)]">
              <Image
                src={heroImage}
                alt={heroImageAlt || title || "Hero"}
                fill
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 67vw, 50vw"
                quality={75}
                priority
                className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700 ease-out"
              />
              {/* Sol tarafta metnin okunabilirliği için mobilde yumuşak gradyan koruyucu */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#f8fafc] via-[#f8fafc]/70 to-transparent lg:hidden" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-[#f8fafc] z-0" />
          )}

          {/* 3. İçerik Metin Alanı */}
          <div className="relative z-10 py-6 pr-6 sm:py-10 sm:pr-10 lg:py-12 lg:pr-12 w-full max-w-2xl lg:max-w-3xl">
            {/* 1. Üst Meta Alanı (Örn: Geri Dönüş Linki & Kategori Rozeti) */}
            {topMeta && (
              <div className="mb-3.5 flex flex-wrap items-center gap-3">
                {topMeta}
              </div>
            )}

            {/* Breadcrumb Navigation */}
            <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-semibold text-slate-500 mb-4">
              <Link href="/" className="flex items-center gap-1 hover:text-[#C98484] transition-colors whitespace-nowrap shrink-0">
                <Home className="w-3.5 h-3.5 text-slate-400" />
                <span>Ana Sayfa</span>
              </Link>
              {breadcrumb.map((item, idx) => {
                const isLast = idx === breadcrumb.length - 1 && (!title || breadcrumb.some(b => b.title === title))
                return (
                  <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    {item.href && !isLast ? (
                      <Link href={item.href} className="hover:text-[#C98484] transition-colors whitespace-nowrap">
                        {item.title}
                      </Link>
                    ) : (
                      <span className="text-slate-800 font-bold max-w-[200px] sm:max-w-[340px] truncate block" title={item.title}>
                        {item.title}
                      </span>
                    )}
                  </div>
                )
              })}
              {title && !breadcrumb.some((b) => b.title === title) && (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className="text-slate-800 font-bold max-w-[200px] sm:max-w-[340px] truncate block" title={title}>
                    {title}
                  </span>
                </div>
              )}
            </nav>

            {/* Metin ve Başlık İçeriği */}
            <div className="space-y-3">
              {hasRawHtml ? (
                <>
                {heading && <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">{heading}</h1>}
                <div
                  className="[&>h1]:text-3xl [&>h1]:sm:text-4xl [&>h1]:font-black [&>h1]:text-slate-900 [&>h1]:tracking-tight [&>h1]:leading-tight [&>h1]:mb-3 [&>h1]:after:content-[''] [&>h1]:after:block [&>h1]:after:w-12 [&>h1]:after:h-1 [&>h1]:after:bg-[#C98484] [&>h1]:after:rounded-full [&>h1]:after:mt-3 [&>h1]:after:mb-4 [&>h2]:text-xs [&>h2]:sm:text-sm [&>h2]:font-extrabold [&>h2]:text-[#C98484] [&>h2]:uppercase [&>h2]:tracking-wider [&>h2]:mb-2 [&>h3]:text-[0.9rem] [&>h3]:leading-[1.25rem] [&>h3]:font-bold [&>h3]:text-slate-900 [&>h3]:tracking-tight [&>h3]:mb-2 [&>p]:text-[0.8rem] [&>p]:text-slate-600 [&>p]:leading-relaxed [&>p]:font-normal [&>p]:mb-3 [&>b]:font-black [&>strong]:font-black"
                  dangerouslySetInnerHTML={{ __html: rawHtmlText }}
                />
                </>
              ) : (
                <>
                  {subtitle && (
                    <h2 className="text-xs sm:text-sm font-extrabold text-[#C98484] uppercase tracking-wider mb-2">
                      {subtitle}
                    </h2>
                  )}

                  {title && (
                    <>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2">
                        {title}
                      </h1>
                      {/* Küçük Turuncu Çizgi Vurgusu */}
                      <div className="w-12 h-1 bg-[#C98484] rounded-full mt-2 mb-3" />
                    </>
                  )}

                  {paragraphs && paragraphs.length > 0 && (
                    <div className="space-y-3 text-slate-600 text-xs sm:text-[13px] leading-relaxed font-normal">
                      {paragraphs.map((p, idx) => (
                        <p key={idx}>{p}</p>
                      ))}
                    </div>
                  )}

                  {/* Alt Meta Alanı (Tarih, Okuma Süresi, Yazar) */}
                  {bottomMeta && (
                    <div className="pt-2 border-t border-slate-200/60 mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                      {bottomMeta}
                    </div>
                  )}
                </>
              )}

              {(ctaText || secondaryCtaText) && (
                <div className="pt-3 flex flex-wrap items-center gap-3">
                  {ctaText && (
                    <Link
                      href={ctaHref}
                      className="inline-flex items-center gap-2 bg-[#C98484] hover:bg-[#d94e00] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                      <span>{ctaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}

                  {secondaryCtaText && (
                    <Link
                      href={secondaryCtaHref || "/iletisim"}
                      className="inline-flex items-center gap-2 bg-white/90 hover:bg-white text-slate-800 border border-slate-200/80 font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs hover:shadow-md transition-all transform hover:-translate-y-0.5"
                    >
                      <span>{secondaryCtaText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
