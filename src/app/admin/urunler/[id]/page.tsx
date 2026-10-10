"use client"
import SeoFields from "../../components/SeoFields"
import { productFieldIssues } from "@lib/commerce/product-validation"
import { plainText } from "@lib/seo/entity"
import AdminTabs from "@components/admin/AdminTabs"

import { useUrlState } from "@lib/hooks/use-url-state"

import ProductMediaEditor from "../../components/ProductMediaEditor"
import { productHandleFromTitle } from "@lib/util/product-handle"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import MediaSelectorModal from "../../components/MediaSelectorModal"
import ProductCategoryPicker from "../../components/ProductCategoryPicker"
import RichTextEditorField from "../../components/RichTextEditorField"
import ProductUsageFields from "../../components/ProductUsageFields"
import { formatTryPriceInput, parseTryPriceInput } from "@lib/util/money"
import { useProductFormError } from "@lib/admin/use-product-form-error"
import ConfirmModal from "../../components/ConfirmModal"
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Undo,
  Redo,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
  Eye,
} from "lucide-react"

interface Category {
  id: string
  name: string
  parent_category_id: string | null
}
interface Collection {
  id: string
  title: string
}
interface Tag {
  id: string
  value: string
}
interface Variant {
  id: string
  sku?: string
  prices?: Array<{ amount: number; currency_code: string }>
  manage_inventory?: boolean
  inventory_quantity?: number
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useUrlState<string>("general", "tab", ["general", "metadata", "stock", "shipping"])

  // Form fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [usageTitle, setUsageTitle] = useState("")
  const [usageContent, setUsageContent] = useState("")
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [thumbnail, setThumbnail] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [handle, setHandle] = useState("")
  const [originalHandle, setOriginalHandle] = useState("")
  const [price, setPrice] = useState("")
  const [comparePrice, setComparePrice] = useState("")
  const hasDiscountPrice = Boolean(price.trim())
  const effectivePriceInput = hasDiscountPrice ? price : comparePrice
  const { error, setError, errorField, fieldProps } = useProductFormError(activeTab, setActiveTab, hasDiscountPrice ? "price" : "normal-price")
  const [sku, setSku] = useState("")
  const [barcode, setBarcode] = useState("")
  const [manageInv, setManageInv] = useState(false)
  const [inventoryQty, setInventoryQty] = useState("")
  const [seoMetadata, setSeoMetadata] = useState<Record<string, any>>({})
  const [shortDesc, setShortDesc] = useState("")
  const [weight, setWeight] = useState("")
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [selectedColId, setSelectedColId] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [catInput, setCatInput] = useState("")
  const [colInput, setColInput] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [variantId, setVariantId] = useState<string | null>(null)
  const [isThumbModalOpen, setIsThumbModalOpen] = useState(false)
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [isEditingHandle, setIsEditingHandle] = useState(false)
  const [tempHandle, setTempHandle] = useState("")

  // Metadata (Custom fields)
  const [featuresContent, setFeaturesContent] = useState("")
  const [packageContent, setPackageContent] = useState<string[]>([])
  const [techSpecs, setTechSpecs] = useState<{ key: string; value: string }[]>([])
  const [descriptionBullets, setDescriptionBullets] = useState<string[]>([])
  const [shippingFree, setShippingFree] = useState(false)
  const [shippingFast, setShippingFast] = useState(false)
  const [warrantyYears, setWarrantyYears] = useState("")

