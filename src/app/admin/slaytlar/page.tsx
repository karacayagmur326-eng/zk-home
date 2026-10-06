"use client"
import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import ConfirmModal from "../components/ConfirmModal"
import MediaSelectorModal from "../components/MediaSelectorModal"
import IconPickerModal from "../components/IconPickerModal"
import HeroSlider from "@modules/home/components/hero-slider"
import { AppIcon, Wrench, Trash2, Pencil, Copy, Plus, Save, Image as ImageIcon } from "@lib/icons"
import { categoryPath } from "@lib/seo/category"

// SVG Icons matching backend sliders page
function DynamicIcon({ name, className = "w-4 h-4 text-[#C98484]", style }: { name: string; className?: string; style?: React.CSSProperties }) {
  return <AppIcon name={name} fallback="check" className={className} style={style} />

  /* Legacy SVG cases retained temporarily as dead code for a low-risk visual migration. */
  switch (name) {
    case "bolt":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      )
    case "gear":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    case "shield":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      )
    case "sun":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      )
    case "battery":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.75v3h-.75v-3zM3 7.5h15a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 15V9a1.5 1.5 0 011.5-1.5z" />
        </svg>
      )
    case "case":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 18.4V14.15m16.5 0c0-1.22-.821-2.278-2.02-2.533a12.947 12.947 0 00-10.96 0c-1.199.255-2.02 1.313-2.02 2.533m16.5 0V8.25c0-.621-.504-1.125-1.125-1.125H16.5m-3 0V4.875A1.125 1.125 0 0012.375 3.75h-2.25A1.125 1.125 0 009 4.875V7.125m3 0H9" />
        </svg>
      )
    case "star":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.173-.439.817-.439.99 0l3.024 7.684 8.243.684c.48.04.673.633.313.953l-6.19 5.507 1.83 8.15c.107.476-.412.852-.822.584l-7.398-4.83-7.397 4.83c-.41.268-.93-.108-.822-.584l1.83-8.15-6.19-5.507c-.36-.32-.167-.913.313-.953l8.243-.684 3.024-7.684z" />
        </svg>
      )
    case "wrench":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75a4.5 4.5 0 01-4.822 4.492l-4.148 4.148v2.793a3 3 0 01-.879 2.121l-1.586 1.586a1.5 1.5 0 01-2.122-2.122l1.586-1.586a3 3 0 012.121-.879h2.793l4.148-4.148A4.5 4.5 0 0121.75 6.75z" />
        </svg>
      )
    case "drill":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 6h9.5l1.5 2v3.5l-1.5 1H8.5v6.5h3.5v2H5.5v-2h1v-6.5H5V6z M16 8h2v3.5h-2V8z M18 9.75l4 .5-4 .5M20 9v1.5 M8 10h1.5v1.5H8z" />
        </svg>
      )
    case "hammer":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 12.5L20.5 6.5 M17.5 9.5L19 8 M14.5 3.5L11.5 6.5 M16.5 1.5l3 3 M11.5 6.5l-3.5-3.5 2-2 1.5 1.5 M7 16l-5 5 M5 14L2 17" />
        </svg>
      )
    case "screwdriver":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 20a2.5 2.5 0 003.5-3.5l-2.5-2.5A2.5 2.5 0 001.5 17.5L4 20z M7.5 16.5l8-8 M15.5 8.5l3.5-3.5 1.5 1.5-3.5 3.5" />
        </svg>
      )
    case "plug":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12a3 3 0 003 3h0a3 3 0 003-3V6H9v6z M10 6V3 M14 6V3 M12 15v5a2 2 0 002 2h4" />
        </svg>
      )
    case "speed":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a6 6 0 100-12 6 6 0 000 12z M12 12l3.5-3.5 M6 12h2 M16 12h2 M12 6v2 M12 16v2" />
        </svg>
      )
    case "brushless":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 019 9c0 2.5-1 4.5-2.5 6M12 21a9 9 0 01-9-9c0-2.5 1-4.5 2.5-6M12 8a4 4 0 100 8 4 4 0 000-8z M14 12l2 2" />
        </svg>
      )
    case "battery-bolt":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.75v3h-.75v-3zM3 7.5h15a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5H3A1.5 1.5 0 011.5 15V9a1.5 1.5 0 011.5-1.5z M11 10l-2 2.5h3L10 15" />
        </svg>
      )
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className} style={style}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )
  }
}

// Spectrum Color Picker Component
interface ColorPickerPopoverProps {
  color: string
  onChange: (color: string) => void
  pickerId: string
  activePicker: string | null
  setActivePicker: (id: string | null) => void
  label?: string
}

function ColorPickerPopover({ color, onChange, pickerId, activePicker, setActivePicker, label }: ColorPickerPopoverProps) {
  const isOpen = activePicker === pickerId
  const displayColor = color || "#FFFFFF"
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const presets = [
    "#C98484", "#1A1A1A", "#FFFFFF", "#C98484", "#3B82F6", "#10B981", "#FBBF24",
    "#8B5CF6", "#EC4899", "#6B7280", "#000000", "#111827", "#374151"
  ]

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gradientH = ctx.createLinearGradient(0, 0, canvas.width, 0)
    gradientH.addColorStop(0, '#ff0000')
    gradientH.addColorStop(0.17, '#ffff00')
    gradientH.addColorStop(0.33, '#00ff00')
    gradientH.addColorStop(0.5, '#00ffff')
    gradientH.addColorStop(0.67, '#0000ff')
    gradientH.addColorStop(0.83, '#ff00ff')
    gradientH.addColorStop(1, '#ff0000')
    ctx.fillStyle = gradientH
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const gradientV = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradientV.addColorStop(0, 'rgba(255,255,255,1)')
    gradientV.addColorStop(0.5, 'rgba(255,255,255,0)')
    gradientV.addColorStop(0.5, 'rgba(0,0,0,0)')
    gradientV.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = gradientV
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [isOpen])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.max(0, Math.min(canvas.width - 1, e.clientX - rect.left))
    const y = Math.max(0, Math.min(canvas.height - 1, e.clientY - rect.top))

    const imgData = ctx.getImageData(x, y, 1, 1).data
    const hex = '#' + [imgData[0], imgData[1], imgData[2]].map(val => val.toString(16).padStart(2, '0')).join('').toUpperCase()
    onChange(hex)
  }

  return (
    <div style={{ position: "relative", display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setActivePicker(isOpen ? null : pickerId)
        }}
        className="w-8 h-8 rounded border border-gray-300 cursor-pointer flex-shrink-0 transition-transform hover:scale-105"
        style={{ backgroundColor: displayColor }}
        title={label || "Renk Seçin"}
      />
      <input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#FFFFFF"
        className="w-full border border-gray-200 rounded px-2 h-8 text-xs font-mono font-bold uppercase bg-white focus:border-[#C98484] focus:outline-none"
      />
      {isOpen && (
        <div 
          className="absolute right-0 top-9 z-50 bg-white p-3 rounded-lg shadow-xl border border-gray-200 flex flex-col gap-2.5 w-[220px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-[10px] font-bold text-gray-500 uppercase">Renk Seçin (HEX)</div>
          <canvas 
            ref={canvasRef}
            width={196}
            height={120}
            onClick={handleCanvasClick}
            className="rounded border border-gray-200 cursor-crosshair"
          />
          <div className="border-t border-gray-100 pt-2">
            <div className="text-[9px] font-bold text-gray-400 uppercase mb-1.5">HIZLI RENKLER</div>
            <div className="flex gap-1.5 flex-wrap">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChange(p)}
                  className="w-5 h-5 rounded border border-gray-200 cursor-pointer transition-transform hover:scale-110 flex-shrink-0"
                  style={{ backgroundColor: p }}
                  title={p}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActivePicker(null)}
            className="w-full mt-1.5 py-1 text-[10px] font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors cursor-pointer"
          >
            Tamam
          </button>
        </div>
      )}
    </div>
  )
}

