import type { Metadata } from "next"
import { query } from "@lib/admin/db"
import MasterContactForm from "../../../components/common/MasterContactForm"
import { getBaseURL } from "@lib/util/env"

export const metadata: Metadata = {
  title: "İletişim ve Müşteri Hizmetleri",
  description: "Mağaza sipariş, teslimat, iade ve kurumsal hediye talepleri için iletişim sayfası.",
  alternates: { canonical: `${getBaseURL()}/iletisim` },
}
export const dynamic = "force-dynamic"

export default async function ContactPage(_props: { searchParams?: Promise<{ render?: string }> }) {
  const rows = await query<{ value: Record<string, string> }>("SELECT value FROM store_settings WHERE key = 'contact_info' LIMIT 1").catch(() => [])
  const info = rows[0]?.value || {}
  const email = info.email || info.card1_email || info.company_email || ""

  return (
    <main className="min-h-screen bg-[#fbf8f7] pb-20">
      <section className="border-b border-rose-100 bg-white py-16 sm:py-20">
        <div className="content-container max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#bd8585]">İletişim</p>
          <h1 className="mt-4 text-4xl font-bold text-slate-900 sm:text-5xl">Size yardımcı olalım</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">Ürün, sipariş, teslimat ve iade konularında bize yazabilirsiniz. Mağaza çevrimiçi satış yapar; ziyaret edilebilen bir mağazamız bulunmaz.</p>
        </div>
      </section>
      <div className="content-container max-w-6xl space-y-10 py-12">
        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-rose-100 bg-white p-7 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Müşteri desteği</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">Sipariş, ödeme, kargo ve iade sorularınız için iletişim formunu kullanabilirsiniz.</p>
            {email && <a href={`mailto:${email}`} className="mt-5 block break-all text-sm font-semibold text-[#a96d6d]">{email}</a>}
          </div>
          <div className="rounded-2xl border border-rose-100 bg-white p-7 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Kurumsal hediyeler</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">Çalışan ve müşteri hediyeleri için tercihlerinizi iletin; size özel seçenekleri değerlendirelim.</p>
            <a href="/toptan-ve-kurumsal-satis" className="mt-5 inline-block text-sm font-semibold text-[#a96d6d]">Hediye talep formuna git →</a>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-white p-7 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">İade ve hasar bildirimi</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">Durumu bize anlatın; varsa fotoğraf ve sipariş numaranızı paylaşın. Uygun çözüm ve gönderim bilgilerini iletelim. Yasal cayma hakkınız saklıdır.</p>
            <a href="/teslimat-ve-iade" className="mt-5 inline-block text-sm font-semibold text-[#a96d6d]">İade koşullarını gör →</a>
          </div>
        </section>
        <section id="contact-form"><MasterContactForm kvkkUrl="/kvkk" /></section>
      </div>
    </main>
  )
}
