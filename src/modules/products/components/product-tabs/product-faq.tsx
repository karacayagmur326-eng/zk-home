"use client"

import { useEffect, useState } from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"
import { productFaqItems } from "@lib/util/product-faq"
import { analyticsAllowed } from "@lib/analytics/ecommerce"

export default function ProductFaq({ html, productId }: { html: string; productId: string }) {
  const items = productFaqItems(html)
  const [votes, setVotes] = useState<Record<string, string>>({})
  const key = `zk-product-faq:${productId}`
  useEffect(() => {
    try { setVotes(JSON.parse(localStorage.getItem(key) || "{}")) } catch { setVotes({}) }
  }, [key])
  function vote(question: string, value: string) {
    const next = { ...votes, [question]: value }
    setVotes(next)
    try { localStorage.setItem(key, JSON.stringify(next)) } catch {}
    if (analyticsAllowed()) {
      const browser = window as any
      const data = { item_id: productId, question: question.replace(/<[^>]*>/g, ""), feedback: value }
      if (typeof browser.gtag === "function") browser.gtag("event", "product_faq_feedback", data)
      else if (browser.__zkGtmReady) browser.dataLayer?.push({ event: "product_faq_feedback", ...data })
    }
  }
  return <div className="product-faq space-y-4">
    {items.length ? items.map(item => <article key={item.question} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-900" dangerouslySetInnerHTML={{ __html: item.question }} />
      <div className="product-rich-text" dangerouslySetInnerHTML={{ __html: item.answer }} />
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <span className="mr-1 text-xs text-slate-500">Bu yanıt faydalı mı?</span>
        {[["yes", "Faydalı", ThumbsUp], ["no", "Faydalı değil", ThumbsDown]].map(([value, label, Icon]) => {
          const FeedbackIcon = Icon as typeof ThumbsUp
          return <button key={String(value)} type="button" aria-pressed={votes[item.question] === value} onClick={() => vote(item.question, String(value))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 transition hover:border-primary hover:text-primary aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:text-primary">
            <FeedbackIcon size={14} aria-hidden="true" />{String(label)}
          </button>
        })}
        {votes[item.question] && <span role="status" className="w-full text-xs text-slate-500">Tercihiniz kaydedildi. Teşekkürler.</span>}
      </div>
    </article>) : <div className="product-rich-text" dangerouslySetInnerHTML={{ __html: html }} />}
  </div>
}
