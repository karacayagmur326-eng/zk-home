"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import AdminTabs from "@components/admin/AdminTabs"
import { AppIcon } from "@lib/icons"
import { useAdminAutoRefresh } from "@lib/hooks/use-admin-auto-refresh"
import { useUrlState } from "@lib/hooks/use-url-state"

type Entry = {
  id: string; order_id?: string; display_id: number; email: string;
  reason?: string; note?: string; status?: string; payment_status?: string;
  refund_status?: string; provider_reference?: string | boolean | null;
  error_message?: string; created_at: string; amount?: number | string;
  total?: number | string; refund_amount?: number | string; currency_code: string;
  items?: { title: string; quantity: number }[];
}
type Data = { requests: Entry[]; cancellations: Entry[]; refunds: Entry[] }
type Tab = keyof Data
const tabs = ["requests", "cancellations", "refunds"] as const
const labels: Record<string, string> = { requested: "Talep edildi", approved: "Onaylandı", rejected: "Reddedildi", received: "Ürün ulaştı", refunded: "İade tamamlandı", pending: "Sonuç bekleniyor", completed: "Sağlayıcı onayladı", failed: "Başarısız", cancelled: "İptal edildi", paid: "Ödeme alındı", refund_pending: "İade sonucu bekleniyor", partially_refunded: "Kısmi iade" }
const empty = { requests: [], cancellations: [], refunds: [] }
function money(value: number | string | undefined, currency = "TRY") { return new Intl.NumberFormat("tr-TR", { style: "currency", currency: currency.toUpperCase() }).format(Number(value || 0) / 100) }
function date(value: string) { return new Date(value).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "short", timeStyle: "short" }) }
function Status({ value, verified = true }: { value?: string; verified?: boolean }) {
  const positive = ["approved", "received", "completed", "refunded"].includes(value || "") && verified
  const danger = ["rejected", "failed"].includes(value || "")
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${positive ? "border-emerald-100 bg-emerald-50 text-emerald-700" : danger ? "border-rose-100 bg-rose-50 text-rose-700" : "border-amber-100 bg-amber-50 text-amber-800"}`}>{value === "completed" && !verified ? "Sağlayıcı onayı doğrulanmalı" : labels[value || ""] || value || "Kayıt yok"}</span>
}

export default function ReturnsAdminPage() {
  const [data, setData] = useState<Data>(empty)
  const [tab, setTab] = useUrlState<Tab>("requests", "tab", tabs)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useUrlState<string>("all", "status", ["all", "requested", "approved", "rejected", "received", "refunded", "pending", "completed", "failed", "paid", "refund_pending", "partially_refunded"])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/admin/returns", { cache: "no-store", signal })
      if (!response.ok) throw new Error("İade ve iptal kayıtları yüklenemedi. Lütfen tekrar deneyin.")
      const next = await response.json()
      if (!signal?.aborted) { setData({ requests: next.requests || [], cancellations: next.cancellations || [], refunds: next.refunds || [] }); setError("") }
    } catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : "Kayıtlar yüklenemedi.") }
    finally { if (!signal?.aborted) setLoading(false) }
  }, [])
  useEffect(() => { const c = new AbortController(); void load(c.signal); return () => c.abort() }, [load])
  useAdminAutoRefresh(load, { enabled: !saving })
  async function update(id: string, next: string) {
    setSaving(true); setMessage("")
    try {
      const response = await fetch("/api/admin/returns", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: next }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "İade talebi güncellenemedi.")
      setMessage("İade talebi güncellendi."); await load()
    } catch (e) { setError(e instanceof Error ? e.message : "İşlem başarısız.") }
    finally { setSaving(false) }
  }
  const rows = useMemo(() => data[tab].filter(item => {
    const effective = tab === "cancellations" ? item.payment_status : item.status
    return (status === "all" || status === effective) && `${item.display_id} ${item.email} ${item.reason || ""} ${item.note || ""} ${(item.items || []).map(i => i.title).join(" ")}`.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR"))
  }), [data, tab, search, status])
  const options = tab === "requests" ? ["requested", "approved", "rejected", "received", "refunded"] : tab === "refunds" ? ["pending", "completed", "failed"] : ["paid", "refunded", "refund_pending", "partially_refunded", "failed"]
  return <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-3">{[
      { label: "Ürün iade talepleri", count: data.requests.length, icon: "RotateCcw", note: "Teslimat sonrası ürün iadeleri" },
      { label: "İptal edilen siparişler", count: data.cancellations.length, icon: "CircleX", note: "Sipariş iptalleri ve ödeme durumları" },
      { label: "Sonuç bekleyen para iadeleri", count: data.refunds.filter(r => r.status === "pending").length, icon: "CreditCard", note: `${data.refunds.length} para iadesi kaydı` },
    ].map(item => <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs"><div><p className="text-xs font-medium text-slate-500">{item.label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{item.count}</p><p className="mt-1 text-xs text-slate-500">{item.note}</p></div><span className="rounded-xl bg-[#B98787]/10 p-3 text-[#B98787]"><AppIcon name={item.icon} size={21} /></span></div>)}</div>
    <AdminTabs value={tab} onChange={next => { setTab(next); setStatus("all"); setSearch("") }} label="İade ve iptal bölümleri" items={[
      { value: "requests", label: "İade Talepleri", count: data.requests.length }, { value: "cancellations", label: "İptaller", count: data.cancellations.length }, { value: "refunds", label: "Para İadeleri", count: data.refunds.length },
    ]} />
    {error && <div role="alert" className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">{error} <button type="button" onClick={() => void load()} className="ml-3 font-semibold underline">Tekrar dene</button></div>}
    {message && <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p>}
    <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-[1fr_220px]">
        <input aria-label="İade ve iptal kayıtlarında ara" placeholder="Sipariş no, müşteri e-postası veya neden ara..." value={search} onChange={e => setSearch(e.target.value)} />
        <select aria-label="Duruma göre filtrele" value={status} onChange={e => setStatus(e.target.value)}><option value="all">Tüm durumlar</option>{options.map(value => <option key={value} value={value}>{labels[value]}</option>)}</select>
      </div>
      <div className="overflow-x-auto">
        {loading ? <p role="status" className="p-10 text-center text-sm text-slate-500">Kayıtlar yükleniyor...</p> : !rows.length ? <div className="flex flex-col items-center gap-3 p-12 text-center text-slate-500"><AppIcon name="Package" size={28} /><p className="text-sm">{error ? "Kayıtlar yüklenemedi. Lütfen tekrar deneyin." : search || status !== "all" ? "Filtrelerinize uygun kayıt bulunamadı." : tab === "requests" ? "Henüz ürün iade talebi yok." : tab === "cancellations" ? "Henüz iptal edilen sipariş yok." : "Henüz para iadesi kaydı yok."}</p></div> : <table className="admin-table w-full">
          <thead><tr><th>Sipariş / Müşteri</th><th>{tab === "requests" ? "Ürünler / İade nedeni" : "Açıklama"}</th><th>{tab === "cancellations" ? "Ödeme / İade" : "Durum"}</th><th>{tab === "requests" ? "Tarih" : "Tutar / Tarih"}</th><th>İşlemler</th></tr></thead>
          <tbody>{rows.map(item => <tr key={item.id}>
            <td><Link href={`/admin/siparisler/${item.order_id || item.id}`} className="font-bold text-[#B98787]">#{String(item.display_id).padStart(4, "0")}</Link><p className="mt-1 text-xs text-slate-500">{item.email}</p></td>
            <td className="max-w-sm">{item.items?.map((i, index) => <p key={index} className="mb-1 text-xs font-semibold">{i.title} × {i.quantity}</p>)}<p className="text-xs text-slate-700">{item.reason || (tab === "cancellations" ? "Sipariş iptal edildi." : "Para iadesi")}</p>{item.note && <p className="mt-1 text-xs text-slate-500">{item.note}</p>}{item.error_message && <p className="mt-1 text-xs text-rose-600">{item.error_message}</p>}</td>
            <td><Status value={tab === "cancellations" ? item.payment_status : item.status} verified={item.status !== "completed" || Boolean(item.provider_reference)} />{tab === "cancellations" && Number(item.refund_amount) > 0 && <div className="mt-2"><Status value={item.refund_status} verified={Boolean(item.provider_reference)} /><p className="mt-1 text-xs text-slate-500">{money(item.refund_amount, item.currency_code)}</p></div>}</td>
            <td>{tab !== "requests" && <p className="mb-1 text-xs font-bold">{money(tab === "refunds" ? item.amount : item.total, item.currency_code)}</p>}<span className="whitespace-nowrap text-xs text-slate-500">{date(item.created_at)}</span></td>
            <td><div className="flex flex-col items-start gap-2">{tab === "requests" && <select aria-label={`İade talebi ${item.display_id} durumu`} disabled={saving} value={item.status} onChange={e => void update(item.id, e.target.value)}>{["requested", "approved", "rejected", "received", ...(item.status === "refunded" ? ["refunded"] : [])].map(value => <option key={value} value={value}>{labels[value]}</option>)}</select>}<Link href={`/admin/siparisler/${item.order_id || item.id}`} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Siparişi görüntüle <AppIcon name="ArrowUpRight" size={14} /></Link></div></td>
          </tr>)}</tbody>
        </table>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500"><span>{rows.length} kayıt gösteriliyor</span><span>Para iadesi işlemleri sipariş detayından yönetilir.</span></div>
    </div>
    {tab === "refunds" && <p className="text-xs leading-relaxed text-slate-500">Sağlayıcı onayı, tutarın müşterinin kartına yansıdığını doğrulamaz. Sonucu belirsiz işlemler için yeni iade göndermeden önce sağlayıcı panelini kontrol edin.</p>}
  </div>
}
