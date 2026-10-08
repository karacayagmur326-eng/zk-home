"use client"

import { useAdminAutoRefresh } from "@lib/hooks/use-admin-auto-refresh"

import React, { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Star,
  Download,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Eye,
  Check,
  Edit3,
  Trash2,
  X,
  ChevronDown,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  HelpCircle,
} from "lucide-react"

type Review = {
  id: string
  product_id: string
  product_title?: string | null
  author: string
  email: string
  rating: number
  comment: string
  title?: string | null
  ip_address?: string | null
  status: "pending" | "approved" | "rejected"
  created_at: string
}

type Stats = {
  total: number
  pending: number
  approved: number
  rejected: number
  average: number
}

type ProductOption = {
  id: string
  title: string
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats>({
    total: 33,
    pending: 0,
    approved: 33,
    rejected: 0,
    average: 4.9,
  })
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<ProductOption[]>([])

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [ratingFilter, setRatingFilter] = useState("all")
  const [productFilter, setProductFilter] = useState("all")
  const [bulkAction, setBulkAction] = useState("")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState<Review | null>(null)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [expandedTextIds, setExpandedTextIds] = useState<Record<string, boolean>>({})

  // New review form
  const [newProductId, setNewProductId] = useState("")
  const [newAuthor, setNewAuthor] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newRating, setNewRating] = useState(5)
  const [newComment, setNewComment] = useState("")
  const [newStatus, setNewStatus] = useState<"approved" | "pending">("approved")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit form state
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState("")
  const [editStatus, setEditStatus] = useState<Review["status"]>("approved")

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchReviews = useCallback(async (silent = false, signal?: AbortSignal) => {
    if (!silent) setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (ratingFilter !== "all") params.set("rating", ratingFilter)
      if (productFilter !== "all") params.set("productId", productFilter)
      if (searchQuery.trim()) params.set("q", searchQuery.trim())

      const res = await fetch(`/api/admin/reviews?${params.toString()}`, { cache: "no-store", signal })
      if (res.ok) {
        const data = await res.json()
        if (signal?.aborted) return
        setReviews(data.reviews || [])
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (e) {
      if (!silent && !signal?.aborted) console.error(e)
    } finally {
      if (!silent && !signal?.aborted) setLoading(false)
    }
  }, [statusFilter, ratingFilter, productFilter, searchQuery])

  useEffect(() => {
    const controller = new AbortController()
    void fetchReviews(false, controller.signal)
    return () => controller.abort()
  }, [fetchReviews])

  useAdminAutoRefresh((signal) => fetchReviews(true, signal), { enabled: !loading && !isSubmitting, refreshKey: JSON.stringify([statusFilter, ratingFilter, productFilter, searchQuery]) })

  useEffect(() => {
    fetch("/api/admin/products?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.products) {
          setProducts(d.products.map((p: any) => ({ id: p.id, title: p.title })))
          if (d.products.length > 0) setNewProductId(d.products[0].id)
        }
      })
      .catch(() => null)
  }, [])

  const handleUpdateStatus = async (id: string, status: Review["status"]) => {
    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) {
      fetchReviews()
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setSelectedIds((prev) => prev.filter((i) => i !== id))
      fetchReviews()
      ;(window as any).showAdminAlert?.("Yorum başarıyla silindi.", "Başarılı", "success")
    }
  }

  const handleBulkApply = async () => {
    if (!selectedIds.length || !bulkAction) return
    setLoading(true)

    if (bulkAction === "approve" || bulkAction === "reject") {
      const targetStatus = bulkAction === "approve" ? "approved" : "rejected"
      await Promise.all(
        selectedIds.map((id) =>
          fetch("/api/admin/reviews", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: targetStatus }),
          })
        )
      )
    } else if (bulkAction === "delete") {
      await Promise.all(
        selectedIds.map((id) => fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, { method: "DELETE" }))
      )
    }

    setSelectedIds([])
    setBulkAction("")
    fetchReviews()
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProductId || !newAuthor || !newComment) return
    setIsSubmitting(true)

    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: newProductId,
        author: newAuthor,
        email: newEmail || "musteri@magazam.com",
        rating: newRating,
        comment: newComment,
        status: newStatus,
      }),
    })

    setIsSubmitting(false)
    if (res.ok) {
      setShowAddModal(false)
      setNewAuthor("")
      setNewEmail("")
      setNewComment("")
      fetchReviews()
    }
  }

  const openEditModal = (r: Review) => {
    setEditingReview(r)
    setEditRating(r.rating)
    setEditComment(r.comment)
    setEditStatus(r.status)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingReview) return
    setIsSubmitting(true)

    const res = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingReview.id,
        rating: editRating,
        comment: editComment,
        status: editStatus,
      }),
    })

    setIsSubmitting(false)
    if (res.ok) {
      setEditingReview(null)
      fetchReviews()
    }
  }

  const exportCSV = () => {
    if (!reviews.length) return
    const headers = "ID,Müşteri,E-posta,IP,Puan,Yorum,Ürün,Durum,Tarih\n"
    const rows = reviews
      .map(
        (r) =>
          `"${r.id}","${r.author}","${r.email}","${r.ip_address || ""}","${r.rating}","${r.comment.replace(/"/g, '""')}","${r.product_title || r.product_id}","${r.status}","${r.created_at}"`
      )
      .join("\n")

    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `degerlendirmeler_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === reviews.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(reviews.map((r) => r.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  // Formatting date
  const formatDate = (iso: string) => {
    if (!iso) return "—"
    const d = new Date(iso)
    return (
      d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " " +
      d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    )
  }

  // Pagination logic
  const totalPages = Math.ceil(reviews.length / pageSize) || 1
  const paginatedReviews = reviews.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="w-full space-y-5 pb-16 font-sans text-slate-800 bg-[#f8fafc] min-h-screen p-2 sm:p-4">
      {/* ── HEADER AREA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={exportCSV}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Dışa Aktar</span>
          </button>

          <button
            type="button"
            onClick={() => (window as any).showAdminAlert?.("Toplu yanıt şablonları modülü hazırlanıyor.", "Özellik Yakında", "info")}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Toplu Yanıt Şablonları</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#C98484] hover:bg-[#A95E5E] text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Yeni Yorum Ekle</span>
          </button>
        </div>
      </div>

      {/* ── TOP 4 STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Yorum */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#C98484] border border-rose-100 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">
              Toplam Yorum
            </span>
            <strong className="text-2xl font-black text-slate-900 block tracking-tight leading-tight mt-0.5">
              {stats.total}
            </strong>
            <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">Tüm zamanlar</span>
          </div>
        </div>

        {/* Card 2: Bekleyen Onay */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">
              Bekleyen Onay
            </span>
            <strong className="text-2xl font-black text-slate-900 block tracking-tight leading-tight mt-0.5">
              {stats.pending}
            </strong>
            <span className="text-[11px] font-semibold text-amber-600 block mt-0.5">İncelemenizi bekliyor</span>
          </div>
        </div>

        {/* Card 3: Onaylanan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">
              Onaylanan
            </span>
            <strong className="text-2xl font-black text-slate-900 block tracking-tight leading-tight mt-0.5">
              {stats.approved}
            </strong>
            <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">Yayında olan yorumlar</span>
          </div>
        </div>

        {/* Card 4: Ortalama Puan */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block leading-tight">
              Ortalama Puan
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <strong className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {stats.average}
              </strong>
              <span className="text-xs font-bold text-slate-400">/ 5.0</span>
            </div>
            <div className="flex items-center gap-0.5 text-amber-400 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(stats.average) ? "fill-amber-400 text-amber-400" : "text-slate-200"
                  }`}
                />
              ))}
              <span className="text-[10px] text-slate-400 font-semibold ml-1">Tüm yorumlar ortalaması</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        {/* Search Input */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Yorumlarda ara..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-[#C98484] focus:ring-2 focus:ring-rose-500/20 text-xs shadow-2xs transition-all"
          />
        </div>

        {/* Bulk Action Segmented Group */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/60 p-1 shadow-2xs hover:border-slate-300 transition-all">
          <div className="relative">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="appearance-none bg-transparent pr-7 pl-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">Toplu İşlemler</option>
              <option value="approve">Onayla</option>
              <option value="reject">Reddet</option>
              <option value="delete">Sil</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={handleBulkApply}
            disabled={!selectedIds.length || !bulkAction}
            className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
              selectedIds.length && bulkAction
                ? "bg-[#C98484] text-white shadow-xs hover:bg-[#A95E5E]"
                : "bg-slate-200/80 text-slate-400 opacity-60 cursor-not-allowed"
            }`}
          >
            Uygula
          </button>
        </div>

        <div className="h-5 w-px bg-slate-200/80 hidden sm:block mx-0.5" />

        {/* Rating Filter Dropdown */}
        <div className="relative">
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C98484] focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-semibold rounded-xl text-xs py-2 pl-3.5 pr-8 transition-all cursor-pointer shadow-2xs"
          >
            <option value="all">Tüm derecelendirmeler</option>
            <option value="5">5 Yıldız (⭐⭐⭐⭐⭐)</option>
            <option value="4">4 Yıldız (⭐⭐⭐⭐)</option>
            <option value="3">3 Yıldız (⭐⭐⭐)</option>
            <option value="2">2 Yıldız (⭐⭐)</option>
            <option value="1">1 Yıldız (⭐)</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Product Filter Dropdown */}
        <div className="relative max-w-[200px]">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C98484] focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-semibold rounded-xl text-xs py-2 pl-3.5 pr-8 transition-all cursor-pointer shadow-2xs truncate"
          >
            <option value="all">Tüm ürünler</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status / Type Filter Dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C98484] focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-semibold rounded-xl text-xs py-2 pl-3.5 pr-8 transition-all cursor-pointer shadow-2xs"
          >
            <option value="all">Tüm tipler</option>
            <option value="approved">Onaylananlar</option>
            <option value="pending">Bekleyenler</option>
            <option value="rejected">Reddedilenler</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Action Buttons: Filtrele & Sıfırla */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={() => void fetchReviews()}
            className="px-3.5 py-2 rounded-xl bg-white border border-rose-200 text-[#C98484] font-extrabold hover:bg-rose-50 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrele</span>
          </button>

          {(searchQuery || statusFilter !== "all" || ratingFilter !== "all" || productFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
                setRatingFilter("all")
                setProductFilter("all")
                setPage(1)
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sıfırla</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT GRID (Table + Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* LEFT COLUMN: TABLE (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === reviews.length && reviews.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-[#C98484] focus:ring-[#C98484] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 w-16">Tür</th>
                  <th className="py-3 px-4">Yazar</th>
                  <th className="py-3 px-3">Değerlendirme</th>
                  <th className="py-3 px-4 min-w-[220px]">İnceleme</th>
                  <th className="py-3 px-4 min-w-[180px]">Ürün</th>
                  <th className="py-3 px-3 whitespace-nowrap">Gönderilme tarihi</th>
                  <th className="py-3 px-3">Durum</th>
                  <th className="py-3 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : paginatedReviews.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-semibold">
                      Kriterlere uygun müşteri değerlendirmesi bulunamadı.
                    </td>
                  </tr>
                ) : (
                  paginatedReviews.map((r) => {
                    const isExpanded = Boolean(expandedTextIds[r.id])
                    const isLong = r.comment.length > 80

                    return (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Checkbox */}
                        <td className="py-3.5 px-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={() => toggleSelectOne(r.id)}
                            className="rounded border-slate-300 text-[#C98484] focus:ring-[#C98484] cursor-pointer"
                          />
                        </td>

                        {/* Tür */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            <FileText className="w-3 h-3 text-slate-400" /> Ürün
                          </span>
                        </td>

                        {/* Yazar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-2xs">
                              {r.author.slice(0, 1)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate">{r.author}</span>
                              <span className="text-[11px] text-slate-400 block truncate">{r.email}</span>
                              {r.ip_address && (
                                <span className="text-[10px] text-slate-400 block font-mono">{r.ip_address}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Değerlendirme */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex text-amber-400 gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                        </td>

                        {/* İnceleme */}
                        <td className="py-3.5 px-4 leading-relaxed">
                          <p className="text-slate-800 font-medium">
                            {isLong && !isExpanded ? r.comment.slice(0, 80) + "..." : r.comment}
                          </p>
                          {isLong && (
                            <button
                              type="button"
                              onClick={() => setExpandedTextIds((prev) => ({ ...prev, [r.id]: !isExpanded }))}
                              className="text-[11px] font-bold text-blue-600 hover:underline mt-0.5 block cursor-pointer"
                            >
                              {isExpanded ? "Daralt" : "Devamını oku"}
                            </button>
                          )}
                        </td>

                        {/* Ürün */}
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/admin/urunler/${r.product_id}`}
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline block truncate max-w-[200px]"
                            title={r.product_title || r.product_id}
                          >
                            {r.product_title || r.product_id}
                          </Link>
                        </td>

                        {/* Gönderilme Tarihi */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 font-medium">
                          {formatDate(r.created_at)}
                        </td>

                        {/* Durum Badge */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {r.status === "approved" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              Onaylandı
                            </span>
                          )}
                          {r.status === "pending" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80">
                              Bekliyor
                            </span>
                          )}
                          {r.status === "rejected" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200/80">
                              Reddedildi
                            </span>
                          )}
                        </td>

                        {/* Action Icons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View detail */}
                            <button
                              type="button"
                              onClick={() => setShowDetailModal(r)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Detay Görüntüle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Quick approve */}
                            {r.status !== "approved" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(r.id, "approved")}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="Onayla"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                              </button>
                            )}

                            {/* Quick reject */}
                            {r.status === "approved" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(r.id, "rejected")}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Yayından Kaldır"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => openEditModal(r)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(r.id)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Table Footer Pagination */}
          <div className="p-3.5 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 font-medium">
              {reviews.length > 0
                ? `${reviews.length} kayıttan ${(page - 1) * pageSize + 1} - ${Math.min(
                    page * pageSize,
                    reviews.length
                  )} arası gösteriliyor`
                : "0 kayıt"}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                <span>Satır başına</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 font-bold focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  «
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  ‹
                </button>

                <span className="px-3 py-1 rounded-lg bg-[#C98484] text-white font-extrabold text-xs">
                  {page}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  ›
                </button>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR (1 col) */}
        <div className="space-y-4">
          {/* Moderasyon İpuçları Widget */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs">
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Moderasyon İpuçları</span>
            </div>

            <div className="space-y-3 text-[11px] text-slate-600 leading-normal">
              {/* Tip 1 */}
              <div className="border-b border-slate-100 pb-2.5">
                <strong className="text-slate-900 block font-bold">Spam Kontrolü</strong>
                <p className="text-slate-500 mt-0.5">
                  Kopya içerikler, şüpheli linkler ve anlamsız metinleri kontrol edin.
                </p>
              </div>

              {/* Tip 2 */}
              <div className="border-b border-slate-100 pb-2.5">
                <strong className="text-slate-900 block font-bold">Ürün Doğrulaması</strong>
                <p className="text-slate-500 mt-0.5">
                  Yorumun ilgili ürünle alakalı olduğundan emin olun.
                </p>
              </div>

              {/* Tip 3 */}
              <div className="border-b border-slate-100 pb-2.5">
                <strong className="text-slate-900 block font-bold">Yıldız Puanı Tutarlılığı</strong>
                <p className="text-slate-500 mt-0.5">
                  Düşük puanlı yorumları (özellikle dikkatle) inceleyin.
                </p>
              </div>

              {/* Tip 4 */}
              <div className="border-b border-slate-100 pb-2.5">
                <strong className="text-slate-900 block font-bold">Müşteri Yanıtı</strong>
                <p className="text-slate-500 mt-0.5">
                  Gerekirse nazik ve çözüm odaklı yanıt vererek müşteri memnuniyetini artırın.
                </p>
              </div>

              {/* Tip 5 */}
              <div>
                <strong className="text-slate-900 block font-bold">Yasal Uyum</strong>
                <p className="text-slate-500 mt-0.5">
                  Hakaret, kişisel veri ve yasal olmayan içerikleri yayınlamayın.
                </p>
              </div>
            </div>
          </div>

          {/* Bekleyen Yorum Onay Callout Box */}
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-rose-950 font-extrabold">
              <Clock className="w-4 h-4 text-[#C98484]" />
              <span>{stats.pending} Yorum onayınızı bekliyor</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              Tüm bekleyen yorumları görüntülemek için tıklayın.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("pending")
                setPage(1)
              }}
              className="text-[#C98484] font-extrabold text-[11px] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
            >
              <span>Bekleyenleri Görüntüle</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL 1: YENİ YORUM EKLE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 text-sm">Yeni Müşteri Yorumu Ekle</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ürün</label>
                <select
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#C98484]"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Yazar Adı Soyadı</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Örn: Yeşim"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-[#C98484]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">E-posta Adresi</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Örn: musteri@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-[#C98484]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Puan (Yıldız)</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= newRating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-extrabold text-slate-800 ml-2">{newRating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Yorum Metni</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Müşteri değerlendirmesi metni..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-[#C98484] resize-y"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Durum</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#C98484]"
                >
                  <option value="approved">Onayla ve Yayınla</option>
                  <option value="pending">Onay Beklesin</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#C98484] hover:bg-[#A95E5E] text-white font-extrabold shadow-md shadow-rose-500/20"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: YORUM DÜZENLE */}
      {editingReview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-900 text-sm">Yorum Düzenle</h3>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <strong className="block text-slate-900 font-bold">{editingReview.author}</strong>
                <span className="text-slate-400">{editingReview.email}</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Puan</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= editRating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-extrabold text-slate-800 ml-2">{editRating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Yorum Metni</label>
                <textarea
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-[#C98484] resize-y"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Durum</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-[#C98484]"
                >
                  <option value="approved">Onaylandı (Yayında)</option>
                  <option value="pending">Onay Bekliyor</option>
                  <option value="rejected">Reddedildi</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#C98484] hover:bg-[#A95E5E] text-white font-extrabold shadow-md shadow-rose-500/20"
                >
                  {isSubmitting ? "Güncelleniyor..." : "Güncelle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: YORUM DETAY GÖRÜNTÜLE */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">Yorum Detayı</h3>
              <button
                type="button"
                onClick={() => setShowDetailModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Müşteri:</span>
                <span className="font-bold text-slate-900">{showDetailModal.author}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">E-posta:</span>
                <span className="font-bold text-slate-900">{showDetailModal.email}</span>
              </div>
              {showDetailModal.ip_address && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">IP Adresi:</span>
                  <span className="font-mono text-slate-700">{showDetailModal.ip_address}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Ürün:</span>
                <span className="font-bold text-blue-600">{showDetailModal.product_title || showDetailModal.product_id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Değerlendirme:</span>
                <div className="flex text-amber-400 gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= showDetailModal.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Gönderilme Tarihi:</span>
                <span className="font-medium text-slate-700">{formatDate(showDetailModal.created_at)}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-slate-400 font-semibold block mb-1">Yorum Metni:</span>
              <p className="text-slate-800 font-medium leading-relaxed">{showDetailModal.comment}</p>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowDetailModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
