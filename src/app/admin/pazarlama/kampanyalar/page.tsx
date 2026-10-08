"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  RefreshCw,
  Clock,
  Tag,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Eye,
  MoreHorizontal,
  Zap,
  Percent,
  Package,
  Gift,
  ShoppingCart,
  TrendingUp,
  Info,
  Sparkles,
} from "@lib/icons"
import {
  convertToLocale,
  formatTryPriceInput,
  parseTryPriceInput,
} from "@lib/util/money"

type Campaign = {
  id: string
  name: string
  description: string | null
  type: "discount" | "shipping" | "loyalty" | "gift" | "other"
  status: "active" | "planned" | "completed" | "draft"
  starts_at: string | null
  ends_at: string | null
  discount_type: string | null
  discount_value: number | null
  min_subtotal: number | null
  usage_count: number
  created_at: string
  metadata?: { customer_notification?: boolean }
}

type Stats = {
  total: number
  active: number
  planned: number
  completed: number
  draft: number
  revenue_30d: number
  orders_30d: number
}

const CAMPAIGN_TYPES: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  discount: {
    label: "İndirim Kampanyası",
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200/60",
    icon: <Percent className="w-4 h-4" />,
  },
  shipping: {
    label: "Kargo Kampanyası",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200/60",
    icon: <Package className="w-4 h-4" />,
  },
  loyalty: {
    label: "Sadakat Kampanyası",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200/60",
    icon: <Sparkles className="w-4 h-4" />,
  },
  gift: {
    label: "Hediye Kampanyası",
    color: "text-pink-700",
    bg: "bg-pink-50",
    border: "border-pink-200/60",
    icon: <Gift className="w-4 h-4" />,
  },
  other: {
    label: "Diğer",
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200/60",
    icon: <Tag className="w-4 h-4" />,
  },
}

