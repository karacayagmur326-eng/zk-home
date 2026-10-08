"use client"
import { AdminSectionHeading } from "@components/admin/AdminContent"
import AdminTabs from "@components/admin/AdminTabs"
import { useUrlState } from "@lib/hooks/use-url-state"
import React, { useEffect, useState } from "react"
import MediaSelectorModal from "../components/MediaSelectorModal"
import IconPickerModal from "../components/IconPickerModal"
import {
  APP_ICON_OPTIONS as SELECTABLE_ICONS,
  AppIcon,
  Award,
  Building2,
  CreditCard,
  FileCheck,
  FileText,
  Globe,
  Layers3,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
} from "@lib/icons"
import { Code, Sparkles } from "lucide-react"
import clx from "clsx"

const FONT_OPTIONS = [
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Önerilen)" },
  { value: "Inter", label: "Inter (Varsayılan)" },
  { value: "Barlow Condensed", label: "Barlow Condensed (Slider)" },
  { value: "Outfit", label: "Outfit" },
  { value: "Roboto", label: "Roboto" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Lora", label: "Lora" },
]

const SITE_FONT_OPTIONS = [
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Önerilen)" },
  { value: "Poppins", label: "Poppins (Önerilen - Kalın & Şık)" },
  { value: "Inter", label: "Inter (Varsayılan)" },
  { value: "Roboto", label: "Roboto" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Outfit", label: "Outfit" },
]

type FooterFeature = {
  title: string
  subtitle: string
  icon: string
}

