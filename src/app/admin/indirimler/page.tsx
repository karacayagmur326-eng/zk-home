"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Percent,
  Coins,
  Search,
  RefreshCw,
  Copy,
  Clock,
  Filter,
  Download,
  AlertTriangle,
  Info,
  Sliders,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Pause,
  Play,
  FileText,
  Sparkles,
} from "@lib/icons"
import {
  convertToLocale,
  formatTryPriceInput,
  parseTryPriceInput,
} from "@lib/util/money"

type Coupon = {
  id: string
  code: string
  type: "percentage" | "fixed"
  value: number
  min_subtotal: number
  free_shipping: boolean
  is_active: boolean
  usage_count: number
  usage_limit: number | null
  starts_at: string | null
  ends_at: string | null
  description: string | null
  created_at: string
}

export default function DiscountsAndCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all") // all, active, passive, expired
  const [typeFilter, setTypeFilter] = useState("all") // all, percentage, fixed
  const [dateFilter, setDateFilter] = useState("all") // all, this_month, past, future

  // Pagination
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form Fields
  const [formCode, setFormCode] = useState("")
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage")
  const [formValue, setFormValue] = useState("10")
  const [formMinSubtotal, setFormMinSubtotal] = useState("0,00")
  const [formUsageLimit, setFormUsageLimit] = useState("")
  const [formStartsAt, setFormStartsAt] = useState("")
  const [formEndsAt, setFormEndsAt] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formIsActive, setFormIsActive] = useState(true)
  const [formFreeShipping, setFormFreeShipping] = useState(false)

  async function fetchCoupons() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/coupons")
      const data = await res.json()
      if (res.ok) {
        setCoupons(data.coupons || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  // Open Modal
  function handleOpenModal(coupon?: Coupon) {
    if (coupon) {
      setEditingCoupon(coupon)
      setFormCode(coupon.code)
      setFormType(coupon.type)
      setFormValue(
        coupon.type === "fixed"
          ? formatTryPriceInput(Number(coupon.value || 0) / 100)
          : String(coupon.value)
      )
      setFormMinSubtotal(
        formatTryPriceInput(Number(coupon.min_subtotal || 0) / 100)
      )
      setFormUsageLimit(coupon.usage_limit ? String(coupon.usage_limit) : "")
      setFormStartsAt(
        coupon.starts_at ? new Date(coupon.starts_at).toISOString().slice(0, 16) : ""
      )
      setFormEndsAt(
        coupon.ends_at ? new Date(coupon.ends_at).toISOString().slice(0, 16) : ""
      )
      setFormDescription(coupon.description || "")
      setFormIsActive(coupon.is_active)
      setFormFreeShipping(Boolean(coupon.free_shipping))
    } else {
      setEditingCoupon(null)
      setFormCode("")
      setFormType("percentage")
      setFormValue("10")
      setFormMinSubtotal("0,00")
      setFormUsageLimit("")
      setFormStartsAt(new Date().toISOString().slice(0, 16))
      const future = new Date()
      future.setMonth(future.getMonth() + 6)
      setFormEndsAt(future.toISOString().slice(0, 16))
      setFormDescription("")
      setFormIsActive(true)
      setFormFreeShipping(false)
    }
    setMessage(null)
    setShowModal(true)
  }

  // Save Coupon
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formCode.trim()) {
      setMessage({ type: "error", text: "Kupon kodu zorunludur." })
      return
    }

    setIsSaving(true)
    setMessage(null)

    try {
      const payload = {
        id: editingCoupon?.id,
        code: formCode.trim().toUpperCase(),
        type: formType,
        value:
          formType === "fixed"
            ? Math.round(parseTryPriceInput(formValue) * 100)
            : Number(formValue) || 0,
        min_subtotal: Math.round(parseTryPriceInput(formMinSubtotal) * 100),
        usage_limit: formUsageLimit ? Number(formUsageLimit) : null,
        starts_at: formStartsAt ? new Date(formStartsAt).toISOString() : null,
        ends_at: formEndsAt ? new Date(formEndsAt).toISOString() : null,
        description: formDescription.trim() || null,
        is_active: formIsActive,
        free_shipping: formFreeShipping,
      }

      const method = editingCoupon ? "PUT" : "POST"
      const res = await fetch("/api/admin/coupons", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Kupon kaydedilemedi.")
      }

      setShowModal(false)
      fetchCoupons()
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Bir hata oluştu." })
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle Active State
  async function handleToggleActive(coupon: Coupon) {
    try {
      await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
      })
      fetchCoupons()
    } catch (err) {
      console.error(err)
    }
  }

  // Delete Coupon
  async function handleDelete(id: string) {
    if (!confirm("Bu kuponu silmek istediğinize emin misiniz?")) return
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" })
      if (res.ok) fetchCoupons()
    } catch (err) {
      console.error(err)
    }
  }

  // Copy Code to Clipboard
  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code)
    setMessage({ type: "success", text: `"${code}" koda kopyalandı!` })
    setTimeout(() => setMessage(null), 3000)
  }

  // Helper: check if expired
  function isExpired(coupon: Coupon) {
    if (!coupon.ends_at) return false
    return new Date(coupon.ends_at).getTime() < Date.now()
  }

  // Filter Logic
  const filteredCoupons = coupons.filter((c) => {
    // Search
    const matchesSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    // Status
    if (statusFilter === "active" && (!c.is_active || isExpired(c))) return false
    if (statusFilter === "passive" && c.is_active) return false
    if (statusFilter === "expired" && !isExpired(c)) return false

    // Type
    if (typeFilter !== "all" && c.type !== typeFilter) return false

    // Date
    if (dateFilter === "this_month") {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      if (c.created_at) {
        const cDate = new Date(c.created_at)
        if (cDate < start || cDate > end) return false
      }
    }

    return true
  })

  // Pagination Logic
  const totalPages = Math.ceil(filteredCoupons.length / pageSize) || 1
  const paginatedCoupons = filteredCoupons.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Stats Calculations
  const totalCount = coupons.length
  const activeCount = coupons.filter((c) => c.is_active && !isExpired(c)).length
  const expiredCount = coupons.filter((c) => isExpired(c)).length
  const totalUsage = coupons.reduce((sum, c) => sum + (c.usage_count || 0), 0)
  const activePercentage = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0
  const expiredPercentage = totalCount > 0 ? Math.round((expiredCount / totalCount) * 10/10) : 0

  // Export to CSV
  function handleExport() {
    const headers = ["Kupon Kodu", "Tür", "Değer", "Min. Sepet", "Kullanım", "Başlangıç", "Bitiş", "Durum"]
    const rows = coupons.map((c) => [
      c.code,
      c.type === "percentage" ? "% Yüzdelik" : "Sabit Tutar",
      c.type === "percentage"
        ? `%${c.value}`
        : convertToLocale({ amount: Number(c.value) || 0, currency_code: "TRY" }),
      convertToLocale({ amount: Number(c.min_subtotal) || 0, currency_code: "TRY" }),
      `${c.usage_count} / ${c.usage_limit || "Sınırsız"}`,
      c.starts_at ? new Date(c.starts_at).toLocaleDateString("tr-TR") : "-",
      c.ends_at ? new Date(c.ends_at).toLocaleDateString("tr-TR") : "-",
      c.is_active ? (isExpired(c) ? "Süresi Dolan" : "Aktif") : "Pasif",
    ])
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `kuponlar_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full space-y-6 pb-12 font-sans text-slate-800">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <button
          type="button"
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Yeni Kupon Oluştur</span>
        </button>
      </div>

      {message && (
        <div className={`admin-notice ${message.type === "success" ? "admin-notice--success" : "admin-notice--danger"}`}>
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="admin-icon-button !h-7 !min-h-7 !w-7 ml-auto"
            aria-label="Bildirimi kapat"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── STAT CARDS (4 ROW) ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Kupon */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-rose-50 text-[#C98484] border border-rose-100 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block leading-tight">
              Toplam Kupon
            </span>
            <strong className="text-2xl font-black text-slate-900 block tracking-tight leading-tight">
              {totalCount}
            </strong>
            <button
              onClick={() => setStatusFilter("all")}
              className="text-[11px] font-semibold text-slate-500 hover:text-[#C98484] transition-colors flex items-center gap-0.5 leading-tight"
            >
              Tümü &gt;
            </button>
          </div>
        </div>

        {/* Card 2: Aktif */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block leading-tight">
              Aktif
            </span>
            <strong className="text-2xl font-black text-slate-900 block tracking-tight leading-tight">
              {activeCount}
            </strong>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 leading-tight">
              %{activePercentage} aktif <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
            </span>
          </div>
        </div>

        {/* Card 3: Süresi Dolan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block leading-tight">
              Süresi Dolan
            </span>
            <strong className="text-2xl font-black text-slate-900 block tracking-tight leading-tight">
              {expiredCount}
            </strong>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 leading-tight">
              %{expiredPercentage} oranında <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
            </span>
          </div>
        </div>

        {/* Card 4: Kullanılan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block leading-tight">
              Kullanılan
            </span>
            <strong className="text-2xl font-black text-slate-900 block tracking-tight leading-tight">
              {totalUsage.toLocaleString("tr-TR")}
            </strong>
            <span className="text-[11px] font-semibold text-slate-400 block leading-tight">
              Toplam kullanım
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT (TABLE + SIDEBAR) ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* LEFT COLUMN: TABLE (3/4 width) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          
          {/* FILTER BAR */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-white">
            {/* Search Input */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Kupon kodu veya açıklama ara..."
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] placeholder-slate-400"
              />
            </div>

            {/* Dropdown Durum */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-slate-500">Durum</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-700 outline-none focus:border-[#C98484] cursor-pointer"
              >
                <option value="all">Tümü</option>
                <option value="active">Aktif</option>
                <option value="passive">Pasif</option>
                <option value="expired">Süresi Dolan</option>
              </select>
            </div>

            {/* Dropdown İndirim Türü */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-slate-500">İndirim Türü</span>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-700 outline-none focus:border-[#C98484] cursor-pointer"
              >
                <option value="all">Tümü</option>
                <option value="percentage">Yüzdelik (%)</option>
                <option value="fixed">Sabit Tutar (TL)</option>
              </select>
            </div>

            {/* Dropdown Tarih Aralığı */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-semibold text-slate-500">Tarih Aralığı</span>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white text-slate-700 outline-none focus:border-[#C98484] cursor-pointer"
              >
                <option value="all">Tümü</option>
                <option value="this_month">Bu Ay</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setTypeFilter("all")
                  setDateFilter("all")
                  setCurrentPage(1)
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Filtreleri Temizle</span>
              </button>

              <button
                type="button"
                onClick={handleExport}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Dışa Aktar</span>
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  <th className="py-3 px-5">Kupon Kodu</th>
                  <th className="py-3 px-4">İndirim Türü</th>
                  <th className="py-3 px-4">Değeri</th>
                  <th className="py-3 px-4">Min. Sepet</th>
                  <th className="py-3 px-4">Kullanım</th>
                  <th className="py-3 px-4">Başlangıç</th>
                  <th className="py-3 px-4">Bitiş</th>
                  <th className="py-3 px-4">Durum</th>
                  <th className="py-3 px-5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      Kuponlar yükleniyor...
                    </td>
                  </tr>
                ) : !paginatedCoupons.length ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                      Aranan kriterlere uygun kupon bulunamadı.
                    </td>
                  </tr>
                ) : (
                  paginatedCoupons.map((coupon) => {
                    const expired = isExpired(coupon)
                    const limit = coupon.usage_limit || 0
                    const usageRatio = limit > 0 ? Math.min(100, Math.round((coupon.usage_count / limit) * 100)) : 50

                    return (
                      <tr key={coupon.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-50 last:border-0">
                        {/* Kupon Kodu */}
                        <td className="py-3.5 px-5">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200/80 text-[#C98484] font-bold text-[11px] tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C98484] shrink-0" />
                            <span>{coupon.code}</span>
                          </div>
                        </td>

                        {/* İndirim Türü */}
                        <td className="py-3.5 px-4">
                          {coupon.type === "percentage" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200/60">
                              <Percent className="w-2.5 h-2.5" /> Yüzdelik (%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                              <Tag className="w-2.5 h-2.5" /> Sabit Tutar (TL)
                            </span>
                          )}
                        </td>

                        {/* Değeri */}
                        <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                          {coupon.type === "percentage"
                            ? `%${coupon.value}`
                            : convertToLocale({
                                amount: Number(coupon.value) || 0,
                                currency_code: "TRY",
                              })}
                        </td>

                        {/* Min. Sepet */}
                        <td className="py-3.5 px-4 font-medium text-slate-600 text-xs">
                          {convertToLocale({
                            amount: Number(coupon.min_subtotal) || 0,
                            currency_code: "TRY",
                          })}
                        </td>

                        {/* Kullanım Progress Bar */}
                        <td className="py-3.5 px-4 min-w-[120px]">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                              <span>{coupon.usage_count}</span>
                              <span className="text-slate-400">/ {coupon.usage_limit ? coupon.usage_limit.toLocaleString("tr-TR") : "∞"}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  usageRatio > 80 ? "bg-red-500" : "bg-[#C98484]"
                                }`}
                                style={{ width: `${coupon.usage_limit ? usageRatio : 30}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Başlangıç */}
                        <td className="py-3.5 px-4 text-slate-500 font-medium text-[11px]">
                          {coupon.starts_at
                            ? new Date(coupon.starts_at).toLocaleDateString("tr-TR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }) + " 00:00"
                            : "—"}
                        </td>

                        {/* Bitiş */}
                        <td className="py-3.5 px-4 text-slate-500 font-medium text-[11px]">
                          {coupon.ends_at
                            ? new Date(coupon.ends_at).toLocaleDateString("tr-TR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }) + " 23:59"
                            : "—"}
                        </td>

                        {/* Durum */}
                        <td className="py-3.5 px-4">
                          {expired ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Süresi Dolan
                            </span>
                          ) : coupon.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Pasif
                            </span>
                          )}
                        </td>

                        {/* İşlemler */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleOpenModal(coupon)}
                              title="Düzenle"
                              className="p-1.5 rounded-md border border-slate-200 hover:border-rose-300 bg-white hover:bg-rose-50 text-slate-500 hover:text-[#C98484] transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Copy */}
                            <button
                              type="button"
                              onClick={() => copyToClipboard(coupon.code)}
                              title="Kodu Kopyala"
                              className="p-1.5 rounded-md border border-slate-200 hover:border-blue-300 bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Pause / Play */}
                            <button
                              type="button"
                              onClick={() => handleToggleActive(coupon)}
                              title={coupon.is_active ? "Duraklat" : "Aktif Et"}
                              className="p-1.5 rounded-md border border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition-all cursor-pointer"
                            >
                              {coupon.is_active ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(coupon.id)}
                              title="Sil"
                              className="p-1.5 rounded-md border border-slate-200 hover:border-red-300 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER PAGINATION */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1.5 border border-slate-200 rounded-xl bg-white text-xs font-bold text-slate-700 outline-none focus:border-[#C98484] cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>sayfa başına</span>
            </div>

            <div>
              {filteredCoupons.length > 0 ? (
                <span>
                  {(currentPage - 1) * pageSize + 1} -{" "}
                  {Math.min(currentPage * pageSize, filteredCoupons.length)} /{" "}
                  {filteredCoupons.length} kupon
                </span>
              ) : (
                <span>0 kupon</span>
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

              <span className="w-8 h-8 rounded-xl bg-[#C98484] text-white flex items-center justify-center font-bold text-xs">
                {currentPage}
              </span>

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

        {/* RIGHT COLUMN: RULES & TIP CARDS (1/4 width) */}
        <div className="space-y-4">
          {/* Card 1: Kupon Kuralları */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Info className="w-4 h-4 text-slate-400" />
              <span>Kupon Kuralları</span>
            </div>

            <div className="space-y-3 text-xs text-slate-600 font-medium">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-2.5 h-2.5" />
                </div>
                <p className="leading-relaxed">Kupon kodları büyük/küçük harf duyarlıdır.</p>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <p className="leading-relaxed">Bir kullanıcı, bir kuponu yalnızca bir kez kullanabilir.</p>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                </div>
                <p className="leading-relaxed">Min. sepet tutarı vergiler hariç hesaplanır.</p>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Tag className="w-2.5 h-2.5" />
                </div>
                <p className="leading-relaxed">Kuponlar başka kampanyalarla birleştirilemeyebilir.</p>
              </div>
            </div>
          </div>

          {/* Card 2: Hızlı İpucu */}
          <div className="bg-amber-50 rounded-2xl border border-amber-200/60 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-[#C98484]" />
              <span>Hızlı İpucu</span>
            </div>

            <p className="text-xs font-medium text-amber-800/90 leading-relaxed">
              Daha fazla kişiye ulaşmak için kuponlarınızı e-posta kampanyalarınızda ve sosyal medyada paylaşın.
            </p>

            <Link
              href="/admin/pazarlama/kampanyalar"
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-amber-200 text-[#C98484] font-bold text-xs transition-all flex items-center justify-between group cursor-pointer"
            >
              <span>Kampanya Oluştur</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── CREATE / EDIT MODAL ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#C98484]" />
                {editingCoupon ? "Kuponu Düzenle" : "Yeni Kupon Oluştur"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Kupon Kodu */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kupon Kodu <span className="text-[#C98484]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="Örn: INDIRIM20"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-black tracking-wider uppercase outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484]"
                />
              </div>

              {/* Tür & Değer Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    İndirim Türü
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as "percentage" | "fixed")}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold bg-white outline-none focus:border-[#C98484]"
                  >
                    <option value="percentage">Yüzdelik (%)</option>
                    <option value="fixed">Sabit Tutar (TL)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    İndirim Değeri ({formType === "percentage" ? "%" : "TL"})
                  </label>
                  <input
                    type={formType === "percentage" ? "number" : "text"}
                    inputMode="decimal"
                    required
                    min="1"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    onBlur={() => {
                      if (formType === "fixed") {
                        setFormValue(formatTryPriceInput(formValue))
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-black outline-none focus:border-[#C98484]"
                  />
                </div>
              </div>

              {/* Min Sepet & Kullanım Limiti Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Min. Sepet Tutarı (TL)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formMinSubtotal}
                    onChange={(e) => setFormMinSubtotal(e.target.value)}
                    onBlur={() => setFormMinSubtotal(formatTryPriceInput(formMinSubtotal))}
                    placeholder="0,00 = Limitsiz"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-[#C98484]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kullanım Adet Limiti
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value)}
                    placeholder="Boş bırakırsanız sınırsız"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold outline-none focus:border-[#C98484]"
                  />
                </div>
              </div>

              {/* Tarih Aralığı Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Başlangıç Tarihi
                  </label>
                  <input
                    type="datetime-local"
                    value={formStartsAt}
                    onChange={(e) => setFormStartsAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-[#C98484]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="datetime-local"
                    value={formEndsAt}
                    onChange={(e) => setFormEndsAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:border-[#C98484]"
                  />
                </div>
              </div>

              {/* Not / Açıklama */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kupon Açıklaması / Kampanya Notu
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Örn: Yaz Sezonu Açılışı İndirimi"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium outline-none focus:border-[#C98484]"
                />
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/40 p-4 cursor-pointer">
                <input type="checkbox" checked={formFreeShipping} onChange={(e) => setFormFreeShipping(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#B98787]" />
                <span><span className="block text-sm font-semibold text-slate-800">Kupon ile ücretsiz kargo</span><span className="mt-1 block text-xs leading-5 text-slate-500">Kupon koşulları sağlandığında indirime ek olarak kargo ücreti alınmaz.</span></span>
              </label>

              {/* Toggle Active */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Kupon Durumu</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C98484]"></div>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 stroke-[3]" />
                  )}
                  {isSaving ? "Kaydediliyor..." : "Kuponu Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
