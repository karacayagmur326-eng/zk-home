import type { MobileSettings } from "@lib/content/mobile-settings"
import MobileHeroSlider from "@modules/home/components/mobile-hero-slider"
import MobileCategoryStrip from "@modules/home/components/mobile-category-strip"
import type { HttpTypes } from "@medusajs/types"

export default function MobileHomeExperience({
  settings,
  prioritizeHero = true,
  categories,
}: {
  settings: MobileSettings
  prioritizeHero?: boolean
  categories: HttpTypes.StoreProductCategory[]
}) {
  const slides = settings.slides
    .filter((slide) => slide.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="bg-[#f5f6f7] md:hidden">
      <MobileHeroSlider slides={slides} prioritize={prioritizeHero} />
      <MobileCategoryStrip categories={categories} />
    </div>
  )
}
