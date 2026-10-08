"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, Loader2, MessageSquare, Package, Tag, X } from "lucide-react"
import { useAdminAutoRefresh } from "@lib/hooks/use-admin-auto-refresh"

type Notification = {
  id: string; kind: string; title: string; body: string; href: string
  created_at: string; is_read: boolean
}

export default function CustomerNotifications({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [authenticated, setAuthenticated] = useState(true)
  const [position, setPosition] = useState({ top: 100, right: 16 })
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const requestSequence = useRef(0)

  const load = useCallback(async (signal?: AbortSignal) => {
    const sequence = ++requestSequence.current
    try {
      const response = await fetch("/api/account/notifications", { cache: "no-store", signal })
      if (signal?.aborted || sequence !== requestSequence.current) return
      if (response.status === 401) { setAuthenticated(false); setOpen(false); return }
      if (!response.ok) throw new Error()
      const data = await response.json()
      if (signal?.aborted || sequence !== requestSequence.current) return
      setItems(data.notifications || [])
      setUnread(data.unreadCount || 0)
      setError("")
    } catch {
      if (!signal?.aborted && sequence === requestSequence.current) setError("Bildirimler yüklenemedi. Tekrar deneyebilirsiniz.")
    } finally {
      if (!signal?.aborted && sequence === requestSequence.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => { controller.abort(); requestSequence.current++ }
  }, [customerId, load])
  useAdminAutoRefresh(load, { enabled: authenticated && !loading && !saving, refreshKey: customerId })

  useEffect(() => {
    if (!open) return
    const updatePosition = () => {
      const rect = trigger.current?.getBoundingClientRect()
      if (rect) setPosition({ top: rect.bottom + 12, right: Math.max(16, window.innerWidth - rect.right) })
    }
    updatePosition()
    window.addEventListener("resize", updatePosition)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    panel.current?.querySelector<HTMLButtonElement>("button")?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
      if (event.key !== "Tab") return
      const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]') || [])
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("resize", updatePosition)
      document.removeEventListener("keydown", onKey)
      trigger.current?.focus()
    }
  }, [open])

  const markRead = async (item?: Notification) => {
    if (saving) return
    if (item?.is_read) { setOpen(false); router.push(item.href); return }
    setSaving(true)
    ++requestSequence.current
    try {
      const response = await fetch("/api/account/notifications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item ? { ids: [item.id] } : { all: true }),
      })
      if (!response.ok) throw new Error()
      const data = await response.json()
      setItems(data.notifications || [])
      setUnread(data.unreadCount || 0)
      setError("")
      if (item) { setOpen(false); router.push(item.href) }
    } catch { setError("Bildirim okunmuş olarak kaydedilemedi. Lütfen tekrar deneyin.") }
    finally { setSaving(false) }
  }

  if (!authenticated) return null
  return <>
    <button ref={trigger} type="button" onClick={() => { setOpen(true); void load() }}
      aria-label={unread ? `Bildirimler, ${unread} okunmamış` : "Bildirimler"}
      aria-haspopup="dialog" aria-expanded={open} title="Bildirimler"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-[#F8EEEE] hover:text-[#A95E5E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484]">
      <Bell className="h-[19px] w-[19px]" aria-hidden="true" />
      {unread > 0 && <span className="absolute right-0 top-0 flex min-w-4 h-4 items-center justify-center rounded-full bg-[#C98484] px-1 text-[9px] font-bold text-white" aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
    </button>
    {open && createPortal(<div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/25 lg:bg-black/10" onClick={() => setOpen(false)} aria-hidden="true" />
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="customer-notifications-title"
        className="fixed inset-x-0 bottom-0 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-3xl border border-[#EEDDDD] bg-white text-slate-800 shadow-2xl lg:inset-x-auto lg:bottom-auto lg:w-[400px] lg:max-h-[min(70dvh,600px)] lg:rounded-2xl"
        style={{ "--notification-top": `${position.top}px`, "--notification-right": `${position.right}px` } as React.CSSProperties}>
        <style>{`@media(min-width:1024px){[aria-labelledby="customer-notifications-title"]{top:var(--notification-top);right:var(--notification-right);max-height:min(600px,calc(100dvh - var(--notification-top) - 16px))}}`}</style>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#EEDDDD] lg:hidden" />
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div><h2 id="customer-notifications-title" className="text-lg font-bold">Bildirimler</h2><p className="mt-0.5 text-xs text-slate-500">{unread ? `${unread} okunmamış bildiriminiz var` : "Güncel haberleriniz burada"}</p></div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Bildirimleri kapat" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF5F3] text-[#A95E5E]"><X className="h-5 w-5" /></button>
        </div>
        {error && <div className="flex items-center justify-between gap-2 bg-rose-50 px-5 py-3 text-xs text-rose-700" role="alert"><span>{error}</span><button type="button" onClick={() => void load()} className="shrink-0 font-bold underline">Tekrar dene</button></div>}
        <div className="min-h-0 overflow-y-auto overscroll-contain">
          {loading ? <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-[#C98484]" aria-label="Yükleniyor" /></div> : items.length ? items.map(item => {
            const Icon = item.kind === "message" ? MessageSquare : item.kind === "order" ? Package : Tag
            return <button key={item.id} type="button" disabled={saving} onClick={() => void markRead(item)}
              className={`flex w-full gap-3 border-b border-slate-100 px-5 py-4 text-left transition-colors hover:bg-[#FAF5F3] disabled:opacity-60 ${item.is_read ? "bg-white" : "bg-[#FDF7F5]"}`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4E7E3] text-[#A95E5E]"><Icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="text-sm font-semibold">{item.title}</span>{!item.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#C98484]" aria-label="Okunmamış" />}</span>
                <span className="mt-1 block whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-500">{item.body}</span>
                <time className="mt-2 block text-[10px] text-slate-400" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}</time>
              </span>
            </button>
          }) : <div className="px-6 py-12 text-center"><Bell className="mx-auto mb-3 h-8 w-8 text-[#C98484]" /><p className="text-sm font-semibold">Henüz bildiriminiz yok</p><p className="mt-1 text-xs text-slate-500">Mesaj yanıtları, sipariş haberleri ve kampanyalar burada görünecek.</p></div>}
        </div>
        <div className="shrink-0 border-t border-slate-100 bg-white px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
          <button type="button" disabled={!unread || saving} onClick={() => void markRead()} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#EEDDDD] text-xs font-semibold text-[#A95E5E] disabled:opacity-40"><CheckCheck className="h-4 w-4" />Tümünü okundu işaretle</button>
        </div>
      </div>
    </div>, document.body)}
  </>
}
