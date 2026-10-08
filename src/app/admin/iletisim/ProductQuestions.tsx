"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { MessageSquare, Search, Send, X, ExternalLink } from "lucide-react"
import { useAdminAutoRefresh } from "@lib/hooks/use-admin-auto-refresh"

type Question = {
  id: string
  author: string
  email: string
  comment: string
  answer: string | null
  created_at: string
  product_title: string | null
  product_handle: string | null
}

export default function ProductQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [selected, setSelected] = useState<Question | null>(null)
  const [answer, setAnswer] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (selected && dialog.current && !dialog.current.open)
      dialog.current.showModal()
  }, [selected])

  async function refresh(signal?: AbortSignal) {
    const response = await fetch("/api/admin/product-questions", {
      cache: "no-store",
      signal,
    })
    const data = await response.json()
    if (!response.ok) {
      setError(data.error || "Sorular yüklenemedi.")
      setLoading(false)
      return
    }
    setQuestions(data.questions || [])
    setLoading(false)
  }
  useAdminAutoRefresh(refresh, { immediate: true })
  async function save() {
    if (!selected || saving) return
    setSaving(true)
    setError("")
    setNotice("")
    try {
      const response = await fetch("/api/admin/product-questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, answer }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Yanıt gönderilemedi.")
      setSelected(null)
      setNotice(
        data.emailSent
          ? "Yanıt yayınlandı ve müşteriye e-posta gönderildi."
          : "Yanıt yayınlandı. E-posta gönderim kuyruğuna alındı."
      )
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yanıt gönderilemedi.")
    } finally {
      setSaving(false)
    }
  }
  const pending = questions.filter((q) => !q.answer).length
  const visible = questions.filter(
    (q) =>
      (filter === "all" || Boolean(q.answer) === (filter === "answered")) &&
      `${q.author} ${q.email} ${q.product_title} ${q.comment}`
        .toLocaleLowerCase("tr")
        .includes(search.toLocaleLowerCase("tr"))
  )
  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          ["Toplam soru", questions.length],
          ["Yanıt bekleyen", pending],
          ["Yanıtlanan", questions.length - pending],
        ].map(([label, count]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{count}</p>
          </div>
        ))}
      </div>
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      {error && !selected && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3 mb-4">
          <div className="relative">
            <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
            <input
              aria-label="Ürün sorularında ara"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Müşteri, ürün veya soru ara…"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm"
            />
          </div>
          <select
            aria-label="Yanıt durumu"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="all">Tüm sorular</option>
            <option value="pending">Yanıt bekleyenler</option>
            <option value="answered">Yanıtlananlar</option>
          </select>
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Sorular yükleniyor…
          </p>
        ) : !visible.length ? (
          <p className="p-8 text-center text-sm text-slate-500">
            Soru bulunamadı.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((q) => (
              <article
                key={q.id}
                className="py-4 flex flex-col sm:flex-row gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm text-slate-900">
                      {q.product_title || "Ürün sorusu"}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        q.answer
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {q.answer ? "Yanıtlandı" : "Yanıt bekliyor"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 break-all">
                    {q.author} · {q.email} ·{" "}
                    {new Date(q.created_at).toLocaleString("tr-TR")}
                  </p>
                  <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap break-words">
                    {q.comment}
                  </p>
                  {q.answer && (
                    <p className="mt-3 rounded-xl bg-rose-50/40 p-3 text-sm text-slate-700 whitespace-pre-wrap break-words">
                      <strong>ZK Home: </strong>
                      {q.answer}
                    </p>
                  )}
                </div>
                <div className="flex sm:flex-col items-start gap-2 shrink-0">
                  {q.product_handle && (
                    <Link
                      href={`/urunler/${q.product_handle}`}
                      target="_blank"
                      className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ürünü gör
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setSelected(q)
                      setAnswer(q.answer || "")
                      setError("")
                    }}
                    className="flex items-center gap-2 rounded-xl bg-[#B98787] px-3 py-2 text-xs font-semibold text-white"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {q.answer ? "Yanıtı düzenle" : "Yanıtla"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {selected && (
        <dialog
          ref={dialog}
          onCancel={(e) => {
            if (saving) e.preventDefault()
            else setSelected(null)
          }}
          aria-labelledby="question-dialog-title"
          className="m-auto w-[calc(100%_-_2rem)] max-w-2xl max-h-[90dvh] overflow-y-auto rounded-3xl bg-white p-6 shadow-xl backdrop:bg-slate-900/50"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="question-dialog-title" className="text-lg font-bold">
              Ürün sorusunu yanıtla
            </h2>
            <button
              disabled={saving}
              aria-label="Kapat"
              onClick={() => setSelected(null)}
              className="p-2 rounded-xl hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-4 text-sm font-semibold">{selected.product_title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {selected.author} · {selected.email}
          </p>
          <p className="my-5 rounded-xl bg-slate-50 p-4 text-sm whitespace-pre-wrap break-words">
            {selected.comment}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void save()
            }}
          >
            <label
              htmlFor="product-answer"
              className="block mb-2 text-sm font-semibold"
            >
              Müşteriye yanıtınız
            </label>
            <textarea
              autoFocus
              id="product-answer"
              minLength={3}
              maxLength={10000}
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full min-h-36 rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-[#B98787]"
            />
            <p className="mt-2 text-xs text-slate-500">
              Yanıt ürünün Soru & Cevap bölümünde yayınlanır ve müşteriye
              e-posta ile iletilir.
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end">
              <button
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#B98787] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {saving ? "Gönderiliyor…" : "Yanıtı yayınla ve gönder"}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </section>
  )
}
