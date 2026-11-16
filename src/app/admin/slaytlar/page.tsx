"use client"

import React, { useState, useEffect, useRef } from "react"
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
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Check,
  Type,
  MousePointerClick,
  Sliders,
  Settings,
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

type TabType = "text" | "media" | "buttons" | "product" | "settings"

const FIELD_TAB_MAP: Record<string, TabType> = {
  badge_text: "text",
  heading_line1: "text",
  heading_line2: "text",
  heading_line3: "text",
  subheading: "text",
  button_text: "buttons",
  button_link: "buttons",
  button2_text: "buttons",
  button2_link: "buttons",
  product_title: "product",
  product_detail: "product",
  product_url: "product",
  image_url: "media",
  theme: "media",
  title: "settings",
  order_index: "settings",
}

function plainCopy(value: string | undefined) {
  return (value || "").split("|")[0].replace(/\*\*/g, "").trim()
}

// Form State Default
const EMPTY_SLIDER_FORM = {
  title: "",
  badge_text: "",
  heading_line1: "",
  heading_line2: "",
  heading_line3: "",
  subheading: "",
  image_url: "",
  button_text: "",
  button_link: "",
  button2_text: "",
  button2_link: "",
  product_title: "",
  product_detail: "",
  product_url: "",
  theme: "warm",
  is_active: true,
  order_index: 1,
}

