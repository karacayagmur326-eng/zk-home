import { query } from "@lib/admin/db"
import MasterContactForm from "../../../components/common/MasterContactForm"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import PageHero from "../../../components/common/PageHero"
import { Phone, Mail, MapPin, Clock, Headphones, Briefcase, Wrench, Building2, Map, ExternalLink } from "lucide-react"
import { getBaseURL } from "@lib/util/env"
import { serializeJsonLd } from "@lib/security/html"

export const metadata: Metadata = {
  title: "İletişim ve Müşteri Hizmetleri",
  description: "ZK Home müşteri hizmetleri, iletişim formu, telefon numarası, çalışma saatleri ve merkez ofis adres bilgileri.",
  alternates: {
    canonical: `${getBaseURL()}/iletisim`,
  },
}

export const dynamic = "force-dynamic"

const fallbackInfo = {
  eyebrow: "7/24 Destek Ekibi",
  title: "Bizimle İletişime Geçin",
  description: "Ürünlerimiz, siparişleriniz, teslimat ve iade süreçleri, garanti işlemleri veya toptan satış talepleriniz hakkında destek almak için ilgili iletişim kanalımızdan bize ulaşabilirsiniz.",
  hero_image: "/brand/placeholder.svg",
  hero_cta_text: "",
  hero_cta_href: "",
  custom_slug: "",

  // 4 Contact Cards Grid
  card1_title: "Müşteri Hizmetleri",
  card1_desc: "Sipariş durumu, ödeme, kargo, iptal ve iade işlemleri hakkında destek alabilirsiniz.",
  card1_phone: "",
  card1_email: "",
  card1_hours: "Hafta içi 09:00 - 18:00",

  card2_title: "Toptan ve Kurumsal Satış",
  card2_desc: "Toplu alım, bayi fiyatlandırması, proje bazlı ürün tedariği ve kurumsal teklif talepleriniz için bize ulaşın.",
  card2_phone: "",
  card2_email: "",
  card2_hours: "Hafta içi 09:00 - 18:00",

  card3_title: "Garanti ve Teknik Servis",
  card3_desc: "Garanti kapsamı, yedek parça, teknik inceleme ve servis süreçleri hakkında bilgi alabilirsiniz.",
  card3_phone: "",
  card3_email: "",
  card3_hours: "Hafta içi 09:00 - 18:00",

  card4_title: "Merkez ve İade Adresi",
  card4_company: "Merkez Ofis",
  card4_address: "",
  card4_country: "Türkiye",
  card4_map_btn: "Haritada Görüntüle",

  // Firma Bilgileri (Corporate Info Table)
  company_title: "Firma Bilgileri",
  company_legal_title: "E-Ticaret ve Mağazacılık A.Ş.",
  company_brand: "Mağazamız",
  company_mersis: "",
  company_tax_office: "İstanbul V.D.",
  company_tax_no: "",
  company_trade_reg_no: "",
  company_kep: "",
  company_email: "",
  company_phone: "",
  company_address: "",
  company_callout: "Tüm soru ve görüşleriniz için bizlere dilediğiniz zaman ulaşabilirsiniz.",

  // Visit Us / Map Section
  visit_title: "Ziyaret Etmek İster misiniz?",
  visit_desc: "Genel merkezimizi ve depomuzu ziyaret ederek ürünlerimizi yakından inceleyebilirsiniz.",
  map_embed_url: "",

  // Contact Form Section
  form_title: "Bize Mesaj Gönderin",
  form_description: "Aşağıdaki formu doldurarak müşteri temsilcilerimize doğrudan mesajınızı iletebilirsiniz.",
  kvkk_url: "/kvkk",
}