export default function ThemeSettingsPage(props: any = {}) {
  const {
    initialTab = "logos",
    mode = "all",
  } = props as {
    initialTab?: "logos" | "typography" | "menu" | "seo" | "icons" | "footer"
    mode?: "theme" | "seo" | "contact" | "all"
  }
  const [activeTab, setActiveTab] = useUrlState<
    "logos" | "typography" | "menu" | "seo" | "icons" | "footer"
  >(mode === "seo" ? "seo" : mode === "contact" ? "footer" : initialTab, "theme_tab", mode === "seo" ? ["seo"] : mode === "contact" ? ["footer"] : ["logos", "typography", "menu", "seo", "icons", "footer"])

  const [iconCategory, setIconCategory] = useState<
    "all" | "hirdavat" | "magaza" | "kurumsal" | "custom"
  >("all")
  const [iconSearch, setIconSearch] = useState("")
  const [copiedIcon, setCopiedIcon] = useState<string | null>(null)
  const [customIcons, setCustomIcons] = useState<
    Array<{ name: string; label: string; url: string }>
  >([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  // Form states
  const [logoText, setLogoText] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [fontFamily, setFontFamily] = useState("Plus Jakarta Sans")
  const [fontSizeBase, setFontSizeBase] = useState("16px")
  const [h1Size, setH1Size] = useState("2.5rem")
  const [h2Size, setH2Size] = useState("2rem")
  const [h3Size, setH3Size] = useState("1.75rem")
  const [h4Size, setH4Size] = useState("1.5rem")
  const [sliderFontTitle, setSliderFontTitle] = useState("Plus Jakarta Sans")
  const [sliderFontDesc, setSliderFontDesc] = useState("Inter")

  // Header Menu States
  const [headerMenuAlign, setHeaderMenuAlign] = useState("center")
  const [headerMenuFontSize, setHeaderMenuFontSize] = useState("13px")
  const [headerMenuGap, setHeaderMenuGap] = useState("16px")
  const [headerMenuLetterSpacing, setHeaderMenuLetterSpacing] = useState("0")
  const [headerMenuFontWeight, setHeaderMenuFontWeight] = useState("600")
  const [headerMenuTextTransform, setHeaderMenuTextTransform] = useState("none")

  // Logo States
  const [headerLogoUrl, setHeaderLogoUrl] = useState("/brand/zkhome-logo.svg")
  const [headerLogoDarkUrl, setHeaderLogoDarkUrl] = useState("/brand/zkhome-logo-dark.svg")
  const [headerLogoHeight, setHeaderLogoHeight] = useState(40)
  const [headerLogoAlt, setHeaderLogoAlt] = useState("")

  const [footerLogoUrl, setFooterLogoUrl] = useState("/brand/zkhome-logo.svg")
  const [footerLogoDarkUrl, setFooterLogoDarkUrl] = useState("/brand/zkhome-logo-dark.svg")
  const [footerLogoHeight, setFooterLogoHeight] = useState(40)
  const [footerLogoAlt, setFooterLogoAlt] = useState("")

  const [faviconUrl, setFaviconUrl] = useState("/brand/zkhome-favicon.svg")

  const [adminLogoUrl, setAdminLogoUrl] = useState("/brand/zkhome-logo.svg")
  const [adminLogoHeight, setAdminLogoHeight] = useState(40)
  const [adminLogoAlt, setAdminLogoAlt] = useState("")

  const [miniLogoUrl, setMiniLogoUrl] = useState("/brand/zkhome-favicon.svg")
  const [miniLogoHeight, setMiniLogoHeight] = useState(36)
  const [miniLogoAlt, setMiniLogoAlt] = useState("")

  // Footer States
  const [footerFeaturesActive, setFooterFeaturesActive] = useState(true)
  const [footerFeatures, setFooterFeatures] = useState<FooterFeature[]>([
    { title: "Aynı Gün Kargo", subtitle: "14:00'a kadar verilen siparişlerde", icon: "truck" },
    { title: "Güvenli Alışveriş", subtitle: "256-bit SSL güvenlik sertifikası", icon: "shield-check" },
    { title: "Kolay İade", subtitle: "14 gün içinde koşulsuz iade", icon: "rotate-ccw" },
    { title: "Uzman Destek", subtitle: "7/24 müşteri desteği", icon: "headphones" }
  ])
  const [footerDescription, setFooterDescription] = useState(
    "Kaliteli ürünler ve müşteri odaklı hizmet anlayışımızla güvenilir alışverişin adresi."
  )
  const [contactPhone, setContactPhone] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactAddress, setContactAddress] = useState("İstanbul, Türkiye")
  const [footerCol2Title, setFooterCol2Title] = useState("KURUMSAL")
  const [footerCol3Title, setFooterCol3Title] = useState("MÜŞTERİ HİZMETLERİ")
  const [footerCol4Title, setFooterCol4Title] = useState("YASAL BİLGİLENDİRME")
  const [footerCol5Title, setFooterCol5Title] = useState("BİZİ TAKİP EDİN")
  const [footerCol5Desc, setFooterCol5Desc] = useState(
    "Yeniliklerden, kampanyalardan ve içeriklerden haberdar olun."
  )
  const [socialInstagram, setSocialInstagram] = useState("")
  const [socialFacebook, setSocialFacebook] = useState("")
  const [socialYoutube, setSocialYoutube] = useState("")
  const [socialLinkedin, setSocialLinkedin] = useState("")
  const [footerCopyrightText, setFooterCopyrightText] = useState(
    "© 2026 Tüm hakları saklıdır."
  )
  const [footerBrandSubtext, setFooterBrandSubtext] = useState("")
  const [footerMersisNo, setFooterMersisNo] = useState("")
  const [footerKepAddress, setFooterKepAddress] = useState("")
  const [footerShowPaymentBadges, setFooterShowPaymentBadges] = useState(true)
  const [paymentLogoIyzico, setPaymentLogoIyzico] = useState("/brand/placeholder.svg")
  const [paymentLogoMastercard, setPaymentLogoMastercard] = useState("/brand/placeholder.svg")
  const [paymentLogoVisa, setPaymentLogoVisa] = useState("/brand/placeholder.svg")
  const [paymentLogoAmex, setPaymentLogoAmex] = useState("/brand/placeholder.svg")
  const [paymentLogoTroy, setPaymentLogoTroy] = useState("/brand/placeholder.svg")
  const [iconPickerIndex, setIconPickerIndex] = useState<number | null>(null)

  // SEO & Google states
  const [seoMetaTitle, setSeoMetaTitle] = useState("")
  const [seoMetaDescription, setSeoMetaDescription] = useState("")
  const [seoMetaKeywords, setSeoMetaKeywords] = useState("")
  const [seoGoogleVerification, setSeoGoogleVerification] = useState("")
  const [seoGa4Id, setSeoGa4Id] = useState("")
  const [seoGtmId, setSeoGtmId] = useState("")
  const [customHeadScripts, setCustomHeadScripts] = useState("")
  const [customBodyScripts, setCustomBodyScripts] = useState("")
  const [seoOgImageUrl, setSeoOgImageUrl] = useState("")
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState("")
  const [seoIndexingEnabled, setSeoIndexingEnabled] = useState(true)
  const [seoTitleSeparator, setSeoTitleSeparator] = useState("|")
  const [seoProductTitleTemplate, setSeoProductTitleTemplate] = useState("%urun_adi% %ayirici% %site_adi%")
  const [seoProductDescTemplate, setSeoProductDescTemplate] = useState("%urun_adi% en uygun fiyatı, %marka% kalitesi ve 2 yıl resmi garanti avantajıyla %site_adi% üzerinde. Hemen inceleyin!")
  const [seoCategoryTitleTemplate, setSeoCategoryTitleTemplate] = useState("%kategori% Modelleri ve Fiyatları %ayirici% %site_adi%")
  const [seoCategoryDescTemplate, setSeoCategoryDescTemplate] = useState("En kaliteli %kategori% çeşitleri uygun fiyatlar, taksit seçenekleri ve hızlı kargo avantajıyla %site_adi% üzerinde!")
  const [seoBrandTitleTemplate, setSeoBrandTitleTemplate] = useState("%marka% Ürünleri ve Fiyatları %ayirici% %site_adi%")
  const [seoBrandDescTemplate, setSeoBrandDescTemplate] = useState("Orijinal %marka% el aletleri ve hırdavat ürünleri en iyi fiyat garantisiyle %site_adi% üzerinde.")
  const [seoBlogTitleTemplate, setSeoBlogTitleTemplate] = useState("%yazi_basligi% %ayirici% %site_adi%")
  const [seoBlogDescTemplate, setSeoBlogDescTemplate] = useState("%yazi_ozeti%")
  const [seoPageTitleTemplate, setSeoPageTitleTemplate] = useState("%sayfa_adi% %ayirici% %site_adi%")
  const [activeSeoTemplateTab, setActiveSeoTemplateTab] = useUrlState<"products" | "categories" | "brands" | "pages">("products", "seo_template", ["products", "categories", "brands", "pages"])

  const [modalTarget, setModalTarget] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/theme-settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings
          setLogoText(s.logo_text || "Mağaza Adı")
          setLogoUrl(s.logo_url || "")
          setFontFamily(s.font_family || "Plus Jakarta Sans")
          setFontSizeBase(s.font_size_base || "16px")
          setH1Size(s.h1_size || "2.5rem")
          setH2Size(s.h2_size || "2rem")
          setH3Size(s.h3_size || "1.75rem")
          setH4Size(s.h4_size || "1.5rem")
          setSliderFontTitle(s.slider_font_title || "Plus Jakarta Sans")
          setSliderFontDesc(s.slider_font_desc || "Inter")

          setHeaderMenuAlign(s.header_menu_align || "center")
          setHeaderMenuFontSize(s.header_menu_font_size || "13px")
          setHeaderMenuGap(s.header_menu_gap || "16px")
          setHeaderMenuLetterSpacing(s.header_menu_letter_spacing || "0")
          setHeaderMenuFontWeight(s.header_menu_font_weight || "600")
          setHeaderMenuTextTransform(s.header_menu_text_transform || "none")

          setHeaderLogoUrl(s.header_logo_url || "/brand/zkhome-logo.svg")
          setHeaderLogoDarkUrl(
            s.header_logo_dark_url || "/brand/zkhome-logo-dark.svg"
          )
          setHeaderLogoHeight(s.header_logo_height || 40)
          setHeaderLogoAlt(s.header_logo_alt || "")

          setFooterLogoUrl(s.footer_logo_url || "/brand/zkhome-logo.svg")
          setFooterLogoDarkUrl(
            s.footer_logo_dark_url || "/brand/zkhome-logo-dark.svg"
          )
          setFooterLogoHeight(s.footer_logo_height || 40)
          setFooterLogoAlt(s.footer_logo_alt || "")

          setFaviconUrl(s.favicon_url || "/brand/zkhome-favicon.svg")

          setAdminLogoUrl(s.admin_logo_url || "/brand/zkhome-logo.svg")
          setAdminLogoHeight(s.admin_logo_height || 40)
          setAdminLogoAlt(s.admin_logo_alt || "")

          setMiniLogoUrl(s.mini_logo_url || "/brand/zkhome-favicon.svg")
          setMiniLogoHeight(s.mini_logo_height || 36)
          setMiniLogoAlt(s.mini_logo_alt || "")

          if (s.footer_features_active !== undefined && s.footer_features_active !== null) {
            setFooterFeaturesActive(Boolean(s.footer_features_active))
          }
          if (s.footer_features) {
            let parsed = s.footer_features
            if (typeof parsed === "string") {
              try { parsed = JSON.parse(parsed) } catch (e) {}
            }
            if (Array.isArray(parsed) && parsed.length > 0) setFooterFeatures(parsed)
          }

          if (s.footer_description) setFooterDescription(s.footer_description)
          if (s.contact_phone) setContactPhone(s.contact_phone)
          if (s.contact_email) setContactEmail(s.contact_email)
          if (s.contact_address) setContactAddress(s.contact_address)
          if (s.footer_col2_title) setFooterCol2Title(s.footer_col2_title)
          if (s.footer_col3_title) setFooterCol3Title(s.footer_col3_title)
          if (s.footer_col4_title) setFooterCol4Title(s.footer_col4_title)
          if (s.footer_col5_title) setFooterCol5Title(s.footer_col5_title)
          if (s.footer_col5_desc) setFooterCol5Desc(s.footer_col5_desc)
          if (s.social_instagram) setSocialInstagram(s.social_instagram)
          if (s.social_facebook) setSocialFacebook(s.social_facebook)
          if (s.social_youtube) setSocialYoutube(s.social_youtube)
          if (s.social_linkedin) setSocialLinkedin(s.social_linkedin)
          if (s.footer_copyright_text) setFooterCopyrightText(s.footer_copyright_text)
          if (s.footer_brand_subtext) setFooterBrandSubtext(s.footer_brand_subtext)
          if (s.footer_mersis_no) setFooterMersisNo(s.footer_mersis_no)
          if (s.footer_kep_address) setFooterKepAddress(s.footer_kep_address)
          if (s.footer_show_payment_badges !== undefined && s.footer_show_payment_badges !== null) {
            setFooterShowPaymentBadges(Boolean(s.footer_show_payment_badges))
          }
          if (s.payment_logo_iyzico) setPaymentLogoIyzico(s.payment_logo_iyzico)
          if (s.payment_logo_mastercard) setPaymentLogoMastercard(s.payment_logo_mastercard)
          if (s.payment_logo_visa) setPaymentLogoVisa(s.payment_logo_visa)
          if (s.payment_logo_amex) setPaymentLogoAmex(s.payment_logo_amex)
          if (s.payment_logo_troy) setPaymentLogoTroy(s.payment_logo_troy)

          if (s.seo_meta_title) setSeoMetaTitle(s.seo_meta_title)
          if (s.seo_meta_description)
            setSeoMetaDescription(s.seo_meta_description)
          if (s.seo_meta_keywords) setSeoMetaKeywords(s.seo_meta_keywords)
          if (s.seo_google_verification)
            setSeoGoogleVerification(s.seo_google_verification)
          if (s.seo_ga4_id) setSeoGa4Id(s.seo_ga4_id)
          if (s.seo_gtm_id) setSeoGtmId(s.seo_gtm_id)
          if (s.custom_head_scripts) setCustomHeadScripts(s.custom_head_scripts)
          if (s.custom_body_scripts) setCustomBodyScripts(s.custom_body_scripts)
          if (s.seo_og_image_url) setSeoOgImageUrl(s.seo_og_image_url)
          if (s.seo_canonical_url) setSeoCanonicalUrl(s.seo_canonical_url)
          if (
            s.seo_indexing_enabled !== undefined &&
            s.seo_indexing_enabled !== null
          ) {
            setSeoIndexingEnabled(Boolean(s.seo_indexing_enabled))
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setError("")
    setSaved(false)

    try {
      const res = await fetch("/api/admin/theme-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_text: logoText,
          logo_url: logoUrl,
          font_family: fontFamily,
          font_size_base: fontSizeBase,
          h1_size: h1Size,
          h2_size: h2Size,
          h3_size: h3Size,
          h4_size: h4Size,
          slider_font_title: sliderFontTitle,
          slider_font_desc: sliderFontDesc,

          header_menu_align: headerMenuAlign,
          header_menu_font_size: headerMenuFontSize,
          header_menu_gap: headerMenuGap,
          header_menu_letter_spacing: headerMenuLetterSpacing,
          header_menu_font_weight: headerMenuFontWeight,
          header_menu_text_transform: headerMenuTextTransform,

          header_logo_url: headerLogoUrl,
          header_logo_dark_url: headerLogoDarkUrl,
          header_logo_height: headerLogoHeight,
          header_logo_alt: headerLogoAlt,
          footer_logo_url: footerLogoUrl,
          footer_logo_dark_url: footerLogoDarkUrl,
          footer_logo_height: footerLogoHeight,
          footer_logo_alt: footerLogoAlt,
          favicon_url: faviconUrl,
          admin_logo_url: adminLogoUrl,
          admin_logo_height: adminLogoHeight,
          admin_logo_alt: adminLogoAlt,
          mini_logo_url: miniLogoUrl,
          mini_logo_height: miniLogoHeight,
          mini_logo_alt: miniLogoAlt,

          footer_features_active: footerFeaturesActive,
          footer_features: footerFeatures,
          footer_description: footerDescription,
          contact_phone: contactPhone,
          contact_email: contactEmail,
          contact_address: contactAddress,
          footer_col2_title: footerCol2Title,
          footer_col3_title: footerCol3Title,
          footer_col4_title: footerCol4Title,
          footer_col5_title: footerCol5Title,
          footer_col5_desc: footerCol5Desc,
          social_instagram: socialInstagram,
          social_facebook: socialFacebook,
          social_youtube: socialYoutube,
          social_linkedin: socialLinkedin,
          footer_copyright_text: footerCopyrightText,
          footer_brand_subtext: footerBrandSubtext,
          footer_mersis_no: footerMersisNo,
          footer_kep_address: footerKepAddress,
          footer_show_payment_badges: footerShowPaymentBadges,
          payment_logo_iyzico: paymentLogoIyzico,
          payment_logo_mastercard: paymentLogoMastercard,
          payment_logo_visa: paymentLogoVisa,
          payment_logo_amex: paymentLogoAmex,
          payment_logo_troy: paymentLogoTroy,

          seo_meta_title: seoMetaTitle,
          seo_meta_description: seoMetaDescription,
          seo_meta_keywords: seoMetaKeywords,
          seo_google_verification: seoGoogleVerification,
          seo_ga4_id: seoGa4Id,
          seo_gtm_id: seoGtmId,
          custom_head_scripts: customHeadScripts,
          custom_body_scripts: customBodyScripts,
          seo_og_image_url: seoOgImageUrl,
          seo_canonical_url: seoCanonicalUrl,
          seo_indexing_enabled: seoIndexingEnabled,
          seo_title_separator: seoTitleSeparator,
          seo_product_title_template: seoProductTitleTemplate,
          seo_product_desc_template: seoProductDescTemplate,
          seo_category_title_template: seoCategoryTitleTemplate,
          seo_category_desc_template: seoCategoryDescTemplate,
          seo_brand_title_template: seoBrandTitleTemplate,
          seo_brand_desc_template: seoBrandDescTemplate,
          seo_blog_title_template: seoBlogTitleTemplate,
          seo_blog_desc_template: seoBlogDescTemplate,
          seo_page_title_template: seoPageTitleTemplate,
        }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        const data = await res.json()
        setError(data.error || "Ayarlar kaydedilirken hata oluştu.")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleModalSelect(urls: string[]) {
    if (!urls.length) return
    const url = urls[0]
    if (modalTarget === "header") setHeaderLogoUrl(url)
    if (modalTarget === "header_dark") setHeaderLogoDarkUrl(url)
    if (modalTarget === "footer") setFooterLogoUrl(url)
    if (modalTarget === "footer_dark") setFooterLogoDarkUrl(url)
    if (modalTarget === "favicon") setFaviconUrl(url)
    if (modalTarget === "admin") setAdminLogoUrl(url)
    if (modalTarget === "mini") setMiniLogoUrl(url)
    if (modalTarget === "og_image") setSeoOgImageUrl(url)
    if (modalTarget === "payment_iyzico") setPaymentLogoIyzico(url)
    if (modalTarget === "payment_mastercard") setPaymentLogoMastercard(url)
    if (modalTarget === "payment_visa") setPaymentLogoVisa(url)
    if (modalTarget === "payment_amex") setPaymentLogoAmex(url)
    if (modalTarget === "payment_troy") setPaymentLogoTroy(url)
    if (modalTarget === "custom_icon") {
      const fileName = url.split("/").pop() || "özel-ikon"
      setCustomIcons((prev) => [
        ...prev,
        { name: fileName, label: fileName, url },
      ])
      setIconCategory("custom")
    }
    setModalTarget(null)
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: 4,
    fontSize: 11,
    fontWeight: 600,
    color: "#646970",
    letterSpacing: "0.5px",
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
        }}
      >
        <div style={{ textAlign: "center", color: "#646970" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
            Ayarlar yükleniyor...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {mode === "all" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <AdminSectionHeading title="Tema Ayarları" />
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="admin-btn admin-btn-primary"
          >
            {saving
              ? "Kaydediliyor..."
              : saved
              ? "✓ Kaydedildi"
              : "Ayarları Kaydet"}
          </button>
        </div>
      )}

      {/* TOP TAB NAVIGATION (Only rendered for theme mode or standalone) */}
      {(mode === "theme" || mode === "all") && (
        <AdminTabs label="Tema ayarları"
          value={activeTab}
          onChange={setActiveTab}
          items={[{ value: "logos", label: "Logo & Renkler" }, { value: "typography", label: "Tipografi" }, { value: "menu", label: "Menü & Görünüm" }, { value: "footer", label: "Alt Alan & İletişim" }, { value: "icons", label: "İkon Kütüphanesi" }]}/>
      )}


      {error && (
        <div
          style={{
            marginBottom: 20,
            padding: "14px 18px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 10,
            color: "#b91c1c",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#ef4444",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            !
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#991b1b" }}>Hata Oluştu</div>
            <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 1 }}>
              {error}
            </div>
          </div>
        </div>
      )}
      {saved && (
        <div
          style={{
            marginBottom: 20,
            padding: "14px 18px",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: 10,
            color: "#15803d",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#22c55e",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            ✓
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#166534" }}>
              Değişiklikler Başarıyla Kaydedildi
            </div>
            <div style={{ fontSize: 12, color: "#15803d", marginTop: 1 }}>
              Tüm tema logoları ve SEO yapılandırması güncellendi.
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 1: LOGOS & IMAGES ── */}
      {activeTab === "logos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Header Banner */}
          <div
            className="admin-card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              background: "linear-gradient(135deg, #ffffff 0%, #fcf7f6 100%)",
              border: "1px solid #fed7aa",
              padding: "20px 24px",
              borderRadius: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#C98484",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 8px 16px rgba(201, 132, 132, 0.25)",
                  flexShrink: 0,
                }}
              >
                <Building2 style={{ width: 24, height: 24 }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1d2327" }}>
                  Logo & Görsel Yönetim Merkezi
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>
                  Header, footer, favicon, admin paneli ve mobil mini logo görsellerini buradan yönetebilirsiniz.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="admin-btn admin-btn-primary"
              style={{
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 10,
              }}
            >
              <Save style={{ width: 16, height: 16 }} />
              {saving ? "Kaydediliyor..." : saved ? "✓ Kaydedildi" : "Logoları Kaydet"}
            </button>
          </div>

          {/* Logo Cards Grid (Spacious 2 to 3 Columns!) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: 24,
            }}
          >
            {/* 1. Site Header Logo (Light) */}
            <div
              className="admin-card"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484" }}>
                    <Building2 style={{ width: 16, height: 16 }} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                    Site Header Logo (Açık Zemin)
                  </h4>
                </div>
                <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                  Üst menüde (header) görünür. Önerilen: yatay şeffaf PNG / SVG (250x60px).
                </p>
              </div>

              {/* Logo Preview & Upload */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  onClick={() => setModalTarget("header")}
                  style={{
                    width: "100%",
                    height: 84,
                    border: "2px dashed #cbd5e1",
                    borderRadius: 12,
                    background: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {headerLogoUrl ? (
                    <img
                      src={headerLogoUrl}
                      alt="Header Logo"
                      style={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        objectFit: "contain",
                        padding: 10,
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                        🖼️ Görsel Seç / Yükle
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button
                    type="button"
                    onClick={() => setModalTarget("header")}
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, borderRadius: 8 }}
                  >
                    Logoyu Değiştir
                  </button>
                  {headerLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setHeaderLogoUrl("")}
                      style={{
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      Kaldır
                    </button>
                  )}
                </div>
              </div>

              {/* ALT Metni Input (Full Width!) */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Logo Alt Metni (SEO Açıklaması)
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: 13, padding: "10px 14px", borderRadius: 8 }}
                  value={headerLogoAlt}
                  onChange={(e) => setHeaderLogoAlt(e.target.value)}
                  placeholder="Örn: Mağaza Logo"
                />
              </div>

              {/* Height Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ color: "#334155" }}>YÜKSEKLİK:</span>
                  <span style={{ color: "#C98484", background: "#fcf7f6", padding: "2px 8px", borderRadius: 6, border: "1px solid #fed7aa" }}>
                    {headerLogoHeight}PX
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={headerLogoHeight}
                  onChange={(e) => setHeaderLogoHeight(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#C98484" }}
                />
              </div>
            </div>

            {/* 2. Footer Logo */}
            <div
              className="admin-card"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484" }}>
                    <Building2 style={{ width: 16, height: 16 }} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                    Footer Logo (Alt Bölüm)
                  </h4>
                </div>
                <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                  Sayfa altında (footer) görünür. Boş bırakırsanız header logosu kullanılır.
                </p>
              </div>

              {/* Logo Preview & Upload */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  onClick={() => setModalTarget("footer")}
                  style={{
                    width: "100%",
                    height: 84,
                    border: "2px dashed #cbd5e1",
                    borderRadius: 12,
                    background: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {footerLogoUrl ? (
                    <img
                      src={footerLogoUrl}
                      alt="Footer Logo"
                      style={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        objectFit: "contain",
                        padding: 10,
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
                        🖼️ Görsel Seç / Yükle
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button
                    type="button"
                    onClick={() => setModalTarget("footer")}
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, borderRadius: 8 }}
                  >
                    Logoyu Değiştir
                  </button>
                  {footerLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setFooterLogoUrl("")}
                      style={{
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      Kaldır
                    </button>
                  )}
                </div>
              </div>

              {/* ALT Metni Input (Full Width!) */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Logo Alt Metni (SEO Açıklaması)
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: 13, padding: "10px 14px", borderRadius: 8 }}
                  value={footerLogoAlt}
                  onChange={(e) => setFooterLogoAlt(e.target.value)}
                  placeholder="Örn: Mağaza Footer Logo"
                />
              </div>

              {/* Height Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ color: "#334155" }}>YÜKSEKLİK:</span>
                  <span style={{ color: "#C98484", background: "#fcf7f6", padding: "2px 8px", borderRadius: 6, border: "1px solid #fed7aa" }}>
                    {footerLogoHeight}PX
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={footerLogoHeight}
                  onChange={(e) => setFooterLogoHeight(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#C98484" }}
                />
              </div>
            </div>

            {/* 3. Favicon (Sekme İkonu) */}
            <div
              className="admin-card"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484" }}>
                    <Globe style={{ width: 16, height: 16 }} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                    Favicon & Metin Logo
                  </h4>
                </div>
                <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                  Tarayıcı sekmesinde görünen ikon ve metin fallback ayarı.
                </p>
              </div>

              {/* Favicon Upload */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  onClick={() => setModalTarget("favicon")}
                  style={{
                    width: "100%",
                    height: 84,
                    border: "2px dashed #cbd5e1",
                    borderRadius: 12,
                    background: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {faviconUrl ? (
                    <img
                      src={faviconUrl}
                      alt="Favicon"
                      style={{
                        width: 36,
                        height: 36,
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
                        🖼️ Favicon Seç
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button
                    type="button"
                    onClick={() => setModalTarget("favicon")}
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, borderRadius: 8 }}
                  >
                    Favicon Değiştir
                  </button>
                  {faviconUrl && (
                    <button
                      type="button"
                      onClick={() => setFaviconUrl("")}
                      style={{
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      Kaldır
                    </button>
                  )}
                </div>
              </div>

              {/* Metin Logo Girişi */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Metin Logo (Logo Yoksa)
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: 13, padding: "10px 14px", borderRadius: 8 }}
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value)}
                  placeholder="Örn: MAĞAZA ADINIZ"
                />
                <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>
                  Header logosu yüklenmediğinde metin olarak gösterilir.
                </span>
              </div>
            </div>

            {/* 4. Admin Paneli Logo */}
            <div
              className="admin-card"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484" }}>
                    <ShieldCheck style={{ width: 16, height: 16 }} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                    Admin Paneli Logosu
                  </h4>
                </div>
                <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                  Yönetim paneli sol üst menüsünde görünür (200x50px yatay PNG / SVG).
                </p>
              </div>

              {/* Logo Preview & Upload */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  onClick={() => setModalTarget("admin")}
                  style={{
                    width: "100%",
                    height: 84,
                    border: "2px dashed #cbd5e1",
                    borderRadius: 12,
                    background: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {adminLogoUrl ? (
                    <img
                      src={adminLogoUrl}
                      alt="Admin Logo"
                      style={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        objectFit: "contain",
                        padding: 10,
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
                        🖼️ Admin Logosu Seç
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button
                    type="button"
                    onClick={() => setModalTarget("admin")}
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, borderRadius: 8 }}
                  >
                    Logoyu Değiştir
                  </button>
                  {adminLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setAdminLogoUrl("")}
                      style={{
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      Kaldır
                    </button>
                  )}
                </div>
              </div>

              {/* ALT Metni Input (Full Width!) */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Admin Logo Açıklaması
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: 13, padding: "10px 14px", borderRadius: 8 }}
                  value={adminLogoAlt}
                  onChange={(e) => setAdminLogoAlt(e.target.value)}
                  placeholder="Örn: Yönetim Paneli"
                />
              </div>

              {/* Height Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ color: "#334155" }}>YÜKSEKLİK:</span>
                  <span style={{ color: "#C98484", background: "#fcf7f6", padding: "2px 8px", borderRadius: 6, border: "1px solid #fed7aa" }}>
                    {adminLogoHeight}PX
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={adminLogoHeight}
                  onChange={(e) => setAdminLogoHeight(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#C98484" }}
                />
              </div>
            </div>

            {/* 5. Menü Kapalı Logo (Mini Rozet) */}
            <div
              className="admin-card"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484" }}>
                    <Layers3 style={{ width: 16, height: 16 }} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                    Menü Kapalı Logo (Mini Rozet)
                  </h4>
                </div>
                <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
                  Sol menü daraltıldığında görünen kare rozet ikon (64x64px).
                </p>
              </div>

              {/* Logo Preview & Upload */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div
                  onClick={() => setModalTarget("mini")}
                  style={{
                    width: "100%",
                    height: 84,
                    border: "2px dashed #cbd5e1",
                    borderRadius: 12,
                    background: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {miniLogoUrl ? (
                    <img
                      src={miniLogoUrl}
                      alt="Mini Logo"
                      style={{
                        maxHeight: 56,
                        maxWidth: 56,
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
                        🖼️ Mini Logo Seç
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button
                    type="button"
                    onClick={() => setModalTarget("mini")}
                    className="admin-btn admin-btn-secondary"
                    style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, borderRadius: 8 }}
                  >
                    Logoyu Değiştir
                  </button>
                  {miniLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setMiniLogoUrl("")}
                      style={{
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      Kaldır
                    </button>
                  )}
                </div>
              </div>

              {/* ALT Metni Input (Full Width!) */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Mini Logo Açıklaması
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: 13, padding: "10px 14px", borderRadius: 8 }}
                  value={miniLogoAlt}
                  onChange={(e) => setMiniLogoAlt(e.target.value)}
                  placeholder="Mini logo açıklaması"
                />
              </div>

              {/* Height Slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  <span style={{ color: "#334155" }}>BOYUT:</span>
                  <span style={{ color: "#C98484", background: "#fcf7f6", padding: "2px 8px", borderRadius: 6, border: "1px solid #fed7aa" }}>
                    {miniLogoHeight}PX
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={miniLogoHeight}
                  onChange={(e) => setMiniLogoHeight(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#C98484" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: TYPOGRAPHY ── */}
      {activeTab === "typography" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="admin-card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Section Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: "1px solid #f0f0f1" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C98484" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 7 4 4 20 4 20 7" />
                  <line x1="9" y1="20" x2="15" y2="20" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1d2327" }}>Genel Yazı Tipi & Başlıklar</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#94a3b8" }}>Site genelinde kullanılan font ve başlık boyutu ayarları</p>
              </div>
            </div>

            {/* Font & Base Size */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Genel Yazı Fontu (Body)
                </label>
                <select
                  className="admin-select"
                  style={{ width: "100%", fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                >
                  {SITE_FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Varsayılan Yazı Boyutu
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ fontSize: 13, padding: "10px 12px" }}
                  value={fontSizeBase}
                  onChange={(e) => setFontSizeBase(e.target.value)}
                  placeholder="Örn: 16px, 14px, 1rem"
                />
                <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>Tavsiye edilen: 15px veya 16px</span>
              </div>
            </div>

            {/* Heading sizes - 2x2 grid */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Başlık Boyutları</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px" }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1d2327" }}>H1 Başlık</span>
                    <span style={{ fontSize: 11, color: "#C98484", fontWeight: 600 }}>{h1Size}</span>
                  </label>
                  <input type="text" className="admin-input" style={{ fontSize: 13 }} value={h1Size} onChange={(e) => setH1Size(e.target.value)} placeholder="2.5rem" />
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px" }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1d2327" }}>H2 Başlık</span>
                    <span style={{ fontSize: 11, color: "#C98484", fontWeight: 600 }}>{h2Size}</span>
                  </label>
                  <input type="text" className="admin-input" style={{ fontSize: 13 }} value={h2Size} onChange={(e) => setH2Size(e.target.value)} placeholder="2rem" />
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px" }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1d2327" }}>H3 Başlık</span>
                    <span style={{ fontSize: 11, color: "#C98484", fontWeight: 600 }}>{h3Size}</span>
                  </label>
                  <input type="text" className="admin-input" style={{ fontSize: 13 }} value={h3Size} onChange={(e) => setH3Size(e.target.value)} placeholder="1.75rem" />
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px" }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1d2327" }}>H4 Başlık</span>
                    <span style={{ fontSize: 11, color: "#C98484", fontWeight: 600 }}>{h4Size}</span>
                  </label>
                  <input type="text" className="admin-input" style={{ fontSize: 13 }} value={h4Size} onChange={(e) => setH4Size(e.target.value)} placeholder="1.5rem" />
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Section Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: "1px solid #f0f0f1" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C98484" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1d2327" }}>Slider Özel Yazı Tipleri</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#94a3b8" }}>Ana sayfa slider bannerlarında kullanılan özel fontlar</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Slider Başlık Fontu
                </label>
                <select
                  className="admin-select"
                  style={{ width: "100%", fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                  value={sliderFontTitle}
                  onChange={(e) => setSliderFontTitle(e.target.value)}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Slider Açıklama Fontu
                </label>
                <select
                  className="admin-select"
                  style={{ width: "100%", fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                  value={sliderFontDesc}
                  onChange={(e) => setSliderFontDesc(e.target.value)}
                >
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── TAB: HEADER MENU ── */}
      {activeTab === "menu" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Live Preview Card */}
          <div
            className="admin-card"
            style={{
              background: "#1e293b",
              color: "#ffffff",
              borderRadius: 12,
              padding: 20,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                paddingBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#C98484",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                ⚡ Canlı Üst Menü Önizlemesi
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Hizalama: {headerMenuAlign} | Boyut: {headerMenuFontSize} | Boşluk: {headerMenuGap}
              </span>
            </div>

            {/* Mock Header Nav */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 8,
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent:
                  headerMenuAlign === "left"
                    ? "flex-start"
                    : headerMenuAlign === "right"
                    ? "flex-end"
                    : "center",
                overflowX: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: headerMenuGap,
                  fontFamily: fontFamily || "Poppins",
                  fontSize: headerMenuFontSize,
                  fontWeight: headerMenuFontWeight,
                  letterSpacing: headerMenuLetterSpacing,
                  textTransform: headerMenuTextTransform as any,
                  color: "#1e293b",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "#C98484", cursor: "pointer" }}>Ana Sayfa</span>
                <span style={{ cursor: "pointer" }}>Şarjlı Matkaplar</span>
                <span style={{ cursor: "pointer" }}>Kesme & Testere</span>
                <span style={{ cursor: "pointer" }}>Taşlama & Yüzey</span>
                <span style={{ cursor: "pointer" }}>El Aletleri</span>
                <span style={{ cursor: "pointer" }}>İletişim</span>
              </div>
            </div>
          </div>

          {/* Alignment & Position */}
          <div className="admin-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3
              style={{
                margin: "0 0 4px 0",
                fontSize: 16,
                fontWeight: 700,
                borderBottom: "1px solid #f0f0f1",
                paddingBottom: 10,
              }}
            >
              Menü Konumu & Hizalaması
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {/* Sol Yaslı */}
              <div
                onClick={() => setHeaderMenuAlign("left")}
                style={{
                  border: `2px solid ${headerMenuAlign === "left" ? "#C98484" : "#e2e8f0"}`,
                  borderRadius: 14,
                  padding: "20px 16px",
                  cursor: "pointer",
                  background: headerMenuAlign === "left" ? "#fcf7f6" : "#ffffff",
                  transition: "all 0.2s",
                  textAlign: "center",
                  boxShadow: headerMenuAlign === "left" ? "0 4px 14px rgba(201,132,132,0.15)" : "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                {/* Layout illustration */}
                <div style={{ background: headerMenuAlign === "left" ? "#fff0e0" : "#f8fafc", borderRadius: 8, padding: "10px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 28, height: 14, borderRadius: 4, background: headerMenuAlign === "left" ? "#C98484" : "#cbd5e1", flexShrink: 0 }} />
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <div style={{ width: 20, height: 6, borderRadius: 2, background: headerMenuAlign === "left" ? "#C98484" : "#94a3b8" }} />
                    <div style={{ width: 20, height: 6, borderRadius: 2, background: "#e2e8f0" }} />
                    <div style={{ width: 20, height: 6, borderRadius: 2, background: "#e2e8f0" }} />
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#e2e8f0" }} />
                </div>
                <strong style={{ display: "block", fontSize: 13, color: headerMenuAlign === "left" ? "#C98484" : "#1d2327", fontWeight: 700 }}>Sola Yaslı</strong>
                <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, display: "block", marginTop: 3 }}>Logonun hemen yanına yaslanır</span>
              </div>

              {/* Ortalı */}
              <div
                onClick={() => setHeaderMenuAlign("center")}
                style={{
                  border: `2px solid ${headerMenuAlign === "center" ? "#C98484" : "#e2e8f0"}`,
                  borderRadius: 14,
                  padding: "20px 16px",
                  cursor: "pointer",
                  background: headerMenuAlign === "center" ? "#fcf7f6" : "#ffffff",
                  transition: "all 0.2s",
                  textAlign: "center",
                  boxShadow: headerMenuAlign === "center" ? "0 4px 14px rgba(201,132,132,0.15)" : "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ background: headerMenuAlign === "center" ? "#fff0e0" : "#f8fafc", borderRadius: 8, padding: "10px 12px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ width: 28, height: 14, borderRadius: 4, background: headerMenuAlign === "center" ? "#C98484" : "#cbd5e1" }} />
                  <div style={{ display: "flex", gap: 4 }}>
                    <div style={{ width: 16, height: 6, borderRadius: 2, background: headerMenuAlign === "center" ? "#C98484" : "#94a3b8" }} />
                    <div style={{ width: 16, height: 6, borderRadius: 2, background: "#e2e8f0" }} />
                    <div style={{ width: 16, height: 6, borderRadius: 2, background: "#e2e8f0" }} />
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#e2e8f0" }} />
                </div>
                <strong style={{ display: "block", fontSize: 13, color: headerMenuAlign === "center" ? "#C98484" : "#1d2327", fontWeight: 700 }}>Ortalı (Varsayılan)</strong>
                <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, display: "block", marginTop: 3 }}>Header alanının tam ortasında durur</span>
              </div>

              {/* Sağa Yaslı */}
              <div
                onClick={() => setHeaderMenuAlign("right")}
                style={{
                  border: `2px solid ${headerMenuAlign === "right" ? "#C98484" : "#e2e8f0"}`,
                  borderRadius: 14,
                  padding: "20px 16px",
                  cursor: "pointer",
                  background: headerMenuAlign === "right" ? "#fcf7f6" : "#ffffff",
                  transition: "all 0.2s",
                  textAlign: "center",
                  boxShadow: headerMenuAlign === "right" ? "0 4px 14px rgba(201,132,132,0.15)" : "0 1px 4px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ background: headerMenuAlign === "right" ? "#fff0e0" : "#f8fafc", borderRadius: 8, padding: "10px 12px", marginBottom: 12, display: "flex", alignItems: "center" }}>
                  <div style={{ width: 28, height: 14, borderRadius: 4, background: headerMenuAlign === "right" ? "#C98484" : "#cbd5e1", flexShrink: 0 }} />
                  <div style={{ flex: 1 }} />
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <div style={{ width: 16, height: 6, borderRadius: 2, background: "#e2e8f0" }} />
                    <div style={{ width: 16, height: 6, borderRadius: 2, background: "#e2e8f0" }} />
                    <div style={{ width: 16, height: 6, borderRadius: 2, background: headerMenuAlign === "right" ? "#C98484" : "#94a3b8" }} />
                  </div>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#e2e8f0", marginLeft: 6 }} />
                </div>
                <strong style={{ display: "block", fontSize: 13, color: headerMenuAlign === "right" ? "#C98484" : "#1d2327", fontWeight: 700 }}>Sağa Yaslı</strong>
                <span style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, display: "block", marginTop: 3 }}>Arama ve hesap ikonlarının yanına yaslanır</span>
              </div>
            </div>
          </div>

          {/* Typography & Spacing Controls */}
          <div className="admin-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h3
              style={{
                margin: "0 0 4px 0",
                fontSize: 16,
                fontWeight: 700,
                borderBottom: "1px solid #f0f0f1",
                paddingBottom: 10,
              }}
            >
              Yazı Boyutu, Boşluklar & Harf Stil Ayarları
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Font Size */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#1d2327" }}>
                  Menü Yazı Boyutu: <span style={{ color: "#C98484" }}>{headerMenuFontSize}</span>
                </label>
                <select
                  className="admin-select"
                  style={{ width: "100%" }}
                  value={headerMenuFontSize}
                  onChange={(e) => setHeaderMenuFontSize(e.target.value)}
                >
                  <option value="11px">11px - Ekstra Küçük</option>
                  <option value="12px">12px - Küçük</option>
                  <option value="13px">13px - Standart (Önerilen)</option>
                  <option value="14px">14px - Orta</option>
                  <option value="15px">15px - Büyük</option>
                  <option value="16px">16px - Ekstra Büyük</option>
                </select>
              </div>

              {/* Menu Gap */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#1d2327" }}>
                  İki Menü Elemanı Arasındaki Boşluk: <span style={{ color: "#C98484" }}>{headerMenuGap}</span>
                </label>
                <select
                  className="admin-select"
                  style={{ width: "100%" }}
                  value={headerMenuGap}
                  onChange={(e) => setHeaderMenuGap(e.target.value)}
                >
                  <option value="8px">8px - Sıkışık</option>
                  <option value="12px">12px - Dar</option>
                  <option value="16px">16px - Standart (Önerilen)</option>
                  <option value="20px">20px - Rahat</option>
                  <option value="24px">24px - Geniş</option>
                  <option value="32px">32px - Ekstra Geniş</option>
                </select>
              </div>

              {/* Letter Spacing */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#1d2327" }}>
                  Harfler Arasındaki Boşluk (Letter Spacing): <span style={{ color: "#C98484" }}>{headerMenuLetterSpacing}</span>
                </label>
                <select
                  className="admin-select"
                  style={{ width: "100%" }}
                  value={headerMenuLetterSpacing}
                  onChange={(e) => setHeaderMenuLetterSpacing(e.target.value)}
                >
                  <option value="0">0 - Normal Harf Aralığı</option>
                  <option value="0.025em">0.025em - Hafif Geniş</option>
                  <option value="0.05em">0.05em - Geniş</option>
                  <option value="0.1em">0.1em - Çok Geniş</option>
                </select>
              </div>

              {/* Font Weight */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#1d2327" }}>
                  Yazı Kalınlığı (Font Weight): <span style={{ color: "#C98484" }}>{headerMenuFontWeight}</span>
                </label>
                <select
                  className="admin-select"
                  style={{ width: "100%" }}
                  value={headerMenuFontWeight}
                  onChange={(e) => setHeaderMenuFontWeight(e.target.value)}
                >
                  <option value="400">400 - Normal</option>
                  <option value="500">500 - Orta (Medium)</option>
                  <option value="600">600 - Yarı Kalın (SemiBold - Önerilen)</option>
                  <option value="700">700 - Kalın (Bold)</option>
                  <option value="800">800 - Ekstra Kalın (ExtraBold)</option>
                </select>
              </div>

              {/* Text Transform */}
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#1d2327" }}>
                  Harf Düzeni (Text Transform): <span style={{ color: "#C98484" }}>{headerMenuTextTransform}</span>
                </label>
                <select
                  className="admin-select"
                  style={{ width: "100%" }}
                  value={headerMenuTextTransform}
                  onChange={(e) => setHeaderMenuTextTransform(e.target.value)}
                >
                  <option value="none">Normal (Verildiği Gibi)</option>
                  <option value="uppercase">BÜYÜK HARF (UPPERCASE)</option>
                  <option value="capitalize">Baş Harfleri Büyük (Capitalize)</option>
                  <option value="lowercase">küçük harf (lowercase)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SEO & GOOGLE ── */}
      {/* ── TAB 3: SEO & GOOGLE ── */}
      {activeTab === "seo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Header Banner */}
          <div
            className="admin-card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              background: "linear-gradient(135deg, #ffffff 0%, #fcf7f6 100%)",
              border: "1px solid #fed7aa",
              padding: "20px 24px",
              borderRadius: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#C98484",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 8px 16px rgba(201, 132, 132, 0.25)",
                  flexShrink: 0,
                }}
              >
                <Globe style={{ width: 24, height: 24 }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1d2327" }}>
                  Google & SEO Yönetim Merkezi
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>
                  Arama motoru görünürlüğü, Meta başlıklar, Google Search Console & Analytics entegrasyonu.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="admin-btn admin-btn-primary"
              style={{
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 10,
              }}
            >
              <Save style={{ width: 16, height: 16 }} />
              {saving ? "Kaydediliyor..." : saved ? "✓ Kaydedildi" : "SEO Ayarlarını Kaydet"}
            </button>
          </div>

          {/* Live Google Search Preview (SERP Snippet) */}
          <div
            className="admin-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284c7" }}>
                  <Globe style={{ width: 16, height: 16 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Canlı Google Arama Sonucu Önizlemesi (SERP Snippet)
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#0284c7", background: "#f0f9ff", padding: "4px 10px", borderRadius: 20 }}>
                Google Aramalarında Böyle Görünecek
              </span>
            </div>

            {/* Google Result Mock Box */}
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "18px 20px", border: "1px solid #e2e8f0", width: "100%", boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 800 }}>
                  {(logoText || "M").charAt(0).toUpperCase()}
                </div>
                <div style={{ fontSize: 12, color: "#475569" }}>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>{logoText || "Mağaza Adı"}</span>
                  <span style={{ color: "#94a3b8", marginLeft: 6 }}>{seoCanonicalUrl || "https://www.magazaniz.com"}</span>
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#1a0dab", textDecoration: "none", cursor: "pointer", lineHeight: 1.3, marginBottom: 6 }}>
                {seoMetaTitle || "Mağaza Başlığı | Slogan veya Kısa Tanıtım"}
              </div>
              <div style={{ fontSize: 13, color: "#4d5156", lineHeight: 1.5 }}>
                {seoMetaDescription || "Mağazamızın kaliteli ürünleri, hızlı teslimat ve güvenli ödeme seçenekleri ile hemen alışverişe başlayın."}
              </div>
            </div>
          </div>

          {/* ── OTOMATİK SEO BAŞLIK ŞABLONLARI ── */}
          <div
            className="admin-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid #f1f5f9", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484", border: "1px solid #fed7aa", flexShrink: 0 }}>
                  <Sparkles style={{ width: 20, height: 20 }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e293b" }}>
                    Otomatik SEO Başlık Şablonları
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                    Ürünler, kategoriler ve sayfalar için Google ve tarayıcı sekmesi başlık yapısını belirleyin.
                  </p>
                </div>
              </div>

              {/* Title Separator Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", padding: "6px 12px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>Başlık Ayracı:</span>
                {["|", "-", "•", "—"].map((sep) => (
                  <button
                    key={sep}
                    type="button"
                    onClick={() => setSeoTitleSeparator(sep)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 800,
                      border: seoTitleSeparator === sep ? "2px solid #C98484" : "1px solid #cbd5e1",
                      background: seoTitleSeparator === sep ? "#fcf7f6" : "#ffffff",
                      color: seoTitleSeparator === sep ? "#C98484" : "#334155",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {sep}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-tabs for template types */}
            <AdminTabs label="SEO şablonları"
              value={activeSeoTemplateTab}
              onChange={setActiveSeoTemplateTab}
              items={[{ value: "products", label: "Ürün Sayfaları" }, { value: "categories", label: "Kategori Sayfaları" }, { value: "brands", label: "Marka Sayfaları" }, { value: "pages", label: "Kurumsal Sayfalar" }]}/>

            {/* Tab 1: Product SEO Template */}
            {activeSeoTemplateTab === "products" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
                      Ürün Sayfası Başlık Şablonu
                    </label>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Varsayılan: %urun_adi% %ayirici% %site_adi%</span>
                  </div>

                  {/* Clickable tokens relevant for products */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Değişkenler:</span>
                    {[
                      { tag: "%urun_adi%", label: "Ürün Adı" },
                      { tag: "%kategori%", label: "Kategori" },
                      { tag: "%marka%", label: "Marka" },
                      { tag: "%site_adi%", label: "Site Adı" },
                      { tag: "%ayirici%", label: "Ayraç" },
                    ].map(({ tag, label }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSeoProductTitleTemplate((prev) => prev ? prev + " " + tag : tag)}
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #cbd5e1",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        + <span style={{ color: "#C98484" }}>{tag}</span> ({label})
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    className="admin-input"
                    value={seoProductTitleTemplate}
                    onChange={(e) => setSeoProductTitleTemplate(e.target.value)}
                    placeholder="%urun_adi% %ayirici% %site_adi%"
                    style={{ width: "100%", fontSize: 13, padding: "10px 14px", borderRadius: 8 }}
                  />
                </div>

                {/* Example SERP Preview */}
                <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>
                    🔍 Google & Tarayıcı Sekmesi Canlı Önizlemesi:
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#1a0dab" }}>
                    {seoProductTitleTemplate
                      .replace(/%urun_adi%/gi, "2000W Bakır Sargılı Metal Kesme Makinesi")
                      .replace(/%ayirici%/gi, seoTitleSeparator)
                      .replace(/%site_adi%/gi, logoText || "ZK Home")
                      .replace(/%marka%/gi, "ZK Home")
                      .replace(/%kategori%/gi, "Kesme & Testere")}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Category SEO Template */}
            {activeSeoTemplateTab === "categories" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
                      Kategori Sayfası Başlık Şablonu
                    </label>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Varsayılan: %kategori% Modelleri %ayirici% %site_adi%</span>
                  </div>

                  {/* Clickable tokens relevant for categories */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Değişkenler:</span>
                    {[
                      { tag: "%kategori%", label: "Kategori" },
                      { tag: "%site_adi%", label: "Site Adı" },
                      { tag: "%ayirici%", label: "Ayraç" },
                    ].map(({ tag, label }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSeoCategoryTitleTemplate((prev) => prev ? prev + " " + tag : tag)}
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #cbd5e1",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        + <span style={{ color: "#C98484" }}>{tag}</span> ({label})
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    className="admin-input"
                    value={seoCategoryTitleTemplate}
                    onChange={(e) => setSeoCategoryTitleTemplate(e.target.value)}
                    placeholder="%kategori% Modelleri %ayirici% %site_adi%"
                    style={{ width: "100%", fontSize: 13, padding: "10px 14px", borderRadius: 8 }}
                  />
                </div>

                {/* Example Preview */}
                <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>
                    🔍 Google & Tarayıcı Sekmesi Canlı Önizlemesi:
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#1a0dab" }}>
                    {seoCategoryTitleTemplate
                      .replace(/%kategori%/gi, "Ahşap & Metal Kesme")
                      .replace(/%ayirici%/gi, seoTitleSeparator)
                      .replace(/%site_adi%/gi, logoText || "ZK Home")}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Brand SEO Template */}
            {activeSeoTemplateTab === "brands" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
                      Marka Sayfası Başlık Şablonu
                    </label>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Varsayılan: %marka% Ürünleri %ayirici% %site_adi%</span>
                  </div>

                  {/* Clickable tokens relevant for brands */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Değişkenler:</span>
                    {[
                      { tag: "%marka%", label: "Marka" },
                      { tag: "%site_adi%", label: "Site Adı" },
                      { tag: "%ayirici%", label: "Ayraç" },
                    ].map(({ tag, label }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSeoBrandTitleTemplate((prev) => prev ? prev + " " + tag : tag)}
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #cbd5e1",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        + <span style={{ color: "#C98484" }}>{tag}</span> ({label})
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    className="admin-input"
                    value={seoBrandTitleTemplate}
                    onChange={(e) => setSeoBrandTitleTemplate(e.target.value)}
                    placeholder="%marka% Ürünleri %ayirici% %site_adi%"
                    style={{ width: "100%", fontSize: 13, padding: "10px 14px", borderRadius: 8 }}
                  />
                </div>

                {/* Example Preview */}
                <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>
                    🔍 Google & Tarayıcı Sekmesi Canlı Önizlemesi:
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#1a0dab" }}>
                    {seoBrandTitleTemplate
                      .replace(/%marka%/gi, "ZK Home")
                      .replace(/%ayirici%/gi, seoTitleSeparator)
                      .replace(/%site_adi%/gi, logoText || "ZK Home")}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Static Pages SEO Template */}
            {activeSeoTemplateTab === "pages" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
                      Kurumsal Sayfalar Başlık Şablonu
                    </label>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Varsayılan: %sayfa_adi% %ayirici% %site_adi%</span>
                  </div>

                  {/* Clickable tokens relevant for pages */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Değişkenler:</span>
                    {[
                      { tag: "%sayfa_adi%", label: "Sayfa Adı" },
                      { tag: "%site_adi%", label: "Site Adı" },
                      { tag: "%ayirici%", label: "Ayraç" },
                    ].map(({ tag, label }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSeoPageTitleTemplate((prev) => prev ? prev + " " + tag : tag)}
                        style={{
                          background: "#f8fafc",
                          border: "1px solid #cbd5e1",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        + <span style={{ color: "#C98484" }}>{tag}</span> ({label})
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    className="admin-input"
                    value={seoPageTitleTemplate}
                    onChange={(e) => setSeoPageTitleTemplate(e.target.value)}
                    placeholder="%sayfa_adi% %ayirici% %site_adi%"
                    style={{ width: "100%", fontSize: 13, padding: "10px 14px", borderRadius: 8 }}
                  />
                </div>

                {/* Example Preview */}
                <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>
                    🔍 Google & Tarayıcı Sekmesi Canlı Önizlemesi:
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#1a0dab" }}>
                    {seoPageTitleTemplate
                      .replace(/%sayfa_adi%/gi, "Hakkımızda")
                      .replace(/%ayirici%/gi, seoTitleSeparator)
                      .replace(/%site_adi%/gi, logoText || "ZK Home")}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Section 1: Meta Etiketleri */}
          <div
            className="admin-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484", flexShrink: 0 }}>
                <FileText style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                  Temel Meta Etiketleri
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  Google ve diğer arama motorları için sayfa başlığı, açıklaması ve anahtar kelimeleri.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Meta Title */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Site Meta Başlığı (Title) <span style={{ color: "#C98484" }}>*</span>
                  </label>
                  <span style={{ fontSize: 11, fontWeight: 700, color: seoMetaTitle.length >= 50 && seoMetaTitle.length <= 65 ? "#16a34a" : "#64748b" }}>
                    {seoMetaTitle.length} / 60 karakter
                  </span>
                </div>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: 14, padding: "12px 14px", borderRadius: 10 }}
                  value={seoMetaTitle}
                  onChange={(e) => setSeoMetaTitle(e.target.value)}
                  placeholder="Örn: Mağaza Başlığı | Slogan veya Kısa Tanıtım"
                />
                <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>
                  Önerilen: 50-60 karakter. Marka adı ve ana ürün kategorilerini içermelidir.
                </span>
              </div>

              {/* Canonical URL */}
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Kanonik Adres (Canonical URL)
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: 14, padding: "12px 14px", borderRadius: 10 }}
                  value={seoCanonicalUrl}
                  onChange={(e) => setSeoCanonicalUrl(e.target.value)}
                  placeholder="https://www.magazaniz.com"
                />
                <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>
                  Sitenin ana URL adresi (https:// ile başlayan).
                </span>
              </div>
            </div>

            {/* Meta Description */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Meta Açıklama (Description) <span style={{ color: "#C98484" }}>*</span>
                </label>
                <span style={{ fontSize: 11, fontWeight: 700, color: seoMetaDescription.length >= 120 && seoMetaDescription.length <= 160 ? "#16a34a" : "#64748b" }}>
                  {seoMetaDescription.length} / 160 karakter
                </span>
              </div>
              <textarea
                className="admin-input"
                rows={4}
                style={{ width: "100%", boxSizing: "border-box", fontSize: 13, lineHeight: 1.6, padding: "12px 14px", borderRadius: 10, resize: "vertical" }}
                value={seoMetaDescription}
                onChange={(e) => setSeoMetaDescription(e.target.value)}
                placeholder="Google aramalarında sitenizin altında görünecek çekici ve açıklayıcı özet metni..."
              />
              <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>
                Önerilen: 120-160 karakter. Tıklama oranını (CTR) artırmak için ilgi çekici olmalıdır.
              </span>
            </div>

            {/* Meta Keywords */}
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Meta Anahtar Kelimeler (Keywords)
              </label>
              <input
                type="text"
                className="admin-input"
                style={{ width: "100%", boxSizing: "border-box", fontSize: 14, padding: "12px 14px", borderRadius: 10 }}
                value={seoMetaKeywords}
                onChange={(e) => setSeoMetaKeywords(e.target.value)}
                placeholder="Örn: e-ticaret, alışveriş, kaliteli ürünler, indirim"
              />
              <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "block" }}>
                Virgülle ayırarak giriniz (örn: şarjlı matkap, hırdavat, el aletleri).
              </span>
            </div>
          </div>

          {/* Section 2: Google & Analitik Entegrasyonları */}
          <div
            className="admin-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a", flexShrink: 0 }}>
                <ShieldCheck style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                  Google Entegrasyonları
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  Google Search Console doğrulama kodu ve Google Analytics 4 (GA4) kimliği.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Google Analytics 4 (GA4) Ölçüm Kimliği
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: 13, padding: "10px 12px", background: "#ffffff", borderRadius: 8, fontFamily: "monospace" }}
                  value={seoGa4Id}
                  onChange={(e) => setSeoGa4Id(e.target.value)}
                  placeholder="Ölçüm kimliğinizi girin"
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 6, display: "block", lineHeight: 1.4 }}>
                  Google Analytics 4 veri akışı kimliğiniz (G- ile başlar).
                </span>
              </div>

              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Google Tag Manager (GTM)
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: 13, padding: "10px 12px", background: "#ffffff", borderRadius: 8, fontFamily: "monospace" }}
                  value={seoGtmId}
                  onChange={(e) => setSeoGtmId(e.target.value)}
                  placeholder="GTM-XXXXXXX"
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 6, display: "block", lineHeight: 1.4 }}>
                  Google Tag Manager konteyner kimliğiniz.
                </span>
              </div>

              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Google Search Console
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: "100%", boxSizing: "border-box", fontSize: 13, padding: "10px 12px", background: "#ffffff", borderRadius: 8 }}
                  value={seoGoogleVerification}
                  onChange={(e) => setSeoGoogleVerification(e.target.value)}
                  placeholder="google-site-verification=..."
                />
                <span style={{ fontSize: 11, color: "#64748b", marginTop: 6, display: "block", lineHeight: 1.4 }}>
                  HTML meta doğrulama kodu.
                </span>
              </div>
            </div>
          </div>

          {/* Section: Özel Head & Body Kodları (Google Tag, Pixel, Özel JS) */}
          <div
            className="admin-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb", flexShrink: 0 }}>
                  <Code style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                    Özel Kod Entegrasyonları (&lt;head&gt; ve &lt;body&gt;)
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                    Google tag (gtag.js), Meta Pixel, TikTok Pixel, Yandex Metrika veya özel takip kodlarınızı buraya yapıştırabilirsiniz.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const measurementId = seoGa4Id.trim()
                  if (!measurementId) return
                  setCustomHeadScripts(`<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n\n  gtag('config', '${measurementId}');\n</script>`)
                }}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#2563eb",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  padding: "6px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                + Google Analytics Şablonunu Doldur
              </button>
            </div>

            {/* Custom Head Scripts */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  &lt;head&gt; Bölümüne Eklenecek Kodlar (Header Scripts)
                </label>
                <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700, background: "#ecfdf5", padding: "2px 8px", borderRadius: 6 }}>
                  Otomatik Canlı Enjeksiyon
                </span>
              </div>
              <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px 0" }}>
                Google Analytics gtag.js, Google Tag Manager script kodu veya Meta Pixel gibi &lt;head&gt; arasına konulması gereken tüm kodları doğrudan yapıştırabilirsiniz.
              </p>
              <textarea
                rows={7}
                value={customHeadScripts}
                onChange={(e) => setCustomHeadScripts(e.target.value)}
                placeholder="Yeni ZK Home analiz kodlarını buraya ekleyin."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 12,
                  lineHeight: 1.5,
                  background: "#0f172a",
                  color: "#38bdf8",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid #334155",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Custom Body Scripts */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  &lt;body&gt; Bölümüne Eklenecek Kodlar (Body / Footer Scripts)
                </label>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  GTM Noscript veya Canlı Destek Widget'ları
                </span>
              </div>
              <textarea
                rows={4}
                value={customBodyScripts}
                onChange={(e) => setCustomBodyScripts(e.target.value)}
                placeholder={'<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>'}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  fontSize: 12,
                  lineHeight: 1.5,
                  background: "#0f172a",
                  color: "#38bdf8",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1px solid #334155",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          {/* Section 3: Sosyal Medya Paylaşım Görseli (Open Graph) */}
          <div
            className="admin-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#c026d3", flexShrink: 0 }}>
                <Globe style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                  Sosyal Medya Paylaşım Görseli (Open Graph Image)
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  WhatsApp, Facebook veya Twitter'da sitenizin linki paylaşıldığında otomatik gösterilen önizleme kapağı.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 24, background: "#f8fafc", padding: "18px 20px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <div
                onClick={() => setModalTarget("og_image")}
                style={{
                  width: 220,
                  height: 115,
                  border: "2px dashed #cbd5e1",
                  borderRadius: 10,
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {seoOgImageUrl ? (
                  <img
                    src={seoOgImageUrl}
                    alt="OG Image"
                    style={{
                      maxHeight: "100%",
                      maxWidth: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: 12 }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>🖼️</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                      Görsel Seç / Yükle
                    </span>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setModalTarget("og_image")}
                    className="admin-btn admin-btn-primary"
                    style={{ padding: "8px 18px", fontSize: 12, fontWeight: 700, borderRadius: 8 }}
                  >
                    {seoOgImageUrl ? "Görseli Değiştir" : "Görsel Yükle / Seç"}
                  </button>
                  {seoOgImageUrl && (
                    <button
                      type="button"
                      onClick={() => setSeoOgImageUrl("")}
                      style={{
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        color: "#dc2626",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "8px 14px",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      Görseli Kaldır
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                  Önerilen boyut: <strong>1200 x 630 piksel</strong> (1.91:1 yatay oran). PNG veya JPG formatında şık bir marka görseli kullanılması önerilir.
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Arama Motoru İndeksleme İzni */}
          <div
            className="admin-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: seoIndexingEnabled ? "#dcfce7" : "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: seoIndexingEnabled ? "#16a34a" : "#dc2626",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                  Arama Motoru İndeksleme İzni (Google Indexing)
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  {seoIndexingEnabled
                    ? "Siteniz arama motorları tarafından indekslenmeye açık (index, follow - robots.txt ve meta robots etkin)."
                    : "Siteniz arama motorlarına kapalı (noindex, nofollow - arama sonuçlarında çıkmaz)."}
                </p>
              </div>
            </div>

            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                background: seoIndexingEnabled ? "#f0fdf4" : "#fef2f2",
                padding: "10px 20px",
                borderRadius: 12,
                border: `1px solid ${seoIndexingEnabled ? "#bbf7d0" : "#fecaca"}`,
                transition: "all 0.2s",
              }}
            >
              <input
                type="checkbox"
                checked={seoIndexingEnabled}
                onChange={(e) => setSeoIndexingEnabled(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: "#C98484", cursor: "pointer" }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: seoIndexingEnabled ? "#16a34a" : "#dc2626",
                }}
              >
                {seoIndexingEnabled ? "İNDEKSLENMEYE AÇIK" : "KAPALI (NOINDEX)"}
              </span>
            </label>
          </div>
        </div>
      )}


      {/* ── TAB 4: ICON LIBRARY ── */}
      {activeTab === "icons" && (
        <div
          className="admin-card"
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div
            style={{
              borderBottom: "1px solid #f0f0f1",
              paddingBottom: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#1d2327",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C98484"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
                <span>Kurumsal İkon Kütüphanesi</span>
              </h3>
              <p
                style={{ margin: "4px 0 0 0", fontSize: 12, color: "#646970" }}
              >
                Sitede, ürünlerde, kategorilerde, menülerde ve slider
                alanlarında kullandığınız tüm kurumsal SVG ikonlar.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={() => setModalTarget("custom_icon")}
                className="admin-btn admin-btn-primary"
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <span>Özel İkon Yükle / Seç</span>
              </button>

              <AdminTabs label="İkon kategorileri"
                value={iconCategory}
                onChange={setIconCategory}
                items={[{ value: "all", label: "Tümü", count: SELECTABLE_ICONS.length }, { value: "hirdavat", label: "Hırdavat & Aletler" }, { value: "magaza", label: "Mağaza & Kargo" }, { value: "kurumsal", label: "Kurumsal" }, ...(customIcons.length ? [{ value: "custom" as const, label: "Özel İkonlar", count: customIcons.length }] : [])]}/>

              <input
                type="text"
                className="admin-input"
                placeholder="İkon ara..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                style={{ width: 160, fontSize: 12 }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 14,
            }}
          >
            {/* Custom Uploaded Image Icons */}
            {(iconCategory === "all" || iconCategory === "custom") &&
              customIcons
                .filter(
                  (item) =>
                    item.label
                      .toLowerCase()
                      .includes(iconSearch.toLowerCase()) ||
                    item.name.toLowerCase().includes(iconSearch.toLowerCase())
                )
                .map((item) => (
                  <div
                    key={item.url}
                    onClick={() => {
                      navigator.clipboard.writeText(item.url)
                      setCopiedIcon(item.url)
                      setTimeout(() => setCopiedIcon(null), 2000)
                    }}
                    style={{
                      border: "1px solid #C98484",
                      borderRadius: 8,
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      background: "#fff",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: "#fafafa",
                        border: "1px solid #edf2f7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 8,
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.label}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#1d2327",
                        textAlign: "center",
                        marginBottom: 2,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: "#C98484",
                        fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {copiedIcon === item.url
                        ? "✓ URL Kopyalandı"
                        : "Özel İkon"}
                    </span>
                  </div>
                ))}

            {/* Preset SVG Icons */}
            {iconCategory !== "custom" &&
              SELECTABLE_ICONS.filter((item) => {
                const matchesCat =
                  iconCategory === "all" || item.category === iconCategory
                const matchesSearch =
                  item.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
                  item.name.toLowerCase().includes(iconSearch.toLowerCase())
                return matchesCat && matchesSearch
              }).map((item) => (
                <div
                  key={item.name}
                  onClick={() => {
                    navigator.clipboard.writeText(item.name)
                    setCopiedIcon(item.name)
                    setTimeout(() => setCopiedIcon(null), 2000)
                  }}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    background: "#fafafa",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#C98484"
                    e.currentTarget.style.background = "#fff"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0"
                    e.currentTarget.style.background = "#fafafa"
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: "#fff",
                      border: "1px solid #edf2f7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#C98484",
                      marginBottom: 8,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    {item.icon}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#1d2327",
                      textAlign: "center",
                      marginBottom: 2,
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#646970",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {copiedIcon === item.name ? "✓ Kopyalandı" : item.name}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: FOOTER & GÜVENCE AYARLARI ── */}
      {activeTab === "footer" && (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
          {/* Header Banner */}
          <div
            className="admin-card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              background: "linear-gradient(135deg, #ffffff 0%, #fcf7f6 100%)",
              border: "1px solid #fed7aa",
              padding: "20px 24px",
              borderRadius: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: "#C98484",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 8px 16px rgba(201, 132, 132, 0.25)",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck style={{ width: 24, height: 24 }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1d2327" }}>
                  Footer & Güvence Yönetim Merkezi
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>
                  Sayfa altı (footer) logosu, sütun başlıkları, iletişim bilgileri, sosyal medya ve güvence ikonları.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="admin-btn admin-btn-primary"
              style={{
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 10,
              }}
            >
              <Save style={{ width: 16, height: 16 }} />
              {saving ? "Kaydediliyor..." : saved ? "✓ Kaydedildi" : "Footer Ayarlarını Kaydet"}
            </button>
          </div>

          {/* Active / Passive Toggle Card */}
          <div
            className="admin-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: footerFeaturesActive ? "#dcfce7" : "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: footerFeaturesActive ? "#16a34a" : "#dc2626",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                  Footer Güvence Bandı Durumu
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  Bu alanı pasif yaparsanız footer üstündeki 4'lü güvence kutuları (Hızlı Teslimat, Güvenli Alışveriş vb.) gizlenir.
                </p>
              </div>
            </div>

            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                background: footerFeaturesActive ? "#f0fdf4" : "#fef2f2",
                padding: "10px 20px",
                borderRadius: 12,
                border: `1px solid ${footerFeaturesActive ? "#bbf7d0" : "#fecaca"}`,
                transition: "all 0.2s",
              }}
            >
              <input
                type="checkbox"
                checked={footerFeaturesActive}
                onChange={(e) => setFooterFeaturesActive(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: "#C98484", cursor: "pointer" }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: footerFeaturesActive ? "#16a34a" : "#dc2626",
                }}
              >
                {footerFeaturesActive ? "AKTİF" : "PASİF"}
              </span>
            </label>
          </div>

          {/* Row 1: Logo & Marka Tanıtım Metni (Spacious 2-Column Grid!) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Left: Footer Logo Controls */}
            <div
              className="admin-card"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484", flexShrink: 0 }}>
                  <Building2 style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                    Footer Logosu (Koyu Zemin)
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                    Koyu footer zemininde görünür. Şeffaf PNG/SVG önerilir.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                <div
                  onClick={() => setModalTarget("footer_dark")}
                  style={{
                    width: 140,
                    height: 64,
                    border: "2px dashed #cbd5e1",
                    borderRadius: 8,
                    background: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {footerLogoDarkUrl || footerLogoUrl ? (
                    <img
                      src={footerLogoDarkUrl || footerLogoUrl}
                      alt="Footer Logo"
                      style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain", padding: 6 }}
                    />
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textAlign: "center" }}>
                      🖼️ Logo Seç
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setModalTarget("footer_dark")}
                      className="admin-btn admin-btn-primary"
                      style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, borderRadius: 8 }}
                    >
                      Logoyu Değiştir
                    </button>
                    {(footerLogoDarkUrl || footerLogoUrl) && (
                      <button
                        type="button"
                        onClick={() => { setFooterLogoDarkUrl(""); setFooterLogoUrl(""); }}
                        style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#fee2e2", border: "1px solid #fecaca", padding: "6px 10px", borderRadius: 8, cursor: "pointer" }}
                      >
                        Kaldır
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    Tavsiye edilen: 200x50px yatay beyaz/açık renk logo
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ color: "#334155" }}>YÜKSEKLİK:</span>
                    <span style={{ color: "#C98484" }}>{footerLogoHeight}PX</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    value={footerLogoHeight}
                    onChange={(e) => setFooterLogoHeight(parseInt(e.target.value))}
                    style={{ width: "100%", accentColor: "#C98484" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#334155" }}>
                    SEO ALT METNİ
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ fontSize: 12, padding: "8px 10px", borderRadius: 8 }}
                    value={footerLogoAlt}
                    onChange={(e) => setFooterLogoAlt(e.target.value)}
                    placeholder="Footer Logo Alt açıklaması"
                  />
                </div>
              </div>
            </div>

            {/* Right: Brand Description Textarea */}
            <div
              className="admin-card"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484", flexShrink: 0 }}>
                  <FileText style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                    Marka / Şirket Tanıtım Metni
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                    Footer sol sütununda logonun altında gösterilen kısa açıklama.
                  </p>
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Tanıtım Paragrafı
                </label>
                <textarea
                  className="admin-input"
                  style={{ flex: 1, minHeight: 120, resize: "vertical", fontSize: 13, lineHeight: 1.6, padding: "12px 14px", borderRadius: 10 }}
                  value={footerDescription}
                  onChange={(e) => setFooterDescription(e.target.value)}
                  placeholder="Profesyonellere özel el aletleri, hırdavat, atölye ekipmanları ve bahçe makinelerinde güvenilir çözüm ortağınız."
                />
              </div>
            </div>
          </div>

          {/* Row 2: İletişim Bilgileri & Footer Sütun Başlıkları (Spacious 2 Columns!) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Card 1: İletişim Bilgileri */}
            <div
              className="admin-card"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484", flexShrink: 0 }}>
                  <Phone style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                    İletişim & Destek Bilgileri
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                    Footer alanında gösterilen telefon, e-posta ve adres.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Telefon Numarası
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="[Telefon yönetim panelinden eklenecektir]"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    E-Posta Adresi
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder=""
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Fiziksel Adres / Şehir
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    placeholder="Firmanızın açık adresi"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Footer Sütun Başlıkları */}
            <div
              className="admin-card"
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484", flexShrink: 0 }}>
                  <Layers3 style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                    Footer Menü Sütun Başlıkları
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                    Footer menü linklerinin üzerinde yer alan başlık metinleri.
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Sütun 2 (Kurumsal)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                    value={footerCol2Title}
                    onChange={(e) => setFooterCol2Title(e.target.value)}
                    placeholder="KURUMSAL"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Sütun 3 (Müşteri Hiz.)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                    value={footerCol3Title}
                    onChange={(e) => setFooterCol3Title(e.target.value)}
                    placeholder="MÜŞTERİ HİZMETLERİ"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Sütun 4 (Yasal)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                    value={footerCol4Title}
                    onChange={(e) => setFooterCol4Title(e.target.value)}
                    placeholder="YASAL BİLGİLENDİRME"
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Sütun 5 (Sosyal)
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                    value={footerCol5Title}
                    onChange={(e) => setFooterCol5Title(e.target.value)}
                    placeholder="BİZİ TAKİP EDİN"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Sosyal Medya Bağlantıları & Bülten Metni (Full Width Card!) */}
          <div
            className="admin-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fdf4ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#c026d3", flexShrink: 0 }}>
                <Globe style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                  Sosyal Medya Bağlantıları & Bülten Açıklaması
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  Footer ve menülerde yer alan resmi sosyal medya hesap bağlantıları.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Instagram URL
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  placeholder="https://instagram.com/hesabiniz"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Facebook URL
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                  placeholder="https://facebook.com/hesabiniz"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  YouTube URL
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                  value={socialYoutube}
                  onChange={(e) => setSocialYoutube(e.target.value)}
                  placeholder="https://youtube.com/@kanaliniz"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  LinkedIn URL
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                  value={socialLinkedin}
                  onChange={(e) => setSocialLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/company/sirketiniz"
                />
              </div>
            </div>

            <div style={{ paddingTop: 6 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Sosyal Medya Altı Bülten Açıklama Metni
              </label>
              <input
                type="text"
                className="admin-input"
                style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                value={footerCol5Desc}
                onChange={(e) => setFooterCol5Desc(e.target.value)}
                placeholder="Yeniliklerden, indirimlerden ve kampanyalardan ilk siz haberdar olun."
              />
            </div>
          </div>

          {/* 4 Feature Items Grid (Generous 2x2 Grid!) */}
          <div
            className="admin-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484", flexShrink: 0 }}>
                <Award style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                  Güvence Öğeleri İçeriği ({footerFeatures.length} Öğe)
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  Footer üstü güvence bandında yer alan 4 ana hizmet/güvence kutusu.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {footerFeatures.map((item, index) => (
                <div
                  key={index}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 12,
                    padding: 18,
                    background: "#f8fafc",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#C98484", letterSpacing: "0.5px", background: "#fcf7f6", padding: "3px 10px", borderRadius: 6, border: "1px solid #fed7aa" }}>
                      ÖĞE #{index + 1}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                      {item.title || `Güvence ${index + 1}`}
                    </span>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
                      Başlık
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ fontSize: 13, padding: "8px 10px", borderRadius: 8, background: "#ffffff" }}
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...footerFeatures]
                        updated[index] = { ...updated[index], title: e.target.value }
                        setFooterFeatures(updated)
                      }}
                      placeholder="Örn: Hızlı Teslimat"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
                      Alt Açıklama Metni
                    </label>
                    <input
                      type="text"
                      className="admin-input"
                      style={{ fontSize: 13, padding: "8px 10px", borderRadius: 8, background: "#ffffff" }}
                      value={item.subtitle}
                      onChange={(e) => {
                        const updated = [...footerFeatures]
                        updated[index] = { ...updated[index], subtitle: e.target.value }
                        setFooterFeatures(updated)
                      }}
                      placeholder="Örn: 1-3 iş günü içinde kapınızda"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 4, fontSize: 11, fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
                      İkon Seçimi
                    </label>
                    <button
                      type="button"
                      onClick={() => setIconPickerIndex(index)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#FFF5EF",
                            border: "1px solid #FFE4D6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#C98484",
                            flexShrink: 0,
                          }}
                        >
                          <AppIcon name={item.icon} fallback="shield" className="h-4 w-4" />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1d2327", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.icon}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#C98484", background: "#FFF5EF", padding: "4px 10px", borderRadius: 6, border: "1px solid #FFE4D6", flexShrink: 0 }}>
                        İkonu Değiştir 🔍
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Ödeme Yöntemi Logoları */}
          <div
            className="admin-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484", flexShrink: 0 }}>
                <CreditCard style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                  Ödeme Yöntemi Logoları (Mobil & Masaüstü Alt Bandı)
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  Footer en altındaki ödeme sağlayıcı logoları (iyzico, Mastercard, Visa, Amex, Troy).
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              {/* 1. iyzico */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475569" }}>1. İYZİCO LOGOSU</label>
                <div style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, padding: 6 }}>
                  <img src={paymentLogoIyzico} alt="iyzico" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                </div>
                <button type="button" onClick={() => setModalTarget("payment_iyzico")} className="admin-btn admin-btn-secondary" style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, borderRadius: 6 }}>
                  🖼️ Logoyu Değiştir
                </button>
                <input type="text" className="admin-input" style={{ fontSize: 11, padding: "6px 8px" }} value={paymentLogoIyzico} onChange={(e) => setPaymentLogoIyzico(e.target.value)} placeholder="/brand/placeholder.svg" />
              </div>

              {/* 2. Mastercard */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475569" }}>2. MASTERCARD LOGOSU</label>
                <div style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, padding: 6 }}>
                  <img src={paymentLogoMastercard} alt="mastercard" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                </div>
                <button type="button" onClick={() => setModalTarget("payment_mastercard")} className="admin-btn admin-btn-secondary" style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, borderRadius: 6 }}>
                  🖼️ Logoyu Değiştir
                </button>
                <input type="text" className="admin-input" style={{ fontSize: 11, padding: "6px 8px" }} value={paymentLogoMastercard} onChange={(e) => setPaymentLogoMastercard(e.target.value)} placeholder="/brand/placeholder.svg" />
              </div>

              {/* 3. VISA */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475569" }}>3. VISA LOGOSU</label>
                <div style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, padding: 6 }}>
                  <img src={paymentLogoVisa} alt="visa" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                </div>
                <button type="button" onClick={() => setModalTarget("payment_visa")} className="admin-btn admin-btn-secondary" style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, borderRadius: 6 }}>
                  🖼️ Logoyu Değiştir
                </button>
                <input type="text" className="admin-input" style={{ fontSize: 11, padding: "6px 8px" }} value={paymentLogoVisa} onChange={(e) => setPaymentLogoVisa(e.target.value)} placeholder="/brand/placeholder.svg" />
              </div>

              {/* 4. AMEX */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475569" }}>4. AMEX LOGOSU</label>
                <div style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, padding: 6 }}>
                  <img src={paymentLogoAmex} alt="amex" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                </div>
                <button type="button" onClick={() => setModalTarget("payment_amex")} className="admin-btn admin-btn-secondary" style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, borderRadius: 6 }}>
                  🖼️ Logoyu Değiştir
                </button>
                <input type="text" className="admin-input" style={{ fontSize: 11, padding: "6px 8px" }} value={paymentLogoAmex} onChange={(e) => setPaymentLogoAmex(e.target.value)} placeholder="/brand/placeholder.svg" />
              </div>

              {/* 5. Troy */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: "#475569" }}>5. TROY LOGOSU</label>
                <div style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "center", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 8, padding: 6 }}>
                  <img src={paymentLogoTroy} alt="troy" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
                </div>
                <button type="button" onClick={() => setModalTarget("payment_troy")} className="admin-btn admin-btn-secondary" style={{ padding: "6px 10px", fontSize: 11, fontWeight: 700, borderRadius: 6 }}>
                  🖼️ Logoyu Değiştir
                </button>
                <input type="text" className="admin-input" style={{ fontSize: 11, padding: "6px 8px" }} value={paymentLogoTroy} onChange={(e) => setPaymentLogoTroy(e.target.value)} placeholder="/brand/placeholder.svg" />
              </div>
            </div>
          </div>

          {/* Alt Telif & Yasal Notlar */}
          <div
            className="admin-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fcf7f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C98484", flexShrink: 0 }}>
                <FileCheck style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
                  Alt Telif, Şirket & Yasal Notlar
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#64748b" }}>
                  Footer en altındaki telif hakları, MERSİS, KEP ve marka alt açıklamaları.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Telif Hakkı Metni
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                  value={footerCopyrightText}
                  onChange={(e) => setFooterCopyrightText(e.target.value)}
                  placeholder="© 2026 Mağaza Adı."
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Marka / Çatı Firma
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                  value={footerBrandSubtext}
                  onChange={(e) => setFooterBrandSubtext(e.target.value)}
                  placeholder="Tüm hakları saklıdır."
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  MERSİS No
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                  value={footerMersisNo}
                  onChange={(e) => setFooterMersisNo(e.target.value)}
                  placeholder=""
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  KEP Adresi
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ fontSize: 13, padding: "10px 12px", borderRadius: 8 }}
                  value={footerKepAddress}
                  onChange={(e) => setFooterKepAddress(e.target.value)}
                  placeholder=""
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={footerShowPaymentBadges}
                  onChange={(e) => setFooterShowPaymentBadges(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "#C98484", cursor: "pointer" }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                  Alt Bantta Ödeme Logoları (iyzico, Mastercard, Visa, American Express, Troy) Gösterilsin
                </span>
              </label>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="admin-btn admin-btn-primary"
                style={{ padding: "12px 28px", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, borderRadius: 10 }}
              >
                <Save style={{ width: 18, height: 18 }} />
                {saving ? "Kaydediliyor..." : saved ? "✓ Kaydedildi" : "Tüm Footer Ayarlarını Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      <MediaSelectorModal
        isOpen={modalTarget !== null}
        onClose={() => setModalTarget(null)}
        onSelect={handleModalSelect}
        multi={false}
      />

      <IconPickerModal
        isOpen={iconPickerIndex !== null}
        onClose={() => setIconPickerIndex(null)}
        onSelect={(iconNameOrUrl) => {
          if (iconPickerIndex !== null) {
            const updated = [...footerFeatures]
            updated[iconPickerIndex] = { ...updated[iconPickerIndex], icon: iconNameOrUrl }
            setFooterFeatures(updated)
          }
          setIconPickerIndex(null)
        }}
      />
    </div>
  )
}
