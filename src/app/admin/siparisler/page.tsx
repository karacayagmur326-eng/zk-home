"use client"

import CustomerMessageButton from "../components/CustomerMessageButton"

import { useAdminAutoRefresh } from "@lib/hooks/use-admin-auto-refresh"

import { FormEvent, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { convertToLocale } from "@lib/util/money"
import {
  ShoppingBag,
  Clock,
  Package,
  TrendingUp,
  Search,
  Download,
  Plus,
  RotateCcw,
  Eye,
  Edit,
  Printer,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Truck,
  X,
  FileText,
} from "@lib/icons"

type Order = {
  id: string
  display_id: number
  status: string
  payment_status: string
  fulfillment_status: string
  email: string
  currency_code: string
  total: string
  created_at: string
  shipping_carrier?: string
  tracking_number?: string
  tracking_url?: string
  invoice_status?: string
  invoice_number?: string
  shipping_address?: any
}

type OrderSummary = {
  total_orders: number
  pending_orders: number
  processing_orders: number
  shipped_orders: number
  completed_orders: number
  cancelled_orders: number
  today_revenue: number
  yesterday_revenue: number
}

type OrderDetail = {
  order: Order
  items: Array<{
    id: string
    title: string
    sku?: string
    quantity: number
    unit_price: string
    total: string
  }>
  history: Array<{ id: string; status: string; note?: string; created_at: string }>
}

const ORDER_LABELS: Record<string, string> = {
  awaiting_payment: "Ödeme bekliyor",
  processing: "Hazırlanıyor",
  shipped: "Kargoya verildi",
  completed: "Tamamlandı",
  cancelled: "İptal edildi",
}

const PAYMENT_LABELS: Record<string, string> = {
  pending: "Bekliyor",
  authorized: "Ödendi",
  paid: "Ödendi",
  partially_refunded: "Kısmi iade",
  refunded: "İade edildi",
  failed: "Başarısız",
}

const FULFILLMENT_LABELS: Record<string, string> = {
  delivery_scheduled: "ZK Home Teslimat",
  not_fulfilled: "Bekliyor",
  preparing: "Hazırlanıyor",
  shipped: "Kargoda",
  delivered: "Teslim edildi",
  returned: "İptal edildi",
}

const money = (value: string | number, currency = "TRY") => {
  const raw = Number(value || 0)
  return convertToLocale({ amount: raw, currency_code: currency })
}

function getBadgeStyle(type: "status" | "payment" | "fulfillment", key: string) {
  if (key === "completed" || key === "paid" || key === "authorized" || key === "delivered" || key === "shipped") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200/60"
  }
  if (key === "processing" || key === "preparing") {
    return "bg-blue-50 text-blue-700 border-blue-200/60"
  }
  if (key === "awaiting_payment" || key === "pending" || key === "not_fulfilled") {
    return "bg-amber-50 text-amber-700 border-amber-200/60"
  }
  if (key === "cancelled" || key === "refunded" || key === "failed" || key === "returned") {
    return "bg-rose-50 text-rose-700 border-rose-200/60"
  }
  return "bg-slate-50 text-slate-700 border-slate-200"
}

function formatOrderDate(dateString?: string | null) {
  if (!dateString) return "—"
  const d = new Date(dateString)
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return "—"
  return d.toLocaleDateString("tr-TR")
}