export default function SlidersAdminPage() {
  const router = useRouter()
  const [sliders, setSliders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  // Layout View Mode: "tabs" (Kompakt) or "all" (Tümü Açık)
  const [viewMode, setViewMode] = useState<"tabs" | "all">("tabs")
  const [activeTab, setActiveTab] = useState<TabType>("text")
  const [highlightedField, setHighlightedField] = useState<string | null>(null)
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Selector data
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [pages, setPages] = useState<any[]>([])

  // Modal states
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Form State - Starts completely blank
  const [formData, setFormData] = useState<any>(EMPTY_SLIDER_FORM)

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
      badge_text: plainCopy(slider.badge_text) || "",
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
      ...EMPTY_SLIDER_FORM,
      order_index: sliders.length + 1,
    })
    setLinkType1("custom")
    setLinkType2("custom")
    setLinkTypeProduct("custom")
    setActiveTab("text")
  }

  // Click on visual preview text to jump to input
  const handleFieldClick = (field: string) => {
    const targetTab = FIELD_TAB_MAP[field] || "text"
    if (viewMode === "tabs" && activeTab !== targetTab) {
      setActiveTab(targetTab)
    }

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current)
    }
    setHighlightedField(field)

    setTimeout(() => {
      const el = document.getElementById(`field-${field}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        el.focus()
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.select?.()
        }
      }
    }, 80)

    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedField(null)
    }, 2500)
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
      badge_text: formData.badge_text?.trim() || null,
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

  // Helper for input highlighting on click-to-edit
  const getFieldHighlightClass = (fieldName: string) => {
    if (highlightedField === fieldName) {
      return "ring-4 ring-rose-400/80 border-[#C98484] bg-rose-50/50 shadow-md transition-all duration-300"
    }
    return "border-slate-300 bg-white focus:border-[#C98484] transition-all"
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
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

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-50 text-[#C98484] border border-rose-100">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Ana Sayfa Slider Vitrini
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Önizleme üzerindeki başlıklara ve butonlara tıklayarak doğrudan düzenleme alanına ulaşabilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Slayt Ekle</span>
          </button>
        </div>
      </div>

      {/* Grid: Left Slide List (4 cols) + Right Preview & Editor (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: SLIDE LIST (4 cols, sticky) */}
        <div className="lg:col-span-4 space-y-3 lg:sticky lg:top-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Yayındaki Slaytlar ({sliders.length})
            </h2>
            <span className="text-[10px] text-slate-400">Sıralama ana sayfaya yansır</span>
          </div>

          {loading ? (
            <div className="p-8 text-center rounded-2xl border border-slate-200 bg-white">
              <Loader2 className="w-5 h-5 animate-spin text-[#C98484] mx-auto" />
              <p className="mt-2 text-xs font-medium text-slate-500">Slaytlar yükleniyor...</p>
            </div>
          ) : sliders.length === 0 ? (
            <div className="p-6 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
              <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="mt-2 text-xs font-bold text-slate-700">Henüz slayt eklenmemiş.</p>
              <button
                type="button"
                onClick={handleAddNew}
                className="mt-3 px-3 py-1.5 bg-[#C98484] text-white rounded-lg text-xs font-bold"
              >
                İlk Slaytı Ekle
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
              {sliders.map((s, idx) => {
                const isSelected = selectedId === s.id
                const lines = (s.heading || "").split("\n").map(plainCopy)
                const displayHeading = lines.join(" ") || s.title || "İsimsiz Slayt"
                const activeTheme = THEMES.find((t) => t.id === s.theme) || THEMES[0]

                return (
                  <div
                    key={s.id}
                    onClick={() => handleEdit(s)}
                    className={`group relative rounded-2xl border p-3 transition-all cursor-pointer bg-white ${
                      isSelected
                        ? "border-[#C98484] shadow-md ring-2 ring-rose-200/50"
                        : "border-slate-200/80 hover:border-slate-300 hover:shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
                        {s.image_url ? (
                          <SmartImage
                            src={s.image_url}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 text-[8px] font-black bg-slate-900/80 text-white px-1 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Content info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider"
                            style={{
                              backgroundColor: `${activeTheme.accent}20`,
                              color: activeTheme.accent,
                            }}
                          >
                            {plainCopy(s.badge_text) || "ZK HOME"}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium">
                            • {activeTheme.name.split(" ")[0]}
                          </span>
                        </div>

                        <h3 className="mt-0.5 text-xs font-bold text-slate-900 truncate">
                          {displayHeading}
                        </h3>

                        <p className="text-[10px] text-slate-400 truncate">
                          {s.product_title ? `Ürün: ${s.product_title}` : s.title}
                        </p>

                        {/* Status bar */}
                        <div className="mt-2 flex items-center justify-between gap-1 border-t border-slate-100 pt-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleActive(s)
                            }}
                            className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                              s.is_active
                                ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                : "text-slate-400 bg-slate-100 hover:bg-slate-200"
                            }`}
                          >
                            {s.is_active ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                            <span>{s.is_active ? "Yayında" : "Gizli"}</span>
                          </button>

                          <div className="flex items-center gap-0.5">
                            {idx > 0 && (
                              <button
                                type="button"
                                title="Yukarı taşı"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveOrder(s, "up")
                                }}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              >
                                <ChevronUp className="w-3 h-3" />
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
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              title="Kopyala"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClone(s)
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              title="Sil"
                              onClick={(e) => {
                                e.stopPropagation()
                                setConfirmDeleteId(s.id)
                              }}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3 h-3" />
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

        {/* RIGHT COLUMN: PREVIEW & COMPACT FORM (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* 1. Live Interactive Preview Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Canlı Masaüstü Önizleme
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100/80">
                <MousePointerClick className="w-3.5 h-3.5 animate-bounce" />
                <span>Yazıya tıklayarak düzenleme alanına atlayabilirsiniz</span>
              </div>
            </div>

            <SliderPreview slider={livePreviewSlide} onFieldClick={handleFieldClick} />
          </div>

          {/* 2. Slide Edit Form (Compact & Tabbed) */}
          <form
            onSubmit={handleFormSubmit}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-5"
          >
            {/* Top Bar inside Form: Slide Name, Active status & Save button */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C98484]">
                  {selectedId ? "Slayt Düzenleniyor" : "Yeni Slayt"}
                </span>
                <h2 className="text-base font-black text-slate-900 leading-tight">
                  {formData.title || "İsimsiz Slayt"}
                </h2>
              </div>

              <div className="flex items-center gap-2.5">
                <label className="flex items-center gap-1.5 cursor-pointer bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="accent-[#C98484] rounded"
                  />
                  <span>Yayında</span>
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saving ? "Kaydediliyor..." : "Kaydet"}</span>
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION BAR */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
              {/* Tab Pills */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {[
                  { id: "text", label: "Rozet & Başlık", icon: Type },
                  { id: "media", label: "Görsel & Tema", icon: ImageIcon },
                  { id: "buttons", label: "Butonlar", icon: Sliders },
                  { id: "product", label: "Öne Çıkan Ürün", icon: Sparkles },
                  { id: "settings", label: "Yayın & Sıra", icon: Settings },
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = viewMode === "tabs" && activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setViewMode("tabs")
                        setActiveTab(tab.id as TabType)
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-rose-50 text-[#C98484] border border-rose-200/80 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* View Toggle (Kompakt / Tümü) */}
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "tabs" ? "all" : "tabs")}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                {viewMode === "tabs" ? "Tümünü Genişlet ⤢" : "Sekmeli Görünüm (Kompakt) ⤡"}
              </button>
            </div>

            {/* TAB 1: ROZET VE BAŞLIK */}
            {(viewMode === "all" || activeTab === "text") && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                {viewMode === "all" && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
                    <Type className="w-4 h-4 text-[#C98484]" />
                    <span>Rozet, Başlık ve Açıklama</span>
                  </div>
                )}

                {/* Rozet */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Üst Rozet Metni (Badge)
                    </label>
                    <span className="text-[10px] text-slate-400">Sliderın en üstündeki hap etiket</span>
                  </div>
                  <input
                    id="field-badge_text"
                    type="text"
                    value={formData.badge_text || ""}
                    onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                    placeholder="Örn: ZK HOME veya SİYAH & ALTIN"
                    className={`w-full px-3 py-2 text-xs border rounded-xl font-semibold uppercase ${getFieldHighlightClass("badge_text")}`}
                  />
                </div>

                {/* 3 Satırlı Başlık */}
                <div className="rounded-xl border border-slate-200/80 p-3 bg-slate-50/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Editoryal Başlık (3 Satır)
                    </label>
                    <span className="text-[10px] text-[#C98484] font-bold">
                      ★ 2. Satır otomatik vurgu rengi ve animasyonlu alt çizgi alır
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                        1. Satır (Giriş)
                      </span>
                      <input
                        id="field-heading_line1"
                        type="text"
                        value={formData.heading_line1 || ""}
                        onChange={(e) => setFormData({ ...formData, heading_line1: e.target.value })}
                        placeholder="Evinize"
                        className={`w-full px-3 py-1.5 text-xs border rounded-xl font-semibold ${getFieldHighlightClass("heading_line1")}`}
                      />
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-[#C98484] mb-1 uppercase">
                        2. Satır (★ Vurgulu Satır)
                      </span>
                      <input
                        id="field-heading_line2"
                        type="text"
                        value={formData.heading_line2 || ""}
                        onChange={(e) => setFormData({ ...formData, heading_line2: e.target.value })}
                        placeholder="İyi Gelen"
                        className={`w-full px-3 py-1.5 text-xs border-2 border-rose-300 rounded-xl font-black text-slate-900 ${getFieldHighlightClass("heading_line2")}`}
                      />
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">
                        3. Satır (Bitiş)
                      </span>
                      <input
                        id="field-heading_line3"
                        type="text"
                        value={formData.heading_line3 || ""}
                        onChange={(e) => setFormData({ ...formData, heading_line3: e.target.value })}
                        placeholder="Dokunuşlar"
                        className={`w-full px-3 py-1.5 text-xs border rounded-xl font-semibold ${getFieldHighlightClass("heading_line3")}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Açıklama */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Açıklama Metni (Alt Başlık)
                  </label>
                  <textarea
                    id="field-subheading"
                    rows={2}
                    value={formData.subheading || ""}
                    onChange={(e) => setFormData({ ...formData, subheading: e.target.value })}
                    placeholder="Dekorasyon, sofra ve ev tekstili için ilham veren kategorileri keşfedin."
                    className={`w-full px-3 py-2 text-xs border rounded-xl font-medium leading-relaxed ${getFieldHighlightClass("subheading")}`}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: GÖRSEL VE TEMA */}
            {(viewMode === "all" || activeTab === "media") && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                {viewMode === "all" && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 pt-2">
                    <ImageIcon className="w-4 h-4 text-[#C98484]" />
                    <span>Arka Plan Sahne Görseli & Tema</span>
                  </div>
                )}

                {/* Görsel */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Arka Plan Sahne Fotoğrafı
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      id="field-image_url"
                      type="text"
                      value={formData.image_url || ""}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="/hero/vase-room-complete-v1.webp veya https://..."
                      className={`flex-1 px-3 py-1.5 text-xs border rounded-xl font-medium ${getFieldHighlightClass("image_url")}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowMediaModal(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Medya Kütüphanesi</span>
                    </button>
                  </div>
                </div>

                {/* Tema Kartları */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Atmosfer Teması (Renk ve Vurgu Stili)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {THEMES.map((theme) => {
                      const isSelected = formData.theme === theme.id
                      return (
                        <div
                          key={theme.id}
                          onClick={() => setFormData({ ...formData, theme: theme.id })}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-[#C98484] bg-rose-50/25 shadow-2xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="h-3 w-3 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: theme.accent }}
                            />
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#C98484]" />}
                          </div>
                          <h4 className="mt-1 text-xs font-bold text-slate-900">{theme.name}</h4>
                          <p className="mt-0.5 text-[9px] text-slate-500 leading-snug">
                            {theme.desc}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EYLEM BUTONLARI */}
            {(viewMode === "all" || activeTab === "buttons") && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                {viewMode === "all" && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 pt-2">
                    <Sliders className="w-4 h-4 text-[#C98484]" />
                    <span>Eylem Butonları (CTA)</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. Buton */}
                  <div className="rounded-xl border border-slate-200/80 p-3 bg-slate-50/40 space-y-2.5">
                    <span className="text-xs font-extrabold text-slate-800 block">
                      1. Buton (Birincil / Dolgulu)
                    </span>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Buton Metni
                      </label>
                      <input
                        id="field-button_text"
                        type="text"
                        value={formData.button_text || ""}
                        onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                        placeholder="Dekorasyonu Keşfet"
                        className={`w-full px-3 py-1.5 text-xs border rounded-xl font-medium ${getFieldHighlightClass("button_text")}`}
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
                          <option value="custom">Özel</option>
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
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Buton */}
                  <div className="rounded-xl border border-slate-200/80 p-3 bg-slate-50/40 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 block">
                        2. Buton (İkincil / Saydam)
                      </span>
                      <span className="text-[9px] text-slate-400">İsteğe bağlı</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Buton Metni (Boş bırakılırsa gizlenir)
                      </label>
                      <input
                        id="field-button2_text"
                        type="text"
                        value={formData.button2_text || ""}
                        onChange={(e) => setFormData({ ...formData, button2_text: e.target.value })}
                        placeholder="Mutfak & Sofra"
                        className={`w-full px-3 py-1.5 text-xs border rounded-xl font-medium ${getFieldHighlightClass("button2_text")}`}
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
                          <option value="custom">Özel</option>
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
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: ÖNE ÇIKARILAN ÜRÜN KARTI */}
            {(viewMode === "all" || activeTab === "product") && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                {viewMode === "all" && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 pt-2">
                    <Sparkles className="w-4 h-4 text-[#C98484]" />
                    <span>Öne Çıkarılan Ürün / Koleksiyon Çubuğu</span>
                  </div>
                )}

                <div className="rounded-xl border border-slate-200/80 p-3 bg-slate-50/50 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ürün / Koleksiyon Başlığı
                      </label>
                      <input
                        id="field-product_title"
                        type="text"
                        value={formData.product_title || ""}
                        onChange={(e) => setFormData({ ...formData, product_title: e.target.value })}
                        placeholder="Örn: Ağaç Dalı Vazo Serisi"
                        className={`w-full px-3 py-1.5 text-xs border rounded-xl font-bold ${getFieldHighlightClass("product_title")}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Alt Detay / Vurgu Metni
                      </label>
                      <input
                        id="field-product_detail"
                        type="text"
                        value={formData.product_detail || ""}
                        onChange={(e) => setFormData({ ...formData, product_detail: e.target.value })}
                        placeholder="Örn: İki boy, birbiriyle uyumlu bir sunum."
                        className={`w-full px-3 py-1.5 text-xs border rounded-xl font-medium ${getFieldHighlightClass("product_detail")}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
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
                        <option value="custom">Özel</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Ürün Bağlantısı (URL)
                      </label>
                      {linkTypeProduct === "product" ? (
                        <select
                          id="field-product_url"
                          value={formData.product_url || ""}
                          onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
                          className={`w-full px-2 py-1.5 text-xs border rounded-xl font-medium ${getFieldHighlightClass("product_url")}`}
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
                          id="field-product_url"
                          value={formData.product_url || ""}
                          onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
                          className={`w-full px-2 py-1.5 text-xs border rounded-xl font-medium ${getFieldHighlightClass("product_url")}`}
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
                          id="field-product_url"
                          value={formData.product_url || ""}
                          onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
                          className={`w-full px-2 py-1.5 text-xs border rounded-xl font-medium ${getFieldHighlightClass("product_url")}`}
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
                          id="field-product_url"
                          type="text"
                          value={formData.product_url || ""}
                          onChange={(e) => setFormData({ ...formData, product_url: e.target.value })}
                          placeholder="/urunler/agac-dali-desenli-ince-agizli-vazo-buyuk-boy"
                          className={`w-full px-2.5 py-1.5 text-xs border rounded-xl font-medium ${getFieldHighlightClass("product_url")}`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: YAYIN VE SIRALAMA */}
            {(viewMode === "all" || activeTab === "settings") && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                {viewMode === "all" && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100 pt-2">
                    <Settings className="w-4 h-4 text-[#C98484]" />
                    <span>Yayın & Sıralama Ayarları</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Yönetim Adı (Sadece panelde liste için görünür)
                    </label>
                    <input
                      id="field-title"
                      type="text"
                      value={formData.title || ""}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Örn: Ağaç Dalı Vazo Vitrini"
                      className={`w-full px-3 py-1.5 text-xs border rounded-xl font-medium ${getFieldHighlightClass("title")}`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sıralama İndeksi (Küçükten büyüğe)
                    </label>
                    <input
                      id="field-order_index"
                      type="number"
                      min={1}
                      max={99}
                      value={formData.order_index}
                      onChange={(e) =>
                        setFormData({ ...formData, order_index: Number(e.target.value) || 1 })
                      }
                      className={`w-24 px-3 py-1.5 text-xs border rounded-xl font-bold text-center ${getFieldHighlightClass("order_index")}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Action Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
                >
                  Yeni Boş Slayt Aç
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...EMPTY_SLIDER_FORM,
                      order_index: formData.order_index || sliders.length + 1,
                    })
                    showToast("Formdaki tüm alanlar temizlendi.", "info")
                  }}
                  className="px-3 py-1.5 rounded-xl border border-dashed border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors"
                  title="Formdaki tüm yazıları ve görselleri sıfırlar"
                >
                  Formu Temizle
                </button>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</span>
              </button>
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
