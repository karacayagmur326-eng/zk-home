"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AppIcon, ShoppingBag, Trash2, History } from "@lib/icons"
import type { MobileSettings } from "@lib/content/mobile-settings"
import { PRODUCT_HISTORY_KEY, type HistoryProduct } from "@modules/products/components/product-history-tracker"

const COLLECTION_KEY = "zkhome_mobile_collections_v1"
type Collection = { id: string; title: string; description: string; icon: string; productIds: string[] }

export default function MobilePersonalizationPage({ mode, settings }: { mode: "history" | "collections"; settings: MobileSettings }) {
  const [history, setHistory] = useState<HistoryProduct[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState("")
  useEffect(() => { try { const h = JSON.parse(localStorage.getItem(PRODUCT_HISTORY_KEY) || "[]"); setHistory(Array.isArray(h) ? h : []); const c = JSON.parse(localStorage.getItem(COLLECTION_KEY) || "[]"); setCollections(Array.isArray(c) ? c : []) } catch {} }, [])
  const clearHistory = () => { localStorage.removeItem(PRODUCT_HISTORY_KEY); setHistory([]) }
  const saveCollections = (next: Collection[]) => { setCollections(next); localStorage.setItem(COLLECTION_KEY, JSON.stringify(next)) }
  const createCollection = () => { if (!title.trim()) return; saveCollections([...collections, { id: `${Date.now()}`, title: title.trim(), description: "ZK Home ürün koleksiyonu", icon: "FolderHeart", productIds: [] }]); setTitle(""); setCreating(false) }

  if (mode === "history") return <main className="min-h-screen bg-[#f5f6f7] pb-24 md:mx-auto md:max-w-5xl md:py-10">
    <div className="bg-white px-4 py-5 md:rounded-t-2xl"><div className="flex items-start justify-between"><div><h1 className="text-xl font-black">{settings.history.title}</h1><p className="mt-1 text-[11px] text-slate-500">{settings.history.description}</p></div>{history.length > 0 && <button onClick={clearHistory} className="text-[10px] font-extrabold text-rose-600">Temizle</button>}</div></div>
    <div className="m-3 flex gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4"><History className="h-5 w-5 shrink-0 text-[#C98484]" /><div><h2 className="text-xs font-black">{settings.history.noticeTitle}</h2><p className="mt-1 text-[10px] text-slate-500">{settings.history.noticeDescription}</p></div></div>
    <div className="flex gap-2 overflow-x-auto px-3 pb-3">{settings.history.filters.map((filter, i) => <span key={filter} className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-extrabold ${i === 0 ? "border-[#C98484] bg-rose-50 text-[#C98484]" : "border-slate-200 bg-white text-slate-600"}`}>{filter}</span>)}</div>
    {history.length ? <div className="space-y-2.5 px-3">{history.map((product) => <article key={product.id} className="grid grid-cols-[105px_1fr] overflow-hidden rounded-2xl border border-slate-200 bg-white"><Link href={`/urunler/${product.handle}`} className="grid min-h-32 place-items-center bg-slate-50 p-3">{product.thumbnail ? <img src={product.thumbnail} alt={product.title} className="h-full w-full object-contain" /> : <ShoppingBag className="h-9 w-9 text-slate-300" />}</Link><div className="p-3"><h2 className="line-clamp-2 text-xs font-extrabold leading-snug">{product.title}</h2><p className="mt-2 text-[9px] text-amber-400">★★★★★</p><div className="mt-2 text-sm font-black text-[#C98484]">{product.price || "Fiyatı incele"}</div><Link href={`/urunler/${product.handle}`} className="mt-3 inline-flex rounded-lg border border-[#C98484] px-3 py-2 text-[10px] font-extrabold text-[#C98484]">Ürünü İncele</Link></div></article>)}</div> : <Empty icon="History" title="Henüz görüntülenen ürün yok" text="İncelediğiniz ürünler burada otomatik olarak görünür." />}
  </main>

  return <main className="min-h-screen bg-[#f5f6f7] pb-24 md:mx-auto md:max-w-5xl md:py-10">
    <div className="bg-white px-4 py-5 md:rounded-t-2xl"><h1 className="text-xl font-black">{settings.collections.title}</h1><p className="mt-1 text-[11px] text-slate-500">{settings.collections.description}</p></div>
    <div className="m-3 flex items-center justify-between rounded-2xl bg-slate-950 p-4 text-white"><div><h2 className="text-sm font-black">{settings.collections.bannerTitle}</h2><p className="mt-1 text-[10px] text-slate-300">{settings.collections.bannerDescription}</p></div><button onClick={() => setCreating(true)} className="rounded-xl bg-[#C98484] px-3 py-2.5 text-[10px] font-extrabold">+ {settings.collections.buttonLabel}</button></div>
    {creating && <div className="m-3 rounded-2xl border border-slate-200 bg-white p-4"><label className="text-[10px] font-extrabold text-slate-500">KOLEKSİYON ADI</label><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold outline-none focus:border-[#C98484]" placeholder="Örn. Atölye Kurulumu" /><div className="mt-3 flex gap-2"><button onClick={createCollection} className="rounded-xl bg-[#C98484] px-4 py-2.5 text-[10px] font-extrabold text-white">Oluştur</button><button onClick={() => setCreating(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-[10px] font-extrabold">Vazgeç</button></div></div>}
    {collections.length ? <div className="grid grid-cols-2 gap-2.5 p-3">{collections.map((collection) => <article key={collection.id} className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-[#C98484]"><AppIcon name={collection.icon} className="h-6 w-6" /></span><h2 className="mt-3 text-xs font-black">{collection.title}</h2><p className="mt-1 text-[9px] text-slate-500">{collection.productIds.length} ürün</p><button onClick={() => saveCollections(collections.filter((item) => item.id !== collection.id))} className="absolute right-2 top-2 grid h-8 w-8 place-items-center text-rose-500"><Trash2 className="h-4 w-4" /></button></article>)}</div> : <Empty icon="FolderHeart" title={settings.collections.emptyTitle} text={settings.collections.emptyDescription} />}
  </main>
}

function Empty({ icon, title, text }: { icon: string; title: string; text: string }) { return <div className="m-3 flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center"><AppIcon name={icon} className="h-12 w-12 text-[#C98484]" /><h2 className="mt-4 text-lg font-black">{title}</h2><p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-500">{text}</p></div> }
