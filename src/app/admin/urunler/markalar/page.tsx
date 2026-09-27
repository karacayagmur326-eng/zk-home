"use client"

import React, { useEffect, useState } from "react"
import ConfirmModal from "../../components/ConfirmModal"
import ImagePickerField from "../../components/ImagePickerField"
import {
  Tag,
  Star,
  Calendar,
  Plus,
  Search,
  Edit3,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowUpDown,
  Eraser,
} from "lucide-react"

interface Brand {
  id: string
  title: string
  handle: string
  created_at?: string
  updated_at?: string
  metadata?: {
    description?: string
    logo_url?: string
    active?: boolean
    featured?: boolean
    sort_order?: number
  }
}

export default function BrandsPage() {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [sortOrder, setSortOrder] = useState<"az" | "za" | "newest" | "oldest">("az")
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [description, setDescription] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [active, setActive] = useState(true)
  const [featured, setFeatured] = useState(true)
  const [displayOrder, setDisplayOrder] = useState(0)

  function fetchBrands() {
    setLoading(true)
    fetch("/api/admin/collections")
      .then((r) => r.json())
      .then((d) => {
        setBrands(d.collections || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  function autoHandle(n: string) {
    return n
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
  }

  function handleNameChange(v: string) {
    setName(v)
    if (!editId) setHandle(autoHandle(v))
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Marka adı zorunludur.")
      return
    }
    setSaving(true)
    setError("")
    const existingMetadata = brands.find((brand) => brand.id === editId)?.metadata || {}
    const body = {
      title: name.trim(),
      handle: handle || autoHandle(name),
      metadata: {
        ...existingMetadata,
        description: description.trim(),
        logo_url: logoUrl,
        active,
        featured,
        sort_order: Number.isFinite(displayOrder) ? displayOrder : 0,
      },
    }
    const url = editId ? `/api/admin/collections/${editId}` : "/api/admin/collections"
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Bir hata oluştu.")
      setSaving(false)
      return
    }
    setName("")
    setHandle("")
    setDescription("")
    setLogoUrl("")
    setActive(true)
    setFeatured(true)
    setDisplayOrder(0)
    setEditId(null)
    setSaving(false)
    fetchBrands()
  }

  function performDelete() {
    if (!confirmDeleteId) return
    fetch(`/api/admin/collections/${confirmDeleteId}`, { method: "DELETE" }).then(() => {
      setConfirmDeleteId(null)
      fetchBrands()
    })
  }

  function startEdit(b: Brand) {
    setEditId(b.id)
    setName(b.title)
    setHandle(b.handle)
    setDescription(b.metadata?.description || "")
    setLogoUrl(b.metadata?.logo_url || "")
    setActive(b.metadata?.active !== false)
    setFeatured(b.metadata?.featured !== false)
    setDisplayOrder(Number(b.metadata?.sort_order) || 0)
    setError("")
  }

  function clearForm() {
    setEditId(null)
    setName("")
    setHandle("")
    setDescription("")
    setLogoUrl("")
    setActive(true)
    setFeatured(true)
    setDisplayOrder(0)
    setError("")
  }

  // Filter & Sort
  const filtered = brands.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.handle.toLowerCase().includes(search.toLowerCase())
  )

  const sortedBrands = [...filtered].sort((a, b) => {
    if (sortOrder === "az") return a.title.localeCompare(b.title, "tr")
    if (sortOrder === "za") return b.title.localeCompare(a.title, "tr")
    if (sortOrder === "newest")
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    if (sortOrder === "oldest")
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
    return 0
  })

  const latestUpdatedAt = brands.reduce((latest, brand) => {
    const timestamp = new Date(brand.updated_at || brand.created_at || 0).getTime()
    return Number.isFinite(timestamp) ? Math.max(latest, timestamp) : latest
  }, 0)

  // Color generator for brand initials
  const bgColors = ["bg-slate-900", "bg-[#C98484]", "bg-purple-600", "bg-emerald-600", "bg-blue-600"]

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">

      {/* 1. Top 3 Summary Cards (Mockup Birebir) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Toplam Marka */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-[#C98484] flex items-center justify-center border border-rose-100/60 shrink-0">
            <Tag className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Toplam Marka</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {brands.filter((brand) => brand.metadata?.featured !== false && brand.metadata?.active !== false).length}
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Sistemde kayıtlı toplam marka
            </span>
          </div>
        </div>

        {/* Card 2: Öne Çıkan Markalar */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100/60 shrink-0">
            <Star className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Öne Çıkan Markalar</span>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {brands.length}
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Öne çıkan marka sayısı
            </span>
          </div>
        </div>

        {/* Card 3: Son Güncelleme */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/60 shrink-0">
            <Calendar className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Son Güncelleme</span>
            <div className="text-sm font-extrabold text-slate-900 tracking-tight">
              {latestUpdatedAt
                ? new Date(latestUpdatedAt).toLocaleString("tr-TR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              En son yapılan güncelleme
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[360px_1fr] gap-6 items-start">
        {/* Left Column: Form Card */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus className="h-5 w-5 text-[#C98484] stroke-[3]" />
            <h2 className="text-base font-extrabold text-slate-900">
              {editId ? "Markayı Düzenle" : "Yeni Marka Ekle"}
            </h2>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
              {error}
            </div>
          )}

          <div className="space-y-4 text-xs font-bold text-slate-700">
            {/* Ad */}
            <div>
              <label className="block mb-1.5">Ad</label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Marka adı"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-slate-900 outline-none focus:border-[#C98484] focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block mb-1.5">Marka Açıklaması</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Marka kartında gösterilecek kısa açıklama"
                rows={4}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-slate-900 outline-none focus:border-[#C98484] focus:bg-white transition-all placeholder:text-slate-400 resize-y"
              />
            </div>

            <ImagePickerField
              label="Marka Logosu"
              value={logoUrl}
              onChange={setLogoUrl}
              helpText="PNG, SVG veya WEBP logo seçebilirsiniz. Şeffaf arka plan önerilir."
            />

            <div>
              <label className="block mb-1.5">Gösterim Sırası</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-slate-900 outline-none focus:border-[#C98484] focus:bg-white transition-all"
              />
            </div>

            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 cursor-pointer">
                <span>Marka aktif</span>
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-[#C98484]" />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 cursor-pointer">
                <span>Ana Markalarımız'da göster</span>
                <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 accent-[#C98484]" />
              </label>
            </div>

            {/* Kısaltma (URL slug) */}
            <div>
              <label className="block mb-1.5">Kısaltma (URL slug)</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="marka-adi"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-slate-900 outline-none focus:border-[#C98484] focus:bg-white transition-all placeholder:text-slate-400"
              />
              <p className="text-[11px] font-semibold text-slate-400 mt-1.5">
                URL'de kullanılacak, web dostu bir adres oluşturulur.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full h-11 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>{editId ? "Güncelle" : "Yeni Marka Ekle"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={clearForm}
                className="w-full h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eraser className="h-4 w-4 text-slate-400" />
                <span>{editId ? "İptal" : "Temizle"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Brands Table Card */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
          {/* Table Header Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              {/* Search Box */}
              <div className="flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Marka ara..."
                  className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-xs font-semibold text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Total Badges */}
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-extrabold shrink-0">
                Toplam {filtered.length} marka
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-extrabold shrink-0 border border-emerald-200">
                Aktif {filtered.filter((brand) => brand.metadata?.active !== false).length}
              </span>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  style={{ paddingLeft: "34px" }}
                  className="h-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 outline-none focus:border-[#C98484] cursor-pointer"
                >
                  <option value="az">Sırala: A'dan Z'ye</option>
                  <option value="za">Sırala: Z'den A'ya</option>
                  <option value="newest">Sırala: En Yeni</option>
                  <option value="oldest">Sırala: En Eski</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="p-3.5">AD</th>
                  <th className="p-3.5">KISALTMA (SLUG)</th>
                  <th className="p-3.5 text-right">İŞLEMLER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400 font-semibold">
                      Markalar yükleniyor...
                    </td>
                  </tr>
                ) : sortedBrands.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400 font-semibold">
                      Kayıtlı marka bulunamadı.
                    </td>
                  </tr>
                ) : (
                  sortedBrands.map((b, idx) => {
                    const bgClass = bgColors[idx % bgColors.length]
                    const initial = (b.title || "M").charAt(0).toUpperCase()
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            {b.metadata?.logo_url ? (
                              <div className="h-9 w-14 rounded-lg border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0">
                                <img src={b.metadata.logo_url} alt="" className="max-h-full max-w-full object-contain" />
                              </div>
                            ) : (
                              <div
                                className={`h-9 w-9 rounded-full ${bgClass} text-white flex items-center justify-center font-black text-sm shrink-0 shadow-2xs`}
                              >
                                {initial}
                              </div>
                            )}
                            <span className="font-extrabold text-slate-900 text-sm">
                              {b.title}
                            </span>
                            {b.metadata?.featured !== false && b.metadata?.active !== false && (
                              <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">Öne çıkan</span>
                            )}
                            {b.metadata?.active === false && (
                              <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">Pasif</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-500 font-semibold">{b.handle}</td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(b)}
                              className="h-8 px-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                              <span>Düzenle</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(b.id)}
                              className="h-8 px-3 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              <span>Sil</span>
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

          {/* Footer Counter */}
          <div className="pt-2 text-xs font-semibold text-slate-400">
            1-{sortedBrands.length} / {sortedBrands.length} marka gösteriliyor
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Markayı Sil"
        message="Bu markayı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        onConfirm={performDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
