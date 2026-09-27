import { HeroSlider, CategoryStrip, FeaturedTabs } from "@modules/home/components/desktop-home-components"
import { getRegion } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { listActiveSliders } from "@lib/data/sliders"

import { isStoreReady } from "@lib/security/store-readiness"
import { getMobileSettings } from "@lib/content/mobile-settings"
import MobileHomeExperience from "@modules/home/components/mobile-home-experience"
import { headers } from "next/headers"
import { isPhoneUserAgent } from "@lib/util/device"
import { compactProductsForCards } from "@lib/util/product-card"
import { Metadata } from "next"
import { getBaseURL } from "@lib/util/env"
import { getThemeSettings } from "@lib/content/theme-settings"
import { serializeJsonLd } from "@lib/security/html"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getThemeSettings()
  const title = "ZK Home | Online Mağaza"
  const description = "ZK Home online mağazası. Yeni ürünler ve içerikler hazırlanıyor."
  return {
    title: { absolute: title }, description,
    alternates: { canonical: getBaseURL() },
    openGraph: {
      title, description, url: getBaseURL(), siteName: "ZK Home", locale: "tr_TR", type: "website",
      images: [{ url: settings?.seo_og_image_url || "/brand/zkhome-logo.svg", alt: "ZK Home" }],
    },
  }
}

function HomeStructuredData() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
      "@context": "https://schema.org", "@type": "WebSite", "@id": `${getBaseURL()}/#website`,
      name: "ZK Home", alternateName: ["ZKHome", "ZK HOME"], url: getBaseURL(), inLanguage: "tr-TR",
    }) }} />
  </>
}

export default async function Home() {
  const countryCode = "tr"
  const userAgent = (await headers()).get("user-agent")
  const isPhoneRequest = isPhoneUserAgent(userAgent)

  // Start all independent database & content reads concurrently to minimize TTFB
  const regionPromise = getRegion(countryCode).catch(() => null)
  const mobileSettingsPromise = getMobileSettings()
  const categoriesPromise = listCategories().catch(() => [])
  // Phone home uses the slides from mobile settings, not the desktop slider.
  const slidersPromise = mobileSettingsPromise.then((settings) =>
    isPhoneRequest && settings.enabled
      ? []
      : listActiveSliders().catch(() => [])
  )

  const productsPromise = regionPromise.then((requestedRegion) => {
    const region =
      requestedRegion ||
      ({ id: "local-fallback", currency_code: "try" } as any)
    return listProducts({
      regionId: region.id,
      countryCode,
      queryParams: { limit: 8 },
    })
      .then(({ response }) => ({ region, products: response.products }))
      .catch(() => ({ region, products: [] }))
  })

  const [mobileSettings, categories, sliders, productsData] =
    await Promise.all([
      mobileSettingsPromise,
      categoriesPromise,
      slidersPromise,
      productsPromise,
    ])

  const region = productsData.region
  const initialProducts = compactProductsForCards(productsData.products)
  const publicSliders = isStoreReady()
    ? sliders
    : sliders.map(({ top_bar_features: _topBar, ...slider }) => slider)

  // Seed the storefront with real published catalog products.
  // A deleted or stale showcase tag must not make this sales section empty.
  if (mobileSettings.enabled && isPhoneRequest) {
    return (
      <><HomeStructuredData /><MobileHomeExperience
        settings={mobileSettings}
        products={initialProducts}
        region={region}
        categories={categories}
      /></>
    )
  }

  return (
    <>
      <HomeStructuredData />
      {mobileSettings.enabled && (
        <MobileHomeExperience
          prioritizeHero={false}
          settings={mobileSettings}
          products={initialProducts}
          region={region}
          categories={categories}
        />
      )}
      <div className={mobileSettings.enabled ? "hidden md:block" : "block"}>
        <HeroSlider initialSliders={publicSliders} />
      </div>
      <div className={`bg-[#f6f7f8] ${mobileSettings.enabled ? "hidden md:block" : "block"}`}>
        <CategoryStrip categories={categories} />
        <div className="content-container pb-8">
          <FeaturedTabs
            region={region}
            countryCode={countryCode}
            initialProducts={initialProducts}
          />
        </div>
      </div>
    </>
  )
}
