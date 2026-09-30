import { getBaseURL, getCanonicalURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import { Barlow_Condensed, Inter, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google"
import Script from "next/script"
import "styles/globals.css"
import { ThemeProvider } from "@modules/layout/components/theme-provider"
import { ToastProvider } from "@modules/common/components/feedback"
import CookieConsent from "@modules/layout/components/cookie-consent"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { getThemeSettings } from "@lib/content/theme-settings"
import { getContactInfo } from "@lib/content/contact-info"
import { getWhatsAppUrl } from "@lib/content/whatsapp"
import { SellerQuestionProvider } from "@components/common/SellerQuestion"
import ChatbotWidget from "@components/common/ChatbotWidget"
import { getChatbotSettings } from "@lib/chatbot/settings"
import { serializeJsonLd } from "@lib/security/html"
import { omitStandardGa4Snippet } from "@lib/util/analytics-snippet"
import { isStoreReady } from "@lib/security/store-readiness"


const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
})

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  // Barlow is reserved for slider copy. Do not preload every configured
  // weight on pages that do not contain a slider.
  preload: false,
  variable: "--font-barlow-condensed",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-playfair-display",
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-plus-jakarta-sans",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getThemeSettings()

  const title =
    settings?.seo_meta_title ||
    "ZK Home | Online Mağaza"
  const description =
    settings?.seo_meta_description ||
    "ZK Home online mağazası. Ürünler ve içerikler hazırlanıyor."
  const keywords =
    settings?.seo_meta_keywords ||
    "zk home, online mağaza, e-ticaret"
  const ogImage = settings?.seo_og_image_url || "/opengraph-image"
  const siteName = settings?.logo_text || "ZK Home"
  const separator = settings?.seo_title_separator || "|"
  const rawPageTemplate =
    settings?.seo_page_title_template || "%sayfa_adi% %ayirici% %site_adi%"

  let layoutTitleTemplate = rawPageTemplate
    .replace(/%site_adi%/gi, siteName)
    .replace(/%sitename%/gi, siteName)
    .replace(/%ayirici%/gi, separator)
    .replace(/%sep%/gi, separator)
    .replace(/%separator%/gi, separator)
    .replace(/%sayfa_adi%/gi, "%s")
    .replace(/%page_title%/gi, "%s")
    .replace(/%title%/gi, "%s")
    .replace(/%urun_adi%/gi, "%s")
    .replace(/%kategori%/gi, "%s")
    .replace(/%marka%/gi, "%s")
    .replace(/%yazi_basligi%/gi, "%s")
    .replace(/\s+/g, " ")
    .trim()

  if (!layoutTitleTemplate.includes("%s")) {
    layoutTitleTemplate = `%s ${separator} ${siteName}`
  }

  const indexing =
    isStoreReady() && settings?.seo_indexing_enabled === true &&
    process.env.VERCEL_ENV !== "preview"

  return {
    title: {
      default: title,
      template: layoutTitleTemplate,
    },
    description,
    keywords,
    metadataBase: new URL(getBaseURL()),
    robots: {
      index: indexing,
      follow: indexing,
      googleBot: {
        index: indexing,
        follow: indexing,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title,
      description,
      siteName: "ZK Home",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "tr_TR",
      type: "website",
    },
    verification: {
      google: settings?.seo_google_verification || undefined,
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = (await getThemeSettings()) || {
    logo_text: "ZK HOME",
    font_family: "Plus Jakarta Sans",
    font_size_base: "16px",
    h1_size: "2.5rem",
    h2_size: "2rem",
    h3_size: "1.75rem",
    h4_size: "1.5rem",
    slider_font_title: "Plus Jakarta Sans",
    slider_font_desc: "Inter",
    seo_meta_title:
      "ZK Home | Online Mağaza",
    seo_meta_description:
      "ZK Home online mağazası. Ürünler ve içerikler hazırlanıyor.",
    seo_meta_keywords:
      "zk home, online mağaza, e-ticaret",
    seo_google_verification: "",
    seo_ga4_id: "",
    favicon_url: "/brand/zkhome-favicon.svg",
  }

  const ga4Id = /^G-[A-Z0-9]+$/i.test(settings.seo_ga4_id || "")
    ? settings.seo_ga4_id
    : undefined
  const gtmId = /^GTM-[A-Z0-9]+$/i.test(settings.seo_gtm_id || "")
    ? settings.seo_gtm_id : undefined
  // Older settings stored the same standard GA4 tag as raw HTML. Route that
  // exact snippet through the consent-aware loader too; preserve custom code.
  const customHeadScripts = omitStandardGa4Snippet(settings.custom_head_scripts, ga4Id)
  const customBodyScripts = omitStandardGa4Snippet(settings.custom_body_scripts, ga4Id)

  // İletişim bilgileri admin panelinden → tüm Schema.org işaretlemeleri buradan beslenir
  const [contact, chatbot] = await Promise.all([getContactInfo(), getChatbotSettings()])
  const whatsappUrl = getWhatsAppUrl(
    contact.whatsapp_phone,
    `Merhaba, ${contact.brand_name} ürünleri hakkında bilgi almak istiyorum.`
  )

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: contact.company_name,
    alternateName: contact.brand_name,
    url: getCanonicalURL(),
    logo: `${getBaseURL()}/brand/zkhome-logo.svg`,
    image: `${getBaseURL()}/brand/zkhome-logo.svg`,
  }

  return (
    <html
      lang="tr"
      className={`${inter.variable} ${barlowCondensed.variable} ${playfairDisplay.variable} ${plusJakartaSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="icon"
          href={settings.favicon_url || "/brand/zkhome-favicon.svg"}
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="screen-orientation" content="portrait" />
        <meta name="x5-orientation" content="portrait" />
        <meta name="orientation" content="portrait" />

        <style>{`
          body { font-size: ${settings.font_size_base || "16px"}; }
          h1 { --heading-size: ${settings.h1_size || "2.5rem"}; }
          h2 { --heading-size: ${settings.h2_size || "2rem"}; }
          h3 { --heading-size: ${settings.h3_size || "1.75rem"}; }
          h4 { --heading-size: ${settings.h4_size || "1.5rem"}; }
        `}</style>

        {/* Dynamic GTM Tag */}
        {gtmId && (
          <Script
            id="google-tag-manager"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
        )}
      </head>
      <body
        className="antialiased overflow-x-hidden max-w-full"
        style={{
          fontFamily:
            "var(--font-plus-jakarta-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Raw admin snippets may contain complete script tags. Rendering their
            wrapper inside <head> creates invalid HTML and a hydration mismatch;
            scripts still execute correctly at the beginning of <body>. */}
        {customHeadScripts && (
          <div
            style={{ display: "contents" }}
            dangerouslySetInnerHTML={{ __html: customHeadScripts }}
          />
        )}

        {/* Dynamic Custom Body Scripts (e.g. GTM Noscript, Live Chat) */}
        {customBodyScripts && (
          <div
            style={{ display: "contents" }}
            dangerouslySetInnerHTML={{ __html: customBodyScripts }}
          />
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ToastProvider>
            <SellerQuestionProvider
              settings={{
                formTitle: contact.form_title,
                formDescription: contact.form_description,
                kvkkUrl: contact.kvkk_url,
                companyName: contact.company_name,
                brandName: contact.brand_name,
                email: contact.email,
                phone: contact.phone,
                phoneRaw: contact.phone_raw,
                address: contact.full_address,
                website: contact.website,
                taxOffice: contact.tax_office,
                taxNumber: contact.tax_no,
                mersisNo: contact.mersis_no,
                tradeRegNo: contact.trade_reg_no,
                kepAddress: contact.kep_address,
              }}
            >
              <main className="relative overflow-x-hidden max-w-full">{children}</main>
              <ChatbotWidget
                settings={chatbot}
                whatsappUrl={contact.whatsapp_enabled !== false ? whatsappUrl : ""}
                whatsappText={contact.whatsapp_text || "WhatsApp ile iletişime geç"}
              />
              {/* CookieConsent owns GA4 loading and configuration. Avoid a second
                  loader when the administrator already supplies a custom tag. */}
              <CookieConsent ga4Id={
                [customHeadScripts, customBodyScripts]
                  .some((script) => script?.includes("googletagmanager.com/gtag/js"))
                  ? undefined
                  : ga4Id
              } />
              {process.env.VERCEL === "1" && Boolean(process.env.VERCEL_URL) && <SpeedInsights />}
            </SellerQuestionProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
