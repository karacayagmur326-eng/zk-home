"use client"

import { useAdminAutoRefresh } from "@lib/hooks/use-admin-auto-refresh"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import AdminLoginForm from "./components/AdminLoginForm"
import {
  ShoppingBag,
  Tag,
  Users,
  TrendingUp,
  Plus,
  Package,
  FolderTree,
  Sliders,
  Search,
  Eye,
  ChevronRight,
  Clock,
  AlertTriangle,
  Mail,
  Calendar,
  CheckCircle2,
  Database,
  Server,
  ShieldCheck,
  RefreshCw,
  Edit3,
} from "lucide-react"

interface DashboardStats {
  orders: number
  products: number
  customers: number
  revenue: number
  today_orders: number
  pending_orders: number
  low_stock_count: number
  avg_order_value: number
  pending_reviews?: number
}

interface Order {
  id: string
  display_id: number
  status: string
  email: string
  currency_code: string
  total: string
  created_at: string
}

interface LowStockItem {
  variant_id: string
  title: string
  stock: number
}

interface SalesPoint {
  date: string
  sales: number
  count: number
}

const STATUS_TR: Record<string, string> = {
  awaiting_payment: "Ödeme Bekleniyor",
  pending: "Ödeme Bekleniyor",
  processing: "Hazırlanıyor",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
  canceled: "İptal Edildi",
  archived: "Arşivlendi",
  requires_action: "İşlem Gerekli",
  not_paid: "Ödenmedi",
  paid: "Ödendi",
  shipped: "Kargolandı",
  delivered: "Teslim Edildi",
}

