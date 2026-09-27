import { query } from "@lib/admin/db"
import { Metadata } from "next"
import PageHero from "../../../components/common/PageHero"
import DeliveryClientContent from "./DeliveryClientContent"
import { getBaseURL } from "@lib/util/env"
import { sanitizePublicHtml } from "@lib/security/html"

export const metadata: Metadata = {
  title: "Teslimat, İptal ve İade Koşulları",
  description: "Sipariş hazırlığı, kargo teslimatı, cayma hakkı, iade adresi ve iptal prosedürleri hakkında tüm detaylar.",
  alternates: {
    canonical: `${getBaseURL()}/teslimat-ve-iade`,
  },
}

export const dynamic = "force-dynamic"

const fallbackInfo = {
  eyebrow: "Müşteri Bilgilendirme",
  title: "Teslimat, İptal ve İade Koşulları",
  description: "Sipariş, teslimat, iptal ve iade süreçlerimizle ilgili tüm detayları burada bulabilirsiniz.",
  hero_image: "/brand/placeholder.svg",
  hero_cta_text: "",
  hero_cta_href: "",

  // Accordion Sections
  acc1_title: "Siparişlerin Hazırlanması",
  acc1_desc: "Siparişler, ödeme onayının alınmasının ardından stok ve ürün kontrolleri yapılarak hazırlanmaya başlanır. Stokta bulunan ürünler, aksi belirtilmedikçe 1-3 iş günü içerisinde kargo firmasına teslim edilir.",

  acc2_title: "Teslimat",
  acc2_desc: "Siparişler, müşterinin sipariş sırasında bildirdiği teslimat adresine gönderilir. Teslimat süresi; teslimat adresine, kargo firmasının operasyonlarına ve bölgesel koşullara göre değişebilir.",

  acc3_title: "Hasarlı Paketler",
  acc3_desc: "Teslimat sırasında pakette yırtılma, ezilme, açılma, ıslanma veya benzeri bir hasar görülmesi halinde ürün kontrol edilmeli ve gerektiğinde kargo görevlisine hasar tespit tutanağı düzenletilmelidir.",

  acc4_title: "Sipariş İptali",
  acc4_desc: "Henüz kargoya verilmemiş siparişler için müşteri hizmetleri üzerinden iptal talebi oluşturulabilir. Kargoya teslim edilmiş siparişlerde teslimat ve iade prosedürü uygulanır.",

  acc5_title: "İade Koşulları",
  acc5_desc: "Ürünlerin iade edilebilmesi için kullanılmamış, orijinal ambalajında, tüm aksesuarları ve belgeleri ile birlikte gönderilmesi gerekmektedir.",

  acc6_title: "Cayma Hakkı",
  acc6_desc: "Tüketici, ürünü teslim aldığı tarihten itibaren 14 gün içerisinde herhangi bir gerekçe göstermeksizin cayma hakkını kullanabilir.",

  acc7_title: "İade Adresi",
  acc7_address: "",
  acc7_courier: "Anlaşmalı Kargo",
  acc7_code: "123456",

  // Right Column Cards
  highlight_title: "Öne Çıkan Bilgiler",
  h1_title: "1-3 İş Günü İçinde Kargoya Teslim", h1_desc: "Stokta olan ürünler için geçerlidir.",
  h2_title: "Ücretsiz Kargo", h2_desc: "Tüm siparişlerinizde ücretsiz kargo.",
  h3_title: "14 Gün İçinde İade", h3_desc: "Koşulsuz iade hakkınız bulunmaktadır.",
  h4_title: "2 Yıl Garanti", h4_desc: "Tüm ürünlerimizde geçerlidir.",
  h5_title: "7/24 Destek", h5_desc: "Her zaman yanınızdayız.",

  process_title: "İade Süreci Nasıl İşler?",
  step1_title: "İade talebinizi oluşturun.", step1_desc: "Hesabınızdan veya müşteri hizmetlerimiz aracılığıyla iade talebinizi bildirin.",
  step2_title: "Ürünü paketleyin.", step2_desc: "Ürünü orijinal ambalajı ve tüm aksesuarları ile birlikte paketleyin.",
  step3_title: "Kargoya teslim edin.", step3_desc: "Anlaşmalı kargomuz ile ücretsiz olarak ürünü tarafımıza gönderin.",
  step4_title: "İade onayı ve ücret iadesi.", step4_desc: "Ürün kontrolü sonrası iadeniz onaylanır ve ücret iadeniz yapılır.",
  process_btn_text: "İade Talebi Oluştur", process_btn_href: "/hesabim/siparislerim"
}

export default async function DeliveryAndReturnsPage() {
  const info = await query<{ value: typeof fallbackInfo }>(
    `SELECT value FROM store_settings WHERE key = 'delivery_returns_info' LIMIT 1`
  )
    .then((rows) => ({ ...fallbackInfo, ...(rows[0]?.value || {}) }))
    .catch(() => fallbackInfo)
  const safeInfo = Object.fromEntries(
    Object.entries(info).map(([key, value]) => [
      key,
      typeof value === "string" && (key === "description" || key.endsWith("_desc"))
        ? sanitizePublicHtml(value)
        : value,
    ])
  ) as typeof info

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* 1. Standart PageHero Header */}
      <PageHero
        breadcrumb={[{ title: "Teslimat, İptal ve İade" }]}
        title={safeInfo.description && /<[a-z][\s\S]*>/i.test(safeInfo.description) ? undefined : (safeInfo.title || "Teslimat, İptal ve İade Koşulları")}
        paragraphs={[safeInfo.description]}
        htmlContent={safeInfo.description && /<[a-z][\s\S]*>/i.test(safeInfo.description) ? safeInfo.description : undefined}
        ctaText={info.hero_cta_text}
        ctaHref={info.hero_cta_href}
        heroImage={!info.hero_image || info.hero_image === "/brand/placeholder.svg" ? "/brand/placeholder.svg" : info.hero_image}
        heroImageAlt={info.title || "Teslimat, İptal ve İade Koşulları"}
      />

      {/* 2. Ana Sayfa İçeriği: Sitenin Tam Genişliği (content-container) */}
      <div className="content-container py-10">
        <DeliveryClientContent info={safeInfo} />
      </div>
    </div>
  )
}
