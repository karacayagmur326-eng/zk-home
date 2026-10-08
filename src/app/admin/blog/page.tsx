"use client"
import { useUrlState } from "@lib/hooks/use-url-state"
import AdminTabs from "@components/admin/AdminTabs"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "@components/common/SmartImage"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Copy,
  Trash2,
  BookOpen,
  FolderPlus,
  ExternalLink,
  Calendar,
  RefreshCw,
  FileText,
  CheckCircle2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Save,
  Check,
  Globe,
  Sliders,
  ImageIcon,
  Sparkles,
  LayoutTemplate
} from "lucide-react"
import { AppIcon } from "@lib/icons"
import IconPickerModal from "../components/IconPickerModal"
import MediaSelectorModal from "../components/MediaSelectorModal"
import ConfirmModal from "../components/ConfirmModal"

export default function AdminBlogPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Active Main Tab: 'posts' | 'categories' | 'settings'
  const [activeMainTab, setActiveMainTab] = useUrlState<"posts" | "categories" | "settings">("posts", "tab", ["posts", "categories", "settings"])

  // Posts State
  const [posts, setPosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & State
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all")
  const [statusTab, setStatusTab] = useState(searchParams.get("status") || "")
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"))
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Status counts
  const [counts, setCounts] = useState({
    total: 0,
    published_count: 0,
    draft_count: 0,
  })

  // Category Modal & Form
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatIcon, setNewCatIcon] = useState("file-text")
  const [newCatDesc, setNewCatDesc] = useState("")
  const [isIconModalOpen, setIsIconModalOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<any | null>(null)
  const [savingCat, setSavingCat] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)

  // ─── Blog Page & Hero Settings State ───
  const [settings, setSettings] = useState<Record<string, any>>({
    title: "Ürün Rehberi ve Makaleler",
    hero_text: "Profesyonel işlerinizde size yardımcı olacak ipuçları, kullanım rehberleri ve sektörel içerikler.",
    hero_image: "/brand/placeholder.svg",
    categories_title: "Kategorilere Göre Keşfedin",
    featured_title: "Öne Çıkan İçerikler",
    popular_title: "Popüler Konular",
    banner_title: "Doğru Bilgi, Güvenli İş",
    banner_description: "Ürünlerinizden en iyi performansı almanız için hazırladığımız rehberler ve ipuçlarıyla işinizi kolaylaştırıyoruz.",
    banner_button_text: "Tüm Rehberlere Göz Atın",
    banner_button_href: "/blog",
    banner_image: "/brand/placeholder.svg",
    newsletter_title: "Yeni İçeriklerden Haberdar Olun",
    newsletter_description: "İpuçları, rehberler ve kampanyalardan ilk siz haberdar olun.",
  })
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // Media selector for settings
  const [mediaTarget, setMediaTarget] = useState<"hero_image" | "banner_image" | null>(null)

  function loadPosts() {
    setLoading(true)
    const params = new URLSearchParams()
    if (searchTerm) params.set("q", searchTerm)
    if (selectedCategory !== "all") params.set("category", selectedCategory)
    if (statusTab) params.set("status", statusTab)
    params.set("page", currentPage.toString())
    params.set("limit", "20")

    fetch(`/api/admin/blog/posts?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.posts) {
          setPosts(data.posts)
          setCategories(data.categories || [])
          setTotalPages(data.pagination?.totalPages || 1)
          setTotalCount(data.pagination?.total || 0)

          const pub = (data.posts || []).filter((p: any) => p.status === "published").length
          const dft = (data.posts || []).filter((p: any) => p.status === "draft").length
          setCounts({
            total: data.pagination?.total || 0,
            published_count: pub,
            draft_count: dft,
          })
        }
      })
      .catch((err) => console.error("Error loading blog posts:", err))
      .finally(() => setLoading(false))
  }

  function loadSettings() {
    setLoadingSettings(true)
    fetch("/api/admin/blog/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }))
        }
      })
      .catch((err) => console.error("Error loading blog settings:", err))
      .finally(() => setLoadingSettings(false))
  }

  useEffect(() => {
    loadPosts()
    loadSettings()
  }, [selectedCategory, statusTab, currentPage])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setCurrentPage(1)
    loadPosts()
  }

  async function handleToggleStatus(post: any) {
    const newStatus = post.status === "published" ? "draft" : "published"
    try {
      const res = await fetch(`/api/admin/blog/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status", status: newStatus }),
      })
      if (res.ok) {
        setPosts((current) =>
          current.map((p) => (p.id === post.id ? { ...p, status: newStatus } : p))
        )
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDuplicate(post: any) {
    try {
      const res = await fetch(`/api/admin/blog/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" }),
      })
      if (res.ok) {
        loadPosts()
        ;(window as any).showAdminAlert?.("Makale kopyalandı.", "Başarılı", "success")
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/blog/posts/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setPosts((current) => current.filter((p) => p.id !== id))
        setTotalCount((c) => Math.max(0, c - 1))
        setDeletingPostId(null)
        ;(window as any).showAdminAlert?.("Makale silindi.", "Başarılı", "success")
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCatName.trim()) return
    setSavingCat(true)
    try {
      const res = await fetch("/api/admin/blog/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCat ? editingCat.id : undefined,
          name: newCatName,
          icon: newCatIcon,
          description: newCatDesc,
        }),
      })
      if (res.ok) {
        setNewCatName("")
        setNewCatDesc("")
        setNewCatIcon("file-text")
        setEditingCat(null)
        setIsCategoryModalOpen(false)
        loadPosts()
        ;(window as any).showAdminAlert?.("Kategori kaydedildi.", "Başarılı", "success")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingCat(false)
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) return
    try {
      const res = await fetch(`/api/admin/blog/categories?id=${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setCategories((current) => current.filter((c) => c.id !== id))
        ;(window as any).showAdminAlert?.("Kategori silindi.", "Başarılı", "success")
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSavingSettings(true)
    try {
      const res = await fetch("/api/admin/blog/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSettingsSaved(true)
        setTimeout(() => setSettingsSaved(false), 2500)
        ;(window as any).showAdminAlert?.("Blog sayfa ve hero ayarları başarıyla kaydedildi.", "Başarılı", "success")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── Breadcrumbs & Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-2xl bg-rose-50 text-[#C98484] border border-rose-100">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Blog & Makale Yönetimi
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Makaleleri, kategorileri, Hero vitrinini ve alt banner alanlarını yönetin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/blog"
            target="_blank"
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <span>Blogu Sitede Gör</span>
          </Link>

          <Link
            href="/admin/blog/yeni"
            className="px-4 py-2.5 rounded-xl bg-[#C98484] text-white font-bold text-xs hover:bg-[#A95E5E] transition-all flex items-center gap-1.5 shadow-md shadow-rose-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Yeni Makale Ekle</span>
          </Link>
        </div>
      </div>

      {/* ── Top Navigation Tabs (Makaleler | Kategoriler | Sayfa & Hero Ayarları) ── */}
      <AdminTabs label="Blog bölümleri"
        value={activeMainTab}
        onChange={setActiveMainTab}
        items={[{ value: "posts", label: "Tüm Makaleler", count: totalCount, icon: FileText }, { value: "categories", label: "Kategoriler", count: categories.length, icon: FolderPlus }, { value: "settings", label: "Hero & Sayfa Tasarım Ayarları", icon: LayoutTemplate }]}/>

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 1: MAKALELER LİSTESİ
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === "posts" && (
        <div className="space-y-6">
          {/* Status Nav Pills Bar */}
          <AdminTabs label="Makale durumları"
            value={statusTab}
            onChange={(value) => { setStatusTab(value); setCurrentPage(1); }}
            items={[{ value: "", label: "Tümü", count: totalCount }, { value: "published", label: "Yayınlanmış", count: counts.published_count }, { value: "draft", label: "Taslak", count: counts.draft_count }]}/>

          {/* Filters & Search Row */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Makale başlığı veya içeriğinde ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#C98484] focus:bg-white transition"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Ara
              </button>
            </form>

            <div className="flex items-center gap-2.5">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#C98484] cursor-pointer"
              >
                <option value="all">Tüm Kategoriler ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.post_count || 0})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={loadPosts}
                className="p-2 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                title="Yenile"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Posts Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C98484] border-t-transparent" />
                <p className="text-xs font-semibold">Makaleler yükleniyor...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#C98484] flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Henüz makale bulunamadı</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Arama kriterlerinize uygun makale bulunamadı veya henüz hiç makale eklenmedi.
                </p>
                <Link
                  href="/admin/blog/yeni"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C98484] text-white text-xs font-bold hover:bg-[#A95E5E] transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  İlk Makaleyi Yaz
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center">#</th>
                      <th className="py-3.5 px-4">Görsel</th>
                      <th className="py-3.5 px-4">Makale Adı</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4">Durum</th>
                      <th className="py-3.5 px-4">Okunma</th>
                      <th className="py-3.5 px-4">Tarih</th>
                      <th className="py-3.5 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {posts.map((post, idx) => (
                      <tr key={post.id} className="hover:bg-slate-50/60 transition group">
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] text-center">
                          {(currentPage - 1) * 20 + idx + 1}
                        </td>

                        <td className="py-3 px-4 w-16">
                          <div className="w-12 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0 flex items-center justify-center">
                            {post.image ? (
                              <img
                                src={post.image}
                                alt={post.title}
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <BookOpen className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 max-w-md">
                            <Link
                              href={`/admin/blog/${post.id}`}
                              className="font-bold text-slate-900 hover:text-[#C98484] transition line-clamp-1 block text-xs"
                            >
                              {post.title}
                            </Link>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span>/blog/{post.slug}</span>
                              {post.featured && (
                                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-sans font-bold text-[9px]">
                                  ★ Öne Çıkan
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px]">
                            <AppIcon name={post.category_icon || "file-text"} className="w-3 h-3 text-[#C98484]" />
                            {post.category_name || "Kategorisiz"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(post)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                              post.status === "published"
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                            }`}
                            title="Durumu değiştirmek için tıklayın"
                          >
                            {post.status === "published" ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Yayında</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>Taslak</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px] font-medium">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 font-bold text-slate-700">
                              <Eye className="w-3 h-3 text-slate-400" />
                              <span>{post.views || 0}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{post.reading_time || "5 dk"}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {post.published_at
                                ? new Intl.DateTimeFormat("tr-TR", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }).format(new Date(post.published_at))
                                : "-"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-[#C98484] transition"
                              title="Önizle / Görüntüle"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDuplicate(post)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                              title="Makaleyi Kopyala"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <Link
                              href={`/admin/blog/${post.id}`}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#2271b1] transition"
                              title="Düzenle"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setDeletingPostId(post.id)}
                              className="p-1.5 rounded-lg border border-rose-100 bg-white hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-slate-50/80 px-4 py-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Sayfa <strong>{currentPage}</strong> / {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Önceki
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold cursor-pointer flex items-center gap-1"
                  >
                    Sonraki
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 2: KATEGORİLER YÖNETİMİ
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === "categories" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] gap-6 items-start">
            
            {/* Left: Add / Edit Category Form */}
            <form onSubmit={handleSaveCategory} className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>{editingCat ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}</span>
                {editingCat && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(null)
                      setNewCatName("")
                      setNewCatDesc("")
                      setNewCatIcon("file-text")
                    }}
                    className="text-xs text-[#C98484] font-bold hover:underline"
                  >
                    + Yeni Ekle Modu
                  </button>
                )}
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Kategori Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Akülü Vidalama Rehberleri"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Kategori İkonu</label>
                <button
                  type="button"
                  onClick={() => setIsIconModalOpen(true)}
                  className="w-full h-11 flex items-center justify-between px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 transition text-xs font-bold text-slate-800 cursor-pointer shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 text-[#C98484] flex items-center justify-center">
                      <AppIcon name={newCatIcon} className="w-4 h-4" />
                    </span>
                    <span>İkon: {newCatIcon}</span>
                  </span>
                  <span className="text-[11px] text-[#C98484] font-extrabold bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                    Seç 🎨
                  </span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Açıklama (Opsiyonel)</label>
                <textarea
                  rows={3}
                  placeholder="Kategori hakkında kısa açıklama..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#C98484] leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={savingCat}
                className="w-full h-11 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingCat ? "Kaydediliyor..." : editingCat ? "Değişiklikleri Kaydet" : "Kategoriyi Oluştur"}
              </button>
            </form>

            {/* Right: Categories Table List */}
            <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Mevcut Blog Kategorileri ({categories.length})
                </h3>
              </div>

              <div className="divide-y divide-slate-100">
                {categories.map((c, idx) => (
                  <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#C98484] shrink-0">
                        <AppIcon name={c.icon || "file-text"} className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>/blog?kategori={c.slug}</span>
                          <span className="font-sans font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                            {c.post_count || 0} makale
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCat(c)
                          setNewCatName(c.name)
                          setNewCatDesc(c.description || "")
                          setNewCatIcon(c.icon || "file-text")
                        }}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#2271b1] transition cursor-pointer shadow-2xs"
                        title="Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(c.id)}
                        className="p-2 rounded-xl border border-rose-100 bg-white hover:bg-rose-50 text-rose-500 transition cursor-pointer shadow-2xs"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 3: BLOG SAYFA, HERO VE ALT BANNER AYARLARI
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeMainTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          {/* Header Action Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-slate-900">Blog Ana Sayfa Alanları & Metinleri</h3>
              <p className="text-xs text-slate-500">
                Hero vitrini, keşif alanı başlıkları, alt banner ve bülten alanlarını buradan düzenleyin.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#C98484] hover:bg-[#A95E5E] text-white rounded-xl text-xs font-extrabold transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? "Kaydediliyor..." : settingsSaved ? "✓ Kaydedildi" : "Ayarları Kaydet"}</span>
            </button>
          </div>

          {settingsSaved && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-xs flex items-center gap-2">
              <Check className="h-4 w-4 stroke-[3]" />
              <span>Blog ana sayfa ve hero ayarları başarıyla kaydedildi.</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Card 1: Hero Vitrin Alanı (En Üst Bölüm) */}
            <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-4 h-4 text-[#C98484]" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  1. Hero Vitrin Alanı (En Üst Alan)
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Hero Sayfa Başlığı</label>
                <input
                  type="text"
                  value={settings.title || ""}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  placeholder="Ürün Rehberi ve Makaleler"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Hero Açıklama Metni</label>
                <textarea
                  rows={3}
                  value={settings.hero_text || ""}
                  onChange={(e) => setSettings({ ...settings, hero_text: e.target.value })}
                  placeholder="Profesyonel işlerinizde size yardımcı olacak ipuçları..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#C98484] leading-relaxed"
                />
              </div>

              {/* Hero Görseli */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Hero Sağ Görseli</label>
                <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  {settings.hero_image ? (
                    <div className="space-y-3 w-full text-center group">
                      <div className="h-44 w-full rounded-xl border border-slate-200 overflow-hidden bg-white flex items-center justify-center p-2 relative">
                        <img src={settings.hero_image} alt="Hero" className="max-w-full max-h-full object-contain" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <button
                            type="button"
                            onClick={() => setMediaTarget("hero_image")}
                            className="bg-white text-slate-900 text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm hover:bg-slate-50 cursor-pointer"
                          >
                            Görseli Değiştir
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, hero_image: "" })}
                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Görseli Kaldır
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMediaTarget("hero_image")}
                      className="py-4 text-xs font-extrabold text-[#C98484] hover:underline cursor-pointer"
                    >
                      + Hero Görseli Seç
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Bölüm Başlıkları */}
            <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sliders className="w-4 h-4 text-[#C98484]" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  2. Sayfa İçi Bölüm Başlıkları
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Kategoriler Alanı Başlığı</label>
                <input
                  type="text"
                  value={settings.categories_title || ""}
                  onChange={(e) => setSettings({ ...settings, categories_title: e.target.value })}
                  placeholder="Kategorilere Göre Keşfedin"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Öne Çıkan Makaleler Başlığı</label>
                <input
                  type="text"
                  value={settings.featured_title || ""}
                  onChange={(e) => setSettings({ ...settings, featured_title: e.target.value })}
                  placeholder="Öne Çıkan İçerikler"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Popüler Konular Başlığı</label>
                <input
                  type="text"
                  value={settings.popular_title || ""}
                  onChange={(e) => setSettings({ ...settings, popular_title: e.target.value })}
                  placeholder="Popüler Konular"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                />
              </div>
            </div>

            {/* Card 3: Alt Banner Alanı (Doğru Bilgi, Güvenli İş) */}
            <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ImageIcon className="w-4 h-4 text-[#C98484]" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  3. Alt Banner Alanı
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Banner Başlığı</label>
                <input
                  type="text"
                  value={settings.banner_title || ""}
                  onChange={(e) => setSettings({ ...settings, banner_title: e.target.value })}
                  placeholder="Doğru Bilgi, Güvenli İş"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Banner Açıklaması</label>
                <textarea
                  rows={3}
                  value={settings.banner_description || ""}
                  onChange={(e) => setSettings({ ...settings, banner_description: e.target.value })}
                  placeholder="Ürünlerinizden en iyi performansı almanız için hazırladığımız rehberler..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#C98484] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Buton Metni</label>
                  <input
                    type="text"
                    value={settings.banner_button_text || ""}
                    onChange={(e) => setSettings({ ...settings, banner_button_text: e.target.value })}
                    placeholder="Tüm Rehberlere Göz Atın"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Buton Linki</label>
                  <input
                    type="text"
                    value={settings.banner_button_href || ""}
                    onChange={(e) => setSettings({ ...settings, banner_button_href: e.target.value })}
                    placeholder="/blog"
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                  />
                </div>
              </div>

              {/* Banner Arka Plan Görseli */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Banner Arka Plan Görseli</label>
                <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  {settings.banner_image ? (
                    <div className="space-y-3 w-full text-center group">
                      <div className="h-40 w-full rounded-xl border border-slate-200 overflow-hidden bg-slate-900 flex items-center justify-center p-2 relative">
                        <img src={settings.banner_image} alt="Banner" className="max-w-full max-h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <button
                            type="button"
                            onClick={() => setMediaTarget("banner_image")}
                            className="bg-white text-slate-900 text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm hover:bg-slate-50 cursor-pointer"
                          >
                            Görseli Değiştir
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, banner_image: "" })}
                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Görseli Kaldır
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMediaTarget("banner_image")}
                      className="py-4 text-xs font-extrabold text-[#C98484] hover:underline cursor-pointer"
                    >
                      + Banner Görseli Seç
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Card 4: E-Bülten Alanı */}
            <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Globe className="w-4 h-4 text-[#C98484]" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  4. E-Bülten Abonelik Alanı
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bülten Başlığı</label>
                <input
                  type="text"
                  value={settings.newsletter_title || ""}
                  onChange={(e) => setSettings({ ...settings, newsletter_title: e.target.value })}
                  placeholder="Yeni İçeriklerden Haberdar Olun"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-[#C98484]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bülten Açıklaması</label>
                <textarea
                  rows={3}
                  value={settings.newsletter_description || ""}
                  onChange={(e) => setSettings({ ...settings, newsletter_description: e.target.value })}
                  placeholder="İpuçları, rehberler ve kampanyalardan ilk siz haberdar olun."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 text-xs text-slate-800 outline-none focus:bg-white focus:border-[#C98484] leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full h-11 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingSettings ? "Kaydediliyor..." : settingsSaved ? "✓ Başarıyla Kaydedildi" : "Tüm Blog Ayarlarını Kaydet"}
                </button>
              </div>
            </div>

          </div>
        </form>
      )}

      {/* ── Modals ── */}
      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#C98484]" />
                Blog Kategorileri Yönetimi
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-600 tracking-wider">
                {editingCat ? "Kategoriyi Düzenle" : "Yeni Kategori Ekle"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_80px] gap-3 items-end">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Adı</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Akülü Vidalama Rehberi"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#C98484]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">İkon</label>
                  <button
                    type="button"
                    onClick={() => setIsIconModalOpen(true)}
                    className="w-full h-9 flex items-center justify-center bg-white border border-rose-200 rounded-xl text-[#C98484] hover:bg-rose-50 cursor-pointer shadow-2xs"
                    title="İkon Değiştir"
                  >
                    <AppIcon name={newCatIcon} className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Açıklama (Opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Kategori kısa açıklaması..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-[#C98484]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                {editingCat && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(null)
                      setNewCatName("")
                      setNewCatDesc("")
                      setNewCatIcon("file-text")
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 font-bold hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Vazgeç
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-4 py-2 bg-[#C98484] hover:bg-[#A95E5E] text-white rounded-xl text-xs font-extrabold transition cursor-pointer"
                >
                  {savingCat ? "Kaydediliyor..." : editingCat ? "Güncelle" : "Kategori Ekle"}
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingPostId}
        onClose={() => setDeletingPostId(null)}
        onConfirm={() => deletingPostId && handleDelete(deletingPostId)}
        title="Makaleyi Sil"
        message="Bu makaleyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmText="Evet, Sil"
        type="danger"
      />

      {/* Icon Picker Modal */}
      <IconPickerModal
        isOpen={isIconModalOpen}
        onClose={() => setIsIconModalOpen(false)}
        onSelect={(icon) => {
          setNewCatIcon(icon)
          setIsIconModalOpen(false)
        }}
      />

      {/* Media Selector Modal for Settings */}
      <MediaSelectorModal
        isOpen={!!mediaTarget}
        onClose={() => setMediaTarget(null)}
        onSelect={(urls) => {
          if (urls.length > 0 && mediaTarget) {
            setSettings((prev) => ({ ...prev, [mediaTarget]: urls[0] }))
          }
          setMediaTarget(null)
        }}
        multi={false}
        allowIcons={false}
      />
    </div>
  )
}
