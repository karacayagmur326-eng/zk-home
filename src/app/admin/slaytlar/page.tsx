"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import SmartImage from "@components/common/SmartImage"
import ConfirmModal from "../components/ConfirmModal"
import MediaSelectorModal from "../components/MediaSelectorModal"
import SliderPreview from "./SliderPreview"
import {
  Plus,
  Trash2,
  Copy,
  Save,
  Pencil,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  ArrowRight,
  Check,
} from "@lib/icons"
import { Loader2 } from "lucide-react"
import { categoryPath } from "@lib/seo/category"

const SYSTEM_PAGE_OPTIONS = [
  { title: "Ana Sayfa", url: "/" },
  { title: "Mağaza (Tüm Ürünler)", url: "/magaza" },
  { title: "Dekorasyon", url: "/dekorasyon" },
  { title: "Mutfak & Sofra", url: "/mutfak-sofra" },
  { title: "Yapay Çiçek & Bitki", url: "/yapay-cicek-bitki" },
  { title: "Hakkımızda", url: "/hakkimizda" },
  { title: "İletişim", url: "/iletisim" },
  { title: "Blog", url: "/blog" },
]

const THEMES = [
  {
    id: "warm",
    name: "Sıcak Bej (Doğal)",
    desc: "Açık ve sıcak bej/mermer tonları, ahşap detaylar.",
    bg: "#f5eadc",
    text: "#332c27",
    accent: "#ac7965",
  },
  {
    id: "gold",
    name: "Siyah & Altın (Lüks)",
    desc: "Koyu siyah mermer zemin, zengin altın yansımalar.",
    bg: "#28221c",
    text: "#fff8ed",
    accent: "#e4bf7c",
  },
  {
    id: "butterfly",
    name: "Pastel Kelebek (Bahar)",
    desc: "Yumuşak pastel leylak/mor tonlar, zarif çiçek uyumu.",
    bg: "#f1e6d8",
    text: "#433a52",
    accent: "#817a9f",
  },
]

function plainCopy(value: string | undefined) {
  return (value || "").split("|")[0].replace(/\*\*/g, "").trim()
}

