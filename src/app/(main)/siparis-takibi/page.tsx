import Link from "next/link"
import { ArrowRight, Box, Check, Clock3, Mail, PackageCheck, Truck } from "lucide-react"
import PageHero from "../../../components/common/PageHero"
import { query } from "@lib/admin/db"
import OrderTrackingSearch from "./OrderTrackingSearch"

import { Metadata } from "next"
import { getBaseURL } from "@lib/util/env"

export const metadata: Metadata = {
  title: "Sipariş Takibi",
  description: "Siparişinizin hazırlık, kargo ve teslimat durumunu anlık takip edin.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: `${getBaseURL()}/siparis-takibi`,
  },
}

const stepIcons = [Check, Box, PackageCheck, Truck, Check]

export default async function OrderTrackingPage() {
  const content: Record<string, any> = await query<{ content: Record<string, any> }>("SELECT content FROM content_pages WHERE handle = 'siparis-takibi' LIMIT 1")
    .then((rows) => rows[0]?.content || {})
    .catch(() => ({} as Record<string, any>))
  const helpQuestions = String(content.help_questions || "Siparişim ne zaman kargoya verilir?\nKargo takibini nasıl yaparım?\nSiparişimi iptal edebilir miyim?\nÜrün iadesi nasıl yapılır?").split("\n").filter(Boolean)
  const stepTitles = String(content.process_steps || "Sipariş Alındı\nHazırlanıyor\nKargoya Verildi\nYolda\nTeslim Edildi").split("\n").filter(Boolean)
  return (
    <main className="min-h-screen bg-[#fbfcfd] pb-16">
      <PageHero
        breadcrumb={[{ title: "Sipariş Takibi" }]}
        title={content.title || "Sipariş Takibi"}
        paragraphs={[content.hero_text || content.description || "Siparişinizin durumuna, kargo bilgilerine ve sipariş detaylarına kolayca ulaşabilirsiniz."]}
        heroImage={content.hero_image || "/brand/placeholder.svg"}
        heroImageAlt={content.title || "Sipariş Takibi"}
      />

      <div className="content-container space-y-5 py-8 sm:py-10">
        <section className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs md:grid-cols-2">
          <div className="p-5 sm:p-7">
            <h2 className="text-base font-extrabold text-slate-900">{content.query_title || "Siparişinizi Sorgulayın"}</h2>
            <p className="mt-2 max-w-lg text-xs leading-5 text-slate-500">{content.query_description || "Sipariş numaranızı ve siparişte kullandığınız e-posta adresinizi girin."}</p>
            <OrderTrackingSearch orderPlaceholder={content.order_placeholder || "Sipariş Numaranız"} emailPlaceholder={content.email_placeholder || "E-posta Adresiniz"} buttonText={content.query_button || "Siparişimi Sorgula"} />
          </div>
          <div className="border-t border-slate-100 bg-slate-50/50 p-5 sm:p-7 md:border-l md:border-t-0">
            <h2 className="text-base font-extrabold text-slate-900">{content.account_title || "Sipariş Numaram Nerede?"}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">{content.account_description || "Sipariş numaranız sipariş onay e-postanızda ve hesabınızdaki siparişler bölümünde yer alır."}</p>
            <Link href="/hesabim/siparislerim" className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-extrabold text-slate-800 transition hover:border-rose-200 hover:text-[#C98484]">{content.account_button || "Hesabıma Git"} <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="text-base font-extrabold text-slate-900">{content.process_title || "Sipariş Süreci"}</h2><p className="mt-1 text-xs text-slate-500">{content.process_description || "Siparişiniz aşağıdaki aşamalardan geçerek size ulaşır."}</p></div>
            <Clock3 className="h-6 w-6 text-[#C98484]" />
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-5">
            {stepTitles.map((stepTitle, index) => {
              const Icon = stepIcons[index] || Check
              return <div key={`${stepTitle}-${index}`} className="relative flex items-center gap-3 sm:flex-col sm:text-center"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-[#C98484]"><Icon className="h-5 w-5" /></span><div><span className="text-[10px] font-black text-[#C98484]">{index + 1}. ADIM</span><h3 className="mt-0.5 text-xs font-extrabold text-slate-800">{stepTitle}</h3></div>{index < stepTitles.length - 1 && <span className="absolute left-1/2 top-[22px] hidden h-px w-full bg-rose-100 sm:block" />}</div>
            })}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
            <h2 className="text-base font-extrabold text-slate-900">{content.help_title || "Yardımcı Olalım"}</h2>
            <div className="mt-4 divide-y divide-slate-100">
              {helpQuestions.map((question) => <Link key={question} href="/sss" className="flex items-center justify-between py-3 text-xs font-semibold text-slate-700 hover:text-[#C98484]">{question}<ArrowRight className="h-3.5 w-3.5" /></Link>)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
            <h2 className="text-base font-extrabold text-slate-900">{content.support_title || "Hızlı Destek"}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">{content.support_description || "Siparişinizle ilgili farklı bir sorunuz mu var? Ekibimiz size yardımcı olmaktan memnuniyet duyar."}</p>
            <Link href="/iletisim" className="mt-5 inline-flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm font-bold text-slate-900 hover:bg-rose-100"><Mail className="h-6 w-6 text-[#C98484]" />İletişim formuna git <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </div>
    </main>
  )
}
