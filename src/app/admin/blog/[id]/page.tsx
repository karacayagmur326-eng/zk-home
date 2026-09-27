"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  Eye,
  Trash2,
  Globe,
  Tag,
  Plus
} from "lucide-react"
import RichTextEditorField from "../../components/RichTextEditorField"
import MediaSelectorModal from "../../components/MediaSelectorModal"
import ConfirmModal from "../../components/ConfirmModal"

function slugify(text: string): string {
  if (!text) return ""
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çÇ]/g, "c")
    .replace(/[ğĞ]/g, "g")
    .replace(/[ıİ]/g, "i")
    .replace(/[öÖ]/g, "o")
    .replace(/[şŞ]/g, "s")
    .replace(/[üÜ]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

interface Category {
  id: string
  name: string
  slug: string
  icon?: string
}

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  const isNew = id === "yeni"
  const router = useRouter()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  // Form fields
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [originalSlug, setOriginalSlug] = useState("")
  const [isEditingSlug, setIsEditingSlug] = useState(false)
  const [tempSlug, setTempSlug] = useState("")

  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [image, setImage] = useState("")
  const [author, setAuthor] = useState("Editör")
  const [readingTime, setReadingTime] = useState("5 dk")
  const [status, setStatus] = useState<"published" | "draft">("published")
  const [featured, setFeatured] = useState(false)
  const [publishedAt, setPublishedAt] = useState(new Date().toISOString().slice(0, 10))
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")

  // Categories
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCatId, setSelectedCatId] = useState("")
  const [catInput, setCatInput] = useState("")

  // Modals
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    // Load categories
    fetch("/api/admin/blog/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories)
          if (isNew && data.categories.length > 0 && !selectedCatId) {
            setSelectedCatId(data.categories[0].id)
          }
        }
      })

    if (!isNew) {
      fetch(`/api/admin/blog/posts/${id}`)
        .then((r) => {
          if (r.status === 401) {
            router.push("/admin")
            return null
          }
          return r.json()
        })
        .then((data) => {
          if (data?.post) {
            const p = data.post
            setTitle(p.title || "")
            setSlug(p.slug || "")
            setOriginalSlug(p.slug || "")
            setSelectedCatId(p.category_id || "")
            setExcerpt(p.excerpt || "")
            setContent(p.content || "")
            setImage(p.image || "")
            setAuthor(p.author || "Editör")
            setReadingTime(p.reading_time || "5 dk")
            setStatus(p.status || "published")
            setFeatured(!!p.featured)
            setPublishedAt(p.published_at ? p.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10))
            setSeoTitle(p.seo_title || "")
            setSeoDescription(p.seo_description || "")
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [id, isNew])

  function handleTitleChange(val: string) {
    setTitle(val)
    if (isNew || !slug) {
      setSlug(slugify(val))
    }
  }

  async function addCategory() {
    if (!catInput.trim()) return
    try {
      const res = await fetch("/api/admin/blog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catInput.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        const newCat: Category = {
          id: data.id,
          name: catInput.trim(),
          slug: data.slug,
        }
        setCategories((prev) => [...prev, newCat])
        setSelectedCatId(data.id)
        setCatInput("")
      }
    } catch (e) {
      console.error(e)
    }
  }

  async function handleSave(forcedStatus?: "published" | "draft") {
    if (!title.trim()) {
      setError("Makale başlığı zorunludur.")
      return
    }

    setSaving(true)
    setError("")

    try {
      const url = isNew ? "/api/admin/blog/posts" : `/api/admin/blog/posts/${id}`
      const method = isNew ? "POST" : "PUT"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || slugify(title),
          category_id: selectedCatId || null,
          excerpt: excerpt.trim(),
          content,
          image,
          author: author.trim() || "Editör",
          reading_time: readingTime.trim() || "5 dk",
          status: forcedStatus ?? status,
          featured,
          seo_title: seoTitle.trim() || title.trim(),
          seo_description: seoDescription.trim() || excerpt.trim(),
          published_at: publishedAt,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Kaydetme sırasında bir hata oluştu.")
        return
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)

      if (isNew && data.id) {
        router.push(`/admin/blog/${data.id}`)
      }
    } catch (err: any) {
      setError(err.message || "Kaydetme hatası")
    } finally {
      setSaving(false)
    }
  }

  async function performDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/admin/blog/posts/${id}`, { method: "DELETE" })
      router.push("/admin/blog")
    } catch (err) {
      console.error(err)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center space-y-3 text-slate-400 font-sans">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C98484] border-t-transparent" />
        <p className="text-xs font-semibold">Makale verileri yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/blog")}
            className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4 text-[#C98484]" />
            <span>Geri</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && slug && (
            <a
              href={`/blog/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              <span>Sitede Gör</span>
            </a>
          )}

          {!isNew && (
            <button
              type="button"
              onClick={() => setIsConfirmDeleteOpen(true)}
              disabled={deleting}
              className="h-10 px-4 rounded-xl border border-red-200 bg-white text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>{deleting ? "Siliniyor..." : "Makaleyi Sil"}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold shadow-xs">
          {error}
        </div>
      )}

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs flex items-center gap-2">
          <Check className="h-4 w-4 stroke-[3]" />
          <span>Değişiklikler başarıyla kaydedildi.</span>
        </div>
      )}

      {/* Main Two-Column Layout (Matching Products View) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT COLUMN */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          
          {/* Card 1: Makale Adı & Kalıcı Bağlantı & Makale Özeti */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-2">Makale adı</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Makale başlığı girin..."
                className="w-full h-11 px-4 rounded-xl border border-slate-200/90 bg-slate-50/40 text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-[#C98484] transition-all placeholder:text-slate-300"
              />

              {/* Permalink with Edit Inline */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-2">
                <span>Kalıcı bağlantı:</span>
                {isEditingSlug ? (
                  <div className="inline-flex items-center gap-2">
                    <span className="text-slate-500">/blog/</span>
                    <input
                      type="text"
                      value={tempSlug}
                      onChange={(e) => setTempSlug(e.target.value)}
                      className="h-7 px-2 border border-[#C98484] rounded-md text-xs font-semibold text-slate-900 outline-none w-48"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const finalSlug = slugify(tempSlug)
                        if (finalSlug) setSlug(finalSlug)
                        setIsEditingSlug(false)
                      }}
                      className="h-7 px-3 bg-[#C98484] text-white rounded-md text-xs font-bold cursor-pointer"
                    >
                      Tamam
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingSlug(false)}
                      className="h-7 px-2 border border-slate-200 rounded-md text-xs text-slate-500 cursor-pointer"
                    >
                      İptal
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-[#C98484] font-semibold underline">
                      /blog/{slug || "makale-adresi"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTempSlug(slug || slugify(title))
                        setIsEditingSlug(true)
                      }}
                      className="px-2 py-0.5 border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Düzenle
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Ürün Özeti Gibi: Makale Özeti (WordPress Klasik Editör) */}
            <div>
              <RichTextEditorField
                label="Makale Özeti"
                value={excerpt}
                onChange={setExcerpt}
                rows={5}
                placeholder="Makalenin kısa özetini girin (Arama sonuçlarında ve liste kartında gösterilir)..."
              />
            </div>
          </div>

          {/* Card 2: Makale İçeriği (Ana WordPress Metin Editörü) */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900">Makale İçeriği</h3>
            <div>
              <RichTextEditorField
                label="Makale Detayı"
                value={content}
                onChange={setContent}
                rows={16}
                minHeight={400}
                placeholder="Makalenizin tam metnini buraya yazın..."
              />
            </div>
          </div>

          {/* Card 3: Google SEO & Arama Motoru Optimizasyonu */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe className="w-4 h-4 text-[#C98484]" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Arama Motoru Optimizasyonu (Google SEO)
              </h3>
            </div>

            {/* Google Search Snippet Preview */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <div className="text-[11px] text-emerald-800 font-mono truncate">
                {typeof window !== "undefined" ? window.location.origin : ""} › blog › {slug || "ornek-makale"}
              </div>
              <div className="text-sm font-bold text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                {seoTitle || title || "Makale Başlığı"}
              </div>
              <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                {seoDescription || excerpt || "Makale kısa açıklaması burada arama sonuçlarında gösterilecektir."}
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Özel SEO Başlığı (Meta Title)
                </label>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder={title || "Google başlığı (Boş bırakılırsa makale başlığı kullanılır)"}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Özel SEO Açıklaması (Meta Description)
                </label>
                <textarea
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder={excerpt || "Google arama sonuçlarında görünecek açıklama (Boş bırakılırsa özet kullanılır)"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#C98484] leading-relaxed"
                />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT SIDEBAR (Matching Products Sidebar) */}
        <div className="w-full lg:w-[280px] xl:w-[300px] shrink-0 space-y-5">
          
          {/* Card 1: Yayınla / Güncelle */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              {isNew ? "Yayınla" : "Güncelle"}
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

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Yayın Tarihi</label>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold outline-none focus:border-[#C98484]"
              />
            </div>

            <div className="pt-1 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="accent-[#C98484] h-4 w-4 rounded"
                />
                <span>★ Öne Çıkan Makale</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="w-full h-11 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Kaydediliyor..." : saved ? "✓ Kaydedildi" : isNew ? "Makaleyi Yayınla" : "Güncelle"}
            </button>
          </div>

          {/* Card 2: Öne Çıkan Görsel (Matching Product Thumbnail Box) */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Öne Çıkan Görsel
            </h3>
            <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              {image ? (
                <div className="space-y-3 w-full text-center group">
                  <div className="h-52 w-full rounded-xl border border-slate-200 overflow-hidden bg-white flex items-center justify-center p-2 relative">
                    <img src={image} alt="featured" className="max-w-full max-h-full object-contain" />
                    {/* Hover Overlay for change */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                      <button
                        type="button"
                        onClick={() => setIsMediaModalOpen(true)}
                        className="bg-white text-slate-900 text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm hover:bg-slate-50 cursor-pointer"
                      >
                        Değiştir
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImage("")}
                    className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Görseli kaldır
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMediaModalOpen(true)}
                  className="py-4 text-xs font-extrabold text-[#C98484] hover:underline cursor-pointer"
                >
                  + Öne Çıkan Görseli Ayarla
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Makale Kategorileri (Matching Product Category Box) */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Makale Kategorileri
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-2 text-xs font-semibold text-slate-700 pr-1">
              {[...categories]
                .sort((a, b) => a.name.localeCompare(b.name, "tr"))
                .map((cat) => {
                  const isSelected = selectedCatId === cat.id
                  return (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer ${
                        isSelected ? "bg-rose-50/80 font-bold text-slate-900" : "hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="blog_category"
                        checked={isSelected}
                        onChange={() => setSelectedCatId(cat.id)}
                        className="accent-[#C98484] h-4 w-4 rounded"
                      />
                      <span>{cat.name}</span>
                    </label>
                  )
                })}
            </div>

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
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* Card 4: Yazar ve Okuma Süresi */}
          <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Yazar & Okuma Detayı
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Yazar İsmi</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Editör / Yazar Adı"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C98484]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tahmini Okuma Süresi</label>
                <input
                  type="text"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                  placeholder="5 dk"
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-[#C98484]"
                />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Media Selector Modal */}
      <MediaSelectorModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(urls) => {
          if (urls.length > 0) {
            setImage(urls[0])
          }
          setIsMediaModalOpen(false)
        }}
        multi={false}
        allowIcons={false}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={performDelete}
        title="Makaleyi Sil"
        message="Bu makaleyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        type="danger"
      />
    </div>
  )
}
