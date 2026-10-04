import { getMenu } from "@lib/data/menus"
import { getThemeSettings } from "@lib/content/theme-settings"
import {
  AppIcon,
  Building2,
  ChevronRight,
  FileText,
  Headphones,
  Mail,
  MapPin,
  Phone,
  Users,
} from "@lib/icons"
import { query } from "@lib/admin/db"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FooterMobileSections from "@modules/layout/components/footer-mobile-sections"
import { isStoreReady } from "@lib/security/store-readiness"
import { turkishTitleCase } from "@lib/util/turkish-title-case"
import "./footer-light.css"

const InstagramIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

const FacebookIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.714 5H18V0h-3.808C10.596 0 9 1.583 9 4.615V8z" />
  </svg>
)

const YoutubeIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
  </svg>
)

const LinkedinIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.239-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
)

export default async function Footer() {
  const storeReady = isStoreReady()
  const [
    themeSettings,
    kurumsalMenu,
    musteriMenu,
    yasalMenu,
    footerMenu,
  ] = await Promise.all([
    getThemeSettings(),
    getMenu("footer-kurumsal").catch(() => null),
    getMenu("footer-musteri-hizmetleri").catch(() => null),
    getMenu("footer-yasal").catch(() => null),
    getMenu("footer-menu").catch(() => null),
  ])

  const footerFeaturesActive = themeSettings?.footer_features_active !== false
  const rawFeatures = themeSettings?.footer_features
  let footerFeatures: Array<{ title: string; subtitle: string; icon: string }> = []
  if (typeof rawFeatures === "string") {
    try {
      footerFeatures = JSON.parse(rawFeatures)
    } catch (e) {
      footerFeatures = []
    }
  } else if (Array.isArray(rawFeatures)) {
    footerFeatures = rawFeatures as any
  }
  if (!storeReady || !footerFeatures || footerFeatures.length === 0) {
    footerFeatures = [
      {
        title: "Teslimat Bilgisi",
        subtitle: "Tahmini süre ürün ve adrese göre sipariş özetinde gösterilir.",
        icon: "truck",
      },
      {
        title: "Kolay İade İletişimi",
        subtitle: "İade ve hasar bildirimlerinde ekibimizle iletişime geçebilirsiniz.",
        icon: "award",
      },
      {
        title: "Müşteri Desteği",
        subtitle: "Güncel çalışma saatleri iletişim sayfasında yer alır.",
        icon: "headphones",
      },
      {
        title: "Güvenli Alışveriş",
        subtitle: "Ödeme bilgileri yetkili ödeme kuruluşu tarafından işlenir.",
        icon: "shield",
      },
    ]
  }
  footerFeatures = footerFeatures.map((feature) =>
    /garanti|teknik servis/i.test(`${feature.title} ${feature.subtitle}`)
      ? { title: "İade Desteği", subtitle: "İade ve hasar bildirimleriniz için bize ulaşın.", icon: "headphones" }
      : feature
  )

  // 1. Column Titles & Content
  const logoText = (themeSettings?.logo_text as string | undefined) || "ZK HOME"
  const footerLogoUrl = themeSettings?.footer_logo_url as string | undefined
  const footerLogoDarkUrl = themeSettings?.footer_logo_dark_url as string | undefined

  const isValidFooterLogo = Boolean(footerLogoUrl && footerLogoUrl !== "/brand/zkhome-logo.svg")
  const isValidFooterDarkLogo = Boolean(footerLogoDarkUrl && footerLogoDarkUrl !== "/brand/zkhome-logo-dark.svg")

  const lightLogo =
    (isValidFooterLogo ? footerLogoUrl : null) ||
    footerLogoUrl ||
    (themeSettings?.header_logo_url as string | undefined) ||
    "/brand/zkhome-logo.svg"

  const logoAlt =
    (themeSettings?.footer_logo_alt as string | undefined) ||
    (themeSettings?.header_logo_alt as string | undefined) ||
    `${logoText} Logo`
  const logoHeight = Number(
    themeSettings?.footer_logo_height ||
      themeSettings?.header_logo_height ||
      42,
  )

  const footerDescription =
    (themeSettings?.footer_description as string | undefined) ||
    "ZK Home, yaşam alanlarına zarif dokunuşlar katan dekorasyon, sofra ve ev tekstili seçkilerini bir araya getirir."
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || ""
  const email = storeReady ? (themeSettings?.contact_email as string | undefined) || "" : ""
  const address = process.env.NEXT_PUBLIC_CONTACT_ADDRESS || ""

  const col2Title = turkishTitleCase((themeSettings?.footer_col2_title as string | undefined) || "Kurumsal")
  const col3Title = turkishTitleCase((themeSettings?.footer_col3_title as string | undefined) || "Müşteri Hizmetleri")
  const col4Title = turkishTitleCase((themeSettings?.footer_col4_title as string | undefined) || "Yasal Bilgilendirme")
  const col5Title = turkishTitleCase((themeSettings?.footer_col5_title as string | undefined) || "Bizi Takip Edin")
  const col5Desc =
    (themeSettings?.footer_col5_desc as string | undefined) ||
    "Yeniliklerden, kampanyalardan ve içeriklerden haberdar olun."

  const socialInstagram = (themeSettings?.social_instagram as string | undefined) || ""
  const socialFacebook = (themeSettings?.social_facebook as string | undefined) || ""
  const socialYoutube = (themeSettings?.social_youtube as string | undefined) || ""
  const socialLinkedin = (themeSettings?.social_linkedin as string | undefined) || ""

  const copyrightText =
    (themeSettings?.footer_copyright_text as string | undefined) ||
    `© ${new Date().getFullYear()} ZK Home. Tüm hakları saklıdır.`
  const brandSubtext = (themeSettings?.footer_brand_subtext as string | undefined) || ""
  const mersisNo = storeReady ? (themeSettings?.footer_mersis_no as string | undefined) || "" : ""
  const kepAddress = storeReady ? (themeSettings?.footer_kep_address as string | undefined) || "" : ""
  const showPaymentBadges = themeSettings?.footer_show_payment_badges !== false

  const paymentLogos = [
    { key: "iyzico", name: "iyzico ile Öde", src: themeSettings?.payment_logo_iyzico },
    { key: "mastercard", name: "Mastercard", src: themeSettings?.payment_logo_mastercard },
    { key: "visa", name: "Visa", src: themeSettings?.payment_logo_visa },
    { key: "amex", name: "American Express", src: themeSettings?.payment_logo_amex },
    { key: "troy", name: "Troy", src: themeSettings?.payment_logo_troy },
  ].filter((logo) => logo.src && logo.src !== "/brand/placeholder.svg")

  // Fallback Menu Arrays
  const defaultKurumsalItems = [
    { label: "Hakkımızda", url: "/hakkimizda" },
    { label: "Kurumsal Hediyeler", url: "/toptan-ve-kurumsal-satis" },
    { label: "Markalarımız", url: "/magaza" },
    { label: "Ürün Rehberi ve Makaleler", url: "/blog" },
  ]
  const defaultMusteriItems = [
    { label: "İletişim", url: "/iletisim" },
    { label: "Sık Sorulan Sorular", url: "/sss" },
    { label: "Teslimat, İptal ve İade", url: "/teslimat-ve-iade" },
    { label: "Sipariş Takibi", url: "/siparis-takibi" },
  ]
  const defaultYasalItems = [
    { label: "Ön Bilgilendirme Formu", url: "/on-bilgilendirme-formu" },
    { label: "Mesafeli Satış Sözleşmesi", url: "/mesafeli-satis-sozlesmesi" },
    { label: "KVKK Aydınlatma Metni", url: "/kvkk" },
    { label: "Gizlilik Politikası", url: "/gizlilik-politikasi" },
    { label: "Çerez Politikası", url: "/cerez-politikasi" },
  ]

  const rawKurumsalItems = kurumsalMenu?.items?.length
    ? kurumsalMenu.items
    : defaultKurumsalItems
  const kurumsalItems = rawKurumsalItems.map((item: any) =>
    item.url === "/toptan-ve-kurumsal-satis" ? { ...item, label: "Kurumsal Hediyeler" } : item
  )
  const rawMusteriItems = musteriMenu?.items?.length
    ? musteriMenu.items
    : defaultMusteriItems
  const musteriItems = rawMusteriItems.filter((item: any) => item.url !== "/garanti-ve-teknik-servis" && item.label !== "Garanti ve Teknik Servis" && item.id !== "fm4")
  const yasalItems = yasalMenu?.items?.length
    ? yasalMenu.items
    : defaultYasalItems

  return (
    <>
      <footer className="zk-footer-light w-full border-t pt-12 pb-8 sm:pt-16">

        <div className="content-container">
          {/* Mobile Footer Top: Brand info + Accordion Menus (Kurumsal, Müşteri Hizmetleri, Yasal Bilgilendirme) + Social */}
          <div className="md:hidden flex flex-col space-y-6 pb-6">
            {/* Mobile Brand Info */}
            <div className="flex flex-col space-y-3">
              <LocalizedClientLink href="/" aria-label="Ana Sayfa" className="inline-block">
                {lightLogo ? (
                  <img
                    src={lightLogo}
                    alt={logoAlt}
                    width={180}
                    height={40}
                    style={{ height: `${Math.min(logoHeight, 36)}px` }}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-lg font-black tracking-wider text-white">
                    ZK HOME
                  </span>
                )}
              </LocalizedClientLink>
              <p className="text-[13px] text-white/75 leading-relaxed">
                {footerDescription}
              </p>
              <div className="flex flex-col space-y-2 pt-1 text-xs text-white/80 font-medium">
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-2.5 hover:text-[#C98484] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#C98484] shrink-0" />
                    <span>{phone}</span>
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2.5 hover:text-[#C98484] transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#C98484] shrink-0" />
                    <span>{email}</span>
                  </a>
                )}
                {address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#C98484] shrink-0 mt-0.5" />
                    <span>{address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menus: KURUMSAL, MÜŞTERİ HİZMETLERİ, YASAL BİLGİLENDİRME */}
            <FooterMobileSections
              kurumsalTitle={col2Title}
              kurumsalItems={kurumsalItems}
              musteriTitle={col3Title}
              musteriItems={musteriItems}
              yasalTitle={col4Title}
              yasalItems={yasalItems}
            />

            {/* Mobile Social Links */}
            <div className="flex flex-col space-y-3 pt-2">
              <h4 className="text-sm font-semibold normal-case text-white tracking-normal flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C98484] shrink-0" />
                <span>{col5Title}</span>
              </h4>
              <p className="text-[13px] text-white/75 leading-relaxed">
                {col5Desc}
              </p>
              <div className="flex items-center gap-2.5 pt-1">
                {socialInstagram && (
                  <a
                    href={socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="zk-footer-instagram"
                  >
                    <InstagramIcon />
                  </a>
                )}
                {socialFacebook && (
                  <a
                    href={socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#C98484] flex items-center justify-center text-white transition-all"
                  >
                    <FacebookIcon />
                  </a>
                )}
                {socialYoutube && (
                  <a
                    href={socialYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Youtube"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#C98484] flex items-center justify-center text-white transition-all"
                  >
                    <YoutubeIcon />
                  </a>
                )}
                {socialLinkedin && (
                  <a
                    href={socialLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#C98484] flex items-center justify-center text-white transition-all"
                  >
                    <LinkedinIcon />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Desktop 5-Column Grid (Hidden on Mobile) */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12">
            {/* Column 1: Brand & Contact Info */}
            <div className="flex flex-col space-y-4 lg:col-span-1">
              <LocalizedClientLink href="/" aria-label="Ana Sayfa" className="inline-block">
                {lightLogo ? (
                  <img
                    src={lightLogo}
                    alt={logoAlt}
                    width={220}
                    height={50}
                    style={{ height: `${logoHeight}px` }}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-xl font-black tracking-wider text-white">
                    ZK HOME
                  </span>
                )}
              </LocalizedClientLink>
              <p className="text-xs text-white/65 leading-relaxed">
                {footerDescription}
              </p>
              <div className="flex flex-col space-y-2.5 pt-2 text-xs text-white/80 font-medium">
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-2.5 hover:text-[#C98484] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#C98484] shrink-0" />
                    <span>{phone}</span>
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2.5 hover:text-[#C98484] transition-colors"
                  >
                    <Mail className="w-4 h-4 text-[#C98484] shrink-0" />
                    <span>{email}</span>
                  </a>
                )}
                {address && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#C98484] shrink-0 mt-0.5" />
                    <span>{address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: KURUMSAL */}
            <div className="flex flex-col space-y-4">
              <h3 className="text-sm font-semibold normal-case text-white tracking-normal flex items-center gap-2 border-b border-white/10 pb-2.5">
                <Building2 className="w-4 h-4 text-[#C98484] shrink-0" />
                <span>{col2Title}</span>
              </h3>
              <ul className="flex flex-col space-y-2 text-[12.5px] text-white/75 font-medium">
                {kurumsalItems.map((item: any, i: number) => (
                  <li key={i}>
                    <LocalizedClientLink
                      href={item.url || "#"}
                      className="flex items-center justify-between group py-1 hover:text-white transition-colors"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#C98484]/70 group-hover:text-[#C98484] group-hover:translate-x-0.5 transition-all" />
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: MÜŞTERİ HİZMETLERİ */}
            <div className="flex flex-col space-y-4">
              <h3 className="text-sm font-semibold normal-case text-white tracking-normal flex items-center gap-2 border-b border-white/10 pb-2.5">
                <Headphones className="w-4 h-4 text-[#C98484] shrink-0" />
                <span>{col3Title}</span>
              </h3>
              <ul className="flex flex-col space-y-2 text-[12.5px] text-white/75 font-medium">
                {musteriItems.map((item: any, i: number) => (
                  <li key={i}>
                    <LocalizedClientLink
                      href={item.url || "#"}
                      className="flex items-center justify-between group py-1 hover:text-white transition-colors"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#C98484]/70 group-hover:text-[#C98484] group-hover:translate-x-0.5 transition-all" />
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: YASAL BİLGİLENDİRME */}
            <div className="flex flex-col space-y-4">
              <h3 className="text-sm font-semibold normal-case text-white tracking-normal flex items-center gap-2 border-b border-white/10 pb-2.5">
                <FileText className="w-4 h-4 text-[#C98484] shrink-0" />
                <span>{col4Title}</span>
              </h3>
              <ul className="flex flex-col space-y-2 text-[12.5px] text-white/75 font-medium">
                {yasalItems.map((item: any, i: number) => (
                  <li key={i}>
                    <LocalizedClientLink
                      href={item.url || "#"}
                      className="flex items-center justify-between group py-1 hover:text-white transition-colors"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#C98484]/70 group-hover:text-[#C98484] group-hover:translate-x-0.5 transition-all" />
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 5: BİZİ TAKİP EDİN & Social Links */}
            <div className="flex flex-col space-y-4">
              <h3 className="text-sm font-semibold normal-case text-white tracking-normal flex items-center gap-2 border-b border-white/10 pb-2.5">
                <Users className="w-4 h-4 text-[#C98484] shrink-0" />
                <span>{col5Title}</span>
              </h3>
              <p className="text-[13px] text-white/75 leading-relaxed">
                {col5Desc}
              </p>
              <div className="flex items-center gap-2.5 pt-2">
                {socialInstagram && (
                  <a
                    href={socialInstagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="zk-footer-instagram"
                  >
                    <InstagramIcon />
                  </a>
                )}
                {socialFacebook && (
                  <a
                    href={socialFacebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#C98484] flex items-center justify-center text-white transition-all transform hover:scale-105"
                  >
                    <FacebookIcon />
                  </a>
                )}
                {socialYoutube && (
                  <a
                    href={socialYoutube}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Youtube"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#C98484] flex items-center justify-center text-white transition-all transform hover:scale-105"
                  >
                    <YoutubeIcon />
                  </a>
                )}
                {socialLinkedin && (
                  <a
                    href={socialLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#C98484] flex items-center justify-center text-white transition-all transform hover:scale-105"
                  >
                    <LinkedinIcon />
                  </a>
                )}
              </div>
            </div>
          </div>

        {/* Middle Section: 4 Güvence Bandı INSIDE Footer */}
        {footerFeaturesActive && footerFeatures && footerFeatures.length > 0 && (
          <div className="border-t border-white/10 py-8 my-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-white/10">
              {footerFeatures.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 lg:px-6 first:lg:pl-0 last:lg:pr-0"
                >
                  <div className="w-11 h-11 rounded-xl border border-[#C98484]/30 bg-[#C98484]/10 flex items-center justify-center shrink-0 text-[#C98484]">
                    <AppIcon name={item.icon} fallback="shield" className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold normal-case text-white tracking-normal">
                      {turkishTitleCase(item.title)}
                    </h4>
                    <p className="text-[12px] text-white/70 mt-1 leading-snug">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Bar: Telif Hakları & Ödeme Logoları */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-center md:text-left">
            <span>{copyrightText}</span>
            {brandSubtext && (
              <span className="hidden sm:inline border-l border-white/15 pl-4">
                {brandSubtext}
              </span>
            )}
            {mersisNo && (
              <span className="hidden md:inline border-l border-white/15 pl-4">
                {mersisNo}
              </span>
            )}
            {kepAddress && (
              <span className="hidden lg:inline border-l border-white/15 pl-4">
                {kepAddress}
              </span>
            )}
          </div>

          {showPaymentBadges && paymentLogos.length > 0 && (
            <div className="zk-payment-logos" role="group" aria-label="Ödeme logoları">
              {paymentLogos.map((logo) => <span key={logo.key} className="zk-payment-logo-item"><img src={logo.src} alt={logo.name} className="zk-payment-logo" loading="lazy" /></span>)}
            </div>
          )}
        </div>
      </div>
    </footer>
  </>
)
}
