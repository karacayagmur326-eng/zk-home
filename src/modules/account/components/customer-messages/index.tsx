"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { MessageSquare, Send, Loader2, RefreshCw, ArrowLeft, Plus } from "@lib/icons"

type MessageSummary = { id: string; subject: string; order_no: string | null; status: string; created_at: string; updated_at: string }
type Conversation = MessageSummary & { history: Array<{ id: string; direction: string; body: string; created_at: string }> }
const statusLabels: Record<string, string> = { new: "Yanıt bekleniyor", read: "İnceleniyor", replied: "Yanıtlandı", archived: "Arşivlendi" }
const formatDate = (value: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(new Date(value))

export default function CustomerMessages() {
  const [messages, setMessages] = useState<MessageSummary[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [reload, setReload] = useState(0)
  const detailRequest = useRef(0)

  const loadList = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/account/messages", { cache: "no-store", signal })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Mesajlar yüklenemedi.")
      if (signal?.aborted) return
      setMessages(data.messages || [])
      setSelectedId((current) => data.messages?.some((m: MessageSummary) => m.id === current) ? current : data.messages?.[0]?.id || "")
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : "Mesajlar yüklenemedi.")
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    loadList(controller.signal)
    const refresh = () => { if (!document.hidden) loadList(controller.signal) }
    const timer = window.setInterval(refresh, 30000)
    window.addEventListener("focus", refresh)
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh) }
  }, [loadList])

  useEffect(() => {
    if (!selectedId) return
    const controller = new AbortController()
    const load = async () => {
      const sequence = ++detailRequest.current
      try {
        const response = await fetch(`/api/account/messages?id=${encodeURIComponent(selectedId)}`, { cache: "no-store", signal: controller.signal })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Yazışma yüklenemedi.")
        if (!controller.signal.aborted && sequence === detailRequest.current) setConversation(data.message)
      } catch (err) {
        if (!controller.signal.aborted && sequence === detailRequest.current) setError(err instanceof Error ? err.message : "Yazışma yüklenemedi.")
      }
    }
    load()
    const refresh = () => { if (!document.hidden) load() }
    const timer = window.setInterval(refresh, 30000)
    window.addEventListener("focus", refresh)
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh) }
  }, [selectedId, reload])

  const thread = conversation?.id === selectedId ? conversation : null
  const draft = drafts[selectedId] || ""
  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending || !selectedId || draft.trim().length < 3) return
    setSending(true); setError(""); setNotice("")
    try {
      const response = await fetch("/api/account/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedId, message: draft }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Mesaj gönderilemedi.")
      ++detailRequest.current
      setConversation(data.message)
      setDrafts((current) => ({ ...current, [selectedId]: "" }))
      setNotice("Mesajınız destek ekibimize iletildi.")
      setReload((current) => current + 1)
      loadList()
    } catch (err) { setError(err instanceof Error ? err.message : "Mesaj gönderilemedi.") }
    finally { setSending(false) }
  }

  return (
    <section className="space-y-5 py-5 md:py-0 pb-24 md:pb-0">
      <Link href="/hesabim" className="inline-flex items-center gap-2 text-sm text-slate-500 md:hidden"><ArrowLeft className="h-4 w-4" /> Hesabıma dön</Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">Mesajlarım</h1><p className="mt-1 text-sm text-slate-500">Sorularınızı ve destek ekibimizin yanıtlarını buradan takip edin.</p></div>
        <Link href="/iletisim" className="inline-flex items-center gap-2 rounded-xl bg-[#C98484] px-4 py-3 text-sm font-bold text-white hover:bg-[#B87272]"><Plus className="h-4 w-4" /> Yeni mesaj</Link>
      </header>
      {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
      <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-slate-100 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4"><h2 className="text-sm font-bold">Yazışmalar ({messages.length})</h2><button type="button" onClick={() => { setError(""); loadList(); setReload((n) => n + 1) }} aria-label="Mesajları yenile" className="rounded-lg p-2 text-slate-500 hover:bg-rose-50"><RefreshCw className="h-4 w-4" /></button></div>
          {loading ? <p className="p-5 text-sm text-slate-500">Mesajlar yükleniyor…</p> : !messages.length ? <p className="p-5 text-sm text-slate-500">Henüz bir mesaj göndermediniz.</p> : (
            <ul className="max-h-64 overflow-y-auto md:max-h-[720px]">{messages.map((message) => <li key={message.id}>
              <button type="button" disabled={sending} aria-current={selectedId === message.id ? "true" : undefined}
                onClick={() => { setSelectedId(message.id); setNotice(""); setError("") }}
                className={`w-full border-b border-slate-100 px-4 py-4 text-left transition-colors disabled:opacity-60 ${selectedId === message.id ? "bg-rose-50/70 border-l-4 border-l-[#C98484]" : "hover:bg-slate-50"}`}>
                <span className="block text-sm font-bold text-slate-800 break-words">{message.subject || "İletişim talebi"}</span>
                <span className="mt-1 block text-xs text-slate-400">#{message.id} · {formatDate(message.updated_at || message.created_at)}</span>
                <span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold ${message.status === "replied" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{statusLabels[message.status] || "İnceleniyor"}</span>
              </button>
            </li>)}</ul>
          )}
        </aside>
        <div className="min-w-0 p-4 sm:p-6">
          {!selectedId ? <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center"><MessageSquare className="h-10 w-10 text-[#C98484]" /><h2 className="font-bold text-slate-800">Size nasıl yardımcı olabiliriz?</h2><p className="max-w-sm text-sm text-slate-500">İletişim formundan mesaj gönderin; yanıtları burada görün ve yazışmaya devam edin.</p></div> : !thread ? <p className="py-12 text-center text-sm text-slate-500">Yazışma yükleniyor…</p> : <>
            <header className="border-b border-slate-100 pb-4"><p className="text-xs font-bold text-[#C98484]">Talep #{thread.id}</p><h2 className="mt-1 text-lg font-bold break-words">{thread.subject || "İletişim talebi"}</h2>{thread.order_no && <p className="mt-1 text-xs text-slate-500">Sipariş: {thread.order_no}</p>}</header>
            <ol aria-label="Yazışma geçmişi" className="my-5 space-y-4">{thread.history.map((entry) => <li key={entry.id}
              className={`rounded-2xl border p-4 ${entry.direction === "incoming" ? "ml-4 border-rose-100 bg-rose-50/50" : "mr-4 border-slate-200 bg-slate-50"}`}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><strong className="text-xs text-slate-700">{entry.direction === "incoming" ? "Siz" : "ZK Home Destek"}</strong><time dateTime={entry.created_at} className="text-[10px] text-slate-400">{formatDate(entry.created_at)}</time></div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{entry.body}</p>
            </li>)}</ol>
            <form onSubmit={send} className="border-t border-slate-100 pt-4">
              <label htmlFor="customer-contact-reply" className="mb-2 block text-sm font-bold">Mesajınız</label>
              <textarea id="customer-contact-reply" value={draft} onChange={(event) => setDrafts((current) => ({ ...current, [selectedId]: event.target.value }))} required minLength={3} maxLength={5000} disabled={sending}
                placeholder="Yazışmaya devam edin…" className="min-h-32 w-full rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-[#C98484] focus:ring-2 focus:ring-rose-100" />
              <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-400">{draft.length}/5000</span><button type="submit" disabled={sending || draft.trim().length < 3} className="inline-flex items-center gap-2 rounded-xl bg-[#C98484] px-5 py-3 text-sm font-bold text-white hover:bg-[#B87272] disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} {sending ? "Gönderiliyor…" : "Mesajı gönder"}</button></div>
            </form>
          </>}
        </div>
      </div>
    </section>
  )
}