export default function SlidersAdminPage() {
  const router = useRouter()
  const [sliders, setSliders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  // Selector data
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [pages, setPages] = useState<any[]>([])

  // Modal states
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState<any>({
    title: "",
    badge_text: "ZK HOME",
    heading_line1: "Evinize",
    heading_line2: "İyi Gelen",
    heading_line3: "Dokunuşlar",
    subheading: "Dekorasyon, sofra ve ev tekstili için ilham veren kategorileri keşfedin.",
    image_url: "/hero/vase-room-complete-v1.webp",
    button_text: "Dekorasyonu Keşfet",
    button_link: "/dekorasyon",
    button2_text: "Mutfak & Sofra",
    button2_link: "/mutfak-sofra",
    product_title: "Ağaç Dalı Vazo Serisi",
    product_detail: "İki boy, birbiriyle uyumlu bir sunum.",
    product_url: "/urunler/agac-dali-desenli-ince-agizli-vazo-buyuk-boy",
    theme: "warm",
    is_active: true,
    order_index: 1,
  })

  // Link pickers state
  const [linkType1, setLinkType1] = useState<string>("page")
  const [linkType2, setLinkType2] = useState<string>("page")
  const [linkTypeProduct, setLinkTypeProduct] = useState<string>("product")

  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  function fetchSliders() {
    setLoading(true)
    fetch("/api/admin/sliders")
      .then((r) => {
        if (r.status === 401) {
          router.push("/admin")
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        const list = data.sliders || []
        setSliders(list)
        setLoading(false)
        if (list.length > 0 && !selectedId) {
          handleEdit(list[0])
        }
      })
      .catch(() => setLoading(false))
  }

  function fetchSelectors() {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error)

    fetch("/api/admin/products?limit=100")
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(console.error)

    fetch("/api/admin/site-pages")
      .then((r) => r.json())
      .then((data) => {
        const contentPages = (data.pages || []).map((page: any) => ({
          title: page.content?.title || page.title || page.handle,
          url: `/${page.content?.custom_slug || page.handle}`,
        }))
        const merged = [...SYSTEM_PAGE_OPTIONS, ...contentPages].filter(
          (p, idx, all) => all.findIndex((x) => x.url === p.url) === idx
        )
        setPages(merged)
      })
      .catch(console.error)
  }

  useEffect(() => {
    fetchSliders()
    fetchSelectors()
  }, [])

  const handleEdit = (slider: any) => {
    setSelectedId(slider.id)

    // Heading lines extraction
    const rawHeading = slider.heading || ""
    const lines = rawHeading.split("\n").map(plainCopy)
    const line1 = lines[0] || ""
    const line2 = lines[1] || ""
    const line3 = lines.slice(2).join(" ") || ""

    setFormData({
      title: slider.title || "",
      badge_text: plainCopy(slider.badge_text) || "ZK HOME",
      heading_line1: line1,
      heading_line2: line2,
      heading_line3: line3,
      subheading: plainCopy(slider.subheading) || "",
      image_url: slider.image_url || "",
      button_text: plainCopy(slider.button_text) || "",
      button_link: slider.button_link || "",
      button2_text: plainCopy(slider.button2_text) || "",
      button2_link: slider.button2_link || "",
      product_title: slider.product_title || "",
      product_detail: slider.product_detail || "",
      product_url: slider.product_url || "",
      theme: slider.theme || (slider.bg_color === "#28221c" || slider.bg_color === "#4E5457" ? "gold" : "warm"),
      is_active: slider.is_active !== false,
      order_index: slider.order_index || 1,
    })

    // Determine link types
    const b1 = slider.button_link || ""
    if (b1.startsWith("/urunler/")) setLinkType1("product")
    else if (b1.startsWith("/kategoriler/") || categories.some((c) => categoryPath(c) === b1)) setLinkType1("category")
    else if (pages.some((p) => p.url === b1)) setLinkType1("page")
    else setLinkType1("custom")

    const b2 = slider.button2_link || ""
    if (b2.startsWith("/urunler/")) setLinkType2("product")
    else if (b2.startsWith("/kategoriler/") || categories.some((c) => categoryPath(c) === b2)) setLinkType2("category")
    else if (pages.some((p) => p.url === b2)) setLinkType2("page")
    else setLinkType2("custom")

    const bp = slider.product_url || ""
    if (bp.startsWith("/urunler/")) setLinkTypeProduct("product")
    else if (bp.startsWith("/kategoriler/") || categories.some((c) => categoryPath(c) === bp)) setLinkTypeProduct("category")
    else if (pages.some((p) => p.url === bp)) setLinkTypeProduct("page")
    else setLinkTypeProduct("custom")
  }

  const handleAddNew = () => {
    setSelectedId(null)
    setFormData({
      title: `Yeni Slayt ${sliders.length + 1}`,
      badge_text: "YENİ KOLEKSİYON",
      heading_line1: "Yaşam Alanınıza",
      heading_line2: "Zarif",
      heading_line3: "Dokunuşlar",
      subheading: "Evinize şıklık ve huzur katan yeni koleksiyonumuzu hemen keşfedin.",
      image_url: "/hero/vase-room-complete-v1.webp",
      button_text: "Koleksiyonu Keşfet",
      button_link: "/magaza",
      button2_text: "",
      button2_link: "",
      product_title: "Öne Çıkan Seri",
      product_detail: "Özel tasarım detaylar.",
      product_url: "/magaza",
      theme: "warm",
      is_active: true,
      order_index: sliders.length + 1,
    })
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    // Construct multi-line heading
    const headingParts = [
      formData.heading_line1?.trim(),
      formData.heading_line2?.trim(),
      formData.heading_line3?.trim(),
    ].filter(Boolean)
    const combinedHeading = headingParts.join("\n")

    const payload = {
      title: formData.title?.trim() || formData.heading_line1 || "İsimsiz Slayt",
      badge_text: formData.badge_text?.trim() || "ZK HOME",
      heading: combinedHeading,
      subheading: formData.subheading?.trim() || null,
      description: formData.subheading?.trim() || null,
      image_url: formData.image_url?.trim() || null,
      button_text: formData.button_text?.trim() || null,
      button_link: formData.button_link?.trim() || null,
      button2_text: formData.button2_text?.trim() || null,
      button2_link: formData.button2_link?.trim() || null,
      product_title: formData.product_title?.trim() || null,
      product_detail: formData.product_detail?.trim() || null,
      product_url: formData.product_url?.trim() || null,
      theme: formData.theme || "warm",
      is_active: formData.is_active !== false,
      order_index: Number(formData.order_index) || 1,
      // Default fallbacks for safety
      button_color: "#44382f",
      button2_color: "#ffffff38",
      text_color: "#332c27",
      bg_color: formData.theme === "gold" ? "#28221c" : formData.theme === "butterfly" ? "#f1e6d8" : "#f5eadc",
    }

    const url = selectedId ? `/api/admin/sliders/${selectedId}` : "/api/admin/sliders"
    const method = selectedId ? "PUT" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        showToast(selectedId ? "Slayt başarıyla güncellendi!" : "Yeni slayt başarıyla eklendi!", "success")
        fetchSliders()
      } else {
        const data = await res.json()
        showToast("Hata oluştu: " + (data.error || "Bilinmeyen hata"), "error")
      }
    } catch (err: any) {
      showToast("Sunucu hatası: " + err.message, "error")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/sliders/${id}`, { method: "DELETE" })
      if (res.ok) {
        showToast("Slayt silindi.", "info")
        setConfirmDeleteId(null)
        if (selectedId === id) {
          setSelectedId(null)
        }
        fetchSliders()
      } else {
        showToast("Silinirken hata oluştu.", "error")
      }
    } catch (e: any) {
      showToast("Sunucu hatası: " + e.message, "error")
    }
  }

  async function handleClone(slider: any) {
    const payload = {
      ...slider,
      id: undefined,
      title: `${slider.title || ""} (Kopya)`,
      order_index: sliders.length + 1,
    }

    const res = await fetch("/api/admin/sliders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      showToast("Slayt kopyalandı!", "success")
      fetchSliders()
    }
  }

  async function handleToggleActive(slider: any) {
    const nextState = !slider.is_active
    const res = await fetch(`/api/admin/sliders/${slider.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...slider, is_active: nextState }),
    })
    if (res.ok) {
      showToast(nextState ? "Slayt yayına alındı." : "Slayt yayından kaldırıldı.", "info")
      fetchSliders()
    }
  }

  async function handleMoveOrder(slider: any, direction: "up" | "down") {
    const currentIdx = sliders.findIndex((s) => s.id === slider.id)
    if (currentIdx < 0) return
    const targetIdx = direction === "up" ? currentIdx - 1 : currentIdx + 1
    if (targetIdx < 0 || targetIdx >= sliders.length) return

    const targetSlider = sliders[targetIdx]
    const currentOrder = slider.order_index || currentIdx + 1
    const targetOrder = targetSlider.order_index || targetIdx + 1

    await Promise.all([
      fetch(`/api/admin/sliders/${slider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...slider, order_index: targetOrder }),
      }),
      fetch(`/api/admin/sliders/${targetSlider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...targetSlider, order_index: currentOrder }),
      }),
    ])

    showToast("Sıralama güncellendi.", "info")
    fetchSliders()
  }

  // Precomputed slider object for live preview
  const livePreviewSlide = {
    image_url: formData.image_url,
    badge_text: formData.badge_text,
    heading: [formData.heading_line1, formData.heading_line2, formData.heading_line3]
      .filter(Boolean)
      .join("\n"),
    subheading: formData.subheading,
    button_text: formData.button_text,
    button_link: formData.button_link,
    button2_text: formData.button2_text,
    button2_link: formData.button2_link,
    product_title: formData.product_title,
    product_detail: formData.product_detail,
    product_url: formData.product_url,
    theme: formData.theme,
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-bold flex items-center gap-2.5 transition-all transform animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : toast.type === "info"
                ? "bg-slate-900 border-slate-800 text-white"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-50 text-[#C98484] border border-rose-100">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Ana Sayfa Slider Vitrini
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Ana sayfadaki editoryal sahne vitrinini, arka plan görsellerini, rozetleri, vurgulu başlıkları ve ürün kartlarını buradan yönetin.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-rose-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Slayt Ekle</span>
        </button>
      </div>

      {/* Grid: Left List (1 col) + Right Editor & Preview (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: SLIDE LIST (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Yayındaki Slaytlar ({sliders.length})
            </h2>
            <span className="text-[11px] text-slate-400">Sıralama ana sayfaya yansır</span>
          </div>

          {loading ? (
            <div className="p-12 text-center rounded-3xl border border-slate-200 bg-white">
              <Loader2 className="w-6 h-6 animate-spin text-[#C98484] mx-auto" />
              <p className="mt-2 text-xs font-medium text-slate-500">Slaytlar yükleniyor...</p>
            </div>
          ) : sliders.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="mt-2 text-xs font-bold text-slate-700">Henüz slayt eklenmemiş.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Varsayılan 3 editoryal sahne gösteriliyor.</p>
              <button
                type="button"
                onClick={handleAddNew}
                className="mt-4 px-4 py-2 bg-[#C98484] text-white rounded-xl text-xs font-bold"
              >
                İlk Slaytı Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sliders.map((s, idx) => {
                const isSelected = selectedId === s.id
                const lines = (s.heading || "").split("\n").map(plainCopy)
                const displayHeading = lines.join(" ") || s.title || "İsimsiz Slayt"
                const activeTheme = THEMES.find((t) => t.id === s.theme) || THEMES[0]

                return (
                  <div
                    key={s.id}
                    onClick={() => handleEdit(s)}
                    className={`group relative rounded-3xl border p-4 transition-all cursor-pointer bg-white ${
                      isSelected
                        ? "border-[#C98484] shadow-md ring-2 ring-rose-200/50"
                        : "border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Thumbnail */}
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
                        {s.image_url ? (
                          <SmartImage
                            src={s.image_url}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 text-[9px] font-black bg-slate-900/80 text-white px-1.5 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Content info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider"
                            style={{
                              backgroundColor: `${activeTheme.accent}20`,
                              color: activeTheme.accent,
                            }}
                          >
                            {plainCopy(s.badge_text) || "ZK HOME"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium capitalize">
                            • {activeTheme.name.split(" ")[0]}
                          </span>
                        </div>

                        <h3 className="mt-1 text-xs font-bold text-slate-900 truncate">
                          {displayHeading}
                        </h3>

                        <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                          {s.product_title ? `Ürün: ${s.product_title}` : s.title}
                        </p>

                        {/* Status bar */}
                        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleActive(s)
                            }}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                              s.is_active
                                ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                : "text-slate-400 bg-slate-100 hover:bg-slate-200"
                            }`}
                          >
                            {s.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{s.is_active ? "Yayında" : "Gizli"}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                title="Yukarı taşı"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveOrder(s, "up")
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {idx < sliders.length - 1 && (
                              <button
                                type="button"
                                title="Aşağı taşı"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveOrder(s, "down")
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              title="Kopyala"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClone(s)
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Sil"
                              onClick={(e) => {
                                e.stopPropagation()
                                setConfirmDeleteId(s.id)
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: EDITOR & LIVE PREVIEW (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Live Preview Section */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Canlı Masaüstü Önizleme
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Ana sayfadaki gerçek editoryal sahne görünümü
              </span>
            </div>

            <SliderPreview slider={livePreviewSlide} />
          </div>

          {/* 2. Slide Edit Form */}
          <form
            onSubmit={handleFormSubmit}
            className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-soft space-y-8"
          >
            {/* Header of Form */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {selectedId ? "Slaytı Düzenle" : "Yeni Slayt Oluştur"}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {formData.title || "Bu slaytın görsel, metin, link ve tema ayarları"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="accent-[#C98484] rounded"
                  />
                  <span className="text-xs font-bold text-slate-700">Yayında</span>
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
                </button>
              </div>
            </div>

            {/* BÖLÜM 1: GÖRSEL VE TEMA */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-[#C98484] text-[10px] font-black">
                  1
                </span>
                <span>Arka Plan Sahne Görseli & Atmosfer Teması</span>
              </div>

              {/* Görsel Seçimi */}
              <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Arka Plan Sahne Fotoğrafı
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={formData.image_url || ""}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="/hero/vase-room-complete-v1.webp veya https://..."
                    className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:border-[#C98484] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMediaModal(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Medya Kütüphanesinden Seç</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tavsiye: 1440 × 720 px veya 1920 × 960 px oranında yüksek kaliteli mekân fotoğrafı.
                </p>
              </div>

              {/* Atmosfer / Tema Seçimi */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Atmosfer Teması (Renk ve Vurgu Stili)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {THEMES.map((theme) => {
                    const isSelected = formData.theme === theme.id
                    return (
                      <div
                        key={theme.id}
                        onClick={() => setFormData({ ...formData, theme: theme.id })}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#C98484] bg-rose-50/20 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: theme.accent }}
                          />
                          {isSelected && <Check className="w-4 h-4 text-[#C98484]" />}
                        </div>
                        <h4 className="mt-2 text-xs font-bold text-slate-900">{theme.name}</h4>
                        <p className="mt-0.5 text-[10px] text-slate-500 leading-relaxed">
                          {theme.desc}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* BÖLÜM 2: METİNLER & BAŞLIK */}
            <div className="space-y-5 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-[#C98484] text-[10px] font-black">
                  2
                </span>
                <span>Rozet, Başlık ve Açıklama</span>
              </div>

              {/* Slayt Yönetim Adı & Rozet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Yönetim Adı (Sadece panelde görünür)
                  </label>
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Örn: Ağaç Dalı Vazo Vitrini"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:border-[#C98484] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Üst Rozet Metni (Badge)
                  </label>
                  <input
                    type="text"
                    value={formData.badge_text || ""}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    placeholder="Örn: ZK HOME veya SİYAH & ALTIN"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:border-[#C98484] focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* 3 Satırlı Başlık */}
              <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Editoryal Başlık (3 Satır)
                  </label>
                  <span className="text-[11px] text-[#C98484] font-bold">
                    ★ 2. Satır otomatik olarak vurgulu renk ve alt çizgi animasyonu alır
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                      1. Satır (Giriş)
                    </span>
                    <input
                      type="text"
                      value={formData.heading_line1 || ""}
                      onChange={(e) => setFormData({ ...formData, heading_line1: e.target.value })}
                      placeholder="Evinize"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold focus:border-[#C98484] focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-[#C98484] mb-1 uppercase">
                      2. Satır (Vurgulu & Renkli)
                    </span>
                    <input
                      type="text"
                      value={formData.heading_line2 || ""}
                      onChange={(e) => setFormData({ ...formData, heading_line2: e.target.value })}
                      placeholder="İyi Gelen"
                      className="w-full px-3 py-2 text-xs border-2 border-rose-300 rounded-xl bg-rose-50/30 font-bold text-slate-900 focus:border-[#C98484] focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                      3. Satır (Bitiş)
                    </span>
                    <input
                      type="text"
                      value={formData.heading_line3 || ""}
                      onChange={(e) => setFormData({ ...formData, heading_line3: e.target.value })}
                      placeholder="Dokunuşlar"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold focus:border-[#C98484] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Açıklama Metni */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Açıklama Metni (Alt Başlık)
                </label>
                <textarea
                  rows={2}
                  value={formData.subheading || ""}
                  onChange={(e) => setFormData({ ...formData, subheading: e.target.value })}
                  placeholder="Dekorasyon, sofra ve ev tekstili için ilham veren kategorileri keşfedin."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:border-[#C98484] focus:outline-none leading-relaxed"
                />
              </div>
            </div>

            {/* BÖLÜM 3: EYLEM BUTONLARI */}
            <div className="space-y-5 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-[#C98484] text-[10px] font-black">
                  3
                </span>
                <span>Eylem Butonları (CTA)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 1. Buton */}
                <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/40 space-y-3">
                  <span className="text-xs font-extrabold text-slate-800 block">
                    1. Buton (Birincil / Dolgulu Buton)
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Buton Metni
                    </label>
                    <input
                      type="text"
                      value={formData.button_text || ""}
                      onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      placeholder="Dekorasyonu Keşfet"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:border-[#C98484] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Tür
                      </label>
                      <select
                        value={linkType1}
                        onChange={(e) => {
                          setLinkType1(e.target.value)
                          setFormData({ ...formData, button_link: "" })
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-bold"
                      >
                        <option value="page">Sayfa</option>
                        <option value="category">Kategori</option>
                        <option value="product">Ürün</option>
                        <option value="custom">Özel URL</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Hedef Bağlantı
                      </label>
                      {linkType1 === "page" ? (
                        <select
                          value={formData.button_link || ""}
                          onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                        >
                          <option value="">Sayfa seçin...</option>
                          {pages.map((p) => (
                            <option key={p.url} value={p.url}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      ) : linkType1 === "category" ? (
                        <select
                          value={formData.button_link || ""}
                          onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                        >
                          <option value="">Kategori seçin...</option>
                          {categories.map((c) => (
                            <option key={c.id} value={categoryPath(c)}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : linkType1 === "product" ? (
                        <select
                          value={formData.button_link || ""}
                          onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                        >
                          <option value="">Ürün seçin...</option>
                          {products.map((p) => (
                            <option key={p.id} value={`/urunler/${p.handle}`}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formData.button_link || ""}
                          onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                          placeholder="/dekorasyon"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Buton */}
                <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 block">
                      2. Buton (İkincil / Saydam Buton)
                    </span>
                    <span className="text-[10px] text-slate-400">İsteğe bağlı</span>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Buton Metni (Boş bırakılırsa gizlenir)
                    </label>
                    <input
                      type="text"
                      value={formData.button2_text || ""}
                      onChange={(e) => setFormData({ ...formData, button2_text: e.target.value })}
                      placeholder="Mutfak & Sofra"
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:border-[#C98484] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Tür
                      </label>
                      <select
                        value={linkType2}
                        onChange={(e) => {
                          setLinkType2(e.target.value)
                          setFormData({ ...formData, button2_link: "" })
                        }}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-bold"
                      >
                        <option value="page">Sayfa</option>
                        <option value="category">Kategori</option>
                        <option value="product">Ürün</option>
                        <option value="custom">Özel URL</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Hedef Bağlantı
                      </label>
                      {linkType2 === "page" ? (
                        <select
                          value={formData.button2_link || ""}
                          onChange={(e) => setFormData({ ...formData, button2_link: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                        >
                          <option value="">Sayfa seçin...</option>
                          {pages.map((p) => (
                            <option key={p.url} value={p.url}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      ) : linkType2 === "category" ? (
                        <select
                          value={formData.button2_link || ""}
                          onChange={(e) => setFormData({ ...formData, button2_link: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                        >
                          <option value="">Kategori seçin...</option>
                          {categories.map((c) => (
                            <option key={c.id} value={categoryPath(c)}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : linkType2 === "product" ? (
                        <select
                          value={formData.button2_link || ""}
                          onChange={(e) => setFormData({ ...formData, button2_link: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                        >
                          <option value="">Ürün seçin...</option>
                          {products.map((p) => (
                            <option key={p.id} value={`/urunler/${p.handle}`}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formData.button2_link || ""}
                          onChange={(e) => setFormData({ ...formData, button2_link: e.target.value })}
                          placeholder="/mutfak-sofra"
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BÖLÜM 4: SOL ALT ÖNE ÇIKARILAN ÜRÜN KARTI */}
            <div className="space-y-4 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-50 text-[#C98484] text-[10px] font-black">
                  4
                </span>
                <span>Öne Çıkarılan Ürün / Koleksiyon Çubuğu</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sliderın sol altında dikey çizgiyle ayrılan şık ürün veya koleksiyon bağlantısı.
              </p>

              <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ürün / Koleksiyon Başlığı
                    </label>
                    <input
                      type="text"
                      value={formData.product_title || ""}
                      onChange={(e) => setFormData({ ...formData, product_title: e.target.value })}
                      placeholder="Örn: Ağaç Dalı Vazo Serisi"
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-semibold focus:border-[#C98484] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alt Detay / Vurgu Metni
                    </label>
                    <input
                      type="text"
                      value={formData.product_detail || ""}
                      onChange={(e) => setFormData({ ...formData, product_detail: e.target.value })}
                      placeholder="Örn: İki boy, birbiriyle uyumlu bir sunum."
                      className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium focus:border-[#C98484] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Bağlantı Türü
                    </label>
                    <select
                      value={linkTypeProduct}
                      onChange={(e) => {
                        setLinkTypeProduct(e.target.value)
                        setFormData({ ...formData, product_url: "" })
                      }}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-bold"
                    >
                      <option value="product">Ürün</option>
                      <option value="category">Kategori</option>
                      <option value="page">Sayfa</option>
                      <option value="custom">Özel URL</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Ürün Bağlantısı (URL)
                    </label>
                    {linkTypeProduct === "product" ? (
                      <select
                        value={formData.product_url || ""}
                        onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                      >
                        <option value="">Ürün seçin...</option>
                        {products.map((p) => (
                          <option key={p.id} value={`/urunler/${p.handle}`}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    ) : linkTypeProduct === "category" ? (
                      <select
                        value={formData.product_url || ""}
                        onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                      >
                        <option value="">Kategori seçin...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={categoryPath(c)}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : linkTypeProduct === "page" ? (
                      <select
                        value={formData.product_url || ""}
                        onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                      >
                        <option value="">Sayfa seçin...</option>
                        {pages.map((p) => (
                          <option key={p.url} value={p.url}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.product_url || ""}
                        onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
                        placeholder="/urunler/agac-dali-desenli-ince-agizli-vazo-buyuk-boy"
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* BÖLÜM 5: SIRALAMA VE KAYDET */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 pt-6">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700">Sıralama İndeksi:</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={formData.order_index}
                  onChange={(e) =>
                    setFormData({ ...formData, order_index: Number(e.target.value) || 1 })
                  }
                  className="w-20 px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-bold text-center"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors"
                >
                  Vazgeç / Yeni
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Media Selector Modal */}
      <MediaSelectorModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onSelect={(url) => {
          setFormData((prev: any) => ({ ...prev, image_url: url }))
          setShowMediaModal(false)
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmDeleteId)}
        title="Slaytı Sil"
        message="Bu slaytı silmek istediğinizden emin misiniz? Slayt ana sayfa vitrininden kaldırılacaktır."
        confirmText="Evet, Sil"
        cancelText="Vazgeç"
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