const SLIDER_FONT_OPTIONS = [
  { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans (Önerilen)" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Barlow Condensed", label: "Barlow Condensed" },
  { value: "Inter", label: "Inter" },
  { value: "Arial", label: "Arial" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
  { value: "Courier New", label: "Courier New" },
]

const SLIDER_WEIGHT_OPTIONS = [300, 400, 500, 600, 700, 800, 900]

const SYSTEM_PAGE_OPTIONS = [
  { title: "Ana Sayfa", url: "/" },
  { title: "Mağaza", url: "/magaza" },
  { title: "Markalar", url: "/markalar" },
  { title: "Blog", url: "/blog" },
  { title: "Hakkımızda", url: "/hakkimizda" },
  { title: "İletişim", url: "/iletisim" },
]

function setDelimitedPart(
  value: string,
  index: number,
  nextValue: string,
  defaults: string[]
) {
  const parts = String(value || "").split("|")
  defaults.forEach((fallback, partIndex) => {
    if (!parts[partIndex]) parts[partIndex] = fallback
  })
  parts[index] = nextValue
  return parts.join("|")
}

function TypographySelectors({
  fontFamily,
  fontWeight,
  onFontFamilyChange,
  onFontWeightChange,
}: {
  fontFamily: string
  fontWeight: string
  onFontFamilyChange: (value: string) => void
  onFontWeightChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase">
        Font
        <select
          value={fontFamily}
          onChange={(event) => onFontFamilyChange(event.target.value)}
          className="h-7 min-w-[125px] rounded-lg border border-gray-300 bg-white px-1.5 text-[11px] font-semibold normal-case text-gray-800 outline-none focus:border-[#C98484]"
        >
          {SLIDER_FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>{font.label}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase">
        Kalınlık
        <select
          value={fontWeight}
          onChange={(event) => onFontWeightChange(event.target.value)}
          className="h-7 min-w-[78px] rounded-lg border border-gray-300 bg-white px-1.5 text-[11px] font-semibold normal-case text-gray-800 outline-none focus:border-[#C98484]"
        >
          {SLIDER_WEIGHT_OPTIONS.map((weight) => (
            <option key={weight} value={String(weight)}>{weight}</option>
          ))}
        </select>
      </label>
    </div>
  )
}


export default function SlidersPage() {
  const previewRef = useRef<HTMLDivElement>(null)
  const [previewHeight, setPreviewHeight] = useState(0)
  const router = useRouter()
  const [sliders, setSliders] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [pages, setPages] = useState<Array<{ title: string; url: string }>>(SYSTEM_PAGE_OPTIONS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const element = previewRef.current
    const parent = element?.parentElement
    const child = element?.firstElementChild as HTMLElement | null
    if (!element || !parent || !child) return
    const resize = () => {
      const height = child.offsetHeight
      const scale = parent.clientWidth / 1440
      element.style.transform = `scale(${scale})`
      parent.style.height = `${height * scale}px`
      setPreviewHeight(height)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(parent)
    observer.observe(child)
    resize()
    return () => observer.disconnect()
  }, [loading])
  const [saving, setSaving] = useState(false)
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)
  const [iconTarget, setIconTarget] = useState<"top_icon" | "feature_icon" | "right_icon">("top_icon")

  // Link Types helper state
  const [linkType1, setLinkType1] = useState("page")
  const [linkType2, setLinkType2] = useState("page")

  // Features list item edit states
  const [newFeatureText, setNewFeatureText] = useState("")
  const [newFeatureDesc, setNewFeatureDesc] = useState("")
  const [newFeatureIcon, setNewFeatureIcon] = useState("bolt")
  const [showAddFeature, setShowAddFeature] = useState(false)
  const [editingFeatureIdx, setEditingFeatureIdx] = useState<number | null>(null)

  const [newRightTitle, setNewRightTitle] = useState("")
  const [newRightDesc, setNewRightDesc] = useState("")
  const [newRightIcon, setNewRightIcon] = useState("battery")
  const [showAddRightFeature, setShowAddRightFeature] = useState(false)
  const [editingRightFeatureIdx, setEditingRightFeatureIdx] = useState<number | null>(null)

  const [newTopTitle, setNewTopTitle] = useState("")
  const [newTopIcon, setNewTopIcon] = useState("shield")
  const [showAddTopFeature, setShowAddTopFeature] = useState(false)
  const [editingTopFeatureIdx, setEditingTopFeatureIdx] = useState<number | null>(null)

  // Form State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({
    title: "",
    heading: "|#FFFFFF|70px|Plus Jakarta Sans|600",
    subheading: "|14px|Inter|400",
    description: "",
    badge_text: "|16px|Inter|600",
    badge_color: "#C98484",
    bg_color: "#111827",
    image_url: "",
    button_text: "Ürünleri İncele",
    button_link: "/magaza",
    button2_text: "Tüm Kampanyalar",
    button2_link: "/magaza",
    button_color: "#C98484",
    button2_color: "#1A1A1A",
    text_color: "#FFFFFF",
    features: [],
    right_features: [],
    top_bar_features: [
      { text: "2 YIL RESMİ GARANTİ", icon: "shield" },
      { text: "ÜCRETSİZ KARGO", icon: "truck" },
      { text: "7/24 DESTEK", icon: "headphones" }
    ],
    is_active: true,
    order_index: 1
  })

  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    const handleGlobalClick = () => setActiveColorPicker(null)
    window.addEventListener("click", handleGlobalClick)
    return () => window.removeEventListener("click", handleGlobalClick)
  }, [])

  function fetchSliders() {
    setLoading(true)
    fetch("/api/admin/sliders")
      .then((r) => {
        if (r.status === 401) { router.push("/admin"); return null }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        setSliders(data.sliders || [])
        setLoading(false)
        if (data.sliders?.length > 0 && !selectedId) {
          handleEdit(data.sliders[0])
        }
      })
      .catch(() => setLoading(false))
  }

  function fetchSelectors() {
    fetch("/api/admin/categories")
      .then(r => r.json())
      .then(data => setCategories(data.categories || []))
      .catch(console.error)

    fetch("/api/admin/products?limit=100")
      .then(r => r.json())
      .then(data => setProducts(data.products || []))
      .catch(console.error)

    fetch("/api/admin/site-pages")
      .then(r => r.json())
      .then(data => {
        const contentPages = (data.pages || []).map((page: any) => ({
          title: page.content?.title || page.title || page.handle,
          url: `/${page.content?.custom_slug || page.handle}`,
        }))
        const mergedPages = [...SYSTEM_PAGE_OPTIONS, ...contentPages].filter(
          (page, index, all) => all.findIndex(item => item.url === page.url) === index
        )
        setPages(mergedPages)
      })
      .catch(console.error)
  }

  useEffect(() => {
    fetchSliders()
    fetchSelectors()
  }, [])

  const handleEdit = (slider: any) => {
    setSelectedId(slider.id)
    
    let bottomFeatures: any[] = []
    try {
      if (slider.features) {
        const parsed = typeof slider.features === "string" ? JSON.parse(slider.features) : slider.features
        bottomFeatures = Array.isArray(parsed) ? parsed : []
      }
    } catch { bottomFeatures = [] }

    let rightFeaturesList: any[] = []
    try {
      if (slider.right_features) {
        const parsed = typeof slider.right_features === "string" ? JSON.parse(slider.right_features) : slider.right_features
        rightFeaturesList = Array.isArray(parsed) ? parsed : []
      }
    } catch { rightFeaturesList = [] }

    // Normalize formatting
    const normalizedBottom = bottomFeatures.map((feat: any) => {
      if (typeof feat === "string") return { text: feat, icon: "bolt", fontSize: "14px" }
      return { ...feat, fontSize: feat.fontSize || "14px" }
    })

    const normalizedRight = rightFeaturesList.map((feat: any) => {
      if (typeof feat === "object") {
        return {
          title: feat.title || "",
          desc: feat.desc || "",
          icon: feat.icon || "battery",
          fontSize: feat.fontSize || "14px"
        }
      }
      return feat
    })

    let parsedTop = []
    try {
      if (slider.top_bar_features) {
        const tVal = typeof slider.top_bar_features === "string" ? JSON.parse(slider.top_bar_features) : slider.top_bar_features
        parsedTop = Array.isArray(tVal) ? tVal : []
      }
    } catch (e) {
      parsedTop = []
    }

    setFormData({
      title: slider.title || "",
      heading: slider.heading || "",
      subheading: slider.subheading || "",
      description: slider.description || "",
      badge_text: slider.badge_text || "",
      badge_color: slider.badge_color || "#C98484",
      bg_color: slider.bg_color || "#111827",
      image_url: slider.image_url || "",
      button_text: slider.button_text || "",
      button_link: slider.button_link || "",
      button2_text: slider.button2_text || "",
      button2_link: slider.button2_link || "",
      button_color: slider.button_color || "#C98484",
      button2_color: slider.button2_color || "#1A1A1A",
      text_color: slider.text_color || "#FFFFFF",
      features: normalizedBottom,
      right_features: normalizedRight,
      top_bar_features: parsedTop,
      is_active: slider.is_active !== false,
      order_index: slider.order_index || 1
    })

    if (slider.button_link?.startsWith("/categories/") || slider.button_link?.startsWith("/kategoriler/") || categories.some((category) => categoryPath(category) === slider.button_link)) setLinkType1("category")
    else if (slider.button_link?.startsWith("/urunler/")) setLinkType1("product")
    else if (pages.some(page => page.url === slider.button_link)) setLinkType1("page")
    else setLinkType1("custom")

    if (slider.button2_link?.startsWith("/categories/") || slider.button2_link?.startsWith("/kategoriler/") || categories.some((category) => categoryPath(category) === slider.button2_link)) setLinkType2("category")
    else if (slider.button2_link?.startsWith("/urunler/")) setLinkType2("product")
    else if (pages.some(page => page.url === slider.button2_link)) setLinkType2("page")
    else setLinkType2("custom")
  }

  const resetForm = () => {
    setSelectedId(null)
    setEditingFeatureIdx(null)
    setEditingRightFeatureIdx(null)
    setEditingTopFeatureIdx(null)
    setFormData({
      title: "",
      heading: "|#FFFFFF|70px|Plus Jakarta Sans|600",
      subheading: "|14px|Inter|400",
      description: "",
      badge_text: "|16px|Inter|600",
      badge_color: "#C98484",
      bg_color: "#111827",
      image_url: "",
      button_text: "Ürünleri İncele",
      button_link: "/magaza",
      button2_text: "Tüm Kampanyalar",
      button2_link: "/magaza",
      button_color: "#C98484",
      button2_color: "#1A1A1A",
      text_color: "#FFFFFF",
      features: [],
      right_features: [],
      top_bar_features: [
        { text: "2 YIL RESMİ GARANTİ", icon: "shield" },
        { text: "ÜCRETSİZ KARGO", icon: "truck" },
        { text: "7/24 DESTEK", icon: "headphones" }
      ],
      is_active: true,
      order_index: sliders.length + 1
    })
    setLinkType1("page")
    setLinkType2("page")
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...formData,
      features: JSON.stringify(formData.features),
      right_features: JSON.stringify(formData.right_features),
      top_bar_features: JSON.stringify(formData.top_bar_features),
      order_index: Number(formData.order_index)
    }

    const url = selectedId ? `/api/admin/sliders/${selectedId}` : "/api/admin/sliders"
    const method = selectedId ? "PUT" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        showToast(selectedId ? "Değişiklikler başarıyla kaydedildi!" : "Yeni slider eklendi!", "success")
        fetchSliders()
      } else {
        const data = await res.json()
        showToast("Hata oluştu: " + data.error, "error")
      }
    } catch (err: any) {
      showToast("Sunucu hatası: " + err.message, "error")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setConfirmDeleteId(id)
  }

  async function handleClone(slider: any) {
    const payload = {
      ...slider,
      id: undefined,
      title: `${slider.title || ""} (Kopya)`,
      order_index: sliders.length + 1
    }

    const res = await fetch("/api/admin/sliders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    if (res.ok) {
      showToast("Slider kopyalandı!", "success")
      fetchSliders()
    }
  }

  async function handleInlineSave(slider: any, newTitle?: string, newOrder?: number) {
    const payload = {
      ...slider,
      title: newTitle !== undefined ? newTitle : slider.title,
      order_index: newOrder !== undefined ? newOrder : slider.order_index
    }

    try {
      await fetch(`/api/admin/sliders/${slider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      fetchSliders()
      showToast("Slider listesi güncellendi!", "success")
    } catch (err: any) {
      showToast("Güncelleme hatası: " + err.message, "error")
    }
  }

  const addFeature = () => {
    if (!newFeatureText.trim()) return
    const newFeat = { 
      text: `${newFeatureText.trim()} ${newFeatureDesc.trim() ? `(${newFeatureDesc.trim()})` : ""}`,
      icon: newFeatureIcon,
      fontSize: (formData.features && formData.features[0]?.fontSize) || "14px"
    }
    
    if (editingFeatureIdx !== null) {
      const next = [...formData.features]
      next[editingFeatureIdx] = newFeat
      setFormData({ ...formData, features: next })
      setEditingFeatureIdx(null)
    } else {
      setFormData({ ...formData, features: [...formData.features, newFeat] })
    }
    setNewFeatureText("")
    setNewFeatureDesc("")
    setNewFeatureIcon("bolt")
    setShowAddFeature(false)
  }

  const removeFeature = (idx: number) => {
    const next = [...formData.features]
    next.splice(idx, 1)
    setFormData({ ...formData, features: next })
  }

  const addRightFeature = () => {
    if (!newRightTitle.trim() || !newRightDesc.trim()) return
    const newFeat = { 
      title: newRightTitle.trim(), 
      desc: newRightDesc.trim(), 
      icon: newRightIcon,
      fontSize: (formData.right_features && formData.right_features[0]?.fontSize) || "14px"
    }

    if (editingRightFeatureIdx !== null) {
      const next = [...formData.right_features]
      next[editingRightFeatureIdx] = newFeat
      setFormData({ ...formData, right_features: next })
      setEditingRightFeatureIdx(null)
    } else {
      setFormData({ ...formData, right_features: [...formData.right_features, newFeat] })
    }
    setNewRightTitle("")
    setNewRightDesc("")
    setNewRightIcon("battery")
    setShowAddRightFeature(false)
  }

  const addTopFeature = () => {
    if (!newTopTitle.trim()) return
    const newFeat = { 
      text: newTopTitle.trim(),
      icon: newTopIcon
    }
    
    if (editingTopFeatureIdx !== null) {
      const next = [...formData.top_bar_features]
      next[editingTopFeatureIdx] = newFeat
      setFormData({ ...formData, top_bar_features: next })
      setEditingTopFeatureIdx(null)
    } else {
      setFormData({ ...formData, top_bar_features: [...(formData.top_bar_features || []), newFeat] })
    }
    setNewTopTitle("")
    setNewTopIcon("shield")
    setShowAddTopFeature(false)
  }

  const handleDragEnd = async (result: any) => { }

  const removeRightFeature = (idx: number) => {
    const next = [...formData.right_features]
    next.splice(idx, 1)
    setFormData({ ...formData, right_features: next })
  }

  const renderHeading = (text: string, highlightColor?: string, textColor?: string) => {
    if (!text) return null
    const lines = text.split("\n")
    return lines.map((lineWithColor, lineIdx) => {
      const lineParts = lineWithColor.split("|")
      const lineText = lineParts[0] || ""
      const lineColor = lineParts[1] || textColor || "#FFFFFF"
      const rawSize = lineParts[2] || "70px"
      const sizeNum = rawSize.replace(/[^0-9]/g, "") || "70"
      const lineSize = `${sizeNum}px`
      const parts = lineText.split("**")
      const highlight = highlightColor || formData.badge_color || formData.button_color || "#C98484"
      return (
        <div key={lineIdx} className={lineIdx > 0 ? "mt-1 font-semibold" : "font-semibold"} style={{ color: lineColor, fontSize: lineSize, lineHeight: 0.98 }}>
          {parts.map((part, i) => i % 2 === 1 ? <span key={i} style={{ color: highlight }} className="font-semibold">{part}</span> : part)}
        </div>
      )
    })
  }

  const badgeParts = String(formData.badge_text || "").split("|")
  const firstHeadingParts = String(formData.heading || "").split("\n")[0]?.split("|") || []
  const descriptionParts = String(formData.subheading || "").split("|")
  const badgeFontFamily = badgeParts[2] || "Inter"
  const badgeFontWeight = badgeParts[3] || "600"
  const headingFontFamily = firstHeadingParts[3] || "Plus Jakarta Sans"
  const headingFontWeight = firstHeadingParts[4] || "600"
  const descriptionFontFamily = descriptionParts[2] || "Inter"
  const descriptionFontWeight = descriptionParts[3] || "400"

  const updateAllHeadingTypography = (partIndex: 3 | 4, value: string) => {
    setFormData((current: any) => ({
      ...current,
      heading: String(current.heading || "")
        .split("\n")
        .map((line) =>
          setDelimitedPart(
            line,
            partIndex,
            value,
            ["", "#FFFFFF", "70px", "Plus Jakarta Sans", "600"]
          )
        )
        .join("\n"),
    }))
  }

  return (
    <div className="text-left font-sans text-gray-800 w-full max-w-full relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .slider-preview-heading {
          font-family: var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
          font-weight: 600 !important;
          letter-spacing: 0 !important;
          line-height: 0.98 !important;
          font-stretch: normal !important;
        }
        .content-container {
          width: 100% !important;
          max-width: 1440px !important;
          margin-left: auto !important;
          margin-right: auto !important;
          padding-left: 1rem !important;
          padding-right: 1rem !important;
        }
        .slider-editor-form {
          font-size: 11px;
        }
        .slider-editor-form label {
          font-size: 9px !important;
          line-height: 1.2;
        }
        .slider-editor-form input,
        .slider-editor-form select,
        .slider-editor-form textarea,
        .slider-editor-form button {
          font-size: 11px;
        }
        @media (min-width: 768px) {
          .content-container {
            padding-left: 4rem !important;
            padding-right: 4rem !important;
          }
        }
        
        @keyframes screwBadge {
          0% {
            opacity: 0;
            transform: rotate(-12deg) scale(0.95) translateY(8px);
          }
          100% {
            opacity: 1;
            transform: rotate(0deg) scale(1) translateY(0);
          }
        }
        
        @keyframes drillHeading {
          0% {
            opacity: 0;
            transform: translateY(-20px);
            filter: blur(8px);
          }
          50% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
          70% {
            transform: translateY(-2px);
          }
          85% {
            transform: translateY(1px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes screwFeature {
          0% {
            opacity: 0;
            transform: rotate(-8deg) translateX(-15px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: rotate(0deg) translateX(0) scale(1);
          }
        }
        
        @keyframes rightFeatureDrill {
          0% {
            opacity: 0;
            transform: translateX(30px);
          }
          85% {
            transform: translateX(-3px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes nailButton {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      ` }} />

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 1000,
          padding: "12px 24px", borderRadius: 10, color: "#fff", fontWeight: 600,
          background: toast.type === "success" ? "#10b981" : toast.type === "error" ? "#ef4444" : "#3b82f6",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        }}>
          {toast.message}
        </div>
      )}

      <div className="w-full">
        
        {/* Header */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
          <button
            onClick={resetForm}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-[#C98484] px-3 py-2 text-[11px] font-bold text-white shadow transition-colors hover:bg-[#d85204]"
          >
            <span>+</span> Yeni Slider Ekle
          </button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsMediaModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[11px] font-bold text-[#C98484] hover:bg-rose-50"
            >
              <ImageIcon className="h-3.5 w-3.5" /> Görseli Değiştir
            </button>
            {formData.image_url && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, image_url: "" })}
                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] font-bold text-red-600 hover:bg-red-50"
              >
                Kaldır
              </button>
            )}
            <span className="mx-1 h-6 w-px bg-gray-200" />
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[11px] font-bold text-gray-600 hover:bg-gray-50"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              form="slider-editor-form"
              disabled={saving}
              className="rounded-lg bg-[#C98484] px-4 py-2 text-[11px] font-extrabold text-white shadow-sm hover:bg-[#d85204] disabled:opacity-60"
            >
              {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
          </div>
        </div>

        {/* Modern 2-Column Slider Editor */}
        <div className="w-full">
          <form id="slider-editor-form" onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ── LEFT COLUMN: Sticky Live Preview & Media Card (lg:col-span-5) ── */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
              
              {/* Canlı Önizleme Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-gray-800">Canlı Önizleme</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">1440 × {previewHeight || "…"} px · Ölçekli önizleme</span>
                </div>

                <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-900 shadow-inner">
                  <div
                    style={{ width: "1440px", transformOrigin: "top left", pointerEvents: "none" }}
                    ref={previewRef}
                  >
                    <HeroSlider
                      initialSliders={[{
                        id: selectedId || "slider-preview",
                        badge_text: formData.badge_text,
                        badge_color: formData.badge_color,
                        heading: formData.heading,
                        subheading: formData.subheading,
                        description: formData.description,
                        bg_color: formData.bg_color,
                        image_url: formData.image_url,
                        button_text: formData.button_text,
                        button_link: formData.button_link || "#",
                        button_color: formData.button_color,
                        button2_text: formData.button2_text,
                        button2_link: formData.button2_link || "#",
                        button2_color: formData.button2_color,
                        text_color: formData.text_color,
                        top_bar_color: formData.top_bar_color,
                        top_bar_features: typeof formData.top_bar_features === "string" ? formData.top_bar_features : JSON.stringify(formData.top_bar_features || []),
                        features: typeof formData.features === "string" ? formData.features : JSON.stringify(formData.features || []),
                        right_features: typeof formData.right_features === "string" ? formData.right_features : JSON.stringify(formData.right_features || []),
                      }]}
                    />
                  </div>
                </div>
              </div>

              {/* Slider Görseli & Yayın Ayarları Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-800">Görsel & Yayın Ayarları</span>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200/80">
                  {formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt="Slider Görseli"
                      className="h-14 w-24 object-cover rounded-lg border border-gray-200 shrink-0 bg-white"
                    />
                  ) : (
                    <div className="h-14 w-24 rounded-lg border border-dashed border-gray-300 bg-white flex items-center justify-center text-gray-400 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <span className="text-xs font-bold text-gray-800 block truncate">
                      {formData.image_url ? formData.image_url.split("/").pop() : "Görsel seçilmedi"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsMediaModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-[#C98484] text-white text-xs font-bold hover:bg-[#d85204] transition-colors shrink-0 cursor-pointer"
                      >
                        {formData.image_url ? "Görseli Değiştir" : "Görsel Seç"}
                      </button>
                      {formData.image_url && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: "" })}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold border border-red-200 transition-colors shrink-0 cursor-pointer"
                        >
                          Kaldır
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Order Row */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                    <label htmlFor="is-active" className="text-xs font-bold text-gray-700 cursor-pointer">Sitede Yayınla:</label>
                    <input
                      type="checkbox"
                      id="is-active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-[#C98484] rounded focus:ring-[#C98484] cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                    <label htmlFor="slider-order" className="text-xs font-bold text-gray-700">Sıra No:</label>
                    <input
                      id="slider-order"
                      type="number"
                      min={0}
                      value={formData.order_index}
                      onChange={(e) => setFormData({ ...formData, order_index: Number(e.target.value) || 0 })}
                      className="w-16 h-8 text-center text-xs font-bold rounded-lg border border-gray-300 bg-white focus:border-[#C98484] outline-none"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN: Structured Form Cards (lg:col-span-7) ── */}
            <div className="lg:col-span-7 space-y-4">

              {/* BAŞLIK (KÜÇÜK) / ROZET */}
              <div className="col-span-12 rounded-lg border border-gray-200 bg-gray-50/50 p-3 xl:col-span-4">
                <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">BAŞLIK (KÜÇÜK) / ROZET</label>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <input 
                      type="text" 
                      value={(formData.badge_text || "").split("|")[0] || ""} 
                      maxLength={50}
                      onChange={e => setFormData({
                        ...formData,
                        badge_text: setDelimitedPart(
                          formData.badge_text,
                          0,
                          e.target.value,
                          ["", "16px", "Inter", "600"]
                        ),
                      })}
                      placeholder="YENİ NESİL GÜÇ"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-[#C98484] focus:outline-none text-xs pr-12 font-medium bg-white shadow-sm"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-gray-400 font-bold">{((formData.badge_text || "").split("|")[0] || "").length}/50</span>
                  </div>
                  <TypographySelectors
                    fontFamily={badgeFontFamily}
                    fontWeight={badgeFontWeight}
                    onFontFamilyChange={(value) => setFormData({
                      ...formData,
                      badge_text: setDelimitedPart(formData.badge_text, 2, value, ["", "16px", "Inter", "600"]),
                    })}
                    onFontWeightChange={(value) => setFormData({
                      ...formData,
                      badge_text: setDelimitedPart(formData.badge_text, 3, value, ["", "16px", "Inter", "600"]),
                    })}
                  />
                  <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 py-1 bg-white shadow-sm flex-shrink-0">
                    <span className="text-xs font-bold text-gray-600 select-none">Boyut:</span>
                    <input
                      type="text"
                      placeholder="16"
                      value={(formData.badge_text || "").split("|")[1] ? parseInt((formData.badge_text || "").split("|")[1], 10) : ""}
                      onChange={e => {
                        const valClean = e.target.value.replace(/[^0-9]/g, "")
                        const sizeStr = valClean ? `${valClean}px` : ""
                        setFormData({
                          ...formData,
                          badge_text: setDelimitedPart(
                            formData.badge_text,
                            1,
                            sizeStr,
                            ["", "16px", "Inter", "600"]
                          ),
                        })
                      }}
                      className="w-10 text-xs font-bold text-gray-900 text-center focus:outline-none border border-gray-200 focus:border-[#C98484] rounded bg-gray-50 py-0.5"
                    />
                    <span className="text-xs font-bold text-gray-600 select-none">px</span>
                  </div>
                  <div className="flex-shrink-0">
                    <ColorPickerPopover
                      color={formData.badge_color || "#C98484"}
                      onChange={(val) => setFormData({ ...formData, badge_color: val })}
                      pickerId="badge"
                      activePicker={activeColorPicker}
                      setActivePicker={setActiveColorPicker}
                      label="Rozet Rengi"
                    />
                  </div>
                </div>
              </div>

              {/* BAŞLIK SATIRLARI */}
              <div className="col-span-12 rounded-lg border border-gray-200 bg-gray-50/50 p-3 xl:col-span-8">
                <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">BAŞLIK SATIRLARI (Sarı vurgu için **kelime** yazın)</label>
                <div className="mb-2 rounded-xl border border-gray-200 bg-gray-50/70 p-2">
                  <TypographySelectors
                    fontFamily={headingFontFamily}
                    fontWeight={headingFontWeight}
                    onFontFamilyChange={(value) => updateAllHeadingTypography(3, value)}
                    onFontWeightChange={(value) => updateAllHeadingTypography(4, value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {(formData.heading || "").split("\n").map((lineWithColor: string, lineIdx: number, linesArray: string[]) => {
                    const parts = lineWithColor.split("|")
                    const text = parts[0] || ""
                    const color = parts[1] || "#FFFFFF"
                    const size = parts[2] || "70px"
                    const fontFamily = parts[3] || headingFontFamily
                    const fontWeight = parts[4] || headingFontWeight
                    
                    return (
                      <div key={lineIdx} className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
                        <input 
                          type="text" 
                          value={text} 
                          maxLength={100}
                          onChange={e => {
                            const newLines = [...linesArray]
                            newLines[lineIdx] = `${e.target.value}|${color}|${size}|${fontFamily}|${fontWeight}`
                            setFormData({ ...formData, heading: newLines.join("\n") })
                          }}
                          placeholder={`Başlık Satırı ${lineIdx + 1}`}
                          className="flex-1 min-w-[200px] px-3 py-1.5 border border-gray-300 rounded-lg focus:border-[#C98484] focus:outline-none text-xs font-medium bg-white shadow-sm"
                        />
                        <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 py-1 bg-white shadow-sm flex-shrink-0">
                          <span className="text-xs font-bold text-gray-600 select-none">Boyut:</span>
                          <input
                            type="text"
                            placeholder="70"
                            value={size ? parseInt(size, 10) : ""}
                            onChange={e => {
                              const valClean = e.target.value.replace(/[^0-9]/g, "")
                              const newLines = [...linesArray]
                              const sizeStr = valClean ? `${valClean}px` : ""
                              newLines[lineIdx] = `${text}|${color}|${sizeStr}|${fontFamily}|${fontWeight}`
                              setFormData({ ...formData, heading: newLines.join("\n") })
                            }}
                            className="w-10 text-xs font-bold text-gray-900 text-center focus:outline-none border border-gray-200 focus:border-[#C98484] rounded bg-gray-50 py-0.5"
                          />
                          <span className="text-xs font-bold text-gray-600 select-none">px</span>
                        </div>
                        <div className="flex-shrink-0">
                          <ColorPickerPopover
                            color={color}
                            onChange={(val) => {
                              const newLines = [...linesArray]
                              newLines[lineIdx] = `${text}|${val}|${size}|${fontFamily}|${fontWeight}`
                              setFormData({ ...formData, heading: newLines.join("\n") })
                            }}
                            pickerId={`line-${lineIdx}`}
                            activePicker={activeColorPicker}
                            setActivePicker={setActiveColorPicker}
                            label="Satır Rengi"
                          />
                        </div>
                        {linesArray.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => {
                              const newLines = [...linesArray]
                              newLines.splice(lineIdx, 1)
                              setFormData({ ...formData, heading: newLines.join("\n") })
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 font-bold border border-gray-200 hover:border-red-300 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center cursor-pointer h-[32px] w-[32px] flex-shrink-0 text-xs"
                            title="Satırı Sil"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )
                  })}
                  <button 
                    type="button" 
                    onClick={() => {
                      const currentLines = (formData.heading || "").split("\n")
                      if (currentLines.length < 5) {
                        setFormData({ ...formData, heading: formData.heading + `\nYeni Satır|#FFFFFF|70px|${headingFontFamily}|${headingFontWeight}` })
                      }
                    }}
                    className="text-[11px] font-bold text-[#C98484] hover:text-[#d85204] flex items-center gap-1 mt-0.5 border-none bg-transparent cursor-pointer w-fit"
                  >
                    + Yeni Başlık Satırı Ekle
                  </button>
                </div>
              </div>

              {/* AÇIKLAMA */}
              <div className="col-span-12 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase">AÇIKLAMA</label>
                  <div className="flex items-center gap-2">
                    <TypographySelectors
                      fontFamily={descriptionFontFamily}
                      fontWeight={descriptionFontWeight}
                      onFontFamilyChange={(value) => setFormData({
                        ...formData,
                        subheading: setDelimitedPart(formData.subheading, 2, value, ["", "14px", "Inter", "400"]),
                      })}
                      onFontWeightChange={(value) => setFormData({
                        ...formData,
                        subheading: setDelimitedPart(formData.subheading, 3, value, ["", "14px", "Inter", "400"]),
                      })}
                    />
                    <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 py-1 bg-white shadow-sm flex-shrink-0">
                      <span className="text-xs font-bold text-gray-600 select-none">Boyut:</span>
                      <input
                        type="text"
                        placeholder="14"
                        value={(formData.subheading || "").split("|")[1] ? parseInt((formData.subheading || "").split("|")[1], 10) : ""}
                        onChange={e => {
                          const valClean = e.target.value.replace(/[^0-9]/g, "")
                          const sizeStr = valClean ? `${valClean}px` : ""
                          setFormData({
                            ...formData,
                            subheading: setDelimitedPart(
                              formData.subheading,
                              1,
                              sizeStr,
                              ["", "14px", "Inter", "400"]
                            ),
                          })
                        }}
                        className="w-10 text-xs font-bold text-gray-900 text-center focus:outline-none border border-gray-200 focus:border-[#C98484] rounded bg-gray-50 py-0.5"
                      />
                      <span className="text-xs font-bold text-gray-600 select-none">px</span>
                    </div>
                    <div className="flex-shrink-0">
                      <ColorPickerPopover
                        color={formData.text_color || "#FFFFFF"}
                        onChange={(val) => setFormData({ ...formData, text_color: val })}
                        pickerId="desc"
                        activePicker={activeColorPicker}
                        setActivePicker={setActiveColorPicker}
                        label="Yazı Rengi"
                      />
                    </div>
                  </div>
                </div>
                <div className="relative flex">
                  <textarea 
                    value={(formData.subheading || "").split("|")[0] || ""} 
                    maxLength={200}
                    rows={2}
                    onChange={e => {
                      setFormData({
                        ...formData,
                        subheading: setDelimitedPart(
                          formData.subheading,
                          0,
                          e.target.value,
                          ["", "14px", "Inter", "400"]
                        ),
                      })
                    }}
                    placeholder="Ürün açıklamasını buraya yazın..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#C98484] focus:outline-none text-xs pr-14 resize-none font-medium bg-white shadow-sm"
                  />
                  <span className="absolute right-2.5 bottom-2.5 text-[10px] text-gray-400 font-bold">{((formData.subheading || "").split("|")[0] || "").length}/200</span>
                </div>
              </div>

              {/* BUTON 1 & BUTON 2 METİN VE LİNKLERİ */}
              <div className="col-span-12 grid grid-cols-1 gap-3 xl:grid-cols-2">
                {/* Buton 1 */}
                <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5 md:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">Buton 1 Metni</label>
                    <input 
                      type="text"
                      value={formData.button_text || ""} 
                      onChange={e => setFormData({ ...formData, button_text: e.target.value })}
                      placeholder="Ürünleri İncele"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-[#C98484] focus:outline-none text-xs font-medium bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Link Tipi</label>
                    <select 
                      value={linkType1}
                      onChange={e => {
                        setLinkType1(e.target.value)
                        setFormData({ ...formData, button_link: "" })
                      }}
                      className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-bold bg-white"
                    >
                      <option value="page">Sayfa Seç</option>
                      <option value="product">Ürün Seç</option>
                      <option value="category">Kategori Seç</option>
                      <option value="custom">Özel Bağlantı / Link</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Link / Yönlendirme</label>
                    {linkType1 === "page" ? (
                      <select
                        value={formData.button_link || ""}
                        onChange={e => setFormData({ ...formData, button_link: e.target.value })}
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-medium bg-white"
                      >
                        <option value="">Sayfa seçin...</option>
                        {pages.map((page) => (
                          <option key={page.url} value={page.url}>{page.title}</option>
                        ))}
                      </select>
                    ) : linkType1 === "category" ? (
                      <select
                        value={formData.button_link || ""}
                        onChange={e => setFormData({ ...formData, button_link: e.target.value })}
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-medium bg-white"
                      >
                        <option value="">Kategori Seçin...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={categoryPath(c)}>{c.name} ({c.handle})</option>
                        ))}
                      </select>
                    ) : linkType1 === "product" ? (
                      <select
                        value={formData.button_link || ""}
                        onChange={e => setFormData({ ...formData, button_link: e.target.value })}
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-medium bg-white"
                      >
                        <option value="">Ürün Seçin...</option>
                        {products.map((p) => (
                          <option key={p.id} value={`/urunler/${p.handle}`}>{p.title} ({p.handle})</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text"
                        value={formData.button_link || ""} 
                        onChange={e => setFormData({ ...formData, button_link: e.target.value })}
                        placeholder="/magaza"
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-medium bg-white"
                      />
                    )}
                  </div>
                </div>

                {/* Buton 2 */}
                <div className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5 md:grid-cols-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1 uppercase">Buton 2 Metni</label>
                    <input 
                      type="text"
                      value={formData.button2_text || ""} 
                      onChange={e => setFormData({ ...formData, button2_text: e.target.value })}
                      placeholder="Tüm Kampanyalar"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-[#C98484] focus:outline-none text-xs font-medium bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Link Tipi</label>
                    <select 
                      value={linkType2}
                      onChange={e => {
                        setLinkType2(e.target.value)
                        setFormData({ ...formData, button2_link: "" })
                      }}
                      className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-bold bg-white"
                    >
                      <option value="page">Sayfa Seç</option>
                      <option value="product">Ürün Seç</option>
                      <option value="category">Kategori Seç</option>
                      <option value="custom">Özel Bağlantı / Link</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Link / Yönlendirme</label>
                    {linkType2 === "page" ? (
                      <select
                        value={formData.button2_link || ""}
                        onChange={e => setFormData({ ...formData, button2_link: e.target.value })}
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-medium bg-white"
                      >
                        <option value="">Sayfa seçin...</option>
                        {pages.map((page) => (
                          <option key={page.url} value={page.url}>{page.title}</option>
                        ))}
                      </select>
                    ) : linkType2 === "category" ? (
                      <select
                        value={formData.button2_link || ""}
                        onChange={e => setFormData({ ...formData, button2_link: e.target.value })}
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-medium bg-white"
                      >
                        <option value="">Kategori Seçin...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={categoryPath(c)}>{c.name} ({c.handle})</option>
                        ))}
                      </select>
                    ) : linkType2 === "product" ? (
                      <select
                        value={formData.button2_link || ""}
                        onChange={e => setFormData({ ...formData, button2_link: e.target.value })}
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-medium bg-white"
                      >
                        <option value="">Ürün Seçin...</option>
                        {products.map((p) => (
                          <option key={p.id} value={`/urunler/${p.handle}`}>{p.title} ({p.handle})</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text"
                        value={formData.button2_link || ""} 
                        onChange={e => setFormData({ ...formData, button2_link: e.target.value })}
                        placeholder="/magaza"
                        className="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-xs font-medium bg-white"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* BUTON RENKLERİ & YAYIN DURUMU */}
              <div className="col-span-12 grid grid-cols-1 items-center gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                <ColorPickerPopover
                  color={formData.button_color || "#C98484"}
                  onChange={(val) => setFormData({ ...formData, button_color: val })}
                  pickerId="button1"
                  activePicker={activeColorPicker}
                  setActivePicker={setActiveColorPicker}
                  label="Buton 1 Rengi"
                />
                <ColorPickerPopover
                  color={formData.button2_color || "#1A1A1A"}
                  onChange={(val) => setFormData({ ...formData, button2_color: val })}
                  pickerId="button2"
                  activePicker={activeColorPicker}
                  setActivePicker={setActiveColorPicker}
                  label="Buton 2 Rengi"
                />
                <div className="flex h-[36px] items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                  <label htmlFor="slider-order" className="text-[11px] font-bold text-gray-700">Sıra:</label>
                  <input
                    id="slider-order"
                    type="number"
                    min={0}
                    value={formData.order_index}
                    onChange={e => setFormData({ ...formData, order_index: Number(e.target.value) || 0 })}
                    className="w-16 rounded border border-gray-300 bg-white px-2 py-1 text-center text-xs font-bold outline-none focus:border-[#C98484]"
                  />
                </div>
                <div className="px-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between h-[36px]">
                  <span className="text-[11px] font-bold text-gray-700">Durum:</span>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="checkbox" 
                      id="is-active"
                      checked={formData.is_active} 
                      onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      className="rounded text-[#C98484] focus:ring-[#C98484] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="is-active" className="text-xs font-extrabold text-[#C98484] cursor-pointer">Sitede Yayınla</label>
                  </div>
                </div>
              </div>

              {/* ÖNE ÇIKAN ÖZELLİKLER (ALT ŞERİT ÖZELLİKLERİ) */}
              <div className="col-span-12 w-full rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex justify-between items-center mb-2 flex-wrap gap-1.5 border-b border-gray-200 pb-2">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase">ÖNE ÇIKAN ÖZELLİKLER (ALT ŞERİT)</label>
                  <div className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 py-1 bg-white shadow-sm flex-shrink-0">
                    <span className="text-xs font-bold text-gray-600 select-none">Boyut:</span>
                    <input
                      type="text"
                      placeholder="14"
                      value={formData.features && formData.features[0]?.fontSize ? parseInt(formData.features[0].fontSize, 10) : ""}
                      onChange={e => {
                        const valClean = e.target.value.replace(/[^0-9]/g, "")
                        const sizeStr = valClean ? `${valClean}px` : ""
                        const updated = (formData.features || []).map((item: any) => ({ ...item, fontSize: sizeStr }))
                        setFormData({ ...formData, features: updated })
                      }}
                      className="w-10 text-xs font-bold text-gray-900 text-center focus:outline-none border border-gray-200 focus:border-[#C98484] rounded bg-gray-50 py-0.5"
                    />
                    <span className="text-xs font-bold text-gray-600 select-none">px</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 items-center">
                  {(formData.features || []).map((feat: any, idx: number) => {
                    const words = (feat.text || "").split(" ")
                    const title = words[0] || ""
                    const desc = words.slice(1).join(" ") || ""
                    return (
                      <span 
                        key={idx} 
                        onClick={() => {
                          setEditingFeatureIdx(idx)
                          setNewFeatureText(title)
                          setNewFeatureDesc(desc.replace(/[()]/g, ""))
                          setNewFeatureIcon(feat.icon || "bolt")
                          setShowAddFeature(true)
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 border rounded text-xs font-semibold shadow-sm cursor-pointer transition-colors ${
                          editingFeatureIdx === idx 
                            ? "bg-[#C98484]/10 border-[#C98484] text-[#C98484]" 
                            : "bg-white border-gray-200 text-gray-700 hover:border-[#C98484] hover:bg-gray-50"
                        }`}
                      >
                        {feat.icon && (feat.icon.startsWith("http") || feat.icon.startsWith("/")) ? (
                          <img src={feat.icon} className="w-3.5 h-3.5 object-contain" />
                        ) : (
                          <DynamicIcon name={feat.icon} className="w-3.5 h-3.5" />
                        )}
                        <span className="text-gray-800 font-bold">{title}</span>
                        {desc && <span className="text-gray-400 text-[11px] font-medium">{desc}</span>}
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); removeFeature(idx) }} 
                          className="text-gray-400 hover:text-red-500 font-bold ml-1 border-none bg-transparent cursor-pointer text-xs"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}

                  {!showAddFeature && (
                    <button 
                      type="button" 
                      onClick={() => setShowAddFeature(true)}
                      className="border border-dashed border-gray-300 hover:border-[#C98484] text-[#C98484] text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors bg-white cursor-pointer shadow-sm"
                    >
                      + Özellik Ekle
                    </button>
                  )}
                </div>

                {showAddFeature && (
                  <div className="flex flex-col gap-2 p-2.5 bg-white border border-[#C98484]/40 rounded-lg shadow-sm mt-2">
                    <div className="text-[10px] font-extrabold text-[#C98484] uppercase">
                      {editingFeatureIdx !== null ? "Özelliği Düzenle" : "Yeni Özellik Ekle"}
                    </div>
                    <div className="flex gap-1.5">
                      <input 
                        type="text" 
                        value={newFeatureText} 
                        onChange={e => setNewFeatureText(e.target.value)} 
                        placeholder="Başlık (Güçlü)"
                        className="px-2.5 py-1 border border-gray-300 rounded text-xs focus:outline-none w-1/2 bg-white font-medium"
                      />
                      <input 
                        type="text" 
                        value={newFeatureDesc} 
                        onChange={e => setNewFeatureDesc(e.target.value)} 
                        placeholder="Açıklama (21V Li-Ion)"
                        className="px-2.5 py-1 border border-gray-300 rounded text-xs focus:outline-none w-1/2 bg-white font-medium"
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex items-center justify-between px-2 py-1 border border-gray-200 rounded text-xs bg-gray-50 h-[30px] flex-1">
                        {newFeatureIcon.startsWith("http") || newFeatureIcon.startsWith("/") ? (
                          <img src={newFeatureIcon} className="w-4 h-4 object-contain" />
                        ) : (
                          <DynamicIcon name={newFeatureIcon} className="w-4 h-4" />
                        )}
                        <button type="button" onClick={() => setNewFeatureIcon("bolt")} className="text-red-500 font-bold ml-2">x</button>
                      </div>
                      <button type="button" onClick={() => { setIconTarget("feature_icon"); setIsIconPickerOpen(true); }} className="px-3 border border-gray-200 rounded bg-[#C98484]/10 text-[#C98484] hover:bg-[#C98484]/20 font-bold text-xs h-[30px] flex items-center transition-colors">
                        İkon Seç
                      </button>
                    </div>
                    <div className="flex gap-2 justify-end mt-1">
                      <button type="button" onClick={addFeature} className="px-3 py-1 bg-[#C98484] text-white rounded text-xs font-bold border-none cursor-pointer">
                        {editingFeatureIdx !== null ? "Güncelle" : "Ekle"}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowAddFeature(false)
                          setEditingFeatureIdx(null)
                          setNewFeatureText("")
                          setNewFeatureDesc("")
                          setNewFeatureIcon("bolt")
                        }} 
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs border-none cursor-pointer"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ÜST BİLGİ ŞERİDİ & SAĞ PANEL ÖZELLİKLERİ */}
              <div className="col-span-12 grid grid-cols-1 gap-3 lg:grid-cols-2">
                {/* Üst Şerit */}
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-1.5">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase">ÜST BİLGİ ŞERİDİ</label>
                    <ColorPickerPopover
                      color={formData.top_bar_color || "#C98484"}
                      onChange={(val) => setFormData({ ...formData, top_bar_color: val })}
                      pickerId="top_bar_color"
                      activePicker={activeColorPicker}
                      setActivePicker={setActiveColorPicker}
                      label="Zemin Rengi"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {(formData.top_bar_features || []).map((feat: any, idx: number) => (
                      <span 
                        key={idx}
                        onClick={() => {
                          setEditingTopFeatureIdx(idx)
                          setNewTopTitle(feat.text)
                          setNewTopIcon(feat.icon || "shield")
                          setShowAddTopFeature(true)
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-[11px] font-semibold text-gray-800 shadow-sm cursor-pointer"
                      >
                        <DynamicIcon name={feat.icon || "shield"} className="w-3 h-3 text-gray-400" />
                        <span>{feat.text}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); const updated = [...formData.top_bar_features]; updated.splice(idx, 1); setFormData({ ...formData, top_bar_features: updated }) }} className="text-gray-400 hover:text-red-500 ml-1">×</button>
                      </span>
                    ))}
                    {!showAddTopFeature && (
                      <button type="button" onClick={() => { setNewTopTitle(""); setNewTopIcon("shield"); setEditingTopFeatureIdx(null); setShowAddTopFeature(true); }} className="text-[10px] font-bold text-[#C98484] px-1.5 py-0.5 border border-dashed border-[#C98484] rounded bg-white">+ Ekle</button>
                    )}
                  </div>
                  {showAddTopFeature && (
                    <div className="flex flex-col gap-1.5 p-2 bg-white border border-[#C98484]/40 rounded mt-2">
                      <input type="text" value={newTopTitle} onChange={e => setNewTopTitle(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Metin" />
                      <div className="flex gap-1 justify-end">
                        <button type="button" onClick={addTopFeature} className="px-2 py-0.5 bg-[#C98484] text-white rounded text-xs font-bold">Kaydet</button>
                        <button type="button" onClick={() => setShowAddTopFeature(false)} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">Vazgeç</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sağ Panel */}
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-200 pb-1.5">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase">SAĞ PANEL ÖZELLİKLERİ</label>
                  </div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {(formData.right_features || []).map((rf: any, idx: number) => (
                      <span 
                        key={idx}
                        onClick={() => {
                          setEditingRightFeatureIdx(idx)
                          setNewRightTitle(rf.title)
                          setNewRightDesc(rf.desc)
                          setNewRightIcon(rf.icon || "battery")
                          setShowAddRightFeature(true)
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-gray-200 rounded text-[11px] font-semibold text-gray-800 shadow-sm cursor-pointer"
                      >
                        <DynamicIcon name={rf.icon || "battery"} className="w-3 h-3 text-[#C98484]" />
                        <span>{rf.title}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeRightFeature(idx) }} className="text-gray-400 hover:text-red-500 ml-1">×</button>
                      </span>
                    ))}
                    {!showAddRightFeature && (
                      <button type="button" onClick={() => setShowAddRightFeature(true)} className="text-[10px] font-bold text-[#C98484] px-1.5 py-0.5 border border-dashed border-[#C98484] rounded bg-white">+ Ekle</button>
                    )}
                  </div>
                  {showAddRightFeature && (
                    <div className="flex flex-col gap-1.5 p-2 bg-white border border-[#C98484]/40 rounded mt-2">
                      <div className="flex gap-1">
                        <input type="text" value={newRightTitle} onChange={e => setNewRightTitle(e.target.value)} className="w-1/2 px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Başlık" />
                        <input type="text" value={newRightDesc} onChange={e => setNewRightDesc(e.target.value)} className="w-1/2 px-2 py-1 border border-gray-300 rounded text-xs" placeholder="Açıklama" />
                      </div>
                      <div className="flex gap-1 justify-end">
                        <button type="button" onClick={addRightFeature} className="px-2 py-0.5 bg-[#C98484] text-white rounded text-xs font-bold">Kaydet</button>
                        <button type="button" onClick={() => setShowAddRightFeature(false)} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">Vazgeç</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* 3. Sliders Table List */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mt-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
            <h2 className="text-base font-bold text-[#111827]">Slider Listesi</h2>
            <button 
              type="button" 
              onClick={() => {
                fetchSliders()
                showToast("Sıralama ve başlık değişiklikleri başarıyla senkronize edildi!", "success")
              }}
              className="border border-gray-200 hover:border-[#C98484] text-gray-700 hover:text-[#C98484] text-xs font-bold px-3.5 py-2 rounded-lg transition-colors bg-white cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-[#C98484]" /> Liste Değişikliklerini Kaydet
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm font-bold text-gray-400">Sliderlar yükleniyor...</div>
          ) : sliders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 py-10 text-center text-sm font-bold text-gray-400">
              Henüz slider eklenmemiş. Üstteki panelden hemen ekleyin!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
              {sliders.map((slider: any, index: number) => (
                <article
                  key={slider.id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"
                >
                  <div className="relative aspect-[16/7] overflow-hidden bg-gray-100">
                    <img
                      src={slider.image_url || "https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=2000"}
                      alt={slider.title || `Slider ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-gray-950/80 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur-sm">
                      #{index + 1}
                    </span>
                    {slider.is_active !== false ? (
                      <span className="absolute right-3 top-3 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700">Aktif</span>
                    ) : (
                      <span className="absolute right-3 top-3 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-bold text-gray-600">Pasif</span>
                    )}
                  </div>

                  <div className="space-y-2.5 p-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-400">Başlık</label>
                      <input
                        type="text"
                        defaultValue={slider.title || slider.heading || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (slider.title || slider.heading || "")) {
                            handleInlineSave(slider, e.target.value, undefined)
                          }
                        }}
                        placeholder="Slider başlığı girin..."
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold transition-all hover:border-gray-300 focus:border-[#C98484] focus:outline-none focus:ring-1 focus:ring-[#C98484]"
                      />
                    </div>

                    <div className="flex items-end justify-between gap-3 border-t border-gray-100 pt-3">
                      <div>
                        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-gray-400">Sıra</label>
                        <input
                          type="number"
                          defaultValue={slider.order_index}
                          onBlur={(e) => {
                            const val = Number(e.target.value)
                            if (val !== slider.order_index) {
                              handleInlineSave(slider, undefined, val)
                            }
                          }}
                          className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-xs font-bold transition-all hover:border-gray-300 focus:border-[#C98484] focus:outline-none"
                        />
                      </div>

                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(slider)}
                          title="Düzenle"
                          className="cursor-pointer rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition-colors hover:border-[#C98484] hover:bg-rose-50/50 hover:text-[#C98484]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClone(slider)}
                          title="Klonla / Kopyala"
                          className="cursor-pointer rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(slider.id)}
                          title="Sil"
                          className="cursor-pointer rounded-lg border border-red-200 bg-white p-2 text-red-500 shadow-sm transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

      </div>

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Slider Silme"
        message="Bu slider'ı silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="Vazgeç"
        onConfirm={async () => {
          if (confirmDeleteId) {
            const res = await fetch(`/api/admin/sliders/${confirmDeleteId}`, { method: "DELETE" })
            if (res.ok) {
              showToast("Slider silindi", "info")
              if (selectedId === confirmDeleteId) setSelectedId(null)
              fetchSliders()
            }
            setConfirmDeleteId(null)
          }
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <MediaSelectorModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(urls) => {
          if (urls && urls.length > 0) {
            setFormData({ ...formData, image_url: urls[0] })
          }
          setIsMediaModalOpen(false)
        }}
        multi={false}
      />

      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={(val) => {
          if (iconTarget === "top_icon") {
            setNewTopIcon(val)
          } else if (iconTarget === "feature_icon") {
            setNewFeatureIcon(val)
          } else if (iconTarget === "right_icon") {
            setNewRightIcon(val)
          }
        }}
      />
    </div>
  )
}