const STATUS_LABELS: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  active: { label: "Aktif", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  planned: { label: "Planlanan", dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  completed: { label: "Tamamlandı", dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
  draft: { label: "Taslak", dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
}

export default function KampanyalarPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  // Pagination
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Form
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formNotifyMembers, setFormNotifyMembers] = useState(false)
  const [formType, setFormType] = useState<Campaign["type"]>("discount")
  const [formStatus, setFormStatus] = useState<Campaign["status"]>("draft")
  const [formStartsAt, setFormStartsAt] = useState("")
  const [formEndsAt, setFormEndsAt] = useState("")
  const [formDiscountType, setFormDiscountType] = useState("percentage")
  const [formDiscountValue, setFormDiscountValue] = useState("")
  const [formMinSubtotal, setFormMinSubtotal] = useState("0,00")

  async function fetchCampaigns() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/campaigns")
      const data = await res.json()
      if (res.ok) {
        setCampaigns(data.campaigns || [])
        setStats(data.stats || null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  function openModal(campaign?: Campaign) {
    if (campaign) {
      setEditingCampaign(campaign)
      setFormName(campaign.name)
      setFormDescription(campaign.description || "")
      setFormNotifyMembers(campaign.metadata?.customer_notification === true)
      setFormType(campaign.type)
      setFormStatus(campaign.status)
      setFormStartsAt(campaign.starts_at ? new Date(campaign.starts_at).toISOString().slice(0, 16) : "")
      setFormEndsAt(campaign.ends_at ? new Date(campaign.ends_at).toISOString().slice(0, 16) : "")
      setFormDiscountType(campaign.discount_type || "percentage")
      setFormDiscountValue(
        campaign.discount_value != null
          ? campaign.discount_type === "fixed"
            ? formatTryPriceInput(Number(campaign.discount_value) / 100)
            : String(campaign.discount_value)
          : ""
      )
      setFormMinSubtotal(
        formatTryPriceInput(Number(campaign.min_subtotal || 0) / 100)
      )
    } else {
      setEditingCampaign(null)
      setFormName("")
      setFormDescription("")
      setFormNotifyMembers(false)
      setFormType("discount")
      setFormStatus("draft")
      setFormStartsAt(new Date().toISOString().slice(0, 16))
      const future = new Date()
      future.setMonth(future.getMonth() + 1)
      setFormEndsAt(future.toISOString().slice(0, 16))
      setFormDiscountType("percentage")
      setFormDiscountValue("")
      setFormMinSubtotal("0,00")
    }
    setMessage(null)
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) {
      setMessage({ type: "error", text: "Kampanya adı zorunludur." })
      return
    }
    setIsSaving(true)
    setMessage(null)
    try {
      const payload = {
        id: editingCampaign?.id,
        name: formName.trim(),
        description: formDescription.trim() || null,
        customer_notification: formNotifyMembers,
        type: formType,
        status: formStatus,
        starts_at: formStartsAt ? new Date(formStartsAt).toISOString() : null,
        ends_at: formEndsAt ? new Date(formEndsAt).toISOString() : null,
        discount_type: formType === "discount" ? formDiscountType : null,
        discount_value:
          formType === "discount" && formDiscountValue
            ? formDiscountType === "fixed"
              ? Math.round(parseTryPriceInput(formDiscountValue) * 100)
              : Number(formDiscountValue)
            : null,
        min_subtotal: Math.round(parseTryPriceInput(formMinSubtotal) * 100),
      }
      const method = editingCampaign ? "PUT" : "POST"
      const res = await fetch("/api/admin/campaigns", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Kaydedilemedi.")
      setShowModal(false)
      fetchCampaigns()
    } catch (err: any) {
      setMessage({ type: "error", text: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu kampanyayı silmek istediğinize emin misiniz?")) return
    try {
      const res = await fetch(`/api/admin/campaigns?id=${id}`, { method: "DELETE" })
      if (res.ok) fetchCampaigns()
    } catch (err) {
      console.error(err)
    }
  }

  async function handleStatusChange(campaign: Campaign, newStatus: Campaign["status"]) {
    try {
      await fetch("/api/admin/campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: campaign.id, status: newStatus }),
      })
      fetchCampaigns()
    } catch (err) {
      console.error(err)
    }
    setOpenMenuId(null)
  }

  const now = new Date()

  const tabFiltered = campaigns.filter((c) => {
    if (activeTab === "all") return true
    return c.status === activeTab
  })

  const filtered = tabFiltered.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchSearch) return false
    if (statusFilter !== "all" && c.status !== statusFilter) return false
    if (typeFilter !== "all" && c.type !== typeFilter) return false
    return true
  })

  const totalPages = Math.ceil(filtered.length / pageSize) || 1
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const tabCounts = {
    all: campaigns.length,
    active: campaigns.filter((c) => c.status === "active").length,
    planned: campaigns.filter((c) => c.status === "planned").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
    draft: campaigns.filter((c) => c.status === "draft").length,
  }

  function formatDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  function formatMoney(n: number) {
    return convertToLocale({ amount: Number(n) || 0, currency_code: "TRY" })
  }

  const bestCampaign = [...campaigns]
    .filter((c) => c.status === "active")
    .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))[0] || null

  const activePercent =
    stats && stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0

  const conversionRate =
    stats && stats.orders_30d > 0
      ? ((stats.orders_30d / Math.max(stats.orders_30d * 20, 1)) * 100).toFixed(2)
      : "0.00"

  return (
    <div className="w-full space-y-5 pb-12 font-sans text-slate-800">
      {/* ── HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => openModal()}
          className="px-5 py-2.5 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Yeni Kampanya Oluştur</span>
        </button>
      </div>

      {message && (
        <div className={`admin-notice ${message.type === "success" ? "admin-notice--success" : "admin-notice--danger"}`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="admin-icon-button !h-7 !min-h-7 !w-7 ml-auto" aria-label="Bildirimi kapat"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}



      {/* ── MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* LEFT: TABLE */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Filter bar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-white">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                placeholder="Kampanya adı veya açıklama ara..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-slate-500">Tür</span>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1) }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-700 outline-none focus:border-[#C98484] cursor-pointer"
              >
                <option value="all">Tümü</option>
                <option value="discount">İndirim Kampanyası</option>
                <option value="shipping">Kargo Kampanyası</option>
                <option value="loyalty">Sadakat Kampanyası</option>
                <option value="gift">Hediye Kampanyası</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => { setSearchTerm(""); setTypeFilter("all"); setStatusFilter("all"); setCurrentPage(1) }}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Filtreleri Temizle</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 border-b border-slate-100 flex gap-0">
            {[
              { key: "all", label: "Tümü" },
              { key: "active", label: "Aktif" },
              { key: "planned", label: "Planlanan" },
              { key: "completed", label: "Tamamlanan" },
              { key: "draft", label: "Taslak" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setCurrentPage(1) }}
                className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === key
                    ? "border-[#C98484] text-[#C98484]"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === key ? "bg-rose-100 text-[#C98484]" : "bg-slate-100 text-slate-500"
                }`}>
                  {tabCounts[key as keyof typeof tabCounts]}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  <th className="py-3 px-5">Kampanya</th>
                  <th className="py-3 px-4">Tür</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-4">Tarih Aralığı</th>
                  <th className="py-3 px-4">Kullanım</th>
                  <th className="py-3 px-5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">Kampanyalar yükleniyor...</td>
                  </tr>
                ) : !paginated.length ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {campaigns.length === 0
                        ? "Henüz kampanya oluşturulmamış. İlk kampanyanızı ekleyin!"
                        : "Aranan kriterlere uygun kampanya bulunamadı."}
                    </td>
                  </tr>
                ) : (
                  paginated.map((c) => {
                    const typeInfo = CAMPAIGN_TYPES[c.type] || CAMPAIGN_TYPES.other
                    const statusInfo = STATUS_LABELS[c.status] || STATUS_LABELS.draft
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Kampanya */}
                        <td className="py-4 px-5 max-w-[240px]">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg ${typeInfo.bg} ${typeInfo.color} flex items-center justify-center shrink-0`}>
                              {typeInfo.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs truncate">{c.name}</p>
                              {c.description && (
                                <p className="text-[11px] text-slate-400 truncate">{c.description}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Tür */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${typeInfo.bg} ${typeInfo.color} border ${typeInfo.border}`}>
                            {typeInfo.label}
                          </span>
                        </td>

                        {/* Durum */}
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusInfo.bg} ${statusInfo.text} border ${statusInfo.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Tarih Aralığı */}
                        <td className="py-4 px-4 text-slate-500 text-[11px]">
                          <div>{formatDate(c.starts_at)}</div>
                          <div className="text-slate-400">{c.ends_at ? formatDate(c.ends_at) : "Süresiz"}</div>
                        </td>

                        {/* Kullanım */}
                        <td className="py-4 px-4">
                          <div className="text-sm font-black text-slate-900">{c.usage_count.toLocaleString("tr-TR")}</div>
                          <div className="text-[11px] text-slate-400">kullanım</div>
                        </td>

                        {/* İşlemler */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openModal(c)}
                              title="Düzenle"
                              className="p-1.5 rounded-md border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-slate-500 hover:text-[#C98484] transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                                className="p-1.5 rounded-md border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-500 transition-all cursor-pointer"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                              {openMenuId === c.id && (
                                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px]">
                                  {c.status !== "active" && (
                                    <button onClick={() => handleStatusChange(c, "active")} className="w-full text-left px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50 font-semibold flex items-center gap-2">
                                      <Check className="w-3 h-3" /> Aktif Et
                                    </button>
                                  )}
                                  {c.status !== "planned" && (
                                    <button onClick={() => handleStatusChange(c, "planned")} className="w-full text-left px-3 py-2 text-xs text-blue-700 hover:bg-blue-50 font-semibold flex items-center gap-2">
                                      <Clock className="w-3 h-3" /> Planlandı
                                    </button>
                                  )}
                                  {c.status !== "completed" && (
                                    <button onClick={() => handleStatusChange(c, "completed")} className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 font-semibold flex items-center gap-2">
                                      <Check className="w-3 h-3" /> Tamamlandı
                                    </button>
                                  )}
                                  {c.status !== "draft" && (
                                    <button onClick={() => handleStatusChange(c, "draft")} className="w-full text-left px-3 py-2 text-xs text-amber-700 hover:bg-amber-50 font-semibold flex items-center gap-2">
                                      <Info className="w-3 h-3" /> Taslağa Al
                                    </button>
                                  )}
                                  <div className="border-t border-slate-100 mt-1 pt-1">
                                    <button onClick={() => { setOpenMenuId(null); handleDelete(c.id) }} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2">
                                      <Trash2 className="w-3 h-3" /> Sil
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/20 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 outline-none focus:border-[#C98484] cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>satır göster</span>
            </div>

            <div>
              {filtered.length > 0 ? (
                <span>{(currentPage - 1) * pageSize + 1} – {Math.min(currentPage * pageSize, filtered.length)} / {filtered.length} kampanya</span>
              ) : (
                <span>0 kampanya</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-8 h-8 rounded-xl bg-[#C98484] text-white flex items-center justify-center font-bold text-xs">{currentPage}</span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: SIDEBAR */}
        <div className="space-y-4">
          {/* Kampanya Özeti */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <span>Kampanya Özeti</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Son 30 gün</span>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Toplam Sipariş", value: stats ? stats.orders_30d.toLocaleString("tr-TR") : "—" },
                { label: "Toplam Gelir", value: stats ? formatMoney(stats.revenue_30d) : "—" },
                {
                  label: "Ortalama Sipariş Tutarı",
                  value:
                    stats && stats.orders_30d > 0
                      ? formatMoney(stats.revenue_30d / stats.orders_30d)
                      : "—",
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{label}</span>
                  <span className="font-bold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* En Performanslı Kampanya */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
              <Zap className="w-4 h-4 text-[#C98484]" />
              <span>En Performanslı</span>
            </div>
            {bestCampaign ? (
              <>
                <div>
                  <p className="font-black text-slate-900 text-sm">{bestCampaign.name}</p>
                  {bestCampaign.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5">{bestCampaign.description}</p>
                  )}
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kullanım</span>
                    <span className="font-black text-slate-900">{bestCampaign.usage_count.toLocaleString("tr-TR")}</span>
                  </div>
                </div>
                <button
                  onClick={() => openModal(bestCampaign)}
                  className="w-full py-2 px-3 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-bold text-xs transition-all flex items-center justify-center gap-1"
                >
                  Kampanyayı Düzenle
                </button>
              </>
            ) : (
              <p className="text-xs text-slate-400 font-medium">
                {campaigns.length === 0 ? "Henüz kampanya yok." : "Aktif kampanya bulunamadı."}
              </p>
            )}
          </div>

          {/* Hızlı İşlemler */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Zap className="w-4 h-4 text-[#C98484]" />
              <span>Hızlı İşlemler</span>
            </div>
            {[
              { label: "Yeni İndirim Kampanyası", type: "discount" as const },
              { label: "Kargo Kampanyası Oluştur", type: "shipping" as const },
              { label: "Sadakat Kampanyası Oluştur", type: "loyalty" as const },
            ].map(({ label, type }) => (
              <button
                key={type}
                onClick={() => {
                  setFormType(type)
                  openModal()
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <span>{label}</span>
                <span className="group-hover:translate-x-0.5 transition-transform text-slate-400">›</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#C98484]" />
                {editingCampaign ? "Kampanyayı Düzenle" : "Yeni Kampanya Oluştur"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs transition-colors"
              >✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <label className="flex items-start gap-3 rounded-xl border border-[#EEDDDD] bg-[#FDF7F5] p-4 text-sm">
                <input type="checkbox" checked={formNotifyMembers} onChange={(e) => setFormNotifyMembers(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#C98484]" />
                <span><span className="block font-semibold">Üyelere bildirim göster</span><span className="mt-1 block text-xs leading-relaxed text-slate-500">Kampanya aktifken ve tarih aralığı içindeyken adı ve açıklaması üyelerin bildirim zilinde görünür.</span></span>
              </label>
              {/* Kampanya Adı */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kampanya Adı <span className="text-[#C98484]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Örn: Yaz İndirimi 2025"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484]"
                />
              </div>

              {/* Tür & Durum */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kampanya Türü</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as Campaign["type"])}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white outline-none focus:border-[#C98484]"
                  >
                    <option value="discount">İndirim Kampanyası</option>
                    <option value="shipping">Kargo Kampanyası</option>
                    <option value="loyalty">Sadakat Kampanyası</option>
                    <option value="gift">Hediye Kampanyası</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Durum</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Campaign["status"])}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white outline-none focus:border-[#C98484]"
                  >
                    <option value="draft">Taslak</option>
                    <option value="planned">Planlanan</option>
                    <option value="active">Aktif</option>
                    <option value="completed">Tamamlandı</option>
                  </select>
                </div>
              </div>

              {/* İndirim Detayları (sadece discount tipinde) */}
              {formType === "discount" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">İndirim Türü</label>
                    <select
                      value={formDiscountType}
                      onChange={(e) => setFormDiscountType(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white outline-none focus:border-[#C98484]"
                    >
                      <option value="percentage">Yüzdelik (%)</option>
                      <option value="fixed">Sabit Tutar (TL)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Değer ({formDiscountType === "percentage" ? "%" : "TL"})
                    </label>
                    <input
                      type={formDiscountType === "percentage" ? "number" : "text"}
                      inputMode="decimal"
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(e.target.value)}
                      onBlur={() => {
                        if (formDiscountType === "fixed") {
                          setFormDiscountValue(formatTryPriceInput(formDiscountValue))
                        }
                      }}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-[#C98484]"
                    />
                  </div>
                </div>
              )}

              {/* Tarih Aralığı */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Başlangıç Tarihi</label>
                  <input
                    type="datetime-local"
                    value={formStartsAt}
                    onChange={(e) => setFormStartsAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-[#C98484]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bitiş Tarihi</label>
                  <input
                    type="datetime-local"
                    value={formEndsAt}
                    onChange={(e) => setFormEndsAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-[#C98484]"
                  />
                </div>
              </div>

              {/* Min Sepet */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Min. Sepet Tutarı (TL)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formMinSubtotal}
                  onChange={(e) => setFormMinSubtotal(e.target.value)}
                  onBlur={() => setFormMinSubtotal(formatTryPriceInput(formMinSubtotal))}
                  placeholder="0,00 = Limitsiz"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-[#C98484]"
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Açıklama (İsteğe Bağlı)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Kampanya hakkında kısa açıklama..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-[#C98484] resize-none"
                />
              </div>

              {message && (
                <div className={`admin-notice ${message.type === "error" ? "admin-notice--danger" : "admin-notice--success"}`}>
                  {message.text}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-extrabold text-xs text-slate-600 transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                  {isSaving ? "Kaydediliyor..." : "Kampanyayı Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}
    </div>
  )
}
