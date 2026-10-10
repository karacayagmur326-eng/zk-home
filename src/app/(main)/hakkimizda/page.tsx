import { contentPageMetadata, contentPageSeo } from "@lib/seo/content-page"
import { getThemeSettings } from "@lib/content/theme-settings"
import { query } from "@lib/admin/db"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "@components/common/SmartImage"
import PageHero from "../../../components/common/PageHero"
import { Target, Eye, ArrowRight } from "lucide-react"
import { getBaseURL } from "@lib/util/env"
import { serializeJsonLd } from "@lib/security/html"

export async function generateMetadata() { return contentPageMetadata("hakkimizda", "Hakkımızda", "Geniş ürün yelpazesi, kaliteli markalar ve müşteri odaklı hizmet anlayışımızla e-ticarette güvenilir çözüm ortağınız. Misyonumuz, vizyonumuz ve kurumsal yapımız hakkında bilgi edinin.") }
export const dynamic = "force-dynamic"

const defaultAboutData = {
  title: "Hakkımızda",
  subtitle: "Evinize özenle seçilmiş parçalar.",
  heroP1: "Ürünlerimizi ve hizmetlerimizi burada tanıyabilirsiniz.",
  heroP2: "Amacımız; doğru ürünü güvenilir hizmetle sizlere sunmaktır.",
  heroCtaText: "Kurumsal Hediyeler",
  heroCtaHref: "/toptan-ve-kurumsal-satis",
  heroImage: "/brand/placeholder.svg",

  whyTitle: "Neden Bizi Seçmelisiniz?",
  whyItems: [
    { title: "Geniş Ürün Seçeneği", desc: "Farklı kullanım alanlarına ve bütçelere uygun kaliteli ürünleri tek çatı altında sunuyoruz." },
    { title: "Özenli Seçki", desc: "Yaşam alanlarınıza uyum sağlayan ürünleri bir araya getiriyoruz." },
    { title: "Kolay Sipariş", desc: "Ürünleri çevrimiçi inceleyip siparişinizi kolayca oluşturabilirsiniz." },
    { title: "Sipariş Desteği", desc: "Teslimat ve iade süreçlerine ilişkin sorularınızda yanınızdayız." },
    { title: "Güvenli Alışveriş", desc: "Ödeme ve sipariş süreçlerinde güvenli altyapılar kullanarak müşteri bilgilerinin korunmasına önem veriyoruz." }
  ],

  missionTitle: "Misyonumuz",
  missionDesc: "Kaliteli ürünleri güvenilir, ulaşılabilir ve kullanıcı odaklı bir alışveriş deneyimiyle müşterilerimize sunmak.",
  visionTitle: "Vizyonumuz",
  visionDesc: "Her evin kendine özgü hikâyesine eşlik eden, güven veren ve ilham veren bir alışveriş deneyimi sunmak.",

  stats: [
    { value: "Özenli", label: "Ürün Seçkisi" },
    { value: "Güvenli", label: "Ödeme" },
    { value: "Kolay", label: "Sipariş" },
    { value: "Destek", label: "İletişim" }
  ],

  aboutDetailImage: "/brand/placeholder.svg",
  aboutDetailTitle: "Hakkımızda",
  aboutDetailP1: "Evde kendinizi iyi hissettiren ayrıntıların önemli olduğuna inanıyoruz.",
  aboutDetailP2: "Dekorasyon ve yaşam ürünlerini farklı zevklere hitap eden bir seçkide buluşturuyoruz.",
  aboutDetailP3: "Siparişinizle ilgili sorularınız için bize her zaman yazabilirsiniz.",
  aboutDetailCtaText: "İletişime Geçin",
  aboutDetailCtaHref: "/iletisim"
}

type AboutPageProps = {
  searchParams?: Promise<{ render?: string }>
}

