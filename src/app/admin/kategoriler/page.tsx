"use client"
import { useEffect, useRef, useState } from "react"
import ConfirmModal from "../components/ConfirmModal"
import IconPickerModal from "../components/IconPickerModal"
import MediaSelectorModal from "../components/MediaSelectorModal"
import {
  APP_ICON_OPTIONS,
  AppIcon,
  Box,
  Check,
  CircleAlert,
  CircleCheck,
  Edit3,
  FolderTree,
  Layers,
  LayoutGrid,
  Plus,
  RefreshCw,
  Save,
  Sliders,
  Star,
  Trash2,
  Undo2,
  Package,
  X,
} from "@lib/icons"
import { SafeImage } from "@lib/SafeImage"

interface Category {
  id: string
  name: string
  handle: string
  description: string | null
  parent_category_id: string | null
  rank?: number
  is_active?: boolean
  product_count?: number
  direct_product_count?: number
  metadata?: Record<string, any>
  created_at?: string
}

type DesignItem = {
  title: string
  subtitle: string
  icon: string
}

type CategoryDesignForm = {
  displayTitle: string
  eyebrow: string
  heroImageUrl: string
  heroMobileImageUrl: string
  heroHeight: number
  heroMobileHeight: number
  heroImageWidth: number
  heroObjectPosition: string
  heroBackground: string
  badgeText: string
  badgeIcon: string
  titleSize: number
  titleSizeMobile: number
  childCardColumns: number
  childCardImageWidth: number
  childCardImageHeight: number
  childCardImageFit: string
  cardImageUrl: string
  cardTitle: string
  cardDescription: string
  cardImageWidth: number
  cardImageHeight: number
  cardImageFit: string
  features: DesignItem[]
  trustItems: DesignItem[]
}

const defaultCategoryDesign = (): CategoryDesignForm => ({
  displayTitle: "",
  eyebrow: "",
  heroImageUrl: "",
  heroMobileImageUrl: "",
  heroHeight: 300,
  heroMobileHeight: 230,
  heroImageWidth: 42,
  heroObjectPosition: "center",
  heroBackground: "#ffffff",
  badgeText: "",
  badgeIcon: "check",
  titleSize: 48,
  titleSizeMobile: 32,
  childCardColumns: 4,
  childCardImageWidth: 145,
  childCardImageHeight: 120,
  childCardImageFit: "cover",
  cardImageUrl: "",
  cardTitle: "",
  cardDescription: "",
  cardImageWidth: 145,
  cardImageHeight: 120,
  cardImageFit: "cover",
  features: [],
  trustItems: [],
})


