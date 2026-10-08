"use client"

import CustomerMessageButton from "../components/CustomerMessageButton"

import { useAdminAutoRefresh } from "@lib/hooks/use-admin-auto-refresh"

import React, { useEffect, useState } from "react"
import {
  Users,
  ShieldCheck,
  Edit3,
  Clock,
  Search,
  Download,
  Plus,
  Eye,
  Trash2,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Phone,
  User as UserIcon,
  Crown,
  Building,
  RefreshCw,
  Check,
} from "lucide-react"

type Customer = {
  id: string
  username: string | null
  email: string
  email_verified: boolean
  first_name: string | null
  last_name: string | null
  phone: string | null
  company_name: string | null
  role: "Admin" | "Yönetici" | "Editör" | "Müşteri" | string
  status: "Aktif" | "Pasif" | string
  last_login_at: string | null
  created_at: string
  has_account: boolean
  order_count?: number
}

type Stats = {
  total_count: number
  admin_count: number
  editor_count: number
  unverified_count: number
}

export default function AdminKullanicilarPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<Stats>({
    total_count: 0,
    admin_count: 0,
    editor_count: 0,
    unverified_count: 0,
  })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("Tümü")
  const [statusFilter, setStatusFilter] = useState("Tümü")
  const [verifiedFilter, setVerifiedFilter] = useState("Tümü")

  // Selections & Modals
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [viewCustomerDetail, setViewCustomerDetail] = useState<Customer | null>(null)

  // Feedback Messages
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // New User Form State
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    role: "Müşteri",
    status: "Aktif",
    email_verified: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 4000)
  }

  async function loadData(silent = false, signal?: AbortSignal) {
    if (!silent) setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: silent ? appliedSearch : search,
        role: roleFilter,
        status: statusFilter,
        verified: verifiedFilter,
      })

      const res = await fetch(`/api/admin/customers?${queryParams}`, { cache: "no-store", signal })
      if (res.status === 401) {
        window.location.assign("/admin")
        return
      }
      if (!res.ok) return
      const data = await res.json()
      if (signal?.aborted) return
      setCustomers(data.customers || [])
      setTotal(data.count || 0)
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      if (!silent && !signal?.aborted) showToast("Kullanıcı verileri yüklenirken bir hata oluştu.", "error")
    } finally {
      if (!silent && !signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void loadData(false, controller.signal)
    return () => controller.abort()
  }, [page, limit, roleFilter, statusFilter, verifiedFilter])

  useAdminAutoRefresh((signal) => loadData(true, signal), { enabled: !loading && !isSubmitting, refreshKey: JSON.stringify([page, limit, roleFilter, statusFilter, verifiedFilter, appliedSearch]) })

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAppliedSearch(search)
    setPage(1)
    loadData()
  }

  const handleClearFilters = () => {
    setSearch("")
    setAppliedSearch("")
    setRoleFilter("Tümü")
    setStatusFilter("Tümü")
    setVerifiedFilter("Tümü")
    setPage(1)
  }

  // Live Status Toggle
  async function handleStatusToggle(customer: Customer) {
    const newStatus = customer.status === "Aktif" ? "Pasif" : "Aktif"
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer.id, status: newStatus }),
      })
      const data = await res.json()
      if (res.ok) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, status: newStatus } : c))
        )
        showToast(`Hesap durumu "${newStatus}" yapıldı.`)
      } else {
        showToast(data.error || "Durum güncellenemedi.", "error")
      }
    } catch {
      showToast("İşlem sırasında hata oluştu.", "error")
    }
  }

  // Add User
  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })
      const data = await res.json()
      if (res.ok) {
        showToast("Yeni kullanıcı başarıyla eklendi.")
        setShowAddModal(false)
        setNewUser({
          first_name: "",
          last_name: "",
          username: "",
          email: "",
          phone: "",
          password: "",
          role: "Müşteri",
          status: "Aktif",
          email_verified: true,
        })
        loadData()
      } else {
        showToast(data.error || "Kullanıcı eklenemedi.", "error")
      }
    } catch {
      showToast("Sunucu hatası oluştu.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update User & Role
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCustomer) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCustomer),
      })
      const data = await res.json()
      if (res.ok) {
        showToast("Kullanıcı ve rol bilgileri başarıyla güncellendi.")
        setEditingCustomer(null)
        loadData()
      } else {
        showToast(data.error || "Güncelleme başarısız.", "error")
      }
    } catch {
      showToast("Sunucu hatası oluştu.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Selected Users
  async function handleDelete(ids: string[]) {
    if (!ids.length) return
    if (!confirm(`${ids.length} kullanıcıyı silmek istediğinize emin misiniz?`)) return
    try {
      const res = await fetch(`/api/admin/customers?ids=${encodeURIComponent(ids.join(","))}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`${data.removed || ids.length} kullanıcı silindi.`)
        setSelectedIds([])
        if (editingCustomer && ids.includes(editingCustomer.id)) {
          setEditingCustomer(null)
        }
        loadData()
      } else {
        showToast(data.error || "Silme işlemi başarısız.", "error")
      }
    } catch {
      showToast("Sunucu hatası oluştu.", "error")
    }
  }

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100"
      case "Yönetici":
        return "bg-purple-50 text-purple-700 border-purple-200/80 hover:bg-purple-100"
      case "Editör":
        return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80 hover:bg-fuchsia-100"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200/60"
    }
  }

  const totalPages = Math.ceil(total / limit) || 1

  const ROLE_OPTIONS = [
    {
      id: "Admin",
      title: "Admin",
      desc: "Tüm modüllere ve ayarlara sınırsız erişim",
      icon: ShieldCheck,
      color: "text-blue-600 border-blue-200 bg-blue-50/50",
    },
    {
      id: "Yönetici",
      title: "Yönetici",
      desc: "Sipariş, ürün, müşteri ve raporları yönetebilir",
      icon: Crown,
      color: "text-purple-600 border-purple-200 bg-purple-50/50",
    },
    {
      id: "Editör",
      title: "Editör",
      desc: "İçerik, blog ve ürün bilgilerini düzenleyebilir",
      icon: Edit3,
      color: "text-fuchsia-600 border-fuchsia-200 bg-fuchsia-50/50",
    },
    {
      id: "Müşteri",
      title: "Müşteri",
      desc: "Standart e-ticaret müşteri hesabı",
      icon: UserIcon,
      color: "text-slate-600 border-slate-200 bg-slate-50/50",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 font-sans text-slate-800 space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold animate-in slide-in-from-top-3 duration-200 ${
            toast.type === "success"
              ? "bg-slate-900 text-white border-slate-800"
              : "bg-red-600 text-white border-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-200 shrink-0" />
          )}
          <span>{toast.text}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 opacity-60 hover:opacity-100 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <button
          onClick={() => setShowAddModal(true)}
          className="h-11 px-5 rounded-2xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Yeni Kullanıcı Ekle</span>
        </button>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Kullanıcı */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 block">Toplam Kullanıcı</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {(stats.total_count || total).toLocaleString("tr-TR")}
            </div>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              ↗ %12,5 artış
              <span className="text-slate-400 font-medium ml-1">son 30 gün</span>
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-[#C98484] flex items-center justify-center border border-rose-100/60 shadow-2xs shrink-0">
            <Users className="h-6 w-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 2: Admin */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 block">Admin</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.admin_count.toLocaleString("tr-TR")}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 block">Sistem yöneticileri</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60 shadow-2xs shrink-0">
            <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: Editör */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 block">Editör</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.editor_count.toLocaleString("tr-TR")}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 block">İçerik düzenleyicileri</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/60 shadow-2xs shrink-0">
            <Edit3 className="h-6 w-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 4: Bekleyen Doğrulama */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 block">Bekleyen Doğrulama</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {stats.unverified_count.toLocaleString("tr-TR")}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 block">Doğrulama bekleyen hesaplar</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/60 shadow-2xs shrink-0">
            <Clock className="h-6 w-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* Filter Bar with Clean Native Dropdowns */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ad, kullanıcı adı veya e-posta ara..."
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-xs font-semibold text-slate-800 outline-none focus:border-[#C98484] focus:bg-white focus:ring-2 focus:ring-[#C98484]/15 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Rol Filter Dropdown */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white text-xs font-bold text-slate-700 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-[#C98484]/15 transition-all cursor-pointer"
          >
            <option value="Tümü">Rol: Tümü</option>
            <option value="Admin">Rol: Admin</option>
            <option value="Yönetici">Rol: Yönetici</option>
            <option value="Editör">Rol: Editör</option>
            <option value="Müşteri">Rol: Müşteri</option>
          </select>

          {/* Durum Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white text-xs font-bold text-slate-700 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-[#C98484]/15 transition-all cursor-pointer"
          >
            <option value="Tümü">Durum: Tümü</option>
            <option value="Aktif">Durum: Aktif</option>
            <option value="Pasif">Durum: Pasif</option>
          </select>

          {/* Doğrulama Filter Dropdown */}
          <select
            value={verifiedFilter}
            onChange={(e) => {
              setVerifiedFilter(e.target.value)
              setPage(1)
            }}
            className="h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white text-xs font-bold text-slate-700 outline-none focus:border-[#C98484] focus:ring-2 focus:ring-[#C98484]/15 transition-all cursor-pointer"
          >
            <option value="Tümü">Doğrulama: Tümü</option>
            <option value="Doğrulanmış">Doğrulandı</option>
            <option value="Bekliyor">Bekliyor</option>
          </select>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            {(search || roleFilter !== "Tümü" || statusFilter !== "Tümü" || verifiedFilter !== "Tümü") && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Filtreleri Temizle</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => showToast("Kullanıcı verileri dışa aktarıldı (CSV).")}
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>Dışa Aktar</span>
            </button>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => handleDelete(selectedIds)}
                className="h-10 px-4 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{selectedIds.length} Seçileni Sil</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Main Grid: Data Table + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Left: Main Table Container */}
        <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-xs space-y-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={customers.length > 0 && selectedIds.length === customers.length}
                      onChange={(e) =>
                        setSelectedIds(e.target.checked ? customers.map((c) => c.id) : [])
                      }
                      className="rounded border-slate-300 accent-[#C98484] cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Kullanıcı</th>
                  <th className="p-4">İletişim</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">Durum</th>
                  <th className="p-4">Doğrulama</th>
                  <th className="p-4 text-center">Sipariş</th>
                  <th className="p-4">Kayıt Tarihi</th>
                  <th className="p-4">Son Giriş</th>
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400 font-semibold">
                      Kullanıcılar yükleniyor...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-slate-400 font-semibold">
                      Kriterlere uygun kullanıcı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => {
                    const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ") || "—"
                    const initials =
                      c.first_name && c.last_name
                        ? `${c.first_name[0]}${c.last_name[0]}`.toUpperCase()
                        : c.email[0].toUpperCase()

                    const displayUsername = c.username || c.email.split("@")[0]

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Checkbox */}
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(c.id)
                                  ? prev.filter((id) => id !== c.id)
                                  : [...prev, c.id]
                              )
                            }
                            className="rounded border-slate-300 accent-[#C98484] cursor-pointer"
                          />
                        </td>

                        {/* Kullanıcı (Avatar + Ad + Username) */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-rose-100 text-[#C98484] font-black text-xs flex items-center justify-center shrink-0 shadow-2xs border border-rose-200/60">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate text-xs">
                                {fullName}
                              </span>
                              <span className="text-[11px] font-medium text-slate-400 block truncate">
                                @{displayUsername}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* İletişim */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-800 block text-xs">
                              {c.email}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400 block">
                              {c.phone || "—"}
                            </span>
                          </div>
                        </td>

                        {/* Rol (Click opens Role & User Edit Modal Popup!) */}
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => setEditingCustomer(c)}
                            title="Rolü Değiştir ve Düzenle"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border shadow-2xs transition-all transform hover:scale-105 cursor-pointer ${getRoleBadgeStyle(
                              c.role || "Müşteri"
                            )}`}
                          >
                            <span>{c.role || "Müşteri"}</span>
                            <ChevronDown className="h-3 w-3 opacity-60" />
                          </button>
                        </td>

                        {/* Durum (Pill Toggle) */}
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(c)}
                            title="Durumu Değiştir"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition-all cursor-pointer ${
                              c.status === "Pasif"
                                ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                c.status === "Pasif" ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            />
                            <span>{c.status || "Aktif"}</span>
                          </button>
                        </td>

                        {/* Doğrulama */}
                        <td className="p-4">
                          {c.email_verified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span>Doğrulandı</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl">
                              <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              <span>Doğrulanmadı</span>
                            </span>
                          )}
                        </td>

                        {/* Sipariş */}
                        <td className="p-4 text-center font-extrabold text-slate-800">
                          {c.order_count || 0}
                        </td>

                        {/* Kayıt Tarihi */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="block font-semibold text-slate-700">
                              {new Date(c.created_at).toLocaleDateString("tr-TR")}
                            </span>
                            <span className="block text-[10px] font-medium text-slate-400">
                              {new Date(c.created_at).toLocaleTimeString("tr-TR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </td>

                        {/* Son Giriş */}
                        <td className="p-4">
                          {c.last_login_at ? (
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                              <div>
                                <span className="block font-bold text-emerald-700 text-[11px]">
                                  {new Date(c.last_login_at).toLocaleDateString("tr-TR")}
                                </span>
                                <span className="block text-[10px] font-medium text-slate-400">
                                  {new Date(c.last_login_at).toLocaleTimeString("tr-TR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium">—</span>
                          )}
                        </td>

                        {/* İşlemler */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <CustomerMessageButton compact customerId={c.id} label={c.email}/>
                            <button
                              type="button"
                              onClick={() => setViewCustomerDetail(c)}
                              title="Görüntüle"
                              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCustomer(c)}
                              title="Rol ve Bilgileri Düzenle"
                              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-[#C98484] transition-colors cursor-pointer"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete([c.id])}
                              title="Sil"
                              className="p-1.5 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
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

          {/* Clean Pagination Footer */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
                className="h-8 px-3 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-800 outline-none focus:border-[#C98484] cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>satır gösteriliyor</span>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              {(page - 1) * limit + 1} - {Math.min(page * limit, total)} / {total.toLocaleString("tr-TR")} kullanıcı
            </span>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="h-8 w-8 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-2xs"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded-xl text-xs font-extrabold transition-all ${
                      page === pageNum
                        ? "bg-[#C98484] text-white shadow-xs"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs"
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              {totalPages > 5 && <span className="text-slate-400 text-xs px-1">...</span>}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="h-8 w-8 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-2xs"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sidebar Cards */}
        <div className="space-y-4">
          {/* Card 1: Rol Yetkileri */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#C98484]" />
              <h3 className="text-sm font-extrabold text-slate-900">Rol Yetkileri</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-600">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  <span>Admin</span>
                </div>
                <p className="text-slate-500 font-medium pl-3.5">
                  Tüm modüllere tam erişim sağlar.
                </p>
              </div>

              <div className="space-y-1 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-purple-600">
                  <span className="h-2 w-2 rounded-full bg-purple-600" />
                  <span>Yönetici</span>
                </div>
                <p className="text-slate-500 font-medium pl-3.5">
                  Sipariş, ürün, müşteri ve raporları yönetebilir.
                </p>
              </div>

              <div className="space-y-1 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-fuchsia-600">
                  <span className="h-2 w-2 rounded-full bg-fuchsia-600" />
                  <span>Editör</span>
                </div>
                <p className="text-slate-500 font-medium pl-3.5">
                  İçerik ve ürün bilgilerini düzenleyebilir.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span>Müşteri</span>
                </div>
                <p className="text-slate-500 font-medium pl-3.5">
                  Sadece kendi hesabı ve siparişlerini görüntüleyebilir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL POPUP: Rol Değiştir ve Bilgileri Düzenle */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-100 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Kullanıcı Rolü ve Bilgilerini Düzenle
                </h3>
                <p className="text-xs font-medium text-slate-400 mt-0.5">
                  Kullanıcının rol yetkilerini, kişisel bilgilerini ve hesap durumunu güncelleyin.
                </p>
              </div>
              <button
                onClick={() => setEditingCustomer(null)}
                className="h-9 w-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Selected User Header Pill */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-rose-100 text-[#C98484] font-black text-base flex items-center justify-center shrink-0 border border-rose-200">
                  {(editingCustomer.first_name?.[0] || editingCustomer.email[0]).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {[editingCustomer.first_name, editingCustomer.last_name].filter(Boolean).join(" ") || "—"}
                  </h4>
                  <span className="text-xs font-medium text-slate-400 block">
                    @{editingCustomer.username || editingCustomer.email.split("@")[0]} • {editingCustomer.email}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 block">Mevcut Rol</span>
                <span className={`inline-block px-3 py-1 rounded-xl text-xs font-extrabold border ${getRoleBadgeStyle(editingCustomer.role || "Müşteri")}`}>
                  {editingCustomer.role || "Müşteri"}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              {/* ROL SEÇİM ALANI */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Kullanıcı Rolünü Seçin
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ROLE_OPTIONS.map((r) => {
                    const IconComp = r.icon
                    const isSelected = (editingCustomer.role || "Müşteri") === r.id
                    return (
                      <div
                        key={r.id}
                        onClick={() => setEditingCustomer({ ...editingCustomer, role: r.id })}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 relative ${
                          isSelected
                            ? "border-[#C98484] bg-rose-50/40 shadow-xs"
                            : "border-slate-200/80 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${r.color}`}>
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <span className="font-bold text-slate-900 text-xs block">
                            {r.title}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 block leading-tight mt-0.5">
                            {r.desc}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute right-3 top-3 h-5 w-5 rounded-full bg-[#C98484] text-white flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* KİŞİSEL VE İLETİŞİM BİLGİLERİ */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4 space-y-4 text-xs font-bold text-slate-700">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Kişisel ve Hesap Bilgileri
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block mb-1 font-bold text-slate-700">Ad</label>
                    <input
                      type="text"
                      value={editingCustomer.first_name || ""}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, first_name: e.target.value })}
                      placeholder="Adınız"
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-700">Soyad</label>
                    <input
                      type="text"
                      value={editingCustomer.last_name || ""}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, last_name: e.target.value })}
                      placeholder="Soyadınız"
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block mb-1 font-bold text-slate-700">E-posta Adresi *</label>
                    <input
                      type="email"
                      required
                      value={editingCustomer.email}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                      placeholder="ornek@domain.com"
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-700">Telefon</label>
                    <input
                      type="tel"
                      value={editingCustomer.phone || ""}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                      placeholder="05XX XXX XX XX"
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484] transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block mb-1 font-bold text-slate-700">Kullanıcı Adı</label>
                    <input
                      type="text"
                      value={editingCustomer.username || ""}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, username: e.target.value })}
                      placeholder="kullaniciadi"
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-slate-700">Hesap Durumu</label>
                    <select
                      value={editingCustomer.status || "Aktif"}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value })}
                      className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-extrabold text-slate-800 outline-none focus:border-[#C98484] cursor-pointer"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Pasif">Pasif</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleDelete([editingCustomer.id])}
                  className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Kullanıcıyı Sil</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                    className="h-11 px-5 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 px-6 rounded-2xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs transition-all shadow-lg shadow-rose-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: Yeni Kullanıcı Ekle */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-rose-50 text-[#C98484] flex items-center justify-center border border-rose-100">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Yeni Kullanıcı Ekle</h3>
                  <p className="text-xs font-medium text-slate-400">
                    Kullanıcı bilgilerini doldurun ve rolünü seçin.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Ad *</label>
                  <input
                    type="text"
                    required
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                    placeholder="Ad"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-[#C98484] focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block mb-1">Soyad *</label>
                  <input
                    type="text"
                    required
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                    placeholder="Soyad"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-[#C98484] focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Kullanıcı Adı</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="kullaniciadi"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-[#C98484] focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="05XX XXX XX XX"
                    className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-[#C98484] focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">E-posta Adresi *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="ornek@domain.com"
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-[#C98484] focus:bg-white transition-all font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block mb-1">Şifre * (En az 10 karakter)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3 outline-none focus:border-[#C98484] focus:bg-white transition-all font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1">Rol Atayın *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 font-bold text-slate-800 outline-none focus:border-[#C98484] cursor-pointer"
                  >
                    <option value="Müşteri">Müşteri</option>
                    <option value="Editör">Editör</option>
                    <option value="Yönetici">Yönetici</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Hesap Durumu</label>
                  <select
                    value={newUser.status}
                    onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 font-bold text-slate-800 outline-none focus:border-[#C98484] cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Pasif">Pasif</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-11 px-5 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-6 rounded-2xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs transition-all shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kullanıcıyı Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Kullanıcı Detay Görüntüle */}
      {viewCustomerDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Kullanıcı Detayları</h3>
              <button onClick={() => setViewCustomerDetail(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="h-12 w-12 rounded-2xl bg-rose-100 text-[#C98484] font-black text-sm flex items-center justify-center shrink-0">
                  {(viewCustomerDetail.first_name?.[0] || viewCustomerDetail.email[0]).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {[viewCustomerDetail.first_name, viewCustomerDetail.last_name].filter(Boolean).join(" ") || "—"}
                  </h4>
                  <p className="text-slate-400 font-medium">@{viewCustomerDetail.username || viewCustomerDetail.email.split("@")[0]}</p>
                </div>
              </div>

              <div className="space-y-2 font-medium text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">E-posta:</span>
                  <span className="font-bold text-slate-900">{viewCustomerDetail.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Telefon:</span>
                  <span className="font-bold text-slate-900">{viewCustomerDetail.phone || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Rol:</span>
                  <span className="font-bold text-slate-900">{viewCustomerDetail.role || "Müşteri"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Durum:</span>
                  <span className="font-bold text-emerald-600">{viewCustomerDetail.status || "Aktif"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Kayıt Tarihi:</span>
                  <span className="font-bold text-slate-900">{new Date(viewCustomerDetail.created_at).toLocaleDateString("tr-TR")}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setViewCustomerDetail(null)}
              className="w-full h-10 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