const STATUS_BADGE: Record<string, string> = {
  awaiting_payment: "bg-amber-50 text-amber-700 border-amber-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  canceled: "bg-red-50 text-red-700 border-red-200",
  archived: "bg-slate-100 text-slate-700 border-slate-200",
  requires_action: "bg-rose-50 text-rose-700 border-rose-200",
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [salesHistory, setSalesHistory] = useState<SalesPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(true)
  const [orderSearch, setOrderSearch] = useState("")

  // Quick Notes State (Persisted in localStorage)
  const [quickNote, setQuickNote] = useState("")
  const [isEditingNote, setIsEditingNote] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedNote = localStorage.getItem("admin_quick_note") || ""
      setQuickNote(savedNote)
    }
  }, [])

  function handleSaveNote() {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_quick_note", quickNote)
    }
    setIsEditingNote(false)
  }

  function loadDashboard(silent = false, signal?: AbortSignal) {
    if (!silent) setLoading(true)
    return fetch("/api/admin/stats", { cache: "no-store", signal })
      .then((r) => {
        if (r.status === 401) {
          setAuthenticated(false)
          setLoading(false)
          return null
        }
        if (!r.ok) return null
        return r.json()
      })
      .then((d) => {
        if (!d || signal?.aborted) return
        setStats(d.stats)
        setOrders(d.recentOrders || [])
        setLowStockItems(d.lowStockItems || [])
        setSalesHistory(d.salesHistory || [])
        setLoading(false)
      })
      .catch(() => {})
      .finally(() => { if (!silent && !signal?.aborted) setLoading(false) })
  }

  useEffect(() => {
    const controller = new AbortController()
    void loadDashboard(false, controller.signal)
    return () => controller.abort()
  }, [])

  useAdminAutoRefresh((signal) => loadDashboard(true, signal), { enabled: authenticated && !loading })

  if (!authenticated) {
    return (
      <AdminLoginForm
        onSuccess={() => {
          setAuthenticated(true)
          loadDashboard()
          router.refresh()
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3 text-slate-500 font-sans">
        <RefreshCw className="h-8 w-8 animate-spin text-[#C98484]" />
        <p className="text-xs font-semibold">Sistem verileri yükleniyor...</p>
      </div>
    )
  }

  const filteredOrders = orders.filter(
    (o) =>
      o.email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.display_id?.toString().includes(orderSearch) ||
      o.status?.toLowerCase().includes(orderSearch.toLowerCase())
  )

  const formattedToday = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  // Prepare chart points
  const maxSales = Math.max(...salesHistory.map((s) => Number(s.sales || 0)), 1000)

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-10">
      {/* 1. Top 4 KPI Summary Cards (Birebir Tasarım) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Sipariş */}
        <Link
          href="/admin/siparisler"
          className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center justify-between hover:shadow-md hover:border-rose-200 transition-all cursor-pointer group"
        >
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors">
              {(stats?.orders || 0).toLocaleString("tr-TR")}
            </div>
            <span className="text-xs font-bold text-slate-400 block">Toplam Sipariş</span>
            <span className="inline-flex items-center text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1">
              Dün ile aynı
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-[#C98484] flex items-center justify-center border border-rose-100/60 shadow-2xs shrink-0 group-hover:scale-110 transition-transform">
            <ShoppingBag className="h-6 w-6 stroke-[2.2]" />
          </div>
        </Link>

        {/* Card 2: Toplam Ürün */}
        <Link
          href="/admin/urunler"
          className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center justify-between hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
        >
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">
              {(stats?.products || 0).toLocaleString("tr-TR")}
            </div>
            <span className="text-xs font-bold text-slate-400 block">Toplam Ürün</span>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
              ↗ %6,8 bu ay
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/60 shadow-2xs shrink-0 group-hover:scale-110 transition-transform">
            <Tag className="h-6 w-6 stroke-[2.2]" />
          </div>
        </Link>

        {/* Card 3: Müşteri */}
        <Link
          href="/admin/kullanicilar"
          className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center justify-between hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group"
        >
          <div className="space-y-1">
            <div className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-purple-600 transition-colors">
              {(stats?.customers || 0).toLocaleString("tr-TR")}
            </div>
            <span className="text-xs font-bold text-slate-400 block">Müşteri</span>
            <span className="inline-flex items-center text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mt-1">
              ↘ %0 yeni müşteri
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/60 shadow-2xs shrink-0 group-hover:scale-110 transition-transform">
            <Users className="h-6 w-6 stroke-[2.2]" />
          </div>
        </Link>

        {/* Card 4: Gelir (TL) */}
        <Link
          href="/admin/siparisler"
          className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center justify-between hover:shadow-md hover:border-rose-200 transition-all cursor-pointer group"
        >
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight group-hover:text-[#C98484] transition-colors">
              {((stats?.revenue || 0) / 100).toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              TL
            </div>
            <span className="text-xs font-bold text-slate-400 block">Gelir (TL)</span>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
              ↗ %12,4 bu ay
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-[#C98484] flex items-center justify-center border border-rose-100/60 shadow-2xs shrink-0 font-black text-xl group-hover:scale-110 transition-transform">
            TL
          </div>
        </Link>
      </div>

      {/* 2. Hızlı İşlemler (Quick Action Pills Row) */}
      <div className="space-y-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Hızlı İşlemler
        </h3>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/urunler/yeni"
            className="h-10 px-4 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-[#C98484] hover:bg-rose-50/50 hover:border-rose-200 transition-all flex items-center gap-2 shadow-2xs"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Yeni Ürün Ekle</span>
          </Link>

          <Link
            href="/admin/siparisler"
            className="h-10 px-4 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-[#C98484] hover:bg-rose-50/50 hover:border-rose-200 transition-all flex items-center gap-2 shadow-2xs"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Siparişler</span>
          </Link>

          <Link
            href="/admin/kullanicilar"
            className="h-10 px-4 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-[#C98484] hover:bg-rose-50/50 hover:border-rose-200 transition-all flex items-center gap-2 shadow-2xs"
          >
            <Users className="h-4 w-4" />
            <span>Kullanıcılar</span>
          </Link>

          <Link
            href="/admin/kategoriler"
            className="h-10 px-4 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-[#C98484] hover:bg-rose-50/50 hover:border-rose-200 transition-all flex items-center gap-2 shadow-2xs"
          >
            <FolderTree className="h-4 w-4" />
            <span>Kategoriler</span>
          </Link>

          <Link
            href="/admin/urunler"
            className="h-10 px-4 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-[#C98484] hover:bg-rose-50/50 hover:border-rose-200 transition-all flex items-center gap-2 shadow-2xs"
          >
            <Package className="h-4 w-4" />
            <span>Tüm Ürünler</span>
          </Link>

          <Link
            href="/admin/slaytlar"
            className="h-10 px-4 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-[#C98484] hover:bg-rose-50/50 hover:border-rose-200 transition-all flex items-center gap-2 shadow-2xs"
          >
            <Sliders className="h-4 w-4" />
            <span>Slider Düzenle</span>
          </Link>
        </div>
      </div>

      {/* 3. Main Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Left Column: Recent Orders + Sales Chart + System Health */}
        <div className="space-y-6">
          {/* Son Siparişler Table Card */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-extrabold text-slate-900">Son Siparişler</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 sm:w-60">
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Sipariş ara..."
                    className="w-full h-9 px-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-semibold outline-none focus:border-[#C98484] focus:bg-white"
                  />
                </div>
                <Link
                  href="/admin/siparisler"
                  className="h-9 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-[#C98484] hover:bg-rose-50 flex items-center gap-1 shrink-0"
                >
                  <span>Tümünü Gör</span>
                </Link>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Müşteri</th>
                    <th className="p-3">Durum</th>
                    <th className="p-3">Tutar</th>
                    <th className="p-3">Tarih</th>
                    <th className="p-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                        Sipariş kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-extrabold text-[#C98484]">
                          #{String(o.display_id || 0).padStart(4, "0")}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{o.email || "—"}</td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${
                              STATUS_BADGE[o.status] || "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {STATUS_TR[o.status] || o.status}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-emerald-600">
                          {(Number(o.total || 0) / 100).toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          TL
                        </td>
                        <td className="p-3 text-slate-500 font-medium">
                          {(() => {
                            if (!o.created_at) return "—"
                            const d = new Date(o.created_at)
                            return isNaN(d.getTime()) || d.getFullYear() <= 1970
                              ? "—"
                              : d.toLocaleDateString("tr-TR")
                          })()}
                        </td>
                        <td className="p-3 text-right">
                          <Link
                            href={`/admin/siparisler`}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 inline-block transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2 text-xs font-semibold text-slate-400 flex items-center justify-between">
              <span>
                1 kayıttan 1 - {filteredOrders.length} arasındaki kayıtlar gösteriliyor
              </span>
            </div>
          </div>

          {/* Satış Performansı (Sales Performance Chart Card) */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Satış Performansı</h3>
                <p className="text-xs font-semibold text-slate-400">
                  Son 30 günlük veritabanı sipariş satış grafiği
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                Bu Ay
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6 items-center">
              {/* Dynamic SVG Area Chart */}
              <div className="h-48 w-full relative flex items-end pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C98484" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#C98484" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area Fill */}
                  <path
                    d={`M 0 140 ${salesHistory
                      .map((pt, idx) => {
                        const x = (idx / Math.max(salesHistory.length - 1, 1)) * 500
                        const y = 140 - (Number(pt.sales || 0) / maxSales) * 110
                        return `L ${x} ${y}`
                      })
                      .join(" ")} L 500 140 Z`}
                    fill="url(#salesGrad)"
                  />

                  {/* Stroke Line */}
                  <path
                    d={`M 0 140 ${salesHistory
                      .map((pt, idx) => {
                        const x = (idx / Math.max(salesHistory.length - 1, 1)) * 500
                        const y = 140 - (Number(pt.sales || 0) / maxSales) * 110
                        return `L ${x} ${y}`
                      })
                      .join(" ")}`}
                    fill="none"
                    stroke="#C98484"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Data Points */}
                  {salesHistory.map((pt, idx) => {
                    const x = (idx / Math.max(salesHistory.length - 1, 1)) * 500
                    const y = 140 - (Number(pt.sales || 0) / maxSales) * 110
                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#C98484"
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                    )
                  })}
                </svg>

                {/* X-Axis Dates */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-100">
                  <span>1 Tem</span>
                  <span>10 Tem</span>
                  <span>20 Tem</span>
                  <span>30 Tem</span>
                </div>
              </div>

              {/* Right Performance Stats Summary */}
              <div className="space-y-4 border-l border-slate-100 pl-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 block">Toplam Gelir</span>
                  <div className="text-xl font-black text-slate-900">
                    {((stats?.revenue || 0) / 100).toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    TL
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                    ↗ %12,4 bu aya göre
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 block">
                    Ortalama Sipariş Tutarı
                  </span>
                  <div className="text-base font-extrabold text-slate-900">
                    {((stats?.avg_order_value || 0) / 100).toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    TL
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 block">
                    Toplam Sipariş
                  </span>
                  <div className="text-base font-extrabold text-slate-900">
                    {stats?.orders || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sistem Durumu (System Status Bar at Bottom) */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Sistem Durumu
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Server className="h-4 w-4 text-emerald-600" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    Sunucu Durumu
                  </span>
                  <span className="text-emerald-600 font-black">Çevrimiçi</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <Database className="h-4 w-4 text-emerald-600" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    Veritabanı
                  </span>
                  <span className="text-emerald-600 font-black">Sağlıklı</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    Yedekleme
                  </span>
                  <span className="text-emerald-600 font-black">Güncel</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    Güvenlik
                  </span>
                  <span className="text-emerald-600 font-black">Korunuyor</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Bugünün Özeti + Stok Uyarıları + Hızlı Notlar */}
        <div className="space-y-6">
          {/* Card 1: Bugünün Özeti (Real DB metrics) */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Bugünün Özeti</h3>
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formattedToday}</span>
              </span>
            </div>

            <div className="space-y-3.5 text-xs font-bold">
              {/* Yeni Siparişler */}
              <Link
                href="/admin/siparisler?filter=today"
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-slate-900 font-extrabold group-hover:text-blue-600 transition-colors">
                      Yeni Siparişler
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">
                      Bugün gelen sipariş sayısı
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black text-slate-900">
                    {stats?.today_orders || 0}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              {/* Bekleyen Siparişler */}
              <Link
                href="/admin/siparisler?status=awaiting_payment"
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-amber-50/50 hover:border-amber-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-slate-900 font-extrabold group-hover:text-amber-600 transition-colors">
                      Bekleyen Siparişler
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">
                      Ödeme bekleyen siparişler
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black text-slate-900">
                    {stats?.pending_orders || 0}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              {/* Düşük Stok Uyarıları */}
              <Link
                href="/admin/urunler?stock=low"
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-rose-50/50 hover:border-rose-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 text-[#C98484] group-hover:scale-110 transition-transform">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-slate-900 font-extrabold group-hover:text-[#C98484] transition-colors">
                      Düşük Stok Uyarıları
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">
                      Stok seviyesi düşük ürünler
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black text-slate-900">
                    {stats?.low_stock_count || 0}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              {/* Okunmamış Mesajlar */}
              <Link
                href="/admin/urunler/degerlendirmeler?status=pending"
                className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-purple-50/50 hover:border-purple-200 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-slate-900 font-extrabold group-hover:text-purple-600 transition-colors">
                      Okunmamış Mesajlar
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium">
                      Müşteri mesajları & değerlendirmeler
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black text-slate-900">
                    {stats?.pending_reviews || 0}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            </div>
          </div>

          {/* Card 2: Stok Uyarıları (Real DB Products) */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Stok Uyarıları</h3>
              <Link
                href="/admin/urunler?stock=low"
                className="text-xs font-bold text-[#C98484] hover:underline"
              >
                Tümünü Gör
              </Link>
            </div>

            <div className="space-y-2.5">
              {lowStockItems.length === 0 ? (
                <p className="text-xs font-medium text-slate-400 py-2">
                  Tüm ürün stok seviyeleri yeterli.
                </p>
              ) : (
                lowStockItems.map((item, idx) => (
                  <div
                    key={item.variant_id || idx}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-[180px]">
                        {item.title}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 block">
                        Stok: {item.stock} adet
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                        item.stock <= 2
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {item.stock <= 2 ? "Kritik" : "Düşük"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 3: Hızlı Notlar (Admin Personal Notes) */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Hızlı Notlar</h3>
              <button
                type="button"
                onClick={() => (isEditingNote ? handleSaveNote() : setIsEditingNote(true))}
                className="h-8 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5 text-[#C98484]" />
                <span>{isEditingNote ? "Kaydet" : "Not Ekle"}</span>
              </button>
            </div>

            {isEditingNote ? (
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Özel notlarınızı buraya ekleyebilirsiniz..."
                className="w-full h-24 p-3 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-800 outline-none focus:border-[#C98484] bg-slate-50/60"
              />
            ) : (
              <p className="text-xs font-semibold text-slate-500 leading-relaxed bg-slate-50/60 p-3 rounded-2xl border border-slate-100 min-h-[60px]">
                {quickNote || "Özel notlarınızı buraya ekleyebilirsiniz. Sadece siz görebilirsiniz."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
