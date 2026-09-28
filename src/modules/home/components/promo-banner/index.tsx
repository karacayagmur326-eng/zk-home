import { BadgePercent, LockKeyhole, ShieldCheck, Truck } from "@lib/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type BenefitItem = {
  id: string
  icon: "truck" | "shield" | "lock"
  eyebrow: string
  title: string
  description: string
}

const DEFAULT_BENEFITS: BenefitItem[] = [
  {
    id: "shipping",
    icon: "truck",
    eyebrow: "2.500 TL VE ÜZERİ",
    title: "Ücretsiz Kargo",
    description: "Türkiye'nin her yerine güvenli teslimat.",
  },
  {
    id: "warranty",
    icon: "shield",
    eyebrow: "ÜRÜN BİLGİSİ",
    title: "Güncel Detaylar",
    description: "Ürün koşulları ilgili ürün sayfasında belirtilir.",
  },
  {
    id: "payment",
    icon: "lock",
    eyebrow: "KORUNAN ÖDEME",
    title: "Güvenli Alışveriş",
    description: "Ödeme bilgileriniz güvenli şekilde işlenir.",
  },
]

const benefitIcons = {
  truck: Truck,
  shield: ShieldCheck,
  lock: LockKeyhole,
}

export default function PromoBanner({
  benefits = DEFAULT_BENEFITS,
}: {
  benefits?: BenefitItem[]
}) {
  return (
    <section
      aria-labelledby="shopping-benefits-title"
      className="content-container pb-10 pt-2 sm:pb-12"
    >
      <h2 id="shopping-benefits-title" className="sr-only">
        Alışveriş avantajları
      </h2>

      <div className="overflow-hidden rounded-lg border border-[#dfe3e8] bg-white shadow-[0_12px_30px_rgba(16,24,40,0.06)] lg:grid lg:grid-cols-[1fr_20rem]">
        <div className="grid divide-y divide-[#e7e9ed] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {benefits.map((benefit) => {
            const Icon = benefitIcons[benefit.icon]

            return (
              <article
                key={benefit.id}
                className="flex items-start gap-4 p-5 sm:flex-col sm:p-6 xl:flex-row"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-rounded bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[11px] font-black tracking-[0.12em] text-muted">
                    {benefit.eyebrow}
                  </p>
                  <h3 className="mt-1 text-base font-black text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {benefit.description}
                  </p>
                </div>
              </article>
            )
          })}
        </div>

        <aside className="relative isolate flex items-center justify-between gap-5 overflow-hidden bg-gradient-to-br from-[#C98484] to-[#A95E5E] p-5 text-white lg:flex-col lg:items-start lg:justify-center">
          <BadgePercent
            aria-hidden="true"
            className="absolute -bottom-7 -right-4 -z-10 h-32 w-32 opacity-10"
          />
          <div>
            <p className="text-xs font-semibold opacity-80">ÜYEYE ÖZEL</p>
            <p className="mt-1 text-lg font-semibold normal-case leading-tight">
              Fırsatları kaçırma
            </p>
          </div>
          <LocalizedClientLink
            href="/hesabim"
            className="shrink-0 rounded-md bg-[#17191c] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Üye Ol
          </LocalizedClientLink>
        </aside>
      </div>
    </section>
  )
}
