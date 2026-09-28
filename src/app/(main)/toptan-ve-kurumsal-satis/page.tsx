import type { Metadata } from "next"
import Link from "next/link"
import GiftInquiryForm from "./GiftInquiryForm"
import { getBaseURL } from "@lib/util/env"

export const metadata: Metadata = {
  title: "Kurumsal ve Özel Gün Hediyeleri",
  description: "Çalışanlarınız ve müşterileriniz için özel gün hediye paketi taleplerinizi ZK Home'a iletin.",
  alternates: { canonical: `${getBaseURL()}/toptan-ve-kurumsal-satis` },
}

const examples = [
  { title: "Yeni yıl kutuları", detail: "Çikolata ve seçili dekoratif parçalarla hazırlanan kutular", image: "/gift-examples/yeni-yil-kutulari.webp", url: "https://www.instagram.com/p/DSiHCM5CFRS/" },
  { title: "Kitap biçimli hediye kutuları", detail: "İçeriği ve sunumu isteğe göre değerlendirilen seçenekler", image: "/gift-examples/kitap-kutu-cikolata.webp", url: "https://www.instagram.com/p/DDT9iAlgC61/" },
  { title: "Dekoratif sunum hediyeleri", detail: "Gondol ve büyük dekoratif objelerle özel gün sunumları", image: "/gift-examples/gondol-hediyeleri.webp", url: "https://www.instagram.com/p/DDMFJ-1AmP-/" },
]

export default function CorporateGiftsPage() {
  return (
    <main className="min-h-screen bg-[#fbf8f7] pb-20">
      <section className="bg-white border-b border-rose-100 py-16 sm:py-24">
        <div className="content-container max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b97e7e]">ZK Home · Kurumsal hediyeler</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Özel günler için özenli hediye fikirleri</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">Çalışanlarınıza ve müşterilerinize yönelik yılbaşı, bayram ve kutlama hediyeleri için tercihlerinizi bize iletin. Ürün, sunum ve adet seçeneklerini birlikte değerlendirip size dönüş yapalım.</p>
          <a href="#hediye-talebi" className="mt-8 inline-flex rounded-full bg-[#bd8585] px-7 py-3 font-semibold text-white hover:bg-[#a96d6d]">Hediye talebi gönder</a>
        </div>
      </section>
      <section className="content-container max-w-6xl py-14">
        <h2 className="text-2xl font-bold text-slate-900">İlham veren örnekler</h2>
        <p className="mt-2 mb-7 text-slate-600">Görseller hediye fikirlerini temsil eder; geçmiş uygulamalarımızı Instagram bağlantılarında inceleyebilirsiniz. Her talep ayrıca değerlendirilir.</p>
        <div className="grid gap-5 md:grid-cols-3">
          {examples.map((example) => (
            <a key={example.title} href={example.url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <img src={example.image} alt={`${example.title} için temsili hediye görseli`} width={960} height={720} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <div className="p-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#bd8585]">Temsili görsel · Instagram örneği ↗</span>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">{example.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{example.detail}</p>
              <span className="mt-6 inline-block text-sm font-semibold text-[#a96d6d]">Instagram gönderisini gör →</span>
              </div>
            </a>
          ))}
        </div>
      </section>
      <section id="hediye-talebi" className="content-container max-w-6xl scroll-mt-24">
        <div className="grid overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-sm lg:grid-cols-[0.8fr_1.2fr]">
          <div className="bg-[#f5eae7] p-8 sm:p-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#a96d6d]">Talep formu</p>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">Birlikte hazırlayalım</h2>
            <p className="mt-5 leading-relaxed text-slate-700">Etkinlik türünü, tahmini adedi, bütçe aralığını ve düşündüğünüz ürünleri yazmanız yeterli. Ekibimiz uygun seçenekleri değerlendirip sizinle iletişime geçer.</p>
            <p className="mt-5 text-sm text-slate-600">Bu form bir sipariş veya ödeme işlemi oluşturmaz.</p>
            <Link href="/iletisim" className="mt-8 inline-block text-sm font-semibold text-[#a96d6d] underline">Genel iletişim sayfası</Link>
          </div>
          <div className="p-8 sm:p-12"><GiftInquiryForm /></div>
        </div>
      </section>
    </main>
  )
}