const PASTEL_THEMES = [
  { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  { bg: "bg-rose-50", text: "text-[#C98484]", border: "border-rose-200" },
]

function getCategoryPastelTheme(index: number) {
  return PASTEL_THEMES[index % PASTEL_THEMES.length]
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [homepageUpdatingIds, setHomepageUpdatingIds] = useState<string[]>([])
  const [activeUpdatingIds, setActiveUpdatingIds] = useState<string[]>([])
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [description, setDescription] = useState("")
  const [parentId, setParentId] = useState("")
  const [icon, setIcon] = useState("")
  const [showOnHomepage, setShowOnHomepage] = useState<boolean>(false)
  const [homepageOrder, setHomepageOrder] = useState<number>(0)
  const [design, setDesign] = useState<CategoryDesignForm>(
    defaultCategoryDesign,
  )
  const [mediaTarget, setMediaTarget] = useState<
    "heroImageUrl" | "heroMobileImageUrl" | "cardImageUrl" | null
  >(null)
  const [iconTarget, setIconTarget] = useState("category")

  // Icon Modal State
  const [isIconModalOpen, setIsIconModalOpen] = useState(false)

  // Bulk Selection & Deletion States
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<string>("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState<boolean>(false)
  const [confirmDiscardModal, setConfirmDiscardModal] = useState<boolean>(false)
  const [deletingBulk, setDeletingBulk] = useState<boolean>(false)

  // Custom Category Appearance Settings
  const [showAppearancePanel, setShowAppearancePanel] = useState<boolean>(false)
  const [showAdvancedDesign, setShowAdvancedDesign] = useState<boolean>(false)
  const [iconSizePx, setIconSizePx] = useState<number | string>(24)
  const [fontSizePx, setFontSizePx] = useState<number | string>(12)
  const [fontWeightVal, setFontWeightVal] = useState<string>("700")
  const [iconColorVal, setIconColorVal] = useState<string>("#C98484")
  const [textColorVal, setTextColorVal] = useState<string>("#1e293b")
  const [iconBgVal, setIconBgVal] = useState<string>("#fcf7f6")

  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState("")
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const editorScrollRef = useRef<HTMLDivElement>(null)

  // Multi-Category Draft Memory & Bulk Save System
  type CategoryDraft = {
    id: string
    name: string
    handle: string
    description: string
    parentId: string
    icon: string
    showOnHomepage: boolean
    homepageOrder?: number
    design: CategoryDesignForm
  }

  const [drafts, setDrafts] = useState<Record<string, CategoryDraft>>({})

  // Helper: Update active category in draft memory
  function updateDraftFields(fields: Partial<CategoryDraft>) {
    if (!editId) return
    setDrafts((prev) => {
      const existing: CategoryDraft = prev[editId] || {
        id: editId,
        name,
        handle,
        description,
        parentId,
        icon,
        showOnHomepage,
        homepageOrder,
        design,
      }
      return {
        ...prev,
        [editId]: {
          ...existing,
          ...fields,
        },
      }
    })
  }

  function discardDraft(id: string) {
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    const c = categories.find((x) => x.id === id)
    if (c && editId === id) {
      performStartEdit(c)
    }
  }

  // Auto-sync active category modifications into drafts memory
  useEffect(() => {
    if (!editId) return
    const originalCat = categories.find((c) => c.id === editId)
    if (!originalCat) return

    const origMeta = originalCat.metadata || {}
    const defaults = defaultCategoryDesign()

    const isModified =
      name !== originalCat.name ||
      handle !== originalCat.handle ||
      description !== (originalCat.description || "") ||
      parentId !== (originalCat.parent_category_id || "") ||
      icon !== (origMeta.icon || "") ||
      showOnHomepage !== Boolean(origMeta.show_on_homepage) ||
      JSON.stringify(design) !== JSON.stringify({
        displayTitle: origMeta.display_title || "",
        eyebrow: origMeta.eyebrow || defaults.eyebrow,
        heroImageUrl: origMeta.hero_image_url || origMeta.banner_url || "",
        heroMobileImageUrl: origMeta.hero_mobile_image_url || "",
        heroHeight: Number(origMeta.hero_height) || defaults.heroHeight,
        heroMobileHeight: Number(origMeta.hero_mobile_height) || defaults.heroMobileHeight,
        heroImageWidth: Number(origMeta.hero_image_width) || defaults.heroImageWidth,
        heroObjectPosition: origMeta.hero_object_position || defaults.heroObjectPosition,
        heroBackground: origMeta.hero_background || defaults.heroBackground,
        badgeText: origMeta.hero_badge_text || origMeta.badge_text || defaults.badgeText,
        badgeIcon: origMeta.badge_icon || defaults.badgeIcon,
        titleSize: Number(origMeta.title_size) || defaults.titleSize,
        titleSizeMobile: Number(origMeta.title_size_mobile) || defaults.titleSizeMobile,
        childCardColumns: Number(origMeta.child_card_columns) || defaults.childCardColumns,
        childCardImageWidth: Number(origMeta.child_card_image_width) || defaults.childCardImageWidth,
        childCardImageHeight: Number(origMeta.child_card_image_height) || defaults.childCardImageHeight,
        childCardImageFit: origMeta.child_card_image_fit || defaults.childCardImageFit,
        cardImageUrl: origMeta.card_image_url || origMeta.image_url || origMeta.banner_url || "",
        cardTitle: origMeta.card_title || originalCat.name || "",
        cardDescription: origMeta.card_description || "",
        cardImageWidth: Number(origMeta.card_image_width) || defaults.cardImageWidth,
        cardImageHeight: Number(origMeta.card_image_height) || defaults.cardImageHeight,
        cardImageFit: origMeta.card_image_fit || defaults.cardImageFit,
        features: Array.isArray(origMeta.hero_features) ? origMeta.hero_features : defaults.features,
        trustItems: Array.isArray(origMeta.trust_items) ? origMeta.trust_items : defaults.trustItems,
      })

    if (isModified) {
      setDrafts((prev) => ({
        ...prev,
        [editId]: {
          id: editId,
          name,
          handle,
          description,
          parentId,
          icon,
          showOnHomepage,
          design,
        },
      }))
    }
  }, [editId, name, handle, description, parentId, icon, showOnHomepage, design, categories])

  function resetToNewCategory() {
    setEditId(null)
    setName("")
    setHandle("")
    setDescription("")
    setParentId("")
    setIcon("")
    setShowOnHomepage(false)
    setDesign(defaultCategoryDesign())
    setError("")
    setSuccessMessage(null)
  }

  async function fetchCategories(options: { silent?: boolean } = {}) {
    const silent = options.silent ?? false
    if (!silent) setLoading(true)

    try {
      const [catData, settingData] = await Promise.all([
        fetch("/api/admin/categories").then((r) => r.json()),
        fetch("/api/admin/category-settings").then((r) => r.json()),
      ])
      const nextCategories: Category[] = catData.categories || []
      setCategories(nextCategories)
      const numIcon = parseInt(settingData.icon_size, 10)
      if (!isNaN(numIcon) && numIcon >= 10) setIconSizePx(numIcon)
      const numFont = parseInt(settingData.font_size, 10)
      if (!isNaN(numFont) && numFont >= 8) setFontSizePx(numFont)
      if (settingData.font_weight) setFontWeightVal(settingData.font_weight)
      if (settingData.icon_color) setIconColorVal(settingData.icon_color)
      if (settingData.text_color) setTextColorVal(settingData.text_color)
      if (settingData.icon_bg) setIconBgVal(settingData.icon_bg)
      return nextCategories
    } catch (err) {
      console.error(err)
      return [] as Category[]
    } finally {
      if (!silent) setLoading(false)
    }
  }

  function restoreEditorPosition(editorScrollTop: number, pageScrollTop: number) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (editorScrollRef.current) {
          editorScrollRef.current.scrollTop = editorScrollTop
        }
        window.scrollTo(0, pageScrollTop)
      })
    })
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  function autoHandle(n: string) {
    return n
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-ğüşöçı]/g, "")
  }

  function handleNameChange(v: string) {
    setName(v)
    if (!editId) setHandle(autoHandle(v))
    const updatedDesign = {
      ...design,
      cardTitle: !design.cardTitle || design.cardTitle === name ? v : design.cardTitle,
    }
    setDesign(updatedDesign)
    if (editId) {
      updateDraftFields({ name: v, design: updatedDesign })
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true)
    setSettingsMsg("")
    try {
      const res = await fetch("/api/admin/category-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          icon_size: String(iconSizePx),
          font_size: String(fontSizePx),
          font_weight: fontWeightVal,
          icon_color: iconColorVal,
          text_color: textColorVal,
          icon_bg: iconBgVal,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSettingsMsg(`Kategori renk ve görünüm ayarları başarıyla uygulandı.`)
        setTimeout(() => setSettingsMsg(""), 3500)
      } else {
        setSettingsMsg(data.error || "Ayar kaydedilemedi.")
      }
    } catch {
      setSettingsMsg("Ayar kaydedilemedi.")
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Kategori adı zorunludur")
      return
    }

    const editorScrollTop = editorScrollRef.current?.scrollTop ?? 0
    const pageScrollTop = window.scrollY
    const editingId = editId

    setSaving(true)
    setError("")
    setSuccessMessage(null)

    const autoH = (str: string) =>
      str
        .toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")

    const finalHandle = handle.trim() || autoH(name)

    const meta: Record<string, any> = {
      icon,
      show_on_homepage: Boolean(showOnHomepage),
      homepage_order: Number(homepageOrder || 1),
      homepage_rank: Number(homepageOrder || 1),
      display_title: design.displayTitle.trim() || name.trim(),
      eyebrow: design.eyebrow.trim(),
      hero_image_url: design.heroImageUrl,
      hero_mobile_image_url: design.heroMobileImageUrl,
      hero_height: design.heroHeight,
      hero_mobile_height: design.heroMobileHeight,
      hero_image_width: design.heroImageWidth,
      hero_object_position: design.heroObjectPosition,
      hero_background: design.heroBackground,
      hero_badge_text: (design.badgeText || "").trim(),
      badge_text: (design.badgeText || "").trim(),
      badge_icon: design.badgeIcon || "check",
      title_size: design.titleSize,
      title_size_mobile: design.titleSizeMobile,
      child_card_columns: design.childCardColumns,
      child_card_image_width: design.childCardImageWidth,
      child_card_image_height: design.childCardImageHeight,
      child_card_image_fit: design.childCardImageFit,
      card_image_url: design.cardImageUrl,
      card_title: (design.cardTitle || name).trim(),
      card_description: design.cardDescription.trim(),
      card_image_width: design.cardImageWidth,
      card_image_height: design.cardImageHeight,
      card_image_fit: design.cardImageFit,
      hero_features: design.features,
      trust_items: design.trustItems,
    }

    const body: Record<string, any> = {
      name: name.trim(),
      handle: finalHandle,
      description: description.trim() || null,
      parent_category_id: parentId || null,
      metadata: meta,
    }
    if (icon) body.icon = icon

    try {
      const url = editId
        ? `/api/admin/categories/${editId}`
        : "/api/admin/categories"
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Kategori kaydedilemedi")
        return
      }

      const savedName = name.trim()
      const savedCategory = data.product_category as Category | undefined
      setSuccessMessage(
        editingId
          ? `"${savedName}" kategorisi güncellendi.`
          : `"${savedName}" kategorisi oluşturuldu.`
      )

      if (editingId) {
        setDrafts((prev) => {
          const next = { ...prev }
          delete next[editingId]
          return next
        })
      }

      setHandle(finalHandle)
      setIsDirty(false)

      const nextCategories = await fetchCategories({ silent: true })
      const savedId =
        editingId ||
        savedCategory?.id ||
        nextCategories.find((category) => category.handle === finalHandle)?.id
      if (savedId) setEditId(savedId)

      restoreEditorPosition(editorScrollTop, pageScrollTop)
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (e) {
      console.error(e)
      setError("Kategori kaydedilirken sunucu hatası oluştu")
    } finally {
      setSaving(false)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map((c) => c.id))
    }
  }

  async function toggleHomepageVisibility(cat: Category) {
    if (homepageUpdatingIds.includes(cat.id)) return

    const currentValue = Boolean(
      drafts[cat.id]?.showOnHomepage ?? cat.metadata?.show_on_homepage
    )
    const nextValue = !currentValue
    const previousCategories = categories
    const previousDraft = drafts[cat.id]

    const currentOrder = Number(cat.metadata?.homepage_order ?? cat.metadata?.homepage_rank ?? 0)
    const nextOrder = nextValue ? currentOrder : 0

    setHomepageUpdatingIds((current) => [...current, cat.id])
    setCategories((current) =>
      current.map((entry) =>
        entry.id === cat.id
          ? {
              ...entry,
              metadata: {
                ...(entry.metadata || {}),
                show_on_homepage: nextValue,
                homepage_order: nextOrder,
                homepage_rank: nextOrder,
              },
            }
          : entry
      )
    )

    if (previousDraft) {
      setDrafts((current) => ({
        ...current,
        [cat.id]: {
          ...current[cat.id],
          showOnHomepage: nextValue,
          homepageOrder: nextOrder,
        },
      }))
    }
    if (editId === cat.id) {
      setShowOnHomepage(nextValue)
      setHomepageOrder(nextOrder)
    }

    try {
      const response = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cat.name,
          handle: cat.handle,
          description: cat.description || null,
          parent_category_id: cat.parent_category_id || null,
          metadata: {
            ...(cat.metadata || {}),
            show_on_homepage: nextValue,
            homepage_order: nextOrder,
            homepage_rank: nextOrder,
          },
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Kategori güncellenemedi")

      const saved = data.product_category as Category | undefined
      setCategories((current) =>
        current.map((entry) =>
          entry.id === cat.id
            ? {
                ...entry,
                ...(saved || {}),
                parent_category_id:
                  saved?.parent_category_id !== undefined
                    ? saved.parent_category_id
                    : entry.parent_category_id,
                product_count:
                  saved?.product_count !== undefined
                    ? saved.product_count
                    : entry.product_count,
                is_active:
                  saved?.is_active !== undefined
                    ? saved.is_active
                    : entry.is_active,
                metadata: {
                  ...(entry.metadata || {}),
                  ...(saved?.metadata || {}),
                  show_on_homepage: nextValue,
                  homepage_order: nextOrder,
                  homepage_rank: nextOrder,
                },
              }
            : entry
        )
      )
      setSuccessMessage(
        nextValue
          ? `“${cat.name}” ana sayfada ${nextOrder}. sırada gösterilecek.`
          : `“${cat.name}” ana sayfadan kaldırıldı.`
      )
      setTimeout(() => setSuccessMessage(null), 2500)
    } catch (toggleError) {
      setCategories(previousCategories)
      if (previousDraft) {
        setDrafts((current) => ({ ...current, [cat.id]: previousDraft }))
      }
      if (editId === cat.id) setShowOnHomepage(currentValue)
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Kategori güncellenemedi"
      )
    } finally {
      setHomepageUpdatingIds((current) =>
        current.filter((id) => id !== cat.id)
      )
    }
  }

  async function updateHomepageOrder(cat: Category, nextOrder: number) {
    if (homepageUpdatingIds.includes(cat.id)) return

    const sanitizedOrder = Math.max(1, Math.min(99, nextOrder))
    const previousCategories = categories
    const previousDraft = drafts[cat.id]

    setHomepageUpdatingIds((current) => [...current, cat.id])
    setCategories((current) =>
      current.map((entry) =>
        entry.id === cat.id
          ? {
              ...entry,
              metadata: {
                ...(entry.metadata || {}),
                show_on_homepage: true,
                homepage_order: sanitizedOrder,
                homepage_rank: sanitizedOrder,
              },
            }
          : entry
      )
    )

    if (previousDraft) {
      setDrafts((current) => ({
        ...current,
        [cat.id]: {
          ...current[cat.id],
          showOnHomepage: true,
          homepageOrder: sanitizedOrder,
        },
      }))
    }
    if (editId === cat.id) {
      setShowOnHomepage(true)
      setHomepageOrder(sanitizedOrder)
    }

    try {
      const response = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cat.name,
          handle: cat.handle,
          description: cat.description || null,
          parent_category_id: cat.parent_category_id || null,
          metadata: {
            ...(cat.metadata || {}),
            show_on_homepage: true,
            homepage_order: sanitizedOrder,
            homepage_rank: sanitizedOrder,
          },
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Sıra güncellenemedi")

      setSuccessMessage(`“${cat.name}” ana sayfa sırası ${sanitizedOrder}. olarak ayarlandı.`)
      setTimeout(() => setSuccessMessage(null), 2500)
    } catch (err) {
      setCategories(previousCategories)
      setError(err instanceof Error ? err.message : "Sıra güncellenemedi")
    } finally {
      setHomepageUpdatingIds((current) =>
        current.filter((id) => id !== cat.id)
      )
    }
  }

  async function toggleActiveStatus(cat: Category) {
    if (activeUpdatingIds.includes(cat.id)) return

    const currentValue = cat.is_active !== false
    const nextValue = !currentValue
    const previousCategories = categories

    setActiveUpdatingIds((current) => [...current, cat.id])
    setCategories((current) =>
      current.map((entry) =>
        entry.id === cat.id
          ? {
              ...entry,
              is_active: nextValue,
            }
          : entry
      )
    )

    try {
      const response = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: nextValue,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Durum güncellenemedi")

      const saved = data.product_category as Category | undefined
      setCategories((current) =>
        current.map((entry) =>
          entry.id === cat.id
            ? {
                ...entry,
                ...(saved || {}),
                parent_category_id:
                  saved?.parent_category_id !== undefined
                    ? saved.parent_category_id
                    : entry.parent_category_id,
                product_count:
                  saved?.product_count !== undefined
                    ? saved.product_count
                    : entry.product_count,
                is_active: nextValue,
              }
            : entry
        )
      )
      setSuccessMessage(
        nextValue
          ? `“${cat.name}” aktif edildi.`
          : `“${cat.name}” pasife alındı.`
      )
      setTimeout(() => setSuccessMessage(null), 2500)
    } catch (toggleError) {
      setCategories(previousCategories)
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Durum güncellenemedi"
      )
    } finally {
      setActiveUpdatingIds((current) =>
        current.filter((id) => id !== cat.id)
      )
    }
  }

  function handleDelete(id: string) {
    setConfirmDeleteId(id)
  }

  async function performDelete() {
    if (!confirmDeleteId) return
    try {
      await fetch(`/api/admin/categories/${confirmDeleteId}`, {
        method: "DELETE",
      })
      if (editId === confirmDeleteId) {
        resetToNewCategory()
      }
      fetchCategories()
    } catch (e) {
      console.error(e)
    } finally {
      setConfirmDeleteId(null)
    }
  }

  function handleApplyBulk() {
    if (!bulkAction || selectedIds.length === 0) return
    if (bulkAction === "delete") {
      setConfirmBulkDelete(true)
    }
  }

  async function performBulkDelete() {
    if (selectedIds.length === 0) return
    setDeletingBulk(true)
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
        )
      )
      setSelectedIds([])
      setBulkAction("")
      fetchCategories()
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingBulk(false)
      setConfirmBulkDelete(false)
    }
  }

  function performStartEdit(c: Category) {
    const metadata = c.metadata || {}
    const defaults = defaultCategoryDesign()
    setEditId(c.id)
    setName(c.name)
    setHandle(c.handle)
    setDescription(c.description || "")
    setParentId(c.parent_category_id || "")
    setIcon(metadata.icon || "")
    setShowOnHomepage(Boolean(metadata.show_on_homepage))
    setHomepageOrder(Number(metadata.homepage_order ?? metadata.homepage_rank ?? 0))
    setDesign({
      displayTitle: metadata.display_title || "",
      eyebrow: metadata.eyebrow || defaults.eyebrow,
      heroImageUrl: metadata.hero_image_url || metadata.banner_url || "",
      heroMobileImageUrl: metadata.hero_mobile_image_url || "",
      heroHeight: Number(metadata.hero_height) || defaults.heroHeight,
      heroMobileHeight:
        Number(metadata.hero_mobile_height) || defaults.heroMobileHeight,
      heroImageWidth:
        Number(metadata.hero_image_width) || defaults.heroImageWidth,
      heroObjectPosition:
        metadata.hero_object_position || defaults.heroObjectPosition,
      heroBackground: metadata.hero_background || defaults.heroBackground,
      badgeText:
        metadata.hero_badge_text || metadata.badge_text || defaults.badgeText,
      badgeIcon: metadata.badge_icon || defaults.badgeIcon,
      titleSize: Number(metadata.title_size) || defaults.titleSize,
      titleSizeMobile:
        Number(metadata.title_size_mobile) || defaults.titleSizeMobile,
      childCardColumns:
        Number(metadata.child_card_columns) || defaults.childCardColumns,
      childCardImageWidth:
        Number(metadata.child_card_image_width) ||
        defaults.childCardImageWidth,
      childCardImageHeight:
        Number(metadata.child_card_image_height) ||
        defaults.childCardImageHeight,
      childCardImageFit:
        metadata.child_card_image_fit || defaults.childCardImageFit,
      cardImageUrl:
        metadata.card_image_url || metadata.image_url || metadata.banner_url || "",
      cardTitle: metadata.card_title || c.name || "",
      cardDescription: metadata.card_description || "",
      cardImageWidth:
        Number(metadata.card_image_width) || defaults.cardImageWidth,
      cardImageHeight:
        Number(metadata.card_image_height) || defaults.cardImageHeight,
      cardImageFit: metadata.card_image_fit || defaults.cardImageFit,
      features: Array.isArray(metadata.hero_features)
        ? metadata.hero_features
        : defaults.features,
      trustItems: Array.isArray(metadata.trust_items)
        ? metadata.trust_items
        : defaults.trustItems,
    })
  }

  function startEdit(c: Category) {
    if (drafts[c.id]) {
      const d = drafts[c.id]
      setEditId(c.id)
      setName(d.name)
      setHandle(d.handle)
      setDescription(d.description)
      setParentId(d.parentId)
      setIcon(d.icon)
      setShowOnHomepage(d.showOnHomepage)
      setDesign(d.design)
      setError("")
      setSuccessMessage(null)
    } else {
      performStartEdit(c)
    }
  }

  function handleRequestNewCategory() {
    resetToNewCategory()
  }

  async function handleSaveAllDrafts() {
    const draftIds = Object.keys(drafts)
    if (draftIds.length === 0) {
      if (name.trim()) handleSave()
      return
    }

    const editorScrollTop = editorScrollRef.current?.scrollTop ?? 0
    const pageScrollTop = window.scrollY

    setSaving(true)
    setError("")
    setSuccessMessage(null)

    const autoH = (str: string) =>
      str
        .toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")

    try {
      await Promise.all(
        draftIds.map(async (id) => {
          const d = drafts[id]
          const finalHandle = d.handle.trim() || autoH(d.name)
          const meta: Record<string, any> = {
            icon: d.icon,
            show_on_homepage: Boolean(d.showOnHomepage),
            homepage_order: Number(d.homepageOrder || 1),
            homepage_rank: Number(d.homepageOrder || 1),
            display_title: d.design.displayTitle.trim() || d.name.trim(),
            eyebrow: d.design.eyebrow.trim(),
            hero_image_url: d.design.heroImageUrl,
            hero_mobile_image_url: d.design.heroMobileImageUrl,
            hero_height: d.design.heroHeight,
            hero_mobile_height: d.design.heroMobileHeight,
            hero_image_width: d.design.heroImageWidth,
            hero_object_position: d.design.heroObjectPosition,
            hero_background: d.design.heroBackground,
            hero_badge_text: (d.design.badgeText || "").trim(),
            badge_text: (d.design.badgeText || "").trim(),
            badge_icon: d.design.badgeIcon || "check",
            title_size: d.design.titleSize,
            title_size_mobile: d.design.titleSizeMobile,
            child_card_columns: d.design.childCardColumns,
            child_card_image_width: d.design.childCardImageWidth,
            child_card_image_height: d.design.childCardImageHeight,
            child_card_image_fit: d.design.childCardImageFit,
            card_image_url: d.design.cardImageUrl,
            card_title: (d.design.cardTitle || d.name).trim(),
            card_description: d.design.cardDescription.trim(),
            card_image_width: d.design.cardImageWidth,
            card_image_height: d.design.cardImageHeight,
            card_image_fit: d.design.cardImageFit,
            hero_features: d.design.features,
            trust_items: d.design.trustItems,
          }

          const body: Record<string, any> = {
            name: d.name.trim(),
            handle: finalHandle,
            description: d.description.trim() || null,
            parent_category_id: d.parentId || null,
            metadata: meta,
          }
          if (d.icon) body.icon = d.icon

          return fetch(`/api/admin/categories/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        })
      )

      setSuccessMessage(
        `${draftIds.length} kategorideki tüm değişiklikler kaydedildi.`
      )
      setDrafts({})
      await fetchCategories({ silent: true })
      restoreEditorPosition(editorScrollTop, pageScrollTop)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      setError("Toplu kaydetme sırasında bir hata oluştu")
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    setEditId(null)
    setName("")
    setHandle("")
    setDescription("")
    setParentId("")
    setIcon("")
    setShowOnHomepage(false)
    setDesign(defaultCategoryDesign())
  }

  function updateDesignItem(
    group: "features" | "trustItems",
    index: number,
    field: keyof DesignItem,
    value: string,
  ) {
    setDesign((current) => ({
      ...current,
      [group]: current[group].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }))
    setIsDirty(true)
  }

  function handleIconSelect(selectedNameOrUrl: string) {
    if (iconTarget === "category") {
      setIcon(selectedNameOrUrl)
    } else if (iconTarget === "badge_icon") {
      setDesign((prev) => ({ ...prev, badgeIcon: selectedNameOrUrl }))
    } else {
      const [groupName, rawIndex] = iconTarget.split("-")
      const group = groupName === "feature" ? "features" : "trustItems"
      updateDesignItem(group, Number(rawIndex), "icon", selectedNameOrUrl)
    }
    setIsIconModalOpen(false)
    setIconTarget("category")
    setIsDirty(true)
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )
  const topLevel = filtered.filter((c) => !c.parent_category_id)

  const selectedIconOption = APP_ICON_OPTIONS.find((opt) => opt.name === icon)

  function renderRow(cat: Category, depth = 0): React.ReactNode {
    const children = filtered.filter((c) => c.parent_category_id === cat.id)
    const isChecked = selectedIds.includes(cat.id)
    const iconName = cat.metadata?.icon || ""
    const catImageUrl =
      cat.metadata?.card_image_url ||
      cat.metadata?.image_url ||
      cat.metadata?.banner_url
    const categoryType =
      depth > 0
        ? "ALT KATEGORİ"
        : children.length > 0
          ? "ANA KATEGORİ"
          : "BAĞIMSIZ KATEGORİ"
    const isMainCategory = categoryType === "ANA KATEGORİ"

    const catIndex = filtered.findIndex((c) => c.id === cat.id)
    const theme = getCategoryPastelTheme(catIndex >= 0 ? catIndex : 0)

    const isHomepage = Boolean(drafts[cat.id]?.showOnHomepage ?? cat.metadata?.show_on_homepage)

    return [
      <tr
        key={cat.id}
        className={`group transition-colors border-b border-slate-100/80 ${
          isMainCategory
            ? "bg-slate-50/40 hover:bg-slate-100/60"
            : "bg-white hover:bg-slate-50/80"
        } ${isChecked ? "bg-rose-50/70" : ""}`}
      >
        <td className="w-10 px-4 py-3.5 text-center">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => toggleSelect(cat.id)}
            className="w-4 h-4 text-[#C98484] accent-[#C98484] rounded cursor-pointer"
          />
        </td>
        <td className="px-4 py-3.5">
          <div
            className="flex items-center gap-3"
            style={{ paddingLeft: `${depth * 22}px` }}
          >
            {depth > 0 && (
              <span className="text-slate-300 font-mono text-xs select-none">
                └─
              </span>
            )}
            {/* Lumiya Style Soft Pastel Icon Badge */}
            <span
              className={`flex items-center justify-center w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-xl shrink-0 border overflow-hidden shadow-2xs transition-transform group-hover:scale-105 ${theme.bg} ${theme.text} ${theme.border}`}
              style={{ width: "36px", height: "36px", minWidth: "36px", minHeight: "36px" }}
            >
              {catImageUrl ? (
                <SafeImage
                  src={catImageUrl}
                  alt={cat.name}
                  className="w-9 h-9 max-w-[36px] max-h-[36px] object-contain p-0.5 pointer-events-none"
                  style={{ width: "36px", height: "36px", objectFit: "contain" }}
                />
              ) : (
                <AppIcon name={iconName} fallback="box" className="w-4 h-4 stroke-[2.2]" />
              )}
            </span>

            <div className="flex items-center gap-2">
              <span
                className={`transition-colors cursor-pointer text-xs sm:text-sm ${
                  isMainCategory
                    ? "text-slate-900 font-extrabold hover:text-[#C98484]"
                    : "text-slate-700 font-bold hover:text-[#C98484]"
                }`}
                onClick={() => startEdit(cat)}
              >
                {cat.name}
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleActiveStatus(cat)
                }}
                disabled={activeUpdatingIds.includes(cat.id)}
                className={`admin-status-badge transition-all cursor-pointer select-none hover:opacity-85 ${
                  cat.is_active !== false
                    ? "admin-status-badge--success"
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}
                title={
                  cat.is_active !== false
                    ? "Kategoriyi pasife almak için tıklayın"
                    : "Kategoriyi aktif etmek için tıklayın"
                }
              >
                {activeUpdatingIds.includes(cat.id) ? (
                  <RefreshCw className="h-3 w-3 animate-spin text-slate-500" />
                ) : (
                  <span
                    className={`admin-status-dot ${
                      cat.is_active === false ? "bg-slate-400" : ""
                    }`}
                  />
                )}
                <span>{cat.is_active !== false ? "Aktif" : "Pasif"}</span>
              </button>

              {drafts[cat.id] && (
                <div className="flex items-center gap-1.5">
                  <span className="admin-status-badge admin-status-badge--warning">
                    <CircleAlert className="h-3 w-3" />
                    Taslak
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      discardDraft(cat.id)
                    }}
                    className="admin-text-action admin-text-action--danger"
                    title="Taslak Değişiklikleri Sıfırla"
                  >
                    <Undo2 className="h-3 w-3" />
                    Geri al
                  </button>
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {isMainCategory ? (
              <span className="admin-status-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C98484]"></span>
                Ana Kategori
              </span>
            ) : categoryType === "ALT KATEGORİ" ? (
              <span className="admin-status-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                Alt Kategori
              </span>
            ) : (
              <span className="admin-status-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Bağımsız Kategori
              </span>
            )}
            {isHomepage && (
              <span className="admin-status-badge admin-status-badge--accent" title={`Ana sayfa gösterim sırası: ${(drafts[cat.id]?.homepageOrder ?? cat.metadata?.homepage_order ?? cat.metadata?.homepage_rank ?? 0) > 0 ? (drafts[cat.id]?.homepageOrder ?? cat.metadata?.homepage_order ?? cat.metadata?.homepage_rank) : "Varsayılan (0)"}`}>
                <Star className="h-3 w-3" />
                Vitrin{(drafts[cat.id]?.homepageOrder ?? cat.metadata?.homepage_order ?? cat.metadata?.homepage_rank ?? 0) > 0 ? ` #${drafts[cat.id]?.homepageOrder ?? cat.metadata?.homepage_order ?? cat.metadata?.homepage_rank}` : ""}
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-3.5 text-xs text-slate-500 max-w-[180px] truncate">
          {cat.description || "—"}
        </td>
        <td className="px-4 py-3.5 text-xs font-mono text-slate-500">
          {cat.handle}
        </td>
        <td className="px-4 py-3.5 text-xs text-slate-600 font-semibold">
          {children.length > 0 ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200/60">
              {children.length} alt içerik
            </span>
          ) : (
            <span className="text-slate-400 font-mono">0</span>
          )}
        </td>
        <td className="px-4 py-3.5 text-center">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shadow-2xs border ${
              (cat.product_count || 0) > 0
                ? "bg-rose-50/90 text-[#C98484] border-rose-200/80"
                : "bg-slate-50 text-slate-400 border-slate-200/60"
            }`}
            title={
              cat.direct_product_count !== undefined && cat.direct_product_count !== cat.product_count
                ? `Doğrudan bağlı: ${cat.direct_product_count} ürün | Alt kategoriler dahil: ${cat.product_count} ürün`
                : `${cat.name} kategorisine bağlı ${cat.product_count ?? 0} ürün`
            }
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span>{cat.product_count ?? 0} ürün</span>
          </span>
        </td>
        <td className="px-4 py-3.5 text-right">
          {/* Lumiya Style Actions Column */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => startEdit(cat)}
              className="admin-btn admin-btn-secondary !min-h-8 !px-3 !py-1.5 text-xs"
              title="Kategoriyi Düzenle"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Düzenle</span>
            </button>

            <button
              type="button"
              onClick={() => toggleHomepageVisibility(cat)}
              disabled={homepageUpdatingIds.includes(cat.id)}
              aria-pressed={isHomepage}
              className={`inline-flex min-h-8 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] font-extrabold transition-colors disabled:cursor-wait disabled:opacity-60 cursor-pointer ${
                isHomepage
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-[#C98484]"
              }`}
              title={isHomepage ? "Ana sayfadan kaldır" : "Ana sayfada göster"}
            >
              {homepageUpdatingIds.includes(cat.id) ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#C98484]" />
              ) : (
                <span
                  className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
                    isHomepage ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
                      isHomepage ? "translate-x-3.5" : "translate-x-0.5"
                    }`}
                  />
                </span>
              )}
              <span className="hidden 2xl:inline">Ana Sayfa</span>
            </button>

            {/* Ana Sayfa Sıra Seçici (Sadece Aktifken Açılır) */}
            {isHomepage && (
              <div
                className="flex items-center gap-1.5 bg-amber-50/90 text-amber-900 border border-amber-200 rounded-lg px-2 py-1 text-[11px] font-extrabold shadow-2xs shrink-0 animate-in fade-in zoom-in-95 duration-150"
                title="Ana sayfada kaçıncı sırada görüneceğini seçin (0: Varsayılan sıra, 1: En başta)"
              >
                <span className="text-[10px] text-amber-800 font-black uppercase tracking-tight">Sıra:</span>
                <select
                  value={drafts[cat.id]?.homepageOrder ?? cat.metadata?.homepage_order ?? cat.metadata?.homepage_rank ?? 0}
                  onChange={(e) => updateHomepageOrder(cat, Number(e.target.value))}
                  disabled={homepageUpdatingIds.includes(cat.id)}
                  className="bg-white border border-amber-300 rounded px-1.5 py-0.5 text-xs font-black text-amber-950 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value={0}>0</option>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Delete Icon Button */}
            <button
              type="button"
              onClick={() => handleDelete(cat.id)}
              className="admin-icon-button !h-8 !w-8 text-rose-600 hover:!border-rose-200 hover:!bg-rose-50 hover:!text-rose-700 cursor-pointer"
              title="Sil"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>,
      ...children.map((child) => renderRow(child, depth + 1)),
    ]
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── MULTI-CATEGORY DRAFT MEMORY & BULK SAVE BAR (STICKY AT TOP) ── */}
      {Object.keys(drafts).length > 0 && (
        <div className="admin-draft-bar sticky top-[82px] z-30 -mt-1 mb-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="admin-draft-bar__icon">
              <CircleAlert className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-slate-900">
                <span>{Object.keys(drafts).length} kategoride kaydedilmemiş değişiklik var</span>
                <span className="admin-status-badge admin-status-badge--warning">
                  Taslak
                </span>
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                Kaydetmeden farklı kategoriler arasında geçebilirsiniz.
              </p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAllDrafts}
              disabled={saving}
              className="admin-btn admin-btn-primary"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{saving ? "Kaydediliyor..." : `Tümünü kaydet (${Object.keys(drafts).length})`}</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmDiscardModal(true)}
              className="admin-btn admin-btn-secondary"
            >
              <X className="h-4 w-4" />
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* ── HEADER ACTION BUTTON ─────────────────────────────────────────── */}
      <div className="flex justify-end mb-4">
        <button
          type="button"
          onClick={() => setShowAppearancePanel((prev) => !prev)}
          className={`admin-btn ${
            showAppearancePanel
              ? "admin-btn-secondary admin-btn-secondary--active"
              : "admin-btn-secondary"
          }`}
        >
          <Sliders className="w-4 h-4 text-[#C98484]" />
          <span>Genel görünüm ve renk ayarları</span>
          <span className="admin-status-badge !min-h-5 !px-1.5 !py-0 text-[10px]">
            {showAppearancePanel ? "Gizle" : "Aç"}
          </span>
        </button>
      </div>

      {/* ── TOP DESIGN SETTINGS CARD (COLLAPSIBLE ACCORDION) ──────────────── */}
      {showAppearancePanel && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3.5">
            <div className="flex items-center gap-2 text-rose-950 font-black text-sm">
              <Sliders className="w-4 h-4 text-[#C98484]" />
              <span>Sitedeki Tüm Kategoriler İçin Ortak Görünüm Ayarları</span>
            </div>
            {settingsMsg && (
              <span className="admin-status-badge admin-status-badge--success">
                <CircleCheck className="h-3 w-3" />
                {settingsMsg}
              </span>
            )}
          </div>

        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 items-end">
            {/* 1. Icon Size */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                İkon Boyutu
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={iconSizePx}
                  onChange={(e) => setIconSizePx(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(String(iconSizePx), 10)
                    if (isNaN(val) || val < 10) setIconSizePx(24)
                    else if (val > 120) setIconSizePx(120)
                    else setIconSizePx(val)
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-l-lg text-xs font-extrabold text-[#C98484] focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] outline-none"
                />
                <span className="px-2 py-1.5 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-[11px] font-bold text-slate-500">
                  px
                </span>
              </div>
            </div>

            {/* 2. Font Size */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Yazı Boyutu
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  min={8}
                  max={36}
                  value={fontSizePx}
                  onChange={(e) => setFontSizePx(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(String(fontSizePx), 10)
                    if (isNaN(val) || val < 8) setFontSizePx(12)
                    else if (val > 36) setFontSizePx(36)
                    else setFontSizePx(val)
                  }}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-l-lg text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] outline-none"
                />
                <span className="px-2 py-1.5 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-[11px] font-bold text-slate-500">
                  px
                </span>
              </div>
            </div>

            {/* 3. Font Weight */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Font Kalınlığı
              </label>
              <select
                value={fontWeightVal}
                onChange={(e) => setFontWeightVal(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] outline-none cursor-pointer"
              >
                <option value="400">Normal (400)</option>
                <option value="500">Orta (500)</option>
                <option value="600">Yarı Kalın (600)</option>
                <option value="700">Kalın (700)</option>
                <option value="800">Ekstra Kalın (800)</option>
              </select>
            </div>

            {/* 4. Icon Color */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                İkon Rengi
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={iconColorVal}
                  onChange={(e) => setIconColorVal(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-300 p-0.5 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={iconColorVal}
                  onChange={(e) => setIconColorVal(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-[11px] font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            {/* 5. Text Color */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Yazı Rengi
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={textColorVal}
                  onChange={(e) => setTextColorVal(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-300 p-0.5 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={textColorVal}
                  onChange={(e) => setTextColorVal(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-[11px] font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            {/* 6. Icon BG Color */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Kutu Rengi
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={iconBgVal}
                  onChange={(e) => setIconBgVal(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-300 p-0.5 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={iconBgVal}
                  onChange={(e) => setIconBgVal(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-[11px] font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            {/* 7. Live Preview Pill */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Canlı Önizleme
              </label>
              <div className="h-[34px] px-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 overflow-hidden">
                <span
                  style={{
                    backgroundColor: iconBgVal || "#fcf7f6",
                    color: iconColorVal || "#C98484",
                  }}
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                >
                  <AppIcon name="drill" className="w-3.5 h-3.5" />
                </span>
                <span
                  style={{
                    fontSize: `${Math.min(13, Number(fontSizePx) || 13)}px`,
                    fontWeight: fontWeightVal,
                    color: textColorVal || "#1e293b",
                  }}
                  className="truncate whitespace-nowrap"
                >
                  Akülü Vidalama
                </span>
              </div>
            </div>

            {/* 8. Apply Button */}
            <div>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="admin-btn admin-btn-primary h-[34px] w-full"
              >
                {savingSettings ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Uygula</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── MAIN CONTENT GRID (FORM + TABLE) ─────────────────────────────── */}
      <div className="category-admin-layout">
        {/* Category editor */}
        <div className="category-editor-panel flex-shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-2 shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                {editId ? (
                  <>
                    <Edit3 className="w-4 h-4 text-[#C98484]" />
                    <span>Kategoriyi Düzenle</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-[#C98484]" />
                    <span>Yeni Kategori Ekle</span>
                  </>
                )}
              </h2>

              {/* ANA SAYFADA GÖSTER CHECKBOX & SIRA SEÇİCİ */}
              <div className="flex items-center gap-2 flex-wrap">
                <label className="admin-checkbox-card">
                  <input
                    type="checkbox"
                    checked={showOnHomepage}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setShowOnHomepage(checked)
                      if (editId) {
                        updateDraftFields({ showOnHomepage: checked })
                      }
                    }}
                    className="w-4 h-4 rounded text-[#C98484] focus:ring-[#C98484] accent-[#C98484] cursor-pointer"
                  />
                  <span>Ana Sayfada Göster</span>
                </label>

                {showOnHomepage && (
                  <div className="flex items-center gap-1.5 bg-rose-50/90 text-[#C98484] border border-rose-200/90 rounded-xl px-2.5 py-1 text-xs font-black shadow-2xs animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[11px] text-slate-700 font-extrabold">Sıra:</span>
                    <select
                      value={homepageOrder}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setHomepageOrder(val)
                        if (editId) {
                          updateDraftFields({ homepageOrder: val })
                        }
                      }}
                      className="bg-white border border-rose-300 rounded-lg px-2 py-0.5 text-xs font-black text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
                    >
                      <option value={0}>0 (Varsayılan)</option>
                      {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num}. sırada
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {editId && (
              <button
                type="button"
                onClick={handleRequestNewCategory}
                className="admin-btn admin-btn-secondary !min-h-8 !px-3 !py-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Yeni Kategori Ekle</span>
              </button>
            )}
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="admin-notice admin-notice--success mx-5 mt-4">
              <div className="flex items-center gap-2">
                <CircleCheck className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="admin-icon-button !h-7 !w-7 !min-h-7 ml-2"
                aria-label="Bildirimi kapat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div
            ref={editorScrollRef}
            className="category-editor-body p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar"
          >
            {error && (
              <div className="admin-notice admin-notice--danger">
                <CircleAlert className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Step 1: Temel Bilgiler */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#C98484] text-white text-[11px] font-black inline-flex items-center justify-center shrink-0 shadow-xs">
                  1
                </span>
                <span className="font-extrabold text-slate-900 text-xs tracking-tight">
                  Temel Bilgiler
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-[420px]:grid-cols-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kategori Adı <span className="text-[#C98484]">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Matkap"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    URL Bağlantı Kısaltması (Slug)
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => {
                      const val = e.target.value
                      setHandle(val)
                      if (editId) updateDraftFields({ handle: val })
                    }}
                    placeholder="matkap"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] outline-none transition-all bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Üst Kategori
                </label>
                <select
                  value={parentId}
                  onChange={(e) => {
                    const val = e.target.value
                    setParentId(val)
                    if (editId) updateDraftFields({ parentId: val })
                  }}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] outline-none transition-all bg-white cursor-pointer"
                >
                  <option value="">Bağımsız Kategori (Ana Kategori)</option>
                  {categories
                    .filter((c) => !c.parent_category_id && c.id !== editId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Step 2: Görsel ve İkon */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#C98484] text-white text-[11px] font-black inline-flex items-center justify-center shrink-0 shadow-xs">
                  2
                </span>
                <span className="font-extrabold text-slate-900 text-xs tracking-tight">
                  Görsel ve İkon
                </span>
              </div>

              {/* 2-Column Side-by-Side Icon & Image Selection Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option A: Category Icon */}
                <div className="flex flex-col justify-between p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Kategori İkonu
                      </label>
                      {icon && (
                        <button
                          type="button"
                          onClick={() => setIcon("")}
                          className="admin-text-action admin-text-action--danger"
                        >
                          Sıfırla
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-9 h-9 rounded-xl bg-rose-100/70 border border-rose-200 text-[#C98484] flex items-center justify-center shrink-0">
                        <AppIcon name={icon} fallback="box" className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-extrabold text-slate-900 truncate">
                          {selectedIconOption
                            ? selectedIconOption.label
                            : icon
                            ? icon
                            : "Varsayılan İkon"}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {icon ? "İkon seçildi" : "Otomatik atanır"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIconTarget("category")
                      setIsIconModalOpen(true)
                    }}
                    className="admin-btn admin-btn-secondary w-full !text-[11px]"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>İkon Kütüphanesi</span>
                  </button>
                </div>

                {/* Option B: Category Image (PNG / Media Image) */}
                <div className="flex flex-col justify-between p-2.5 bg-slate-50/70 border border-slate-200/90 rounded-xl">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Kategori Görseli
                      </label>
                      {design.cardImageUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setDesign((current) => ({
                              ...current,
                              cardImageUrl: "",
                            }))
                          }
                          className="admin-text-action admin-text-action--danger"
                        >
                          Kaldır
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-10 h-9 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                        {design.cardImageUrl ? (
                          <img
                            src={design.cardImageUrl}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[9px] text-slate-400">Görsel Yok</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-extrabold text-slate-900 truncate">
                          {design.cardImageUrl ? "Görsel Seçildi" : "Görsel Eklenmedi"}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {design.cardImageUrl
                            ? "Sitede gösterilir"
                            : "PNG / Fotoğraf"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMediaTarget("cardImageUrl")}
                    className="admin-btn admin-btn-secondary w-full !text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Medyadan Seç</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Açıklama (İsteğe Bağlı)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => {
                  const val = e.target.value
                  setDescription(val)
                  if (editId) updateDraftFields({ description: val })
                }}
                placeholder="Kategori hakkında kısa açıklama..."
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvancedDesign((prev) => !prev)}
                className="w-full py-2.5 px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-between transition-colors shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#C98484]" />
                  <span>Gelişmiş kapak ve banner tasarımı</span>
                </div>
                <span className="text-slate-500 font-extrabold text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                  {showAdvancedDesign ? "Gizle ▲" : "Göster ▼"}
                </span>
              </button>

              {showAdvancedDesign && (
                <div className="space-y-6 pt-2 animate-in slide-in-from-top-2 duration-150">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                      <h3 className="text-xs font-black text-rose-900">
                        {parentId ? "Alt Kategori Kapak & Vitrin Banner Tasarımı" : "Ana Kategori Vitrin Tasarımı"}
                      </h3>
                      <p className="mt-1 text-[10px] leading-relaxed text-rose-700">
                        Kategori sayfasının geniş kapak alanını, kapak görselini, başlık ve fayda kartlarını buradan yönetin.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="space-y-1">
                        <span className="block text-[11px] font-bold text-slate-700">
                          Üst Etiket
                        </span>
                        <input
                          value={design.eyebrow}
                          onChange={(event) =>
                            setDesign((current) => ({
                              ...current,
                              eyebrow: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="block text-[11px] font-bold text-slate-700">
                          Vitrin Başlığı
                        </span>
                        <input
                          value={design.displayTitle}
                          onChange={(event) =>
                            setDesign((current) => ({
                              ...current,
                              displayTitle: event.target.value,
                            }))
                          }
                          placeholder={name || "Kategori adı kullanılır"}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        {
                          key: "heroImageUrl" as const,
                          label: "Masaüstü Kapak Görseli",
                          value: design.heroImageUrl,
                        },
                        {
                          key: "heroMobileImageUrl" as const,
                          label: "Mobil Kapak Görseli",
                          value: design.heroMobileImageUrl,
                        },
                      ].map((imageField) => (
                        <div
                          key={imageField.key}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <span className="block text-[11px] font-bold text-slate-700">
                            {imageField.label}
                          </span>
                          <div className="mt-2 flex h-24 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                            {imageField.value ? (
                              <img
                                src={imageField.value}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                Görsel seçilmedi
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setMediaTarget(imageField.key)}
                              className="admin-btn admin-btn-secondary flex-1 !min-h-8 !px-2 !py-1.5 !text-[10px]"
                            >
                              Medyadan Seç
                            </button>
                            {imageField.value && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDesign((current) => ({
                                    ...current,
                                    [imageField.key]: "",
                                  }))
                                }
                                className="admin-btn admin-btn-danger !min-h-8 !px-2 !py-1.5 !text-[10px]"
                              >
                                Kaldır
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["Kapak Yüksekliği", "heroHeight", 280, 620, "px"],
                        ["Mobil Yükseklik", "heroMobileHeight", 200, 440, "px"],
                        ["Görsel Alanı", "heroImageWidth", 35, 70, "%"],
                        ["Başlık Boyutu", "titleSize", 32, 72, "px"],
                        ["Mobil Başlık", "titleSizeMobile", 24, 48, "px"],
                      ].map(([label, key, min, max, suffix]) => (
                        <label key={String(key)} className="space-y-1">
                          <span className="block text-[10px] font-bold text-slate-600">
                            {label}
                          </span>
                          <div className="flex">
                            <input
                              type="number"
                              min={Number(min)}
                              max={Number(max)}
                              value={Number(design[key as keyof CategoryDesignForm])}
                              onChange={(event) =>
                                setDesign((current) => ({
                                  ...current,
                                  [key]: Number(event.target.value),
                                }))
                              }
                              className="min-w-0 flex-1 rounded-l-lg border border-slate-300 px-2 py-2 text-xs"
                            />
                            <span className="rounded-r-lg border border-l-0 border-slate-300 bg-slate-100 px-2 py-2 text-[10px] text-slate-500">
                              {suffix}
                            </span>
                          </div>
                        </label>
                      ))}
                      <label className="space-y-1">
                        <span className="block text-[10px] font-bold text-slate-600">
                          Görsel Odağı
                        </span>
                        <select
                          value={design.heroObjectPosition}
                          onChange={(event) =>
                            setDesign((current) => ({
                              ...current,
                              heroObjectPosition: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"
                        >
                          <option value="center">Orta</option>
                          <option value="left">Sol</option>
                          <option value="right">Sağ</option>
                          <option value="top">Üst</option>
                          <option value="bottom">Alt</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="block text-[10px] font-bold text-slate-600">
                          Kapak Zemin Rengi
                        </span>
                        <input
                          type="color"
                          value={design.heroBackground}
                          onChange={(event) =>
                            setDesign((current) => ({
                              ...current,
                              heroBackground: event.target.value,
                            }))
                          }
                          className="h-9 w-full rounded-lg border border-slate-300 bg-white p-1"
                        />
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-[11px] font-black text-slate-800">
                          Kapak Özellikleri
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          Kapak açıklamasının altında gösterilen üç kısa fayda.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {design.features.map((feature, index) => (
                          <div
                            key={`feature-${index}`}
                            className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5"
                          >
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                title="İkon değiştirmek için tıklayın"
                                onClick={() => {
                                  setIconTarget(`feature-${index}`)
                                  setIsIconModalOpen(true)
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50/80 text-[#C98484] border border-rose-200/90 shadow-2xs hover:bg-rose-100 hover:border-[#C98484] hover:scale-105 transition-all cursor-pointer group shrink-0"
                              >
                                <AppIcon
                                  name={feature.icon}
                                  fallback="shield"
                                  className="h-4.5 w-4.5 group-hover:scale-110 transition-transform"
                                />
                              </button>
                              <span className="text-[10px] font-bold text-slate-400">
                                Özellik #{index + 1}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1.5 min-w-0">
                              <input
                                value={feature.title}
                                onChange={(event) =>
                                  updateDesignItem(
                                    "features",
                                    index,
                                    "title",
                                    event.target.value,
                                  )
                                }
                                placeholder="Özellik başlığı"
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-800 focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] outline-none"
                              />
                              <input
                                value={feature.subtitle}
                                onChange={(event) =>
                                  updateDesignItem(
                                    "features",
                                    index,
                                    "subtitle",
                                    event.target.value,
                                  )
                                }
                                placeholder="Kısa açıklama"
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] text-slate-600 focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {!parentId && (
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-[11px] font-black text-slate-800">
                            Alt Kategori Kartlarının Ortak Tasarımı
                          </h4>
                          <p className="text-[10px] text-slate-500">
                            Bu ana kategorinin bütün alt kategori kartlarına uygulanır.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="space-y-1">
                            <span className="block text-[10px] font-bold text-slate-600">
                              Sütun Sayısı
                            </span>
                            <select
                              value={design.childCardColumns}
                              onChange={(event) =>
                                setDesign((current) => ({
                                  ...current,
                                  childCardColumns: Number(event.target.value),
                                }))
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"
                            >
                              <option value={3}>3 sütun</option>
                              <option value={4}>4 sütun</option>
                            </select>
                          </label>
                          <label className="space-y-1">
                            <span className="block text-[10px] font-bold text-slate-600">
                              Görsel Yerleşimi
                            </span>
                            <select
                              value={design.childCardImageFit}
                              onChange={(event) =>
                                setDesign((current) => ({
                                  ...current,
                                  childCardImageFit: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"
                            >
                              <option value="contain">Tamamını göster</option>
                              <option value="cover">Alanı doldur</option>
                            </select>
                          </label>
                          <label className="space-y-1">
                            <span className="block text-[10px] font-bold text-slate-600">
                              Görsel Genişliği
                            </span>
                            <input
                              type="number"
                              min={80}
                              max={240}
                              value={design.childCardImageWidth}
                              onChange={(event) =>
                                setDesign((current) => ({
                                  ...current,
                                  childCardImageWidth: Number(event.target.value),
                                }))
                              }
                              className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="block text-[10px] font-bold text-slate-600">
                              Görsel Yüksekliği
                            </span>
                            <input
                              type="number"
                              min={80}
                              max={200}
                              value={design.childCardImageHeight}
                              onChange={(event) =>
                                setDesign((current) => ({
                                  ...current,
                                  childCardImageHeight: Number(event.target.value),
                                }))
                              }
                              className="w-full rounded-lg border border-slate-300 px-2 py-2 text-xs"
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {parentId && (
                      <div className="space-y-4 border-t border-slate-200 pt-4">
                        <div className="admin-notice admin-notice--info">
                          <div>
                          <h3 className="text-xs font-bold">
                            Üst Kategori Sayfasındaki Kart Görünümü
                          </h3>
                          <p className="mt-1 text-[10px] leading-relaxed">
                            Bu alt kategori, üst kategorisinin sayfasında kart olarak gösterilirken kullanılacak görsel, başlık ve açıklama.
                          </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="space-y-1">
                            <span className="block text-[11px] font-bold text-slate-700">
                              Kart Başlığı
                            </span>
                            <input
                              value={design.cardTitle}
                              onChange={(event) =>
                                setDesign((current) => ({
                                  ...current,
                                  cardTitle: event.target.value,
                                }))
                              }
                              placeholder={name || "Kategori adı kullanılır"}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                            />
                          </label>
                          <label className="space-y-1">
                            <span className="block text-[11px] font-bold text-slate-700">
                              Kart Açıklaması
                            </span>
                            <textarea
                              rows={2}
                              value={design.cardDescription}
                              onChange={(event) =>
                                setDesign((current) => ({
                                  ...current,
                                  cardDescription: event.target.value,
                                }))
                              }
                              placeholder="Alt kategori için kısa tanıtım"
                              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-xs"
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

            {/* Modern Action Bar */}
            <div className="admin-editor-actions">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="admin-btn admin-btn-primary w-full"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 stroke-[3]" />
                )}
                <span>{editId ? "Kategoriyi güncelle" : "Yeni kategori oluştur"}</span>
              </button>
            </div>
          </div>

        {/* Category hierarchy */}
        <div className="category-table-panel flex-1 min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Table Header & Bulk Toolbar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Kategori ara..."
                className="px-3.5 py-1.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] outline-none w-44"
              />
              <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                {filtered.length} Kategori
              </span>
              <span className="text-xs font-black text-[#C98484] bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200/80 shadow-2xs flex items-center gap-1.5" title="Sitedeki tüm 141 ürün kategorilere eksiksiz atanmıştır">
                <Package className="w-3.5 h-3.5 text-[#C98484]" />
                141 Ürün Dağıtıldı
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                {selectedIds.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[#C98484] font-extrabold">
                    <Check className="h-3 w-3" />
                    {selectedIds.length} seçili
                  </span>
                ) : (
                  "Toplu İşlem:"
                )}
              </span>

              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="text-xs font-bold text-slate-800 border-none bg-slate-100 rounded-lg px-2.5 py-1 outline-none cursor-pointer"
              >
                <option value="">Eylem Seçin</option>
                <option value="delete">Seçilenleri sil</option>
              </select>

              <button
                type="button"
                onClick={handleApplyBulk}
                disabled={selectedIds.length === 0 || !bulkAction || deletingBulk}
                className="admin-btn admin-btn-primary !min-h-8 !px-3 !py-1 text-xs"
              >
                Uygula
              </button>

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-xs font-bold text-red-500 hover:text-red-700 ml-1"
                >
                  Sıfırla
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-slate-400 font-medium text-xs">
                Kategoriler yükleniyor...
              </div>
            ) : (
              <table className="admin-table !rounded-none !border-0 !shadow-none">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-100/60 text-[11px] uppercase tracking-wider font-extrabold text-slate-500">
                    <th className="w-10 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filtered.length > 0 &&
                          selectedIds.length === filtered.length
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-[#C98484] accent-[#C98484] rounded cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Tür</th>
                    <th className="px-4 py-3">Açıklama</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Alt Kategori</th>
                    <th className="px-4 py-3 text-center">Ürün Sayısı</th>
                    <th className="px-4 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topLevel.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-12 text-center text-slate-400 font-medium text-xs"
                      >
                        Kategori bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    topLevel.map((cat) => renderRow(cat))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Single Category Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Kategoriyi Sil"
        message="Bu kategoriyi silmek istediğinize emin misiniz? Bu işlem seçilen kategoriyi sistemden kaldıracaktır."
        confirmText="Sil"
        cancelText="Vazgeç"
        onConfirm={performDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Bulk Category Delete Confirm Modal */}
      <ConfirmModal
        isOpen={confirmBulkDelete}
        title="Toplu Kategori Silme"
        message={`Seçtiğiniz ${selectedIds.length} kategoriyi tamamen silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText={`Evet, ${selectedIds.length} Kategoriyi Sil`}
        cancelText="Vazgeç"
        onConfirm={performBulkDelete}
        onCancel={() => setConfirmBulkDelete(false)}
      />

      {/* Discard Drafts Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDiscardModal}
        title="Kaydedilmemiş Değişiklikleri İptal Et?"
        message={`Hafızada kaydedilmemiş ${Object.keys(drafts).length} adet kategori değişikliğiniz bulunmaktadır. Tüm değişiklikleri iptal etmek istediğinize emin misiniz?`}
        confirmText="Evet, İptal Et"
        cancelText="Hayır, Düzenlemeye Devam Et"
        type="warning"
        onConfirm={() => {
          setDrafts({})
          if (editId) {
            const orig = categories.find((c) => c.id === editId)
            if (orig) performStartEdit(orig)
          }
          setConfirmDiscardModal(false)
        }}
        onCancel={() => setConfirmDiscardModal(false)}
      />

      {/* KURUMSAL İKON KÜTÜPHANESİ MODAL POPUP */}
      <IconPickerModal
        isOpen={isIconModalOpen}
        onClose={() => {
          setIsIconModalOpen(false)
          setIconTarget("category")
        }}
        onSelect={handleIconSelect}
      />
      <MediaSelectorModal
        isOpen={Boolean(mediaTarget)}
        onClose={() => setMediaTarget(null)}
        onSelect={(urls) => {
          const selectedUrl = urls[0]
          if (mediaTarget && selectedUrl) {
            setDesign((current) => ({
              ...current,
              [mediaTarget]: selectedUrl,
            }))
            setIsDirty(true)
          }
          setMediaTarget(null)
        }}
      />
    </div>
  )
}
