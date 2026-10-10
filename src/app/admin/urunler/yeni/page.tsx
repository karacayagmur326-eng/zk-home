"use client"
import SeoFields from "../../components/SeoFields"
import { productFieldIssues } from "@lib/commerce/product-validation"
import { plainText } from "@lib/seo/entity"
import AdminTabs from "@components/admin/AdminTabs"

import { useUrlState } from "@lib/hooks/use-url-state"

import ProductMediaEditor from "../../components/ProductMediaEditor"
import { productHandleFromTitle } from "@lib/util/product-handle"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import MediaSelectorModal from "../../components/MediaSelectorModal"
import ProductCategoryPicker from "../../components/ProductCategoryPicker"
import RichTextEditorField from "../../components/RichTextEditorField"
import ProductUsageFields from "../../components/ProductUsageFields"
import { formatTryPriceInput, parseTryPriceInput } from "@lib/util/money"
import { useProductFormError } from "@lib/admin/use-product-form-error"
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
  X,
  UploadCloud,
  ChevronDown,
  Eye,
  Save,
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

export default function NewProductPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useUrlState<string>("general", "tab", ["general", "metadata", "stock", "shipping"])

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [usageTitle, setUsageTitle] = useState("")
  const [usageContent, setUsageContent] = useState("")
  const [seoMetadata, setSeoMetadata] = useState<Record<string, any>>({})
  const [shortDesc, setShortDesc] = useState("")
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [thumbnail, setThumbnail] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [handle, setHandle] = useState("")
  const [isThumbModalOpen, setIsThumbModalOpen] = useState(false)
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [isEditingHandle, setIsEditingHandle] = useState(false)
  const [tempHandle, setTempHandle] = useState("")

  // Pricing
  const [price, setPrice] = useState("")
  const [comparePrice, setComparePrice] = useState("")
  const hasDiscountPrice = Boolean(price.trim())
  const effectivePriceInput = hasDiscountPrice ? price : comparePrice
  const { error, setError, errorField, fieldProps } = useProductFormError(activeTab, setActiveTab, hasDiscountPrice ? "price" : "normal-price")

  // Stock / Shipping
  const [sku, setSku] = useState("")
  const [barcode, setBarcode] = useState("")
  const [manageInventory, setManageInventory] = useState(false)
  const [inventoryQty, setInventoryQty] = useState("")
  const [stockStatus, setStockStatus] = useState("in_stock")
  const [weight, setWeight] = useState("")
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")

  // Metadata (Custom fields)
  const [featuresContent, setFeaturesContent] = useState("")
  const [packageContent, setPackageContent] = useState<string[]>([])
  const [techSpecs, setTechSpecs] = useState<{ key: string; value: string }[]>([])
  const [descriptionBullets, setDescriptionBullets] = useState<string[]>([])
  const [shippingFree, setShippingFree] = useState(false)
  const [shippingFast, setShippingFast] = useState(false)
  const [warrantyYears, setWarrantyYears] = useState("")

  // Relations
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [selectedColId, setSelectedColId] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [catInput, setCatInput] = useState("")
  const [colInput, setColInput] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  // Data for dropdowns
  const [categories, setCategories] = useState<Category[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
    fetch("/api/admin/collections")
      .then((r) => r.json())
      .then((d) => setCollections(d.collections || []))
    fetch("/api/admin/product-tags")
      .then((r) => r.json())
      .then((d) => setAllTags(d.tags || []))
  }, [])

  function toggleCat(id: string) {
    setSelectedCats((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
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
        setSelectedTagIds((current) =>
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

  async function handleSave(publishStatus?: "published" | "draft") {
    if (!title.trim()) {
      setError("Ürün adı zorunludur.")
      return
    }
    if (!sku.trim()) {
      setActiveTab("stock")
      setError("Stok kodu (SKU) kullanıcı tarafından girilmelidir.")
      return
    }
    const parsedPrice = parseTryPriceInput(effectivePriceInput)
    if ((publishStatus ?? status) === "published" && (!Number.isFinite(parsedPrice) || parsedPrice <= 0)) {
      setError("Lütfen geçerli bir fiyat girin! Fiyatı 0 TL olan ürünler sitede yayınlanamaz.")
      return
    }
    const issues = productFieldIssues({ title, description, status: publishStatus ?? status,
      metadata: { ...seoMetadata, product_summary: shortDesc }, thumbnail, images,
      collection_id: selectedColId, categories: selectedCats,
      variants: [{ sku, manage_inventory: manageInventory, inventory_quantity: inventoryQty,
        prices: [{ currency_code: "try", amount: parsedPrice * 100 }] }] })
    if (issues.length) { setError(issues[0].message); return }
    setSaving(true)
    setError("")

    const finalStatus = publishStatus ?? status

    const body: Record<string, unknown> = {
      title: title.trim(),
      handle: handle.trim() || undefined,
      description: description.trim() || undefined,
      status: finalStatus,
      metadata: {
          ...seoMetadata,
        product_summary: shortDesc.trim(),
        usage_title: usageTitle.trim(),
        usage_content: usageContent.trim(),
        features: [],
        features_content: featuresContent.trim(),
        package_content: packageContent.filter((c) => c.trim()),
        description_bullets: descriptionBullets.filter((b) => b.trim()),
        tech_specs: techSpecs.filter((s) => s.key && s.value),
        shipping_free: shippingFree,
        shipping_fast: shippingFast,
        warranty_years: warrantyYears,
        original_price: hasDiscountPrice && comparePrice.trim()
          ? Math.round(parseTryPriceInput(comparePrice) * 100)
          : null,
      },
    }

    // Variant with pricing + stock
    const variantPrices = []
    if (effectivePriceInput.trim()) {
      const parsedPrice = parseTryPriceInput(effectivePriceInput)
      variantPrices.push({ currency_code: "try", amount: Math.round(parsedPrice * 100) })
    }
    body.options = [{ title: "Varsayılan", values: ["Default"] }]
    body.variants = [
      {
        title: "Varsayılan",
        sku: sku.trim(),
        barcode: barcode.trim() || undefined,
        manage_inventory: manageInventory,
        inventory_quantity: manageInventory && inventoryQty ? parseInt(inventoryQty) : undefined,
        allow_backorder: stockStatus === "on_backorder",
        prices: variantPrices,
        options: { Varsayılan: "Default" },
      },
    ]

    if (selectedCats.length) body.categories = selectedCats.map((id) => ({ id }))
    if (selectedColId) body.collection_id = selectedColId
    if (selectedTagIds.length) body.tags = selectedTagIds.map((id) => ({ id }))
    if (thumbnail) body.thumbnail = thumbnail
    if (images.length || thumbnail) {
      body.images = Array.from(new Set([...images, thumbnail].filter(Boolean))).map((url) => ({ url }))
    }
    if (weight) body.weight = parseFloat(weight)
    if (length) body.length = parseFloat(length)
    if (width) body.width = parseFloat(width)
    if (height) body.height = parseFloat(height)

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Bir hata oluştu")
        setSaving(false)
        return
      }
      router.push("/admin/urunler")
    } catch (e: any) {
      setError(e.message)
      setSaving(false)
    }
  }

  const tabs = [
    { key: "general", label: "Genel" },
    { key: "metadata", label: "Özellikler" },
    { key: "stock", label: "Stok" },
    { key: "shipping", label: "Gönderim" },
  ]

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16">

      {error && (
        <div id="product-form-error" role="alert" tabIndex={-1} className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold shadow-xs">
          {error}
        </div>
      )}

      {/* Main Two-Column Layout (Mockup Birebir) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Card 1: Ürün Adı & Ürün Açıklaması */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-5">
            {/* Ürün Adı */}
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">Ürün adı</label>
              <input
                type="text"
                value={title}
                {...fieldProps("title")}
                aria-label="Ürün adı"
                onChange={(e) => {
                  if (errorField === "title") setError("")
                  const val = e.target.value
                  setTitle(val)
                  const nextHandle = productHandleFromTitle(val)
                  setHandle(nextHandle)
                  setTempHandle(nextHandle)
                }}
                placeholder="Ürün adı"
                className="w-full h-11 px-4 rounded-xl border border-slate-200/90 bg-slate-50/40 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#C98484] transition-all placeholder:text-slate-300"
              />
              {errorField === "title" && <p id="product-title-error" className="mt-2 text-xs text-red-700">{error}</p>}

              {/* Permalink */}
              {title && (
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
                        GTIN / UPC / EAN / Barkod
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
                          if (e.target.value) setManageInventory(true)
                        }}
                        placeholder="Sınırsız..."
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer pt-1 mb-2">
                    <input
                      type="checkbox"
                      checked={manageInventory}
                      onChange={(e) => setManageInventory(e.target.checked)}
                      className="accent-[#C98484] h-4 w-4 rounded"
                    />
                    <span>Stok takibini etkinleştir</span>
                  </label>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Stok durumu
                    </label>
                    <div className="space-y-2 text-xs font-semibold text-slate-700">
                      {[
                        { value: "in_stock", label: "Stokta" },
                        { value: "out_of_stock", label: "Stokta yok" },
                        { value: "on_backorder", label: "Ön Siparişte" },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name="stock_status"
                            value={opt.value}
                            checked={stockStatus === opt.value}
                            onChange={() => setStockStatus(opt.value)}
                            className="accent-[#C98484]"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
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

        {/* RIGHT SIDEBAR (Mockup Birebir) */}
        <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0 space-y-5">
          {/* Card 1: Yayınla */}
          <div className="rounded-2xl bg-white border border-[#EADBD4]/70 p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Yayınla
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSave("draft")}
                disabled={saving}
                className="h-9 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Taslak Kaydet
              </button>
              <button
                type="button"
                className="h-9 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Ön İzleme
              </button>
            </div>

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
              onClick={() => handleSave("published")}
              disabled={saving}
              className="w-full h-11 rounded-xl bg-[#C98484] hover:bg-[#AF7272] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : "Yayınla"}
            </button>
          </div>

          <div tabIndex={-1} {...fieldProps("image")}><ProductMediaEditor thumbnail={thumbnail} images={images} onCoverChange={setThumbnail} onImagesChange={setImages}
            onUploadCover={() => setIsThumbModalOpen(true)} onUploadGallery={() => setIsGalleryModalOpen(true)} /></div>

          {/* Card 4: Ürün Kategorileri */}
          <div className="rounded-2xl bg-white border border-[#EADBD4]/70 p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
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
          <div className="rounded-2xl bg-white border border-[#EADBD4]/70 p-4 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Ürün Etiketleri
            </h3>

            {/* Selected Tag Badges */}
            {selectedTagIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
                {selectedTagIds.map((id) => {
                  const tag = allTags.find((t) => t.id === id)
                  return tag ? (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700"
                    >
                      <span>{tag.value}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTagIds((s) => s.filter((x) => x !== id))}
                        className="hover:text-red-600 font-black text-sm"
                      >
                        ×
                      </button>
                    </span>
                  ) : null
                })}
              </div>
            )}

            {/* Available Tags to Add */}
            {allTags.filter((t) => !selectedTagIds.includes(t.id)).length > 0 && (
              <div className="pt-2">
                <p className="text-[11px] font-medium text-slate-500 mb-2">Tüm etiketler — eklemek için tıklayın</p>
                <div className="flex flex-wrap gap-1.5">
                  {allTags
                    .filter((t) => !selectedTagIds.includes(t.id))
                    .map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => setSelectedTagIds((s) => [...s, tag.id])}
                        className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        + {tag.value}
                      </button>
                    ))}
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
                className="flex-1 h-9 px-3 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#C98484]"
              />
              <button
                type="button"
                onClick={addTag}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 shrink-0"
              >
                + Oluştur
              </button>
            </div>
          </div>

          {/* Card 6: Marka */}
          <div className="rounded-2xl bg-white border border-[#EADBD4]/70 p-4 shadow-sm space-y-3">
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
    </div>
  )
}