export default async function AboutPage({ searchParams }: AboutPageProps) {
  const skipRedirect = (await searchParams)?.render === "custom-slug"
  let row: any = null
  try {
    const rows = await query<{ content: any }>(
      "SELECT content FROM content_pages WHERE handle = $1",
      ["hakkimizda"],
    )
    row = rows?.[0]?.content
  } catch (e) {
    row = null
  }

  if (!skipRedirect && row?.custom_slug && row.custom_slug !== "hakkimizda") {
    redirect(`/${row.custom_slug}`)
  }

  let contentData = { ...defaultAboutData }

  if (row) {
    let parsed: any = row
    if (typeof row === "string") {
      try {
        parsed = JSON.parse(row)
      } catch (e) {
        parsed = {}
      }
    }
    if (parsed && typeof parsed === "object") {
      contentData = {
        ...defaultAboutData,
        ...parsed,

      }
    }
  }

  const heroParagraphs = [contentData.heroP1, contentData.heroP2]

  const theme = await getThemeSettings()
  const siteName = theme?.logo_text || "Mağaza"
  const configuredLogo = String(theme?.header_logo_url || "")
  const organizationLogo = configuredLogo ? (/^https?:\/\//.test(configuredLogo) ? configuredLogo : `${getBaseURL()}${configuredLogo}`) : undefined
  const baseUrl = getBaseURL()
  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `${contentData.title} | ${siteName}`,
    url: `${baseUrl}/hakkimizda`,
    description: contentData.subtitle,
    mainEntity: {
      "@type": "Organization",
      name: siteName,
      url: baseUrl,
      logo: organizationLogo,
    },
  }

  return (
    <main className="bg-white min-h-screen pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(aboutJsonLd) }}
      />
      {/* 1. Reusable Hero Section */}
      <PageHero seoHandle="hakkimizda"
        breadcrumb={[{ title: "Hakkımızda" }]}
        title={contentData.title}
        subtitle={contentData.subtitle}
        paragraphs={heroParagraphs}
        ctaText={contentData.heroCtaText}
        ctaHref={contentData.heroCtaHref}
        heroImage={!contentData.heroImage || contentData.heroImage === "/brand/placeholder.svg" ? "/brand/placeholder.svg" : contentData.heroImage}
        heroImageAlt={contentData.title || "Hakkımızda"}
      />

      {/* 2. "Neden Biz?" (5 Columns Grid) */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="content-container">
          <h2 className="text-2xl sm:text-3xl font-black text-center text-slate-900 mb-12 tracking-tight">
            {contentData.whyTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6 relative">
            {contentData.whyItems.map((item, idx) => (
              <div
                key={idx}
                className="group flex flex-col space-y-3 relative lg:px-4 first:lg:pl-0 last:lg:pr-0 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 last:border-none transition-all duration-300 transform hover:-translate-y-1"
              >
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Misyonumuz & Vizyonumuz (2 Cards Grid) */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="content-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="group bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-3 transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-xl hover:border-rose-200/60">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 group-hover:bg-[#C98484] transition-colors duration-300">
                <Target className="w-6 h-6 text-[#C98484] group-hover:text-white transition-colors duration-300 group-hover:scale-110 transform transition-transform" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors">
                {contentData.missionTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md font-normal">
                {contentData.missionDesc}
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-3 transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-xl hover:border-rose-200/60">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100 group-hover:bg-[#C98484] transition-colors duration-300">
                <Eye className="w-6 h-6 text-[#C98484] group-hover:text-white transition-colors duration-300 group-hover:scale-110 transform transition-transform" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors">
                {contentData.visionTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md font-normal">
                {contentData.visionDesc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Stat Counter Bar */}
      <section className="py-12 bg-white">
        <div className="content-container">
          <div className="bg-[#111214] text-white rounded-2xl py-8 px-6 sm:px-10 shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
              {contentData.stats.map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center pt-4 md:pt-0 first:pt-0">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#C98484] tracking-tight mb-1">
                    {stat.value}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-300">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. "Mağaza Hakkında" Section */}
      <section className="py-16 bg-white">
        <div className="content-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 flex justify-center">
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-slate-100 bg-slate-50">
                <Image
                  src={contentData.aboutDetailImage}
                  alt={contentData.aboutDetailTitle}
                  fill
                  className="object-cover object-center"
                />
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-3">
                  {contentData.aboutDetailTitle}
                </h2>
                <div className="w-12 h-1 bg-[#C98484] rounded-full" />
              </div>

              <div className="space-y-4 text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                {[contentData.aboutDetailP1, contentData.aboutDetailP2, contentData.aboutDetailP3].map((p: string, idx: number) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {contentData.aboutDetailCtaText && (
                <div className="pt-2">
                  <Link
                    href={contentData.aboutDetailCtaHref}
                    className="inline-flex items-center gap-2 border border-slate-300 hover:border-slate-800 text-slate-900 font-bold text-sm px-6 py-3 rounded-full hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                  >
                    <span>{contentData.aboutDetailCtaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
