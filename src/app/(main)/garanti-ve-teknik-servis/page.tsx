import type { Metadata } from "next"
import Link from "next/link"
import PageHero from "../../../components/common/PageHero"
import MasterContactForm from "../../../components/common/MasterContactForm"
import { query } from "@lib/admin/db"
import { AppIcon } from "@lib/icons"
import { defaultServicePageData } from "@lib/content/service-page"
import { getBaseURL } from "@lib/util/env"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Garanti ve Teknik Servis Bilgileri",
  description: "Satış sonrası destek, 2 yıl garanti, bakım, onarım ve teknik servis süreçleri hakkında tüm detayları öğrenin.",
  alternates: {
    canonical: `${getBaseURL()}/garanti-ve-teknik-servis`,
  },
}

async function getPageData() {
  try {
    const rows = await query<{ content: any }>(
      "SELECT content FROM content_pages WHERE handle = $1 LIMIT 1",
      ["garanti-ve-teknik-servis"]
    )
    const stored = rows[0]?.content
    if (!stored || typeof stored !== "object") return defaultServicePageData
    return {
      ...defaultServicePageData,
      ...stored,
      feature_cards: Array.isArray(stored.feature_cards) ? stored.feature_cards : defaultServicePageData.feature_cards,
      coverage_items: Array.isArray(stored.coverage_items) ? stored.coverage_items : defaultServicePageData.coverage_items,
      exclusion_items: Array.isArray(stored.exclusion_items) ? stored.exclusion_items : defaultServicePageData.exclusion_items,
      process_steps: Array.isArray(stored.process_steps) ? stored.process_steps : defaultServicePageData.process_steps,
    }
  } catch {
    return defaultServicePageData
  }
}

async function getMasterFormSettings() {
  const fallback = {
    form_title: "Mesaj Gönderin",
    form_description: "Formu doldurun; mesajınız destek ekibimize kaydedilsin.",
    kvkk_url: "/gizlilik-politikasi",
  }
  try {
    const rows = await query<{ value: any }>(
      "SELECT value FROM store_settings WHERE key = 'contact_info' LIMIT 1"
    )
    return { ...fallback, ...(rows[0]?.value || {}) }
  } catch {
    return fallback
  }
}

export default async function ServicePage() {
  const [content, masterForm] = await Promise.all([
    getPageData(),
    getMasterFormSettings(),
  ])

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-16">
      <PageHero
        breadcrumb={[
          { title: "Kurumsal", href: "/hakkimizda" },
          { title: content.title },
        ]}
        title={content.title}
        subtitle={content.subtitle}
        paragraphs={[content.description]}
        heroImage={content.hero_image}
        heroImageAlt={content.title}
      />

      <section className="py-10 sm:py-12">
        <div className="content-container space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {content.feature_cards.map((item: any, index: number) => (
              <article key={`${item.title}-${index}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-rose-200 hover:shadow-lg">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-[#C98484] transition group-hover:bg-[#C98484] group-hover:text-white">
                  <AppIcon name={item.icon} className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-black text-slate-900">{item.title}</h2>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.desc}</p>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-900">{content.coverage_title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{content.coverage_intro}</p>
              <ul className="mt-4 space-y-2.5">
                {content.coverage_items.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <AppIcon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-[#C98484]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-2xl border border-red-100 bg-red-50/40 p-6 shadow-sm">
              <h2 className="text-base font-black text-slate-900">{content.exclusion_title}</h2>
              <ul className="mt-4 space-y-2.5">
                {content.exclusion_items.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <AppIcon name="x" className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-7 text-center text-xl font-black text-slate-900">{content.process_title}</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
              {content.process_steps.map((step: any, index: number) => (
                <article key={`${step.title}-${index}`} className="relative text-center">
                  <span className="absolute left-1/2 top-0 z-10 -translate-x-8 -translate-y-1 rounded-full bg-[#C98484] px-2 py-1 text-[10px] font-black text-white">{index + 1}</span>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm">
                    <AppIcon name={step.icon} className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-xs font-black text-slate-900">{step.title}</h3>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">{step.desc}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {content.show_contact_form !== false && (
              <div className="lg:col-span-2">
                <MasterContactForm
                  formTitle={masterForm.form_title}
                  formDescription={masterForm.form_description}
                  kvkkUrl={masterForm.kvkk_url || "/gizlilik-politikasi"}
                  defaultSubject="Teknik Destek & Garanti"
                  className="h-full"
                />
              </div>
            )}

            <aside className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${content.show_contact_form === false ? "lg:col-span-3" : ""}`}>
              <h2 className="text-lg font-black text-slate-900">{content.contact_title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{content.contact_description}</p>
              <div className="mt-6 space-y-5">
                <div className="flex gap-3">
                  <AppIcon name="phone" className="mt-0.5 h-5 w-5 shrink-0 text-[#C98484]" />
                  <div><div className="text-xs font-black text-slate-900">{content.phone}</div><div className="text-[11px] text-slate-500">{content.phone_note}</div></div>
                </div>
                <div className="flex gap-3">
                  <AppIcon name="mail" className="mt-0.5 h-5 w-5 shrink-0 text-[#C98484]" />
                  <div><div className="text-xs font-black text-slate-900">{content.email}</div><div className="text-[11px] text-slate-500">{content.email_note}</div></div>
                </div>
                <div className="flex gap-3">
                  <AppIcon name="map-pin" className="mt-0.5 h-5 w-5 shrink-0 text-[#C98484]" />
                  <div className="text-xs font-semibold leading-relaxed text-slate-700">{content.address}</div>
                </div>
              </div>
              <Link href={content.map_link || "/iletisim"} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-800 hover:border-rose-200 hover:text-[#C98484]">
                Servis Noktalarını Görüntüle
                <AppIcon name="arrow-right" className="h-4 w-4" />
              </Link>
            </aside>
          </section>
        </div>
      </section>
    </main>
  )
}
