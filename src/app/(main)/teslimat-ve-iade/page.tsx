import type { Metadata } from "next"
import Link from "next/link"
import { getBaseURL } from "@lib/util/env"

export const metadata: Metadata = {
  title: "Teslimat, İptal ve İade Koşulları",
  description: "ZK Home kargo ücretleri, teslimat, iptal ve iade süreçleri.",
  alternates: { canonical: `${getBaseURL()}/teslimat-ve-iade` },
}

const topics = [
  { title: "Sipariş hazırlığı ve teslimat", body: "Siparişiniz ödeme onayından sonra hazırlanır ve adresinize kargo ile gönderilir. Tahmini teslimat bilgisi sipariş sırasında gösterilir. Fiziksel mağazadan teslim seçeneğimiz yoktur." },
  { title: "Hasarlı paket", body: "Pakette görünür hasar varsa kargo görevlisiyle tutanak düzenlenmesini isteyin. Üründeki hasarı sipariş numaranız ve mümkünse fotoğraflarla bize bildirin. Size uygun çözümü iletelim; yasal haklarınız saklıdır." },
  { title: "Sipariş iptali", body: "Henüz kargoya verilmemiş sipariş için bize iptal talebi gönderebilirsiniz. Kargoya verilmiş siparişler için cayma hakkı ve iade süreci uygulanır." },
  { title: "Cayma hakkı ve iade", body: "Tüketici, ürünü teslim aldıktan sonra 14 gün içinde herhangi bir gerekçe göstermeden cayma hakkını kullanabilir. Talebinizi e-posta veya iletişim formuyla bize iletmeniz yeterlidir. Nedeninizi ve fotoğrafı paylaşırsanız çözümü hızlandırabiliriz; bunlar cayma hakkının şartı değildir. Bildirimden sonra iade gönderimi için 14 gününüz vardır." },
  { title: "İade gönderimi ve ücret iadesi", body: "İade kargo bilgilerini size bildiririz. Belirttiğimiz taşıyıcıyla yapılan iade gönderiminde kargo ücreti ödemezsiniz. Hasarlı veya ayıplı ürünlerde durum değerlendirilerek ürünün geri gönderilmesine gerek olmadan da çözüm sunulabilir. Cayma hakkına ilişkin ücret iadesi yürürlükteki mevzuata uygun süre ve yöntemle yapılır." },
]

export default function DeliveryAndReturnsPage() {
  return (
    <main className="min-h-screen bg-[#fbf8f7] pb-20">
      <section className="border-b border-rose-100 bg-white py-16 sm:py-20"><div className="content-container max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#bd8585]">Müşteri bilgilendirme</p>
        <h1 className="mt-4 text-4xl font-bold text-slate-900 sm:text-5xl">Teslimat, İptal ve İade</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">Siparişinizin teslimatından iade talebine kadar süreçle ilgili temel bilgileri burada bulabilirsiniz.</p>
      </div></section>
      <div className="content-container max-w-6xl grid gap-8 py-12 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-3" aria-label="Teslimat ve iade bilgileri">
          {topics.map((topic) => <details key={topic.title} className="group rounded-2xl border border-rose-100 bg-white px-6 py-5 shadow-sm" open={topic.title === "Cayma hakkı ve iade"}>
            <summary className="cursor-pointer list-none font-semibold text-slate-900">{topic.title}<span className="float-right text-[#bd8585] group-open:rotate-45">＋</span></summary>
            <p className="mt-4 text-sm leading-7 text-slate-600">{topic.body}</p>
          </details>)}
        </section>
        <aside className="space-y-5">
          <div className="rounded-2xl border border-rose-100 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Kargo ücretleri</h2>
            <ul className="mt-5 space-y-3 text-sm text-slate-700">
              <li className="flex justify-between border-b border-rose-50 pb-3"><span>2.000–4.999,99 TL</span><strong>300 TL</strong></li>
              <li className="flex justify-between border-b border-rose-50 pb-3"><span>5.000–9.999,99 TL</span><strong>600 TL</strong></li>
              <li className="flex justify-between"><span>10.000 TL ve üzeri</span><strong>Ücretsiz</strong></li>
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-slate-500">2.000 TL altındaki siparişlerin kargo tutarı ödeme öncesinde sepetinizde gösterilir.</p>
          </div>
          <div className="rounded-2xl bg-[#f5eae7] p-7">
            <h2 className="text-xl font-bold text-slate-900">İade için bize ulaşın</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">Sipariş numaranızı ve varsa görselleri paylaşın. Size gönderim bilgisi veya başka bir çözüm için dönüş yapalım.</p>
            <Link href="/iletisim#contact-form" className="mt-6 inline-block rounded-full bg-[#bd8585] px-6 py-3 text-sm font-semibold text-white">İletişim formu</Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
