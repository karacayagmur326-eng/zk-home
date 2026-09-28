import type { MobileSettings } from "@lib/content/mobile-settings"
import MobileHeroSlider from "@modules/home/components/mobile-hero-slider"

export default function MobileHomeExperience({
  settings,
  prioritizeHero = true,
}: {
  settings: MobileSettings
  prioritizeHero?: boolean
}) {
  const slides = settings.slides
    .filter((slide) => slide.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="bg-[#f5f6f7] md:hidden">
      <MobileHeroSlider slides={slides} prioritize={prioritizeHero} />
    </div>
  )
}