type ContactPageProps = {
  searchParams?: Promise<{ render?: string }>
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const skipRedirect = (await searchParams)?.render === "custom-slug"
  const storedInfo = await query<{ value: typeof fallbackInfo }>(
    `SELECT value FROM store_settings WHERE key = 'contact_info' LIMIT 1`
  )
    .then((rows) => ({ ...fallbackInfo, ...(rows[0]?.value || {}) }))
    .catch(() => fallbackInfo)
  const info = {
    ...storedInfo,
    card1_email: (storedInfo as any).email || storedInfo.card1_email,
    card2_email: (storedInfo as any).email || storedInfo.card2_email,
    card3_email: (storedInfo as any).email || storedInfo.card3_email,
    company_email: (storedInfo as any).email || storedInfo.company_email,
    card1_phone: (storedInfo as any).phone || storedInfo.card1_phone,
    card2_phone: (storedInfo as any).phone || storedInfo.card2_phone,
    card3_phone: (storedInfo as any).phone || storedInfo.card3_phone,
    company_phone: (storedInfo as any).phone || storedInfo.company_phone,
  }

  if (!skipRedirect && info.custom_slug && info.custom_slug !== "iletisim") {
    redirect(`/${info.custom_slug}`)
  }

  const resolvedAddress =
    (info as any).full_address ||
    (info as any).company_address ||
    (info as any).address ||
    (info as any).card4_address ||
    "[Şirket adresi yönetim panelinden eklenecektir]"

  const mapAddressUrl = `https://maps.google.com/?q=${encodeURIComponent(resolvedAddress)}`

  const resolvedMapEmbedUrl =
    info.map_embed_url && info.map_embed_url.trim() && !info.map_embed_url.includes("Ümraniye") && !info.map_embed_url.includes("0x14cac851604a11ad")
      ? info.map_embed_url
      : `https://maps.google.com/maps?q=${encodeURIComponent(resolvedAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  const baseUrl = getBaseURL()
  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "İletişim ve Müşteri Hizmetleri | ZK Home",
    url: `${baseUrl}/iletisim`,
    description: "ZK Home müşteri hizmetleri, iletişim formu, telefon numarası ve adres bilgileri.",
    mainEntity: {
      "@type": "Organization",
      name: "ZK Home",
      url: baseUrl,
      telephone: info.card1_phone || "[Telefon yönetim panelinden eklenecektir]",
      email: info.card1_email || "info@zk-home.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: resolvedAddress,
        addressCountry: "TR",
      },
    },
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(contactJsonLd) }}
      />
      <PageHero
        breadcrumb={[{ title: "İletişim" }]}
        title={info.description && /<[a-z][\s\S]*>/i.test(info.description) ? undefined : (info.title || "Bizimle İletişime Geçin")}
        paragraphs={[info.description]}
        htmlContent={info.description && /<[a-z][\s\S]*>/i.test(info.description) ? info.description : undefined}
        ctaText={info.hero_cta_text}
        ctaHref={info.hero_cta_href}
        heroImage={!info.hero_image || info.hero_image === "/brand/placeholder.svg" ? "/brand/placeholder.svg" : info.hero_image}
        heroImageAlt={info.title || "İletişim"}
      />

      <div className="content-container space-y-12 py-10">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Kart 1: Müşteri Hizmetleri */}
          <div className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-xl hover:border-rose-200/60">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-[#C98484] flex items-center justify-center border border-rose-100 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300">
                <Headphones className="w-6 h-6 group-hover:scale-110 transform transition-transform" />
              </div>
              <h3 className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors">
                {info.card1_title || "Müşteri Hizmetleri"}
              </h3>
              <p className="text-[0.8rem] text-slate-600 leading-relaxed font-normal">
                {info.card1_desc || "Sipariş durumu, ödeme, kargo, iptal ve iade işlemleri hakkında destek alabilirsiniz."}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-[0.8rem] font-medium text-slate-700">
              <a href={`tel:${(info.card1_phone || "").replace(/\D/g, "")}`} className="flex items-center gap-2 hover:text-[#C98484] transition-colors">
                <Phone className="w-3.5 h-3.5 text-[#C98484] shrink-0" />
                <span>{info.card1_phone || ""}</span>
              </a>
              <a href={`mailto:${info.card1_email || ""}`} className="flex items-center gap-2 hover:text-[#C98484] transition-colors">
                <Mail className="w-3.5 h-3.5 text-[#C98484] shrink-0" />
                <span className="truncate">{info.card1_email || ""}</span>
              </a>
              <div className="flex items-center gap-2 text-slate-500 font-normal text-[0.8rem]">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{info.card1_hours || "Hafta içi 09:00 - 18:00"}</span>
              </div>
            </div>
          </div>

          {/* Kart 2: Toptan ve Kurumsal Satış */}
          <div className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-xl hover:border-rose-200/60">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-[#C98484] flex items-center justify-center border border-rose-100 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300">
                <Briefcase className="w-6 h-6 group-hover:scale-110 transform transition-transform" />
              </div>
              <h3 className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors">
                {info.card2_title || "Toptan ve Kurumsal Satış"}
              </h3>
              <p className="text-[0.8rem] text-slate-600 leading-relaxed font-normal">
                {info.card2_desc || "Toplu alım, bayi fiyatlandırması, proje bazlı ürün tedariği ve kurumsal teklif talepleriniz için bize ulaşın."}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-[0.8rem] font-medium text-slate-700">
              <a href={`tel:${(info.card2_phone || "").replace(/\D/g, "")}`} className="flex items-center gap-2 hover:text-[#C98484] transition-colors">
                <Phone className="w-3.5 h-3.5 text-[#C98484] shrink-0" />
                <span>{info.card2_phone || ""}</span>
              </a>
              <a href={`mailto:${info.card2_email || ""}`} className="flex items-center gap-2 hover:text-[#C98484] transition-colors">
                <Mail className="w-3.5 h-3.5 text-[#C98484] shrink-0" />
                <span className="truncate">{info.card2_email || ""}</span>
              </a>
              <div className="flex items-center gap-2 text-slate-500 font-normal text-[0.8rem]">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{info.card2_hours || "Hafta içi 09:00 - 18:00"}</span>
              </div>
            </div>
          </div>

          {/* Kart 3: Garanti ve Teknik Servis */}
          <div className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-xl hover:border-rose-200/60">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-[#C98484] flex items-center justify-center border border-rose-100 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300">
                <Wrench className="w-6 h-6 group-hover:scale-110 transform transition-transform" />
              </div>
              <h3 className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors">
                {info.card3_title || "Garanti ve Teknik Servis"}
              </h3>
              <p className="text-[0.8rem] text-slate-600 leading-relaxed font-normal">
                {info.card3_desc || "Garanti kapsamı, yedek parça, teknik inceleme ve servis süreçleri hakkında bilgi alabilirsiniz."}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-[0.8rem] font-medium text-slate-700">
              <a href={`tel:${(info.card3_phone || "").replace(/\D/g, "")}`} className="flex items-center gap-2 hover:text-[#C98484] transition-colors">
                <Phone className="w-3.5 h-3.5 text-[#C98484] shrink-0" />
                <span>{info.card3_phone || ""}</span>
              </a>
              <a href={`mailto:${info.card3_email || ""}`} className="flex items-center gap-2 hover:text-[#C98484] transition-colors">
                <Mail className="w-3.5 h-3.5 text-[#C98484] shrink-0" />
                <span className="truncate">{info.card3_email || ""}</span>
              </a>
              <div className="flex items-center gap-2 text-slate-500 font-normal text-[0.8rem]">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{info.card3_hours || "Hafta içi 09:00 - 18:00"}</span>
              </div>
            </div>
          </div>

          {/* Kart 4: Genel Merkez Adresi */}
          <div className="group bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-xl hover:border-rose-200/60">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-[#C98484] flex items-center justify-center border border-rose-100 group-hover:bg-[#C98484] group-hover:text-white transition-colors duration-300">
                <MapPin className="w-6 h-6 group-hover:scale-110 transform transition-transform" />
              </div>
              <h3 className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors">
                {info.card4_title || "Merkez ve İade Adresi"}
              </h3>
              <div className="text-[0.8rem] text-slate-600 leading-relaxed font-normal space-y-0.5">
                <div className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900">{info.card4_company || "Merkez Ofis"}</div>
                <div>{resolvedAddress}</div>
                <div className="text-slate-500 font-medium">{info.card4_country || "Türkiye"}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <a
                href={mapAddressUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-rose-400 text-[#C98484] hover:bg-[#C98484] hover:text-white rounded-xl text-[0.8rem] font-bold transition-all duration-300 shadow-2xs cursor-pointer group/btn"
              >
                <Map className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                <span>{info.card4_map_btn || "Haritada Görüntüle"}</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
              </a>
            </div>
          </div>

        </section>

        {/* Firma Bilgileri */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <h2 className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 tracking-tight border-b border-slate-100 pb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#C98484]" />
            <span>{info.company_title || "Firma Bilgileri"}</span>
          </h2>

          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-1">
              <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block">Ticari Unvan</span>
              <span className="text-[0.8rem] text-slate-600 font-normal leading-relaxed block">{info.company_legal_title || fallbackInfo.company_legal_title}</span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block">Marka Adı</span>
              <span className="text-[0.8rem] text-slate-600 font-normal block">{info.company_brand || "Mağazamız"}</span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block">MERSİS Numarası</span>
              <span className="text-[0.8rem] text-slate-600 font-normal font-mono block">{info.company_mersis || ""}</span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block">Ticaret Sicil No</span>
              <span className="text-[0.8rem] text-slate-600 font-normal font-mono block">{info.company_trade_reg_no || ""}</span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block">KEP Adresi</span>
              <span className="text-[0.8rem] text-slate-600 font-normal font-mono truncate block">{info.company_kep || ""}</span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block">Vergi Dairesi / No</span>
              <span className="text-[0.8rem] text-slate-600 font-normal block">{info.company_tax_office || "İstanbul V.D."} <span className="font-mono text-slate-500 font-normal">({info.company_tax_no || "123 456 7890"})</span></span>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block">E-Posta</span>
              <a href={`mailto:${info.company_email || ""}`} className="text-[0.8rem] text-slate-600 font-normal hover:text-[#C98484] transition-colors block">{info.company_email || ""}</a>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block">Telefon</span>
              <a href={`tel:${(info.company_phone || "").replace(/\D/g, "")}`} className="text-[0.8rem] text-slate-600 font-normal font-mono hover:text-[#C98484] transition-colors block">{info.company_phone || ""}</a>
            </div>

            <div className="md:col-span-3 space-y-1 border-t border-slate-100 pt-4 mt-2">
              <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block">Merkez Adresi</span>
              <a href={mapAddressUrl} target="_blank" rel="noopener noreferrer" className="text-[0.8rem] text-slate-600 font-normal leading-relaxed hover:text-[#C98484] transition-colors block flex items-center gap-1.5">
                <span>{resolvedAddress}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#C98484] shrink-0" />
              </a>
            </div>

          </div>
        </section>

        {/* Harita ve Konum */}
        <section id="map-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 min-h-[300px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs relative">
            <iframe
              src={resolvedMapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "320px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col justify-center space-y-5">
            <div>
              <h3 className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 tracking-tight mb-2">
                {info.visit_title || "Ziyaret Etmek İster misiniz?"}
              </h3>
              <p className="text-[0.8rem] text-slate-600 font-normal leading-relaxed">
                {info.visit_desc || "Merkez ofisimiz ve depomuzu ziyaret ederek ürünlerimizi yakından inceleyebilirsiniz."}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 text-[0.8rem] text-slate-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C98484] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block mb-0.5">Adres</span>
                  <a href={mapAddressUrl} target="_blank" rel="noopener noreferrer" className="text-[0.8rem] text-slate-600 font-normal leading-relaxed hover:text-[#C98484] transition-colors block">
                    {resolvedAddress}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#C98484] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block mb-0.5">Çalışma Saatleri</span>
                  <span className="text-[0.8rem] text-slate-600 font-normal block">{info.card1_hours || "Hafta içi 09:00 - 18:00"}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#C98484] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[0.9rem] leading-[1.25rem] text-slate-900 block mb-0.5">Telefon</span>
                  <a href={`tel:${(info.card1_phone || "").replace(/\D/g, "")}`} className="text-[0.8rem] text-slate-600 font-normal font-mono hover:text-[#C98484] transition-colors block">
                    {info.card1_phone || "[Telefon yönetim panelinden eklenecektir]"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* İletişim Formu */}
        <section id="contact-form" className="w-full">
          <MasterContactForm
            formTitle={info.form_title || "Bize Mesaj Gönderin"}
            formDescription={info.form_description || "Aşağıdaki formu doldurarak müşteri temsilcilerimize doğrudan mesajınızı iletebilirsiniz."}
            kvkkUrl={info.kvkk_url || "/gizlilik-politikasi"}
          />
        </section>
      </div>
    </div>
  )
}
