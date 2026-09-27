import { query } from "@lib/admin/db"
import { Metadata } from "next"
import PageHero from "../../../components/common/PageHero"
import WholesaleClientContent from "./WholesaleClientContent"
import { defaultWholesaleInfo } from "@lib/content/wholesale-defaults"
import { getBaseURL } from "@lib/util/env"

export const metadata: Metadata = {
  title: "Toptan ve Kurumsal Satış",
  description:
    "İşletmeler ve kurumsal alıcılar için avantajlı fiyatlar, toplu sipariş kolaylığı ve özel teklif çözümleri.",
  alternates: {
    canonical: `${getBaseURL()}/toptan-ve-kurumsal-satis`,
  },
}

export const dynamic = "force-dynamic"

export default async function WholesalePage() {
  const info = await query<{ value: typeof defaultWholesaleInfo }>(
    `SELECT value FROM store_settings WHERE key = 'wholesale_info' LIMIT 1`
  )
    .then((rows) => ({ ...defaultWholesaleInfo, ...(rows[0]?.value || {}) }))
    .catch(() => defaultWholesaleInfo)

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* 1. Standart PageHero Header (Tam Site Genişliğinde) */}
      <PageHero
        breadcrumb={[
          { title: "Kurumsal", href: "/hakkimizda" },
          { title: "Toptan ve Kurumsal Satış" },
        ]}
        htmlContent={
          info.description && /<[a-z][\s\S]*>/i.test(info.description)
            ? info.description
            : `<h1>İşinizi Güçlendiren <br/><span style="color:#C98484;">Profesyonel Çözümler</span></h1><p>${
                info.description ||
                "İşletmelerin ihtiyaç duyduğu yüksek kaliteli ürünleri ve ekipmanları toptan avantajlarla sunuyoruz. Güvenilir ürünler, rekabetçi fiyatlar ve özel hizmet anlayışıyla iş ortağınız olmaya hazırız."
              }</p>`
        }
        ctaText={info.hero_cta1_text || "Teklif Talebi Oluştur"}
        ctaHref={info.hero_cta1_href || "#quote-form"}
        secondaryCtaText={info.hero_cta2_text || "Bize Ulaşın"}
        secondaryCtaHref={info.hero_cta2_href || "/iletisim"}
        heroImage={!info.hero_image || info.hero_image === "/brand/placeholder.svg" ? "/brand/placeholder.svg" : info.hero_image}
        heroImageAlt={info.title || "Toptan ve Kurumsal Satış"}
      />

      {/* 2. Client Content (Tam Header Genişliğinde content-container) */}
      <div className="content-container py-10">
        <WholesaleClientContent info={info} />
      </div>
    </div>
  )
}
