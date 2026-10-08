"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, HelpCircle, RefreshCw, Clock, CheckCircle } from "@lib/icons"
import { useAdminAutoRefresh } from "@lib/hooks/use-admin-auto-refresh"
import { useUrlState } from "@lib/hooks/use-url-state"

type Question = {
  id: string
  comment: string
  answer: string | null
  answered: boolean
  created_at: string
  answered_at: string | null
  product_title: string | null
  product_handle: string | null
}
const date = (value: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(value))

export default function CustomerQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedId, setSelectedId] = useUrlState<string>("", "soru")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  async function refresh(signal?: AbortSignal) {
    try {
      const response = await fetch("/api/account/product-questions", { cache: "no-store", signal })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Sorularınız yüklenemedi.")
      if (signal?.aborted) return
      setQuestions(data.questions || [])
      setSelectedId(current => data.questions?.some((question: Question) => question.id === current) ? current : data.questions?.[0]?.id || "")
      setError("")
    } catch (error) {
      if (!signal?.aborted) setError(error instanceof Error ? error.message : "Sorularınız yüklenemedi.")
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }
  useAdminAutoRefresh(refresh, { immediate: true })
  const selected = questions.find(question => question.id === selectedId) || questions[0]
  const pending = questions.filter(question => !question.answered).length
  const productUrl = selected?.product_handle ? `/urunler/${encodeURIComponent(selected.product_handle)}` : null
  return <section className="space-y-5 py-5 md:py-0 pb-24 md:pb-0">
    <Link href="/hesabim" className="inline-flex items-center gap-2 text-sm text-slate-500 md:hidden"><ArrowLeft className="h-4 w-4" />Hesabıma dön</Link>
    <header><h1 className="text-2xl font-bold text-slate-900">Ürün Sorularım</h1><p className="mt-1 text-sm text-slate-500">Ürünler hakkında sorduğunuz soruları ve ZK Home yanıtlarını takip edin.</p></header>
    {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-b border-slate-100 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4"><div><h2 className="text-sm font-bold">Sorular ({questions.length})</h2><p className="mt-1 text-xs text-slate-400">{pending} soru yanıt bekliyor</p></div><button type="button" onClick={() => void refresh()} aria-label="Soruları yenile" className="rounded-lg p-2 text-slate-500 hover:bg-rose-50"><RefreshCw className="h-4 w-4" /></button></div>
        {loading ? <p className="p-5 text-sm text-slate-500">Sorularınız yükleniyor…</p> : !questions.length ? <p className="p-5 text-sm text-slate-500">Henüz ürün sorunuz bulunmuyor.</p> : <ul className="max-h-64 overflow-y-auto md:max-h-[720px]">{questions.map(question => <li key={question.id}><button type="button" aria-current={selected?.id === question.id ? "true" : undefined} onClick={() => setSelectedId(question.id)} className={`w-full border-b border-slate-100 px-4 py-4 text-left transition-colors ${selected?.id === question.id ? "border-l-4 border-l-[#C98484] bg-rose-50/70" : "hover:bg-slate-50"}`}>
          <span className="block break-words text-sm font-bold text-slate-800">{question.product_title || "Ürün sorusu"}</span><span className="mt-1 line-clamp-2 text-xs text-slate-500">{question.comment}</span><span className="mt-2 block text-xs text-slate-400">{date(question.created_at)}</span><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold ${question.answered ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{question.answered ? "Yanıtlandı" : "Yanıt bekleniyor"}</span>
        </button></li>)}</ul>}
      </aside>
      <div className="min-w-0 p-4 sm:p-6">
        {!selected ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center"><HelpCircle className="h-10 w-10 text-[#C98484]" /><h2 className="font-bold text-slate-800">Ürün sorularınız burada</h2><p className="max-w-sm text-sm text-slate-500">Ürün sayfasındaki Soru & Cevap bölümünden bize soru sorabilirsiniz.</p><Link href="/magaza" className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#C98484] px-4 py-3 text-sm font-semibold text-white">Ürünleri keşfet<ArrowRight className="h-4 w-4" /></Link></div> : <>
          <header className="mb-5 border-b border-slate-100 pb-4"><p className="text-xs font-semibold text-[#C98484]">Ürün sorusu #{selected.id}</p><h2 className="mt-1 break-words text-lg font-bold text-slate-900">{selected.product_title || "Ürün sorusu"}</h2>{productUrl && <Link href={productUrl} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#C98484]">Ürünü görüntüle<ArrowRight className="h-3 w-3" /></Link>}</header>
          <article className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="text-sm font-bold text-slate-800">Sorunuz</h3><time dateTime={selected.created_at} className="text-xs text-slate-400">{date(selected.created_at)}</time></div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{selected.comment}</p></article>
          {selected.answered ? <article className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap justify-between gap-2"><h3 className="inline-flex items-center gap-2 text-sm font-bold text-slate-800"><CheckCircle className="h-4 w-4 text-[#C98484]" />ZK Home yanıtı</h3>{selected.answered_at && <time dateTime={selected.answered_at} className="text-xs text-slate-400">{date(selected.answered_at)}</time>}</div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-600">{selected.answer}</p></article> : <p role="status" className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800"><Clock className="mt-0.5 h-4 w-4 shrink-0" />Sorunuz alındı. En kısa sürede yanıtlayacağız. Yanıtınızı burada görebileceksiniz.</p>}
          {productUrl && <div className="mt-6 border-t border-slate-100 pt-5"><p className="mb-3 text-sm text-slate-500">Bu ürün hakkında başka bir sorunuz mu var?</p><Link href={`${productUrl}#sorular`} className="inline-flex items-center gap-2 rounded-xl bg-[#C98484] px-4 py-3 text-sm font-semibold text-white hover:bg-[#B87272]">Yeni soru sor<ArrowRight className="h-4 w-4" /></Link></div>}
        </>}
      </div>
    </div>
  </section>
}
