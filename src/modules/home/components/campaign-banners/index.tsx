import { ArrowRight, BadgePercent, Wrench } from "@lib/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export type CampaignBannerItem = {
  id: string
  eyebrow: string
  title: string
  description: string
  linkLabel: string
  link: string
  tone: "primary" | "dark"
}

const DEFAULT_CAMPAIGNS: CampaignBannerItem[] = [
  {
    id: "professional-sets",
    eyebrow: "USTALARIN SEÇİMİ",
    title: "Profesyonel setlerde güçlü fırsatlar",
    description: "Atölye ve saha ihtiyaçlarınız için seçili setleri keşfedin.",
    linkLabel: "Setleri İncele",
    link: "/magaza",
    tone: "primary",
  },
  {
    id: "workshop-upgrade",
    eyebrow: "ATÖLYENİ GÜÇLENDİR",
    title: "İşinize uygun ekipmanı kolayca bulun",
    description:
      "Performans, dayanıklılık ve fiyat dengesini bir arada sunan ürünler.",
    linkLabel: "Fırsatları Gör",
    link: "/magaza?sortBy=price_asc",
    tone: "dark",
  },
]

export default function CampaignBanners({
  campaigns = DEFAULT_CAMPAIGNS,
}: {
  campaigns?: CampaignBannerItem[]
}) {
  if (!campaigns.length) return null

  return (
    <section
      aria-labelledby="campaign-banners-title"
      className="content-container py-8 sm:py-10"
    >
      <h2 id="campaign-banners-title" className="sr-only">
        Güncel kampanyalar
      </h2>

      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((campaign, index) => {
          const Icon = index % 2 === 0 ? Wrench : BadgePercent

          return (
            <article
              key={campaign.id}
              className={`group relative isolate min-h-64 overflow-hidden rounded-desktop-wide border p-6 shadow-card sm:p-8 ${
                campaign.tone === "primary"
                  ? "border-primary/30 bg-primary text-on-primary"
                  : "border-border bg-elevated text-foreground"
              }`}
            >
              <div
                aria-hidden="true"
                className="absolute -right-16 -top-16 h-56 w-56 rounded-circle border-[32px] border-current opacity-[0.08] transition-transform duration-500 group-hover:scale-110"
              />
              <Icon
                aria-hidden="true"
                className="absolute bottom-5 right-6 h-24 w-24 rotate-[-8deg] opacity-10 sm:h-32 sm:w-32"
                strokeWidth={1.25}
              />

              <div className="relative z-10 flex h-full max-w-lg flex-col items-start">
                <span className="mb-3 text-xs font-black tracking-[0.18em] opacity-80">
                  {campaign.eyebrow}
                </span>
                <h3 className="max-w-md text-2xl font-black leading-tight sm:text-3xl">
                  {campaign.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed opacity-80 sm:text-base">
                  {campaign.description}
                </p>
                <LocalizedClientLink
                  href={campaign.link}
                  className={`mt-6 inline-flex items-center gap-2 rounded-base px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 ${
                    campaign.tone === "primary"
                      ? "bg-background text-foreground hover:bg-card focus-visible:ring-background"
                      : "bg-primary text-on-primary hover:bg-primary-hover focus-visible:ring-ring"
                  }`}
                >
                  {campaign.linkLabel}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </LocalizedClientLink>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
