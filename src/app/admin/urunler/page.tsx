"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Package,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Edit3,
  Copy,
  Eye,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  XCircle,
  ChevronDown,
  Filter,
  X,
} from "lucide-react"
import ConfirmModal from "../components/ConfirmModal"

interface Product {
  id: string
  title: string
  handle: string
  status: string
  thumbnail: string | null
  created_at: string
  deleted_at?: string | null
  variants?: Array<{
    id: string
    sku?: string
    prices?: Array<{ amount: number; currency_code: string }>
    manage_inventory?: boolean
    inventory_quantity?: number
    stock?: number
  }>
  categories?: Array<{ id: string; name: string }>
  tags?: Array<{ id: string; value: string }>
  collection?: { id: string; title: string } | null
  type?: { id: string; value: string } | null
}

interface FilterOption {
  id: string
  label: string
}

interface StatusCounts {
  total: number
  published_count: number
  draft_count: number
  low_stock_count: number
  deleted_count: number
}

const STATUS_LABELS: Record<string, string> = {
  published: "Yayında",
  draft: "Taslak",
  proposed: "Beklemede",
  rejected: "Reddedildi",
  deleted: "Silindi",
}

function formatPrice(variants?: Product["variants"]) {
  if (!variants?.length) return "—"
  const price = variants[0]?.prices?.[0]
  if (!price) return "—"
  const val = typeof price.amount === "number" ? price.amount : parseFloat(String(price.amount || 0))
  const formatted = (val / 100).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${formatted} TL`
}

function renderStockStatus(variants?: Product["variants"]) {
  if (!variants?.length) return <span className="text-slate-400">—</span>

  if (variants.length > 1) {
    const totalStock = variants.reduce((acc, v) => acc + (v.inventory_quantity ?? v.stock ?? 0), 0)
    return (
      <div>
        <span className="font-semibold text-slate-800">{totalStock} adet</span>
        <span className="block text-[11px] text-slate-400">({variants.length} varyant)</span>
      </div>
    )
  }

  const v = variants[0]
  if (!v.manage_inventory) {
    return <span className="text-slate-500 font-medium">Sınırsız</span>
  }

  const qty = v.inventory_quantity ?? v.stock ?? 0
  if (qty <= 0) {
    return <span className="text-rose-600 font-extrabold text-xs bg-rose-50 px-2 py-0.5 rounded-full">Stok Yok (0)</span>
  }
  if (qty <= 5) {
    return <span className="text-amber-600 font-extrabold text-xs bg-amber-50 px-2 py-0.5 rounded-full">Kritik ({qty})</span>
  }
  return <span className="text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded-full">{qty} adet</span>
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState<StatusCounts>({
    total: 0,
    published_count: 0,
    draft_count: 0,
    low_stock_count: 0,
    deleted_count: 0,
  })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState("")
  const [statusTab, setStatusTab] = useState("") // "" = Tümü, "published", "draft", "deleted"
  const [catFilter, setCatFilter] = useState("")
  const [colFilter, setColFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [stockFilter, setStockFilter] = useState("")
  
  const [selected, setSelected] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<string>("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [bulkAction, setBulkAction] = useState("")
  const [deleting, setDeleting] = useState(false)
  
  // Modals
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmPermanentId, setConfirmPermanentId] = useState<string | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [confirmBulkPermanent, setConfirmBulkPermanent] = useState(false)
  const [deleteRelatedMedia, setDeleteRelatedMedia] = useState(false)

  // Filter options
  const [categories, setCategories] = useState<FilterOption[]>([])
  const [collections, setCollections] = useState<FilterOption[]>([])
  const [types, setTypes] = useState<FilterOption[]>([])

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories((d.categories || []).map((c: any) => ({ id: c.id, label: c.name }))))
    fetch("/api/admin/collections")
      .then((r) => r.json())
      .then((d) => setCollections((d.collections || []).map((c: any) => ({ id: c.id, label: c.title }))))
    fetch("/api/admin/product-types")
      .then((r) => r.json())
      .then((d) => setTypes((d.types || []).map((t: any) => ({ id: t.id, label: t.value }))))
  }, [])

  const fetchProducts = useCallback(
    (p = page, currentLimit = limit, currentStock = stockFilter, currentStatus = statusTab) => {
      setLoading(true)
      const qs = new URLSearchParams()
      qs.set("page", String(p))
      qs.set("limit", String(currentLimit))
      if (search) qs.set("search", search)
      if (currentStatus) qs.set("status", currentStatus)
      if (catFilter) qs.set("category_id", catFilter)
      if (colFilter) qs.set("collection_id", colFilter)
      if (typeFilter) qs.set("type_id", typeFilter)
      if (currentStock) qs.set("stock", currentStock)

      fetch(`/api/admin/products?${qs}`)
        .then((r) => {
          if (r.status === 401) {
            window.location.href = "/admin"
            return null
          }
          return r.json()
        })
        .then((d) => {
          if (!d) return
          setProducts(d.products || [])
          setTotal(d.total || 0)
          if (d.counts) setCounts(d.counts)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    },
    [catFilter, colFilter, limit, page, router, search, statusTab, stockFilter, typeFilter]
  )

  useEffect(() => {
    fetchProducts(page, limit, stockFilter, statusTab)
  }, [page, limit, statusTab, catFilter, colFilter, typeFilter, stockFilter])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchProducts(1, limit, stockFilter, statusTab)
  }

  function toggleAll(c: boolean) {
    setSelected(c ? products.map((p) => p.id) : [])
  }
  function toggleOne(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  async function applyBulk() {
    if (!bulkAction || !selected.length) return

    if (bulkAction === "soft_delete") {
      setDeleteRelatedMedia(false)
      setConfirmBulkDelete(true)
    } else if (bulkAction === "restore") {
      setDeleting(true)
      await Promise.all(
        selected.map((id) =>
          fetch(`/api/admin/products/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "restore" }),
          })
        )
      )
      setDeleting(false)
      setSelected([])
      fetchProducts(page)
    } else if (bulkAction === "permanent_delete") {
      setDeleteRelatedMedia(false)
      setConfirmBulkPermanent(true)
    } else if (bulkAction === "publish" || bulkAction === "draft") {
      setDeleting(true)
      await Promise.all(
        selected.map((id) =>
          fetch(`/api/admin/products/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: bulkAction === "publish" ? "published" : "draft" }),
          })
        )
      )
      setDeleting(false)
      setSelected([])
      fetchProducts(page)
    }
  }

  async function performBulkPermanentDelete() {
    if (await deleteSelectedProducts(selected, true)) {
      setConfirmBulkPermanent(false)
    }
  }

  async function performBulkSoftDelete() {
    if (await deleteSelectedProducts(selected, false)) {
      setConfirmBulkDelete(false)
    }
  }

  async function handleSoftDelete(id: string) {
    setDeleteRelatedMedia(false)
    setConfirmDeleteId(id)
  }

  async function performSoftDelete() {
    if (!confirmDeleteId) return
    if (await deleteSelectedProducts([confirmDeleteId], false)) {
      setConfirmDeleteId(null)
    }
  }

  async function handleRestore(id: string) {
    await fetch(`/api/admin/products/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore" }),
    })
    fetchProducts(page)
  }

  async function handlePermanentDelete(id: string) {
    setDeleteRelatedMedia(false)
    setConfirmPermanentId(id)
  }

  async function performPermanentDelete() {
    if (!confirmPermanentId) return
    if (await deleteSelectedProducts([confirmPermanentId], true)) {
      setConfirmPermanentId(null)
    }
  }

  async function deleteSelectedProducts(ids: string[], permanent: boolean) {
    if (!ids.length) return false
    setDeleting(true)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 30_000)
    try {
      const response = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          ids,
          permanent,
          deleteMedia: deleteRelatedMedia,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Ürünler silinemedi.")

      const mediaSummary = deleteRelatedMedia
        ? ` ${result.deletedMedia || 0} medya dosyası çöp kutusuna taşındı.${
            result.skippedSharedMedia
              ? ` Başka yerlerde kullanılan ${result.skippedSharedMedia} dosya korundu.`
              : ""
          }${
            result.failedMediaDeletes
              ? ` ${result.failedMediaDeletes} dosya depolamadan kaldırılamadı; depolama ayarlarını kontrol edin.`
              : ""
          }`
        : " İlişkili medya dosyaları korundu."
      ;(window as any).showAdminAlert?.(
        `${result.deletedProducts || ids.length} ürün ${
          permanent ? "kalıcı olarak silindi." : "çöp kutusuna taşındı."
        }${mediaSummary}`,
        "İşlem tamamlandı",
        result.failedMediaDeletes ? "warning" : "success",
      )
      setSelected([])
      setBulkAction("")
      setDeleteRelatedMedia(false)
      fetchProducts(page)
      return true
    } catch (error: any) {
      const message = error?.name === "AbortError"
        ? "Silme işlemi zaman aşımına uğradı. Hiçbir değişiklik yarım bırakılmadı; lütfen tekrar deneyin."
        : error?.message || "Silme işlemi tamamlanamadı."
      ;(window as any).showAdminAlert?.(
        message,
        "Hata",
        "error",
      )
      return false
    } finally {
      window.clearTimeout(timeoutId)
      setDeleting(false)
    }
  }

  async function duplicateProduct(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      if (typeof window !== "undefined" && (window as any).showAdminAlert) {
        (window as any).showAdminAlert("Ürün başarıyla çoğaltıldı!", "Başarılı", "success")
      }
      fetchProducts(page)
    } catch (e) {
      console.error("Duplicate failed", e)
      setLoading(false)
    }
  }

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const sortedProducts = [...products].sort((a, b) => {
    let valA: any = ""
    let valB: any = ""

    switch (sortKey) {
      case "title":
        valA = a.title || ""
        valB = b.title || ""
        break
      case "sku":
        valA = a.variants?.[0]?.sku || ""
        valB = b.variants?.[0]?.sku || ""
        break
      case "stock":
        valA = a.variants?.[0]?.manage_inventory
          ? a.variants?.[0]?.inventory_quantity ?? 0
          : 9999
        valB = b.variants?.[0]?.manage_inventory
          ? b.variants?.[0]?.inventory_quantity ?? 0
          : 9999
        break
      case "price":
        valA = a.variants?.[0]?.prices?.[0]?.amount ?? 0
        valB = b.variants?.[0]?.prices?.[0]?.amount ?? 0
        break
      case "category":
        valA = a.categories?.map((c) => c.name).join(", ") || ""
        valB = b.categories?.map((c) => c.name).join(", ") || ""
        break
      case "status":
        valA = STATUS_LABELS[a.status] || a.status || ""
        valB = STATUS_LABELS[b.status] || b.status || ""
        break
      case "date":
      default:
        valA = new Date(a.created_at || 0).getTime()
        valB = new Date(b.created_at || 0).getTime()
        break
    }

    if (typeof valA === "string" && typeof valB === "string") {
      const cmp = valA.localeCompare(valB, "tr-TR", { sensitivity: "base" })
      return sortOrder === "asc" ? cmp : -cmp
    }

    const numA = Number(valA) || 0
    const numB = Number(valB) || 0
    return sortOrder === "asc" ? numA - numB : numB - numA
  })

  function renderSortHeader(key: string, label: string) {
    const isActive = sortKey === key
    return (
      <th
        onClick={() => handleSort(key)}
        className="px-3 py-3 font-semibold text-slate-500 hover:text-slate-900 cursor-pointer select-none transition-colors text-left"
        title={`${label} sütununa göre sıralamak için tıklayın`}
      >
        <div className="inline-flex items-center gap-1.5">
          <span className={isActive ? "font-bold text-slate-900" : ""}>{label}</span>
          <ArrowUpDown className={`w-3 h-3 ${isActive ? "text-[#C98484]" : "text-slate-300"}`} />
        </div>
      </th>
    )
  }

  const totalPages = Math.ceil(total / limit) || 1
  const isTrashTab = statusTab === "deleted"

  return (
    <div className="space-y-6 font-sans">
      {/* ── Breadcrumbs & Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Link href="/admin/urunler/ice-aktar" className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-2">
            <Download className="w-4 h-4" />Excel'den İçe Aktar
          </Link>
          <a href="/api/admin/products/export" className="px-3.5 py-2.5 rounded-xl border border-[#C98484] bg-white text-[#C98484] font-bold text-xs hover:bg-rose-50 flex items-center gap-2">
            <Download className="w-4 h-4" />Excel'e Dışa Aktar
          </a>

          <Link
            href="/admin/urunler/yeni"
            className="px-4 py-2.5 rounded-xl bg-[#C98484] text-white font-bold text-xs hover:bg-[#A95E5E] transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Yeni Ürün Ekle</span>
          </Link>
        </div>
      </div>

      {/* ── Status Nav Pills Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: "", label: "Tümü", count: counts.total, icon: Package },
          { key: "published", label: "Yayınlanmış", count: counts.published_count, icon: CheckCircle2 },
          { key: "draft", label: "Taslak", count: counts.draft_count, icon: FileText },
          { key: "low_stock", label: "Düşük Stok", count: counts.low_stock_count, icon: AlertTriangle },
          { key: "deleted", label: "Silinenler", count: counts.deleted_count, icon: Trash2 },
        ].map((tab) => {
          const isActive =
            tab.key === "low_stock"
              ? stockFilter === "low"
              : statusTab === tab.key && !stockFilter

          const Icon = tab.icon

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                if (tab.key === "low_stock") {
                  setStockFilter("low")
                  setStatusTab("")
                } else {
                  setStockFilter("")
                  setStatusTab(tab.key)
                }
                setPage(1)
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-white border-rose-200 text-slate-900 shadow-sm ring-2 ring-[#C98484]/20"
                  : tab.key === "deleted"
                  ? "bg-white border-slate-200/80 text-rose-600 hover:bg-rose-50/50"
                  : "bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive
                    ? "text-[#C98484]"
                    : tab.key === "deleted"
                    ? "text-rose-500"
                    : tab.key === "published"
                    ? "text-emerald-500"
                    : tab.key === "low_stock"
                    ? "text-amber-500"
                    : "text-slate-400"
                }`}
              />
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                  isActive
                    ? "bg-rose-100 text-[#C98484]"
                    : tab.key === "deleted"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Action & Filter Controls Bar ── */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        {/* Bulk Action Segmented Group */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50/60 p-1 shadow-2xs hover:border-slate-300 transition-all">
          <div className="relative">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="appearance-none bg-transparent pr-7 pl-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="">Toplu İşlemler</option>
              {!isTrashTab ? (
                <>
                  <option value="publish">Yayınla</option>
                  <option value="draft">Taslağa Al</option>
                  <option value="soft_delete">Sil (Çöp Kutusu)</option>
                </>
              ) : (
                <>
                  <option value="restore">Geri Yükle</option>
                  <option value="permanent_delete">Kalıcı Olarak Sil</option>
                </>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={applyBulk}
            disabled={deleting || !selected.length || !bulkAction}
            className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
              selected.length && bulkAction
                ? "bg-[#C98484] text-white shadow-xs hover:bg-[#A95E5E]"
                : "bg-slate-200/80 text-slate-400 opacity-60 cursor-not-allowed"
            }`}
          >
            {deleting ? "..." : "Uygula"}
          </button>
        </div>

        <div className="h-5 w-px bg-slate-200/80 hidden sm:block mx-0.5" />

        {/* Category Filter Dropdown */}
        <div className="relative">
          <select
            value={catFilter}
            onChange={(e) => {
              setCatFilter(e.target.value)
              setPage(1)
            }}
            className="appearance-none bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C98484] focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-semibold rounded-xl text-xs py-2 pl-3.5 pr-8 transition-all cursor-pointer shadow-2xs"
          >
            <option value="">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Brand / Collection Filter Dropdown */}
        <div className="relative">
          <select
            value={colFilter}
            onChange={(e) => {
              setColFilter(e.target.value)
              setPage(1)
            }}
            className="appearance-none bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C98484] focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-semibold rounded-xl text-xs py-2 pl-3.5 pr-8 transition-all cursor-pointer shadow-2xs"
          >
            <option value="">Tüm Markalar</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Type Filter Dropdown */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            className="appearance-none bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C98484] focus:ring-2 focus:ring-rose-500/20 text-slate-700 font-semibold rounded-xl text-xs py-2 pl-3.5 pr-8 transition-all cursor-pointer shadow-2xs"
          >
            <option value="">Tüm Tipler</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Reset Active Filters Button */}
        {(catFilter || colFilter || typeFilter || search) && (
          <button
            type="button"
            onClick={() => {
              setCatFilter("")
              setColFilter("")
              setTypeFilter("")
              setSearch("")
              setPage(1)
            }}
            className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 transition-all flex items-center gap-1 cursor-pointer border border-rose-200/60"
            title="Tüm Filtreleri Temizle"
          >
            <X className="w-3.5 h-3.5" />
            <span>Filtreleri Temizle</span>
          </button>
        )}

        {/* Search Input Box + Button */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center justify-end gap-2 min-w-[220px] ml-auto">
          <div className="relative w-full sm:w-52">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ürün ara..."
              className="w-full pl-3.5 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:border-[#C98484] focus:ring-2 focus:ring-rose-500/20 text-xs shadow-2xs transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[#C98484] text-white font-bold text-xs hover:bg-[#A95E5E] shadow-xs shadow-rose-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            Ara
          </button>
        </form>
      </div>

      {/* ── Products Table Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#C98484] border-t-transparent rounded-full animate-spin" />
            <span>Ürünler yükleniyor...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-sm text-slate-800">
              {isTrashTab ? "Çöp kutusu boş" : "Ürün bulunamadı"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isTrashTab
                ? "Silinen ürünler burada listelenir."
                : "Arama veya filtre kriterlerinize uyan ürün bulunmuyor."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500">
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selected.length === products.length && products.length > 0}
                      onChange={(e) => toggleAll(e.target.checked)}
                      className="rounded text-[#C98484] focus:ring-[#C98484]"
                    />
                  </th>
                  <th className="w-12 px-2 py-3"></th>
                  {renderSortHeader("title", "Ürün Adı")}
                  {renderSortHeader("sku", "SKU")}
                  {renderSortHeader("stock", "Stok")}
                  {renderSortHeader("price", "Fiyat")}
                  {renderSortHeader("category", "Kategori")}
                  {renderSortHeader("status", "Durum")}
                  {renderSortHeader("date", "Tarih")}
                  <th className="px-3 py-3 text-right font-semibold text-slate-500">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedProducts.map((p) => {
                  const sku = p.variants?.[0]?.sku || "—"
                  const price = formatPrice(p.variants)
                  const cats = p.categories?.map((c) => c.name).join(", ") || "—"
                  const isDeleted = p.deleted_at || p.status === "deleted"

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors group">
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selected.includes(p.id)}
                          onChange={() => toggleOne(p.id)}
                          className="rounded text-[#C98484] focus:ring-[#C98484]"
                        />
                      </td>

                      {/* Thumbnail */}
                      <td className="px-2 py-3">
                        {p.thumbnail ? (
                          <img
                            src={p.thumbnail}
                            alt={p.title}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 shadow-2xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                      </td>

                      {/* Product Title & Brand */}
                      <td className="px-3 py-3">
                        <div>
                          <Link
                            href={!isDeleted ? `/admin/urunler/${p.id}` : "#"}
                            className={`font-bold text-xs ${
                              isDeleted ? "text-slate-500 line-through" : "text-slate-900 hover:text-[#C98484]"
                            } transition-colors block`}
                          >
                            {p.title}
                          </Link>
                          <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">
                            {p.collection?.title || "—"}
                          </span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-3 py-3 font-semibold text-slate-500">{sku}</td>

                      {/* Stock */}
                      <td className="px-3 py-3 whitespace-nowrap">{renderStockStatus(p.variants)}</td>

                      {/* Price */}
                      <td className="px-3 py-3 font-bold text-slate-900 whitespace-nowrap">{price}</td>

                      {/* Category */}
                      <td className="px-3 py-3 font-medium text-slate-600 min-w-[180px]">
                        <div className="flex flex-wrap gap-1" title={cats}>{p.categories?.length ? p.categories.map(c => <span key={c.id} className="rounded-md border border-rose-100 bg-rose-50 px-2 py-1 text-[10px]">{c.name}</span>) : "—"}</div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                            isDeleted
                              ? "bg-rose-50 text-rose-700 border-rose-200/60"
                              : p.status === "published"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {isDeleted ? "Silindi" : STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3 text-slate-500 whitespace-nowrap font-medium">
                        {new Date(p.created_at).toLocaleDateString("tr-TR")}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {!isTrashTab ? (
                            <>
                              <Link
                                href={`/admin/urunler/${p.id}`}
                                title="Düzenle"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Link>
                              <button
                                type="button"
                                title="Çoğalt"
                                onClick={() => duplicateProduct(p.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <Link
                                href={`/urunler/${p.handle}`}
                                target="_blank"
                                title="Görüntüle"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <button
                                type="button"
                                title="Sil (Çöp Kutusu)"
                                onClick={() => handleSoftDelete(p.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                title="Geri Yükle"
                                onClick={() => handleRestore(p.id)}
                                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200/60"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Geri Yükle</span>
                              </button>
                              <button
                                type="button"
                                title="Kalıcı Olarak Sil"
                                onClick={() => handlePermanentDelete(p.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Footer ── */}
        <div className="p-3.5 bg-slate-50/50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <span>Toplam {total} ürün</span>
            <div className="flex items-center gap-1.5">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
                className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>kayıt göster</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
              if (
                pNum === 1 ||
                pNum === totalPages ||
                (pNum >= page - 1 && pNum <= page + 1)
              ) {
                return (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setPage(pNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      page === pNum
                        ? "bg-[#C98484] text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {pNum}
                  </button>
                )
              }
              if (pNum === 2 && page > 3) {
                return <span key="dots1" className="px-1 text-slate-400">...</span>
              }
              if (pNum === totalPages - 1 && page < totalPages - 2) {
                return <span key="dots2" className="px-1 text-slate-400">...</span>
              }
              return null
            })}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Ürünü Çöp Kutusu'na Taşı"
        message="Bu ürün Çöp Kutusu'na taşınacaktır. Dilediğiniz zaman 'Silinenler' sekmesinden geri yükleyebilirsiniz."
        confirmText={deleting ? "Taşınıyor..." : "Çöp Kutusu'na Taşı"}
        confirmDisabled={deleting}
        cancelText="Vazgeç"
        onConfirm={performSoftDelete}
        onCancel={() => {
          if (deleting) return
          setConfirmDeleteId(null)
          setDeleteRelatedMedia(false)
        }}
      >
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-left">
          <input
            type="checkbox"
            checked={deleteRelatedMedia}
            onChange={(event) => setDeleteRelatedMedia(event.target.checked)}
            className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
          />
          <span>
            <strong className="block text-xs text-slate-900">Ürün görsellerini medya çöp kutusuna taşı</strong>
            <span className="mt-1 block text-[11px] leading-4 text-slate-600">
              Küçük resim ve galeri dosyaları Silinenler bölümüne taşınır; ürün geri alındığında otomatik geri yüklenir. Başka ürün veya sayfalarda kullanılan ortak dosyalar korunur.
            </span>
          </span>
        </label>
      </ConfirmModal>

      <ConfirmModal
        isOpen={!!confirmPermanentId}
        title="Kalıcı Olarak Sil"
        message="Bu ürün veritabanından KALICI OLARAK silinecektir. Bu işlem geri ALINAMAZ. Devam etmek istiyor musunuz?"
        confirmText={deleting ? "Siliniyor..." : "Kalıcı Sil"}
        confirmDisabled={deleting}
        cancelText="Vazgeç"
        onConfirm={performPermanentDelete}
        onCancel={() => {
          if (deleting) return
          setConfirmPermanentId(null)
          setDeleteRelatedMedia(false)
        }}
      >
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-left">
          <input
            type="checkbox"
            checked={deleteRelatedMedia}
            onChange={(event) => setDeleteRelatedMedia(event.target.checked)}
            className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
          />
          <span>
            <strong className="block text-xs text-slate-900">Ürün görsellerini medya çöp kutusuna taşı</strong>
            <span className="mt-1 block text-[11px] leading-4 text-slate-600">
              Ürüne bağlı küçük resim ve galeri dosyaları Silinenler bölümüne taşınır. Ortak kullanılan dosyalar korunur.
            </span>
          </span>
        </label>
      </ConfirmModal>

      <ConfirmModal
        isOpen={confirmBulkDelete}
        title="Seçili Ürünleri Çöp Kutusu'na Taşı"
        message={`${selected.length} ürün Çöp Kutusu'na taşınacaktır.`}
        confirmText={deleting ? "Taşınıyor..." : "Tümünü Çöp Kutusu'na Taşı"}
        confirmDisabled={deleting}
        cancelText="Vazgeç"
        onConfirm={performBulkSoftDelete}
        onCancel={() => {
          if (deleting) return
          setConfirmBulkDelete(false)
          setDeleteRelatedMedia(false)
        }}
      >
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-left">
          <input
            type="checkbox"
            checked={deleteRelatedMedia}
            onChange={(event) => setDeleteRelatedMedia(event.target.checked)}
            className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
          />
          <span>
            <strong className="block text-xs text-slate-900">Seçili ürünlerin görsellerini medya çöp kutusuna taşı</strong>
            <span className="mt-1 block text-[11px] leading-4 text-slate-600">
              Küçük resimler ve galeri dosyaları Medya → Silinenler bölümüne taşınır; ürün geri alındığında otomatik geri yüklenir. Ortak dosyalar korunur.
            </span>
          </span>
        </label>
      </ConfirmModal>

      <ConfirmModal
        isOpen={confirmBulkPermanent}
        title="Seçili Ürünleri Kalıcı Olarak Sil"
        message={`${selected.length} ürünü veritabanından KALICI OLARAK silmek istediğinize emin misiniz? Bu işlem geri ALINAMAZ.`}
        confirmText={deleting ? "Siliniyor..." : "Tümünü Kalıcı Olarak Sil"}
        confirmDisabled={deleting}
        cancelText="Vazgeç"
        onConfirm={performBulkPermanentDelete}
        onCancel={() => {
          if (deleting) return
          setConfirmBulkPermanent(false)
          setDeleteRelatedMedia(false)
        }}
      >
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-left">
          <input
            type="checkbox"
            checked={deleteRelatedMedia}
            onChange={(event) => setDeleteRelatedMedia(event.target.checked)}
            className="mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
          />
          <span>
            <strong className="block text-xs text-slate-900">Seçili ürünlerin görsellerini medya çöp kutusuna taşı</strong>
            <span className="mt-1 block text-[11px] leading-4 text-slate-600">
              Görseller Medya → Silinenler bölümüne taşınır. Başka yerlerde kullanılan ortak dosyalar korunur.
            </span>
          </span>
        </label>
      </ConfirmModal>
    </div>
  )
}
