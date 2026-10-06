import { HeroSlider, CategoryStrip } from "@modules/home/components/desktop-home-components"
import { getRegion } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { listProducts } from "@lib/data/products"
import { listActiveSliders } from "@lib/data/sliders"

import { isStoreReady } from "@lib/security/store-readiness"
import { getMobileSettings } from "@lib/content/mobile-settings"
import MobileHomeExperience from "@modules/home/components/mobile-home-experience"
import { compactProductsForCards } from "@lib/util/product-card"
import { Metadata } from "next"
import { getBaseURL } from "@lib/util/env"
import { getThemeSettings } from "@lib/content/theme-settings"
import { serializeJsonLd } from "@lib/security/html"
import { query } from "@lib/admin/db"
import { defaultHomeEditorialContent, type HomeEditorialContent } from "@lib/content/home-editorial"
import HomeEditorial, { type HomeArticle } from "@modules/home/components/home-editorial"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getThemeSettings()
  const title = "ZK Home | Online Mağaza"
  const description = "ZK Home'da ev dekorasyonu, sofra ve ev tekstili için ilham veren kategorileri keşfedin. Yaşam alanınıza iyi gelen dokunuşları bulun."
  return {
    title: { absolute: title }, description,
    alternates: { canonical: getBaseURL() },
    openGraph: {
      title, description, url: getBaseURL(), siteName: "ZK Home", locale: "tr_TR", type: "website",
      images: [{ url: settings?.seo_og_image_url || "/opengraph-image", alt: "ZK Home" }],
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

  // Start all independent database & content reads concurrently to minimize TTFB
  const regionPromise = getRegion(countryCode).catch(() => null)
  const mobileSettingsPromise = getMobileSettings()
  const categoriesPromise = listCategories().catch(() => [])
  const editorialPromise = query<{ content: Partial<HomeEditorialContent> }>(
    "SELECT content FROM homepage_editorial WHERE id = 'main' LIMIT 1"
  ).then((rows) => ({ ...defaultHomeEditorialContent, ...(rows[0]?.content || {}) })).catch(() => defaultHomeEditorialContent)
  const articlesPromise = query<HomeArticle>(
    "SELECT id, title, slug, excerpt, image, published_at FROM blog_posts WHERE status = 'published' ORDER BY featured DESC, published_at DESC, created_at DESC LIMIT 3"
  ).catch(() => [])
  // Render both variants so a resized mobile browser can reveal the desktop hero.
  const slidersPromise = listActiveSliders().catch(() => [])

  const productsPromise = regionPromise.then((requestedRegion) => {
    const region =
      requestedRegion ||
      ({ id: "local-fallback", currency_code: "try" } as any)
    return listProducts({
      regionId: region.id,
      countryCode,
      queryParams: { limit: 9 },
    })
      .then(({ response }) => ({ region, products: response.products }))
      .catch(() => ({ region, products: [] }))
  })

  const [mobileSettings, categories, sliders, productsData, editorialContent, articles] =
    await Promise.all([
      mobileSettingsPromise,
      categoriesPromise,
      slidersPromise,
      productsPromise,
      editorialPromise,
      articlesPromise,
    ])

  const region = productsData.region
  const initialProducts = compactProductsForCards(productsData.products)
  const publicSliders = isStoreReady()
    ? sliders
    : sliders.map(({ top_bar_features: _topBar, ...slider }) => slider)

  return (
    <>
      <HomeStructuredData />
      {mobileSettings.enabled && (
        <MobileHomeExperience
          prioritizeHero={false}
          settings={mobileSettings}
          categories={categories}
        />
      )}
      <div className={mobileSettings.enabled ? "hidden md:block" : "block"}>
        <HeroSlider initialSliders={publicSliders} />
      </div>
      <div className={`bg-[#f6f7f8] ${mobileSettings.enabled ? "hidden md:block" : "block"}`}>
        <CategoryStrip categories={categories} />
      </div>
      <HomeEditorial content={editorialContent} products={initialProducts} region={region} articles={articles} />
    </>
  )
}
