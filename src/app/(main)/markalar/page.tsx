import { query } from "@lib/admin/db"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import PageHero from "../../../components/common/PageHero"
import { AppIcon } from "@lib/icons"
import {
  defaultBrandsPageInfo,
  withoutPartnerSection,
} from "@lib/content/brands-defaults"
import {
  Award,
  ShieldCheck,
  Tag,
  Headphones,
  ArrowRight,
  Handshake,
} from "lucide-react"
import { getBaseURL } from "@lib/util/env"

export const metadata: Metadata = {
  title: "Markalarımız",
  description:
    "Kalite ve güvenilirliğini kanıtlamış, alanında lider markaların ürünlerini sizlere sunuyoruz.",
  alternates: {
    canonical: `${getBaseURL()}/markalar`,
  },
}

export const dynamic = "force-dynamic"

interface BrandRow {
  id: string
  title: string
  handle: string
  metadata?: any
}

const defaultBrandDescriptions: Record<string, string> = {}

type BrandsPageProps = {
  searchParams?: Promise<{ render?: string }>
}

export default async function BrandsListingPage({ searchParams }: BrandsPageProps) {
  const skipRedirect = (await searchParams)?.render === "custom-slug"
  const infoRow = await query<{ value: typeof defaultBrandsPageInfo }>(
    `SELECT value FROM store_settings WHERE key = 'brands_page_info' LIMIT 1`
  ).catch(() => [])

  const info = {
    ...defaultBrandsPageInfo,
    ...withoutPartnerSection(infoRow[0]?.value || {}),
  }

  if (!skipRedirect && (info as any).custom_slug && (info as any).custom_slug !== "markalar" && (info as any).custom_slug !== "markalarimiz") {
    redirect(`/${(info as any).custom_slug}`)
  }

  const dbBrands = await query<BrandRow>(
    `SELECT id, title, handle, metadata FROM store_collection ORDER BY title ASC`
  ).catch(() => [])

  const visibleBrands = dbBrands
    .filter((brand) => brand.metadata?.active !== false && brand.metadata?.featured !== false)
    .sort((a, b) => {
      const orderA = Number(a.metadata?.sort_order) || 0
      const orderB = Number(b.metadata?.sort_order) || 0
      return orderA - orderB || a.title.localeCompare(b.title, "tr")
    })

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-20 font-sans text-slate-800">
      
      {/* 1. Standart PageHero Header */}
      <PageHero
        breadcrumb={[
          { title: "Kurumsal", href: "/hakkimizda" },
          { title: info.title || "Markalarımız" },
        ]}
        title={info.description && /<[a-z][\s\S]*>/i.test(info.description) ? undefined : (info.title || "Markalarımız")}
        paragraphs={info.description && /<[a-z][\s\S]*>/i.test(info.description) ? [] : [info.description || ""]}
        htmlContent={info.description && /<[a-z][\s\S]*>/i.test(info.description) ? info.description : undefined}
        ctaText={info.hero_cta_text}
        ctaHref={info.hero_cta_href}
        secondaryCtaText={info.secondary_cta_text}
        secondaryCtaHref={info.secondary_cta_href}
        heroImage={info.hero_image || undefined}
        heroImageAlt={info.title || "Markalarımız"}
      />

      {/* Main Content Container */}
      <div className="content-container py-10 space-y-12">
        
        {/* 2. FEATURE STRIP (4 Column Cards Bar) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            
            {/* Item 1 */}
            <div className="p-4 flex items-start gap-3.5 group hover:bg-slate-50/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300">
                <AppIcon name={info.feat1_icon || "award"} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[0.88rem] leading-snug text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors mb-0.5">
                  {info.feat1_title || "Güvenilir Markalar"}
                </h3>
                <p className="text-[0.78rem] text-slate-500 leading-relaxed font-normal">
                  {info.feat1_desc || "Kalitesi ve başarısı kanıtlanmış dünya markaları."}
                </p>
              </div>
            </div>

            {/* Item 2 */}
            <div className="p-4 flex items-start gap-3.5 group hover:bg-slate-50/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300">
                <AppIcon name={info.feat2_icon || "shield-check"} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[0.88rem] leading-snug text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors mb-0.5">
                  {info.feat2_title || "Ürün Koşulları"}
                </h3>
                <p className="text-[0.78rem] text-slate-500 leading-relaxed font-normal">
                  {info.feat2_desc || "Koşullar ilgili ürün sayfasında belirtilir."}
                </p>
              </div>
            </div>

            {/* Item 3 */}
            <div className="p-4 flex items-start gap-3.5 group hover:bg-slate-50/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300">
                <AppIcon name={info.feat3_icon || "tag"} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[0.88rem] leading-snug text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors mb-0.5">
                  {info.feat3_title || "Uygun Fiyat Avantajı"}
                </h3>
                <p className="text-[0.78rem] text-slate-500 leading-relaxed font-normal">
                  {info.feat3_desc || "En iyi markaları en avantajlı fiyatlarla sunuyoruz."}
                </p>
              </div>
            </div>

            {/* Item 4 */}
            <div className="p-4 flex items-start gap-3.5 group hover:bg-slate-50/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300">
                <AppIcon name={info.feat4_icon || "headphones"} className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[0.88rem] leading-snug text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors mb-0.5">
                  {info.feat4_title || "Uzman Destek"}
                </h3>
                <p className="text-[0.78rem] text-slate-500 leading-relaxed font-normal">
                  {info.feat4_desc || "Doğru ürün seçimi için uzman ekibimiz yanınızda."}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 3. ANA MARKALARIMIZ (Dynamic Brand Grid from DB) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-2xl text-slate-900 tracking-tight">
              {info.main_title || "Ana Markalarımız"}
            </h2>
            <Link
              href={info.main_cta_href || "/magaza"}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-[#C98484] hover:border-rose-300 transition shadow-2xs"
            >
              <span>{info.main_cta_text || "Tüm Markaları Görüntüle"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleBrands.map((brand) => {
              const handleKey = (brand.handle || "").toLowerCase()
              const description =
                brand.metadata?.description ||
                defaultBrandDescriptions[handleKey] ||
                `${brand.title} ürünlerini inceleyin.`

              return (
                <div
                  key={brand.id}
                  className="group bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs flex flex-col justify-between items-center text-center space-y-5 hover:shadow-xl hover:border-rose-200 transition-all transform hover:-translate-y-1"
                >
                  <div className="space-y-4 w-full">
                    {/* Brand Logo / Styled Name */}
                    <div className="h-16 flex items-center justify-center border-b border-slate-100 pb-3">
                      {brand.metadata?.logo_url ? (
                        <img
                          src={brand.metadata.logo_url}
                          alt={brand.title}
                          className="max-h-12 object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <span className="text-2xl font-black tracking-widest text-slate-900 group-hover:text-[#C98484] transition-colors uppercase">
                          {brand.title}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 leading-relaxed font-normal line-clamp-3">
                      {description}
                    </p>
                  </div>

                  {/* Action Link */}
                  <div className="pt-2 w-full">
                    <Link
                      href={`/markalar/${brand.handle}`}
                      className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#C98484] hover:text-[#A95E5E] transition group/btn"
                    >
                      <span>Markayı İncele</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              )
            })}
            {visibleBrands.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-4 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                Henüz vitrinde gösterilecek bir marka seçilmedi.
              </div>
            )}
          </div>
        </section>

        {/* 4. SIZE ÖZEL MARKA VE ÜRÜN ÇÖZÜMLERİ (Bottom CTA Box) */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[#C98484] flex items-center justify-center shrink-0 border border-rose-100 shadow-2xs">
              <Handshake className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                {info.cta_title || "Size Özel Marka ve Ürün Çözümleri"}
              </h3>
              <p className="text-xs text-slate-500 font-normal leading-relaxed">
                {info.cta_desc || "İhtiyacınıza uygun marka, ürün ve fiyat teklifleri için uzman ekibimizle iletişime geçin."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link
              href={info.cta_btn1_href || "/toptan-ve-kurumsal-satis"}
              className="px-5 py-3 rounded-xl border border-[#C98484] text-[#C98484] font-extrabold text-xs hover:bg-rose-50 transition text-center w-full sm:w-auto"
            >
              {info.cta_btn1_text || "Teklif Talebi Oluştur"}
            </Link>
            <Link
              href={info.cta_btn2_href || "/iletisim"}
              className="px-6 py-3 rounded-xl bg-[#C98484] hover:bg-[#A95E5E] text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 w-full sm:w-auto"
            >
              <span>{info.cta_btn2_text || "Bize Ulaşın"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