function formatOrderDateTime(dateString?: string | null) {
  if (!dateString) return "—"
  const d = new Date(dateString)
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return "—"
  return d.toLocaleString("tr-TR")
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [status, setStatus] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("")
  const [fulfillmentFilter, setFulfillmentFilter] = useState("")
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [summary, setSummary] = useState<OrderSummary>({
    total_orders: 0,
    pending_orders: 0,
    processing_orders: 0,
    shipped_orders: 0,
    completed_orders: 0,
    cancelled_orders: 0,
    today_revenue: 0,
    yesterday_revenue: 0,
  })

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const statusParam = searchParams.get("status")
    const filterParam = searchParams.get("filter") || searchParams.get("date")
    if (statusParam) setStatus(statusParam)
    if (filterParam) setDateFilter(filterParam)
  }, [])

  const loadOrders = useCallback(async (silent = false, signal?: AbortSignal) => {
    if (!silent) setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(limit))
      if (status) params.set("status", status)
      if (dateFilter) params.set("date", dateFilter)
      if (searchQuery.trim()) params.set("q", searchQuery.trim())
      if (paymentFilter) params.set("payment_status", paymentFilter)
      if (fulfillmentFilter) params.set("fulfillment_status", fulfillmentFilter)

      const response = await fetch(`/api/admin/orders?${params}`, { cache: "no-store", signal })
      if (response.status === 401) {
        router.push("/admin")
        return
      }
      if (!response.ok) return
      const data = await response.json()
      if (signal?.aborted) return
      setOrders(data.orders || [])
      setTotal(data.total || 0)
      if (data.summary) setSummary(data.summary)
    } finally { if (!silent && !signal?.aborted) setLoading(false) }
  }, [dateFilter, fulfillmentFilter, limit, page, paymentFilter, router, searchQuery, status])

  useEffect(() => {
    const controller = new AbortController()
    void loadOrders(false, controller.signal).catch(() => {})
    return () => controller.abort()
  }, [loadOrders])

  useAdminAutoRefresh((signal) => loadOrders(true, signal), { enabled: !loading && !saving, refreshKey: JSON.stringify([dateFilter, fulfillmentFilter, limit, page, paymentFilter, searchQuery, status]) })

  function resetFilters() {
    setStatus("")
    setDateFilter("")
    setSearchQuery("")
    setPaymentFilter("")
    setFulfillmentFilter("")
    setPage(1)
  }

  function handleSelectAll(checked: boolean) {
    if (checked) {
      setSelectedIds(orders.map((o) => o.id))
    } else {
      setSelectedIds([])
    }
  }

  function toggleSelectOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  async function openOrder(id: string) {
    setMessage("")
    const response = await fetch(`/api/admin/orders?id=${encodeURIComponent(id)}`)
    const data = await response.json()
    if (!response.ok) {
      setMessage(data.error || "Sipariş yüklenemedi.")
      return
    }
    setDetail(data)
  }

  async function saveOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!detail) return
    setSaving(true)
    setMessage("")
    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(form.entries())
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: detail.order.id, ...payload }),
    })
    const data = await response.json().catch(() => ({}))
    setSaving(false)
    if (!response.ok) {
      setMessage(data.error || "Sipariş güncellenemedi.")
      return
    }
    setMessage("Sipariş güncellendi.")
    await Promise.all([loadOrders(), openOrder(detail.order.id)])
  }

  function exportCSV() {
    if (!orders.length) return
    const headers = ["Siparis No", "Musteri", "Durum", "Odeme", "Kargo", "Tutar", "Tarih"]
    const rows = orders.map((o) => [
      `#${o.display_id}`,
      o.email,
      ORDER_LABELS[o.status] || o.status,
      PAYMENT_LABELS[o.payment_status] || o.payment_status,
      FULFILLMENT_LABELS[o.fulfillment_status] || o.fulfillment_status,
      money(o.total, o.currency_code),
      new Date(o.created_at).toLocaleDateString("tr-TR"),
    ])
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `siparisler_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const pages = Math.ceil(total / limit) || 1

  // Calculation for status distribution donut chart
  const pendingPct = summary.total_orders > 0 ? ((summary.pending_orders / summary.total_orders) * 100).toFixed(1) : "0"
  const processingPct = summary.total_orders > 0 ? ((summary.processing_orders / summary.total_orders) * 100).toFixed(1) : "0"
  const shippedPct = summary.total_orders > 0 ? ((summary.shipped_orders / summary.total_orders) * 100).toFixed(1) : "0"
  const completedPct = summary.total_orders > 0 ? ((summary.completed_orders / summary.total_orders) * 100).toFixed(1) : "0"
  const cancelledPct = summary.total_orders > 0 ? ((summary.cancelled_orders / summary.total_orders) * 100).toFixed(1) : "0"

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Dışa Aktar
          </button>
          <Link
            href="/admin/urunler"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#C98484] hover:bg-[#A95E5E] transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Yeni Sipariş
          </Link>
        </div>
      </div>

      {/* ── 4 Top KPI Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Sipariş */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-rose-50 text-[#C98484]">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400">Toplam Sipariş</span>
            <span className="text-xl font-black text-slate-900 leading-tight block">
              {summary.total_orders}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">Tüm zamanlar</span>
          </div>
        </div>

        {/* Card 2: Ödeme Bekleyen */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400">Ödeme Bekleyen</span>
            <span className="text-xl font-black text-slate-900 leading-tight block">
              {summary.pending_orders}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">%{pendingPct} oranında</span>
          </div>
        </div>

        {/* Card 3: Hazırlanan */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-500">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400">Hazırlanan</span>
            <span className="text-xl font-black text-slate-900 leading-tight block">
              {summary.processing_orders}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">%{processingPct} oranında</span>
          </div>
        </div>

        {/* Card 4: Bugünkü Ciro */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400">Bugünkü Ciro</span>
            <span className="text-xl font-black text-slate-900 leading-tight block">
              {money(summary.today_revenue)}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
              Dün: {money(summary.yesterday_revenue)} <span className="font-bold">↗</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Status Nav Tabs Bar ── */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 text-xs font-bold">
        {[
          { key: "", label: "Tümü" },
          { key: "awaiting_payment", label: "Ödeme bekleyen" },
          { key: "processing", label: "Hazırlanan" },
          { key: "completed", label: "Tamamlanan" },
          { key: "cancelled", label: "İptal" },
        ].map((tab) => {
          const isActive = status === tab.key && !dateFilter
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setDateFilter("")
                setStatus(tab.key)
                setPage(1)
              }}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-[#C98484] shadow-xs border border-slate-200/80 font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Filter Controls Card ── */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sipariş no, müşteri veya e-posta ara..."
            className="w-full px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-[#C98484] transition-all"
          />
        </div>

        {/* Date Filter */}
        <button
          type="button"
          onClick={() => {
            setDateFilter(dateFilter === "today" ? "" : "today")
            setPage(1)
          }}
          className={`px-3 py-2 rounded-xl border flex items-center gap-2 font-semibold transition-all cursor-pointer ${
            dateFilter === "today"
              ? "bg-rose-50 border-rose-200 text-[#C98484]"
              : "bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <span>📅 {dateFilter === "today" ? "Bugün" : "Tüm Tarihler"}</span>
        </button>

        {/* Ödeme Durumu Select */}
        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value)
            setPage(1)
          }}
          className="px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:border-[#C98484]"
        >
          <option value="">Ödeme Durumu</option>
          <option value="pending">Bekliyor</option>
          <option value="paid">Ödendi</option>
          <option value="refunded">İade Edildi</option>
        </select>

        {/* Kargo Durumu Select */}
        <select
          value={fulfillmentFilter}
          onChange={(e) => {
            setFulfillmentFilter(e.target.value)
            setPage(1)
          }}
          className="px-3 py-2 rounded-xl bg-slate-50/80 border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:border-[#C98484]"
        >
          <option value="">Kargo Durumu</option>
          <option value="not_fulfilled">Bekliyor</option>
          <option value="preparing">Hazırlanıyor</option>
          <option value="shipped">Kargoda</option>
          <option value="delivered">Teslim Edildi</option>
        </select>

        {/* Clear Filters */}
        {(status || dateFilter || searchQuery || paymentFilter || fulfillmentFilter) && (
          <button
            onClick={resetFilters}
            className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-bold transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Filtreleri Temizle
          </button>
        )}

        <div className="flex-1" />

        <button
          onClick={exportCSV}
          className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Dışa Aktar
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
          {message}
        </div>
      )}

      {/* ── Main Grid Container: 2-Columns (Table + Sidebar Widgets) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Orders Table & Pagination (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-xs font-medium text-slate-400">
                Yükleniyor…
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-xs font-medium text-slate-400">
                Sipariş bulunamadı.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === orders.length && orders.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-slate-300 text-[#C98484] focus:ring-[#C98484]"
                        />
                      </th>
                      <th className="p-3">Sipariş</th>
                      <th className="p-3">Müşteri</th>
                      <th className="p-3">Sipariş Durumu</th>
                      <th className="p-3">Ödeme</th>
                      <th className="p-3">Kargo</th>
                      <th className="p-3">Tutar</th>
                      <th className="p-3">Tarih</th>
                      <th className="p-3 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(order.id)}
                            onChange={() => toggleSelectOne(order.id)}
                            className="rounded border-slate-300 text-[#C98484] focus:ring-[#C98484]"
                          />
                        </td>
                        <td className="p-3">
                          <Link
                            href={`/admin/siparisler/${order.id}`}
                            className="font-black text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-xs"
                          >
                            #{String(order.display_id || 0).padStart(4, "0")}
                          </Link>
                        </td>
                        <td className="p-3 text-slate-800 font-bold">
                          {(() => {
                            const addr = order.shipping_address
                            if (addr) {
                              const first = addr.first_name || ""
                              const last = addr.last_name || ""
                              const company = addr.company || ""
                              if (first || last) return `${first} ${last}`.trim()
                              if (company) return company
                            }
                            return order.email || "Müşteri"
                          })()}
                          <span className="block text-[11px] font-normal text-slate-400">
                            {order.email}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getBadgeStyle(
                              "status",
                              order.status
                            )}`}
                          >
                            {ORDER_LABELS[order.status] || order.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getBadgeStyle(
                              "payment",
                              order.payment_status
                            )}`}
                          >
                            {PAYMENT_LABELS[order.payment_status] || order.payment_status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getBadgeStyle(
                              "fulfillment",
                              order.fulfillment_status
                            )}`}
                          >
                            {FULFILLMENT_LABELS[order.fulfillment_status] ||
                              order.fulfillment_status}
                          </span>
                        </td>
                        <td className="p-3 font-black text-slate-900">
                          {money(order.total, order.currency_code)}
                        </td>
                        <td className="p-3 text-slate-400 font-medium">
                          {formatOrderDate(order.created_at)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-1.5 text-slate-400">
                            <CustomerMessageButton compact orderId={order.id} orderNumber={order.display_id} label={order.email}/>
                            <Link
                              href={`/admin/siparisler/${order.id}`}
                              className="p-1 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              href={`/admin/siparisler/${order.id}`}
                              className="p-1 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => window.print()}
                              className="p-1 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Yazdır"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => void openOrder(order.id)}
                              className="p-1 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Detay"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium">
                {(page - 1) * limit + 1} - {Math.min(page * limit, total)} / {total} sipariş gösteriliyor
              </span>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          page === pageNum
                            ? "bg-[#C98484] text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  {pages > 5 && <span className="text-slate-400 px-1">...</span>}
                  <button
                    disabled={page >= pages}
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value))
                    setPage(1)
                  }}
                  className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold text-xs focus:outline-none"
                >
                  <option value={10}>10 / sayfa</option>
                  <option value={20}>20 / sayfa</option>
                  <option value={50}>50 / sayfa</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets Stack (1 col) */}
        <div className="space-y-4">
          {/* Widget 1: Sipariş Durum Özeti (Donut Chart) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-900 tracking-tight">Sipariş Durum Özeti</h3>

            {/* Donut Graphic */}
            <div className="flex justify-center my-2 relative">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="3.8" />
                {/* Completed Arc (Green) */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3.8"
                  strokeDasharray={`${Number(completedPct) * 0.88} 100`}
                  strokeDashoffset="0"
                />
                {/* Pending Arc (Yellow) */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.8"
                  strokeDasharray={`${Number(pendingPct) * 0.88} 100`}
                  strokeDashoffset={`-${Number(completedPct) * 0.88}`}
                />
                {/* Processing Arc (Blue) */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.8"
                  strokeDasharray={`${Number(processingPct) * 0.88} 100`}
                  strokeDashoffset={`-${(Number(completedPct) + Number(pendingPct)) * 0.88}`}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-base font-black text-slate-900 leading-none">
                  {summary.total_orders}
                </span>
                <span className="text-[10px] font-bold text-slate-400">Toplam</span>
              </div>
            </div>

            {/* Status Breakdown Legend */}
            <div className="space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Ödeme bekleyen</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900">{summary.pending_orders}</span>
                  <span className="text-[10px] text-slate-400 font-medium">(%{pendingPct})</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Hazırlanan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900">{summary.processing_orders}</span>
                  <span className="text-[10px] text-slate-400 font-medium">(%{processingPct})</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Kargoda</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900">{summary.shipped_orders}</span>
                  <span className="text-[10px] text-slate-400 font-medium">(%{shippedPct})</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600" />
                  <span>Tamamlanan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900">{summary.completed_orders}</span>
                  <span className="text-[10px] text-slate-400 font-medium">(%{completedPct})</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>İptal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900">{summary.cancelled_orders}</span>
                  <span className="text-[10px] text-slate-400 font-medium">(%{cancelledPct})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Kargo Notları Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900">
              <Truck className="w-4 h-4 text-slate-700" />
              <span>Kargo Notları</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
              Yoğunluk nedeniyle teslimat sürelerinde 1-2 iş günü gecikme yaşanabilir.
            </p>
            <button
              onClick={() => setMessage("Kargo durum takibi güncellendi.")}
              className="w-full py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer text-center"
            >
              Detayları Gör
            </button>
          </div>
        </div>
      </div>

      {/* ── Order Detail Drawer (Slide-over Modal) ── */}
      {detail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target) setDetail(null)
          }}
        >
          <div className="w-full max-w-xl h-full bg-slate-50 overflow-y-auto p-6 shadow-2xl space-y-6 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Sipariş #{String(detail.order.display_id || 0).padStart(4, "0")}
                </h2>
                <p className="text-xs font-semibold text-slate-500">{detail.order.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order Items */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-xs">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Sipariş İçeriği
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {detail.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex justify-between gap-4 font-semibold">
                    <div>
                      <span className="text-slate-900 block">{item.title} × {item.quantity}</span>
                      {item.sku && <span className="text-[10px] text-slate-400 font-medium">SKU: {item.sku}</span>}
                    </div>
                    <span className="text-slate-900 font-black">{money(item.total, detail.order.currency_code)}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Edit Order Form */}
            <form onSubmit={saveOrder} className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4 shadow-xs text-xs">
              <h3 className="text-xs font-black text-slate-900">Siparişi Yönet</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-semibold text-slate-700">
                <label className="space-y-1 block">
                  <span>Sipariş Durumu</span>
                  <select
                    name="status"
                    defaultValue={detail.order.status}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
                  >
                    {Object.entries(ORDER_LABELS).map(([val, lbl]) => (
                      <option key={val} value={val}>{lbl}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 block">
                  <span>Ödeme Durumu</span>
                  <select
                    name="payment_status"
                    defaultValue={detail.order.payment_status}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
                  >
                    {Object.entries(PAYMENT_LABELS).map(([val, lbl]) => (
                      <option key={val} value={val}>{lbl}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 block">
                  <span>Kargo Durumu</span>
                  <select
                    name="fulfillment_status"
                    defaultValue={detail.order.fulfillment_status}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
                  >
                    {Object.entries(FULFILLMENT_LABELS).map(([val, lbl]) => (
                      <option key={val} value={val}>{lbl}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 block">
                  <span>Kargo Firması</span>
                  <input
                    name="shipping_carrier"
                    defaultValue={detail.order.shipping_carrier || ""}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
                  />
                </label>

                <label className="space-y-1 block">
                  <span>Takip Numarası</span>
                  <input
                    name="tracking_number"
                    defaultValue={detail.order.tracking_number || ""}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
                  />
                </label>

                <label className="space-y-1 block">
                  <span>Fatura Durumu</span>
                  <select
                    name="invoice_status"
                    defaultValue={detail.order.invoice_status || "not_issued"}
                    className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
                  >
                    <option value="not_issued">Kesilmedi</option>
                    <option value="pending">Bekliyor</option>
                    <option value="issued">Kesildi</option>
                    <option value="cancelled">İptal</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-1 font-semibold text-slate-700">
                <span>İşlem Notu</span>
                <textarea
                  name="note"
                  rows={2}
                  className="w-full p-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-[#C98484] text-white font-extrabold hover:bg-[#A95E5E] transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
              </button>
            </form>

            {/* History */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-xs text-xs">
              <h3 className="text-xs font-black text-slate-900">İşlem Geçmişi</h3>
              <div className="divide-y divide-slate-100">
                {detail.history.map((item) => (
                  <div key={item.id} className="py-2 space-y-0.5">
                    <span className="font-bold text-slate-900 block">
                      {ORDER_LABELS[item.status] || PAYMENT_LABELS[item.status] || FULFILLMENT_LABELS[item.status] || item.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {formatOrderDateTime(item.created_at)} · {item.note || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