  // Dropdown data
  const [categories, setCategories] = useState<Category[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then((r) => r.json()),
      fetch("/api/admin/collections").then((r) => r.json()),
      fetch("/api/admin/product-tags").then((r) => r.json()),
      fetch(`/api/admin/products/${id}`).then((r) => {
        if (r.status === 401) {
          router.push("/admin")
          return null
        }
        return r.json()
      }),
    ])
      .then(([catData, colData, tagData, prodData]) => {
        setCategories(catData.categories || [])
        setCollections(colData.collections || [])
        setAllTags(tagData.tags || [])

        if (prodData?.product) {
          const p = prodData.product
          setTitle(p.title || "")
          setHandle(p.handle || "")
          setOriginalHandle(p.handle || "")
          setDescription(p.description || "")
          setStatus(p.status || "draft")
          setThumbnail(p.thumbnail || "")
          setImages((p.images || []).map((img: any) => img.url))
          setWeight(p.weight?.toString() || "")
          setLength(p.length?.toString() || "")
          setWidth(p.width?.toString() || "")
          setHeight(p.height?.toString() || "")
          setSelectedCats((p.categories || []).map((c: any) => c.id))
          setSelectedColId(p.collection?.id || "")
          setSelectedTags((p.tags || []).map((t: any) => t.id))
          if (p.variants?.length) {
            const v: Variant = p.variants[0]
            setVariantId(v.id)
            setSku(v.sku || "")
            setManageInv(v.manage_inventory || false)
            setInventoryQty(v.inventory_quantity?.toString() || "")
            const pr = v.prices?.[0]
            const currentAmount = pr?.amount || 0
            const normalAmount = Number(p.metadata?.original_price) || 0
            const discounted = normalAmount > currentAmount && currentAmount > 0
            setComparePrice(formatTryPriceInput((discounted ? normalAmount : currentAmount || normalAmount) / 100))
            setPrice(discounted ? formatTryPriceInput(currentAmount / 100) : "")
          }

          const md = p.metadata || {}
          setSeoMetadata(md)
          setUsageTitle(typeof md.usage_title === "string" ? md.usage_title : "")
          setUsageContent(typeof md.usage_content === "string" ? md.usage_content : "")
          setShortDesc(
            typeof md.product_summary === "string"
              ? md.product_summary
              : typeof md.short_description === "string"
                ? md.short_description
                : ""
          )
          setFeaturesContent(
            typeof md.features_content === "string" ? md.features_content : ""
          )
          setPackageContent(md.package_content || [])
          setTechSpecs(md.tech_specs || [])
          setDescriptionBullets(md.description_bullets || [])
          setShippingFree(md.shipping_free || false)
          setShippingFast(md.shipping_fast || false)
          setWarrantyYears(md.warranty_years != null ? String(md.warranty_years) : "")
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  function toggleCat(catId: string) {
    setSelectedCats((s) => (s.includes(catId) ? s.filter((x) => x !== catId) : [...s, catId]))
  }

  async function addTag() {
    const val = tagInput.trim()
    if (!val) return
    try {
      const res = await fetch("/api/admin/product-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: val }),
      })
      const responseText = await res.text()
      let data: any = {}
      if (responseText) {
        try {
          data = JSON.parse(responseText)
        } catch {
          data = { error: `Sunucu geçersiz yanıt döndürdü (${res.status}).` }
        }
      } else {
        data = { error: `Sunucu boş yanıt döndürdü (${res.status}).` }
      }
      if (!res.ok) throw new Error(data.error || "Etiketler eklenemedi.")
      const created = Array.isArray(data.tags) ? data.tags : []
      if (created.length) {
        setAllTags((current) => {
          const byId = new Map(current.map((tag) => [tag.id, tag]))
          created.forEach((tag: Tag) => byId.set(tag.id, tag))
          return Array.from(byId.values())
        })
        setSelectedTags((current) =>
          Array.from(new Set([...current, ...created.map((tag: Tag) => tag.id)]))
        )
      }
      setTagInput("")
    } catch (e: any) {
      setError(e?.message || "Etiketler eklenemedi.")
    }
  }

  async function addCategory() {
    const val = catInput.trim()
    if (!val) return
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: val, is_active: true, is_internal: false }),
      })
      const data = await res.json()
      if (data.product_category) {
        setCategories((s) => [...s, data.product_category])
        setSelectedCats((s) => [...s, data.product_category.id])
      }
    } catch (e) {}
    setCatInput("")
  }

  async function addCollection() {
    const val = colInput.trim()
    if (!val) return
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: val }),
      })
      const data = await res.json()
      if (data.collection) {
        setCollections((s) => [...s, data.collection])
        setSelectedColId(data.collection.id)
      }
    } catch (e) {}
    setColInput("")
  }

  async function handleSave(forcedStatus?: "published" | "draft") {
    if (!String(title || "").trim()) {
      setError("Ürün adı zorunludur.")
      return
    }
    if (!String(sku || "").trim()) {
      setActiveTab("stock")
      setError("Stok kodu (SKU) kullanıcı tarafından girilmelidir.")
      return
    }
    const parsedPrice = parseTryPriceInput(effectivePriceInput)
    if ((forcedStatus ?? status) === "published" && (!Number.isFinite(parsedPrice) || parsedPrice <= 0)) {
      setError("Lütfen geçerli bir fiyat girin! Fiyatı 0 TL olan ürünler sitede yayınlanamaz.")
      return
    }
    const issues = productFieldIssues({ title, description, status: forcedStatus ?? status,
      metadata: { ...seoMetadata, product_summary: shortDesc }, thumbnail, images,
      collection_id: selectedColId, categories: selectedCats,
      variants: [{ sku, manage_inventory: manageInv, inventory_quantity: inventoryQty,
        prices: [{ currency_code: "try", amount: parsedPrice * 100 }] }] })
    if (issues.length) { setError(issues[0].message); return }
    setSaving(true)
    setError("")

    try {
      const safeTitle = String(title || "").trim()
      const safeDesc = String(description || "").trim()
      const safeWarranty = String(warrantyYears || "").trim()
      const safeComparePrice = String(comparePrice || "").trim()
      const safeHandle = String(handle || "").trim()

      const body: Record<string, unknown> = {
        title: safeTitle,
        description: safeDesc,
        status: forcedStatus ?? status,
        metadata: {
          ...seoMetadata,
          product_summary: shortDesc.trim(),
          usage_title: usageTitle.trim(),
          usage_content: usageContent.trim(),
          features: [],
          features_content: featuresContent.trim(),
          package_content: (packageContent || []).filter((c) => typeof c === "string" && c.trim()),
          description_bullets: (descriptionBullets || []).filter((b) => typeof b === "string" && b.trim()),
          tech_specs: (techSpecs || []).filter((s) => s && s.key && s.value),
          shipping_free: Boolean(shippingFree),
          shipping_fast: Boolean(shippingFast),
          warranty_years: safeWarranty || undefined,
          original_price: hasDiscountPrice && safeComparePrice
            ? Math.round(parseTryPriceInput(safeComparePrice) * 100)
            : null,
        },
      }

      if (safeHandle && safeHandle !== originalHandle) {
        body.handle = safeHandle
      }

      const parsedPrice = parseTryPriceInput(effectivePriceInput)
      const variantPrices = effectivePriceInput.trim() ? [{ currency_code: "try", amount: Math.round(parsedPrice * 100) }] : []
      const variantData: Record<string, unknown> = {
        title: "Varsayılan",
        prices: variantPrices,
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        manage_inventory: manageInv,
        inventory_quantity:
          manageInv && inventoryQty !== ""
            ? Math.max(0, Math.floor(Number(inventoryQty)))
            : undefined,
      }
      if (variantId) variantData.id = variantId
      body.variants = [variantData]

      body.categories = selectedCats.map((cid) => ({ id: cid }))
      if (selectedColId) body.collection_id = selectedColId
      body.tags = selectedTags.map((tid) => ({ id: tid }))
      body.thumbnail = thumbnail
      if (images.length || thumbnail) {
        body.images = Array.from(new Set([...images, thumbnail].filter(Boolean))).map((url) => ({ url }))
      } else {
        body.images = []
      }
      if (weight) body.weight = parseFloat(String(weight))
      if (length) body.length = parseFloat(String(length))
      if (width) body.width = parseFloat(String(width))
      if (height) body.height = parseFloat(String(height))

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        let errorMsg = data.error || "Bir hata oluştu"
        if (errorMsg.includes("Product with handle") && errorMsg.includes("already exists")) {
          errorMsg = "Bu ürün adresi (URL) zaten başka bir üründe kullanılıyor."
        }
        setError(errorMsg)
        return
      }
      setOriginalHandle(data.product?.handle || safeHandle || originalHandle)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e.message || "Kaydetme sırasında hata oluştu")
    } finally {
      setSaving(false)
    }
  }

  async function performDelete() {
    setDeleting(true)
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
    router.push("/admin/urunler")
  }

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400 font-sans">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C98484] border-t-transparent" />
        <p className="text-xs font-semibold">Ürün verileri yükleniyor...</p>
      </div>
    )
  }

  const tabs = [
    { key: "general", label: "Genel" },
    { key: "metadata", label: "Özellikler" },
    { key: "stock", label: "Stok" },
    { key: "shipping", label: "Gönderim" },
  ]

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 text-[#C98484]" />
            <span>Geri</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {handle && (
            <a
              href={`/urunler/${handle}`}
              target="_blank"
              rel="noreferrer"
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              <span>Sitede Gör</span>
            </a>
          )}

          <button
            onClick={() => setIsConfirmDeleteOpen(true)}
            disabled={deleting}
            className="h-10 px-4 rounded-xl border border-red-200 bg-white text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>{deleting ? "Siliniyor..." : "Ürünü Sil"}</span>
          </button>
        </div>
      </div>

      {error && (
        <div id="product-form-error" role="alert" tabIndex={-1} className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold shadow-xs">
          {error}
        </div>
      )}

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs flex items-center gap-2">
          <Check className="h-4 w-4 stroke-[3]" />
          <span>Değişiklikler başarıyla kaydedildi.</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Card 1: Ürün Adı & Ürün Açıklaması */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">Ürün adı</label>
              <input
                type="text"
                value={title}
                {...fieldProps("title")}
                aria-label="Ürün adı"
                onChange={(e) => {
                  const nextTitle = e.target.value
                  const nextHandle = productHandleFromTitle(nextTitle)
                  setTitle(nextTitle)
                  setHandle(nextHandle)
                  setTempHandle(nextHandle)
                  setSaved(false)
                  if (errorField === "title") setError("")
                }}
                placeholder="Ürün adı"
                className="w-full h-11 px-4 rounded-xl border border-slate-200/90 bg-slate-50/40 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#C98484] transition-all placeholder:text-slate-300"
              />
              {errorField === "title" && <p id="product-title-error" className="mt-2 text-xs text-red-700">{error}</p>}

              {/* Permalink */}
              {handle && (
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-2">
                  <span>Kalıcı bağlantı:</span>
                  {isEditingHandle ? (
                    <div className="inline-flex items-center gap-2">
                      <span className="text-slate-500">/urunler/</span>
                      <input
                        type="text"
                        value={tempHandle}
                        onChange={(e) => setTempHandle(e.target.value)}
                        className="h-7 px-2 border border-[#C98484] rounded-md text-xs font-semibold text-slate-900 outline-none w-44"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const finalHandle = tempHandle
                            .trim()
                            .toLowerCase()
                            .replace(/[^a-z0-9\-]/g, "-")
                          if (finalHandle) setHandle(finalHandle)
                          setIsEditingHandle(false)
                        }}
                        className="h-7 px-3 bg-[#C98484] text-white rounded-md text-xs font-bold"
                      >
                        Tamam
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingHandle(false)}
                        className="h-7 px-2 border border-slate-200 rounded-md text-xs text-slate-500"
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[#C98484] font-semibold underline">
                        /urunler/{handle}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempHandle(handle)
                          setIsEditingHandle(true)
                        }}
                        className="px-2 py-0.5 border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Düzenle
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Ürün Özeti (WordPress Klasik Editör) */}
            <div tabIndex={-1} {...fieldProps("summary")}>
              <RichTextEditorField
                label="Ürün Özeti *"
                value={shortDesc}
                onChange={setShortDesc}
                rows={6}
                placeholder="Ürünün kısa özetini girin..."
              />
            </div>
          </div>

          <SeoFields value={seoMetadata} onChange={setSeoMetadata} title={title} description={plainText(shortDesc)} images={Array.from(new Set([thumbnail, ...images].filter(Boolean)))} />

          {/* Card 2: Ürün Verisi (Tabbed Box) */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-extrabold text-slate-900">Ürün verisi</h3>

            {/* Tabs Header Bar */}
            <AdminTabs label="Ürün bilgileri"
              value={activeTab}
              onChange={setActiveTab}
              items={tabs.map(({ key, label }) => ({ value: key, label }))}/>

            {/* Tab Contents */}
            <div className="pt-2">
              {/* GENEL TAB */}
              {activeTab === "general" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Normal Fiyat (TL){" "}
                        {!hasDiscountPrice && <span className="text-[#C98484]">*Geçerli Fiyat</span>}
                      </label>
                      <input
                        type="text"
                        value={comparePrice}
                        {...fieldProps("normal-price")}
                        aria-label="Normal ürün fiyatı"
                        onChange={(e) => { setComparePrice(e.target.value); if (errorField === "normal-price") setError("") }}
                        onBlur={() => comparePrice && setComparePrice(formatTryPriceInput(comparePrice))}
                        inputMode="decimal"
                        placeholder="0,00"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                      />
                      {errorField === "normal-price" && <p id="product-normal-price-error" className="mt-2 text-xs text-red-700">{error}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        İndirimli Fiyat (TL){" "}
                        {hasDiscountPrice && <span className="text-[#C98484]">*Geçerli Fiyat</span>}
                      </label>
                      <input
                        type="text"
                        value={price}
                        {...fieldProps("price")}
                        aria-label="İndirimli ürün fiyatı"
                        onChange={(e) => { setPrice(e.target.value); if (errorField === "price" || errorField === "normal-price") setError("") }}
                        onBlur={() => price && setPrice(formatTryPriceInput(price))}
                        inputMode="decimal"
                        placeholder="0,00"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                      />
                      {errorField === "price" && <p id="product-price-error" className="mt-2 text-xs text-red-700">{error}</p>}
                    </div>
                  </div>

                  <div tabIndex={-1} {...fieldProps("description")}>
                    <RichTextEditorField
                      label="Ürün Açıklaması *"
                      value={description}
                      onChange={setDescription}
                      placeholder="Ürün hakkında detaylı açıklama..."
                      minHeight={250}
                      rows={10}
                    />
                  </div>
                  <ProductUsageFields title={usageTitle} content={usageContent} onTitleChange={setUsageTitle} onContentChange={setUsageContent} />
                </div>
              )}

              {/* STOK TAB */}
              {activeTab === "stock" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Stok kodu (SKU) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={sku}
                        {...fieldProps("sku")}
                        aria-label="Stok kodu (SKU)"
                        onChange={(e) => { setSku(e.target.value); if (errorField === "sku") setError("") }}
                        required
                        autoComplete="off"
                        placeholder="Stok kodunu girin"
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                      />
                      {errorField === "sku" && <p id="product-sku-error" className="mt-2 text-xs text-red-700">{error}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Barkod
                      </label>
                      <input
                        type="text"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Stok adedi
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={inventoryQty} {...fieldProps("stock")}
                        onChange={(e) => {
                          setInventoryQty(e.target.value)
                          if (e.target.value) setManageInv(true)
                        }}
                        placeholder="Sınırsız..."
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer pt-1 mb-2">
                    <input
                      type="checkbox"
                      checked={manageInv}
                      onChange={(e) => setManageInv(e.target.checked)}
                      className="accent-[#C98484] h-4 w-4 rounded"
                    />
                    <span>Stok takibini etkinleştir</span>
                  </label>
                </div>
              )}

              {/* GÖNDERİM TAB */}
              {activeTab === "shipping" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ağırlık (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="0"
                      className="w-48 h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Boyutlar (cm)
                    </label>
                    <div className="flex items-center gap-2 max-w-md">
                      <input
                        type="number"
                        placeholder="Uzunluk"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold outline-none"
                      />
                      <span className="text-slate-400 font-bold">×</span>
                      <input
                        type="number"
                        placeholder="Genişlik"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold outline-none"
                      />
                      <span className="text-slate-400 font-bold">×</span>
                      <input
                        type="number"
                        placeholder="Yükseklik"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* EKSTRA ÖZELLİKLER TAB */}
              {activeTab === "metadata" && (
                <div className="text-xs text-slate-700">
                  <RichTextEditorField
                    label="Ürün özellikleri"
                    value={featuresContent}
                    onChange={setFeaturesContent}
                    placeholder="Ürünün özelliklerini yazın..."
                    minHeight={220}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-full lg:w-[280px] xl:w-[300px] shrink-0 space-y-5">
          {/* Card 1: Yayınla */}
          <div className="rounded-2xl bg-white border border-[#EADBD4]/70 p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-[#F3ECE8] pb-3">
              Güncelle
            </h3>

            <div className="flex items-center justify-between text-xs font-bold text-slate-700 pt-1">
              <span>Durum:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                className="h-8 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold outline-none focus:border-[#C98484] cursor-pointer"
              >
                <option value="draft">Taslak</option>
                <option value="published">Yayında</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="w-full h-11 rounded-xl bg-[#C98484] hover:bg-[#AF7272] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : saved ? "✓ Kaydedildi" : "Güncelle"}
            </button>
          </div>

          <div tabIndex={-1} {...fieldProps("image")}><ProductMediaEditor thumbnail={thumbnail} images={images} onCoverChange={setThumbnail} onImagesChange={setImages}
            onUploadCover={() => setIsThumbModalOpen(true)} onUploadGallery={() => setIsGalleryModalOpen(true)} /></div>

          {/* Card 4: Ürün Kategorileri */}
          <div className="rounded-2xl bg-white border border-[#EADBD4]/70 p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 border-b border-[#F3ECE8] pb-3">
              Ürün Kategorileri
            </h3>
            <div tabIndex={-1} {...fieldProps("category")}><ProductCategoryPicker categories={categories} selected={selectedCats} onToggle={toggleCat} /></div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Yeni kategori..."
                value={catInput}
                onChange={(e) => setCatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCategory()
                  }
                }}
                className="flex-1 h-9 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#C98484]"
              />
              <button
                type="button"
                onClick={addCategory}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 shrink-0"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* Card 5: Ürün Etiketleri */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                Ürün Etiketleri
              </h3>
              {allTags.length > 0 && (
                <span className="text-[11px] font-bold text-slate-400">
                  {selectedTags.length}/{allTags.length} seçili
                </span>
              )}
            </div>

            {selectedTags.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Seçili Etiketler</p>
                <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
                  {selectedTags.map((id) => {
                    const tag = allTags.find((t) => t.id === id)
                    const label = tag ? (tag.value.includes("-") ? tag.value.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : tag.value) : id
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200/80 text-xs font-bold text-rose-700 shadow-2xs transition-all hover:bg-rose-100/80"
                      >
                        <span>{label}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedTags((s) => s.filter((x) => x !== id))}
                          className="hover:text-red-600 font-black text-xs leading-none transition-colors cursor-pointer"
                          title="Etiketi kaldır"
                        >
                          ✕
                        </button>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Available Tags to Add */}
            {allTags.filter((t) => !selectedTags.includes(t.id)).length > 0 && (
              <div className="pt-1">
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Tüm Etiketler</p>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {allTags
                    .filter((t) => !selectedTags.includes(t.id))
                    .map((tag) => {
                      const label = tag.value.includes("-") ? tag.value.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : tag.value
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => setSelectedTags((s) => [...s, tag.id])}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 text-xs font-medium text-slate-700 hover:text-rose-700 transition-all cursor-pointer"
                        >
                          <span className="text-slate-400 font-bold text-[10px]">+</span>
                          <span>{label}</span>
                        </button>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Quick Add Tag Input */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Etiketleri virgülle ayırarak ekleyin..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
                className="flex-1 h-9 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#C98484] bg-slate-50/50 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={addTag}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer"
              >
                + Ekle
              </button>
            </div>
          </div>

          {/* Card 6: Marka */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Marka
            </h3>
            <select
              value={selectedColId} {...fieldProps("brand")}
              onChange={(e) => setSelectedColId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-[#C98484] cursor-pointer"
            >
              <option value="">Marka seçin...</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Yeni marka..."
                value={colInput}
                onChange={(e) => setColInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCollection()
                  }
                }}
                className="flex-1 h-9 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#C98484]"
              />
              <button
                type="button"
                onClick={addCollection}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 shrink-0"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>
      </div>

      <MediaSelectorModal
        isOpen={isThumbModalOpen}
        onClose={() => setIsThumbModalOpen(false)}
        onSelect={(urls) => setThumbnail(urls[0])}
        multi={false}
      />

      <MediaSelectorModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
        onSelect={(urls) => setImages((prev) => Array.from(new Set([...prev, ...urls])))}
        addedUrls={[...images, thumbnail].filter(Boolean)}
        multi={true}
        allowIcons={false}
      />

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Ürünü Sil"
        message="Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmText="Sil"
        cancelText="Vazgeç"
        onConfirm={performDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  )
}
