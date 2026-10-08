"use client"
import AdminTabs from "@components/admin/AdminTabs"

import { useUrlState } from "@lib/hooks/use-url-state"

import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  Folder, 
  FileText,
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  Save, 
  ChevronDown, 
  ChevronRight, 
  MoveUp, 
  MoveDown, 
  Edit3, 
  Check, 
  Menu as MenuIcon,
  LayoutGrid,
  Sparkles
} from "@lib/icons"
import ConfirmModal from "../components/ConfirmModal"
import MediaSelectorModal from "../components/MediaSelectorModal"
import { categoryPath } from "@lib/seo/category"

interface MenuItem {
  id: string
  label: string
  url: string
  type: "custom" | "category" | "page"
  children?: MenuItem[]
  expanded?: boolean
  editing?: boolean
  promo_badge?: string
  promo_title?: string
  promo_description?: string
  promo_image_url?: string
  promo_button_text?: string
  promo_button_url?: string
  promo_enabled?: boolean
}

interface Menu {
  id: string
  name: string
  items: MenuItem[]
  location: string[]
}

interface Category { id: string; name: string; handle: string }
interface PageItem { handle: string; title: string }

const MENU_LOCATIONS = [
  { label: "Header Menü (Üst Navigasyon)", value: "header-menu" },
  { label: "Kategori Sol Menü (Yan Menü)", value: "category-sidebar" },
  { label: "Footer - Kurumsal Menüsü", value: "footer-kurumsal" },
  { label: "Footer - Müşteri Hizmetleri Menüsü", value: "footer-musteri-hizmetleri" },
  { label: "Footer - Yasal Bilgilendirme Menüsü", value: "footer-yasal" },
  { label: "Footer Genel (Varsayılan Alt Linkler)", value: "footer-menu" },
  { label: "Mobil Menü", value: "secondary-menu" },
]

function generateId() {
  return Math.random().toString(36).slice(2)
}

function normalizeMenuItems(items: MenuItem[] | null | undefined): MenuItem[] {
  return (items ?? []).map(item => ({
    ...item,
    children: normalizeMenuItems(item.children),
  }))
}

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [locationSaving, setLocationSaving] = useState(false)
  const [locationSaved, setLocationSaved] = useState(false)
  const [activeTab, setActiveTab] = useUrlState<"edit" | "locations">("edit", "tab", ["edit", "locations"])
  const [categories, setCategories] = useState<Category[]>([])
  const [pages, setPages] = useState<PageItem[]>([])
  const [newMenuName, setNewMenuName] = useState("")
  const [creatingNew, setCreatingNew] = useState(false)
  const [confirmDeleteMenu, setConfirmDeleteMenu] = useState(false)
  const [mediaModalTargetItemId, setMediaModalTargetItemId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)

  // Panel accordions
  const [panelPagesOpen, setPanelPagesOpen] = useState(true)
  const [panelCatsOpen, setPanelCatsOpen] = useState(false)
  const [panelCustomOpen, setPanelCustomOpen] = useState(false)

  // Custom link inputs
  const [customUrl, setCustomUrl] = useState("")
  const [customLabel, setCustomLabel] = useState("")

  const activeMenu = menus.find(m => m.id === activeMenuId) || null

  useEffect(() => {
    fetch("/api/admin/menus")
      .then(r => r.json())
      .then(d => {
        const list: Menu[] = (d.menus || []).map((menu: Menu) => ({
          ...menu,
          items: normalizeMenuItems(menu.items),
          location: menu.location ?? [],
        }))
        setMenus(list)
        if (list.length) setActiveMenuId(list[0].id)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch("/api/admin/categories")
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))

    fetch("/api/admin/site-pages")
      .then(r => r.json())
      .then(d => {
        const rawPages = d.pages || []
        const parsed: PageItem[] = rawPages.map((p: any) => ({
          handle: p.handle,
          title: p.content?.title || p.title || p.handle,
        }))
        setPages(parsed)
      })
  }, [])

  function updateMenu(updated: Menu) {
    setMenus(ms => ms.map(m => m.id === updated.id ? updated : m))
  }

  function updateActiveMenu(patch: Partial<Menu>) {
    if (!activeMenuId) return
    setMenus(current =>
      current.map(menu =>
        menu.id === activeMenuId ? { ...menu, ...patch } : menu
      )
    )
  }

  function updateMenuItem(id: string, patch: Partial<MenuItem>) {
    if (!activeMenuId) return
    setMenus(current =>
      current.map(menu =>
        menu.id === activeMenuId
          ? { ...menu, items: updateItem(menu.items, id, patch) }
          : menu
      )
    )
  }

  function createMenu() {
    if (!newMenuName.trim()) return
    setCreatingNew(true)
    const newM: Menu = { id: generateId(), name: newMenuName.trim(), items: [], location: [] }
    fetch("/api/admin/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newM)
    })
      .then(r => r.json())
      .then(() => {
        setMenus(m => [...m, newM])
        setActiveMenuId(newM.id)
        setNewMenuName("")
        setCreatingNew(false)
      })
      .catch(() => setCreatingNew(false))
  }

  function saveMenu() {
    if (!activeMenu) return
    setSaving(true)
    setSaved(false)
    fetch("/api/admin/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activeMenu)
    })
      .then(r => r.json())
      .then(() => {
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      })
      .catch(() => setSaving(false))
  }

  function assignMenuToLocation(location: string, menuId: string) {
    setLocationSaved(false)
    setMenus(current =>
      current.map(menu => {
        const withoutLocation = menu.location.filter(item => item !== location)
        return {
          ...menu,
          location:
            menu.id === menuId
              ? [...withoutLocation, location]
              : withoutLocation,
        }
      })
    )
  }

  async function saveMenuLocations() {
    setLocationSaving(true)
    setLocationSaved(false)

    try {
      const responses = await Promise.all(
        menus.map(menu =>
          fetch("/api/admin/menus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(menu),
          })
        )
      )

      if (responses.some(response => !response.ok)) {
        throw new Error("Menü konumları kaydedilemedi.")
      }

      setLocationSaved(true)
      setTimeout(() => setLocationSaved(false), 2500)
    } finally {
      setLocationSaving(false)
    }
  }

  function performDeleteMenu() {
    if (!activeMenu) return
    setSaving(true)
    fetch(`/api/admin/menus?id=${activeMenu.id}`, { method: "DELETE" })
      .then(() => {
        const rest = menus.filter(m => m.id !== activeMenu.id)
        setMenus(rest)
        setActiveMenuId(rest.length ? rest[0].id : null)
        setSaving(false)
        setConfirmDeleteMenu(false)
      })
      .catch(() => {
        setSaving(false)
        setConfirmDeleteMenu(false)
      })
  }

  function addItemsFromPages(checkedHandles: string[]) {
    if (!activeMenu) return
    const newItems: MenuItem[] = checkedHandles.map(handle => {
      const page = pages.find(p => p.handle === handle)
      return {
        id: generateId(),
        label: page?.title || handle,
        url: `/${handle}`,
        type: "page",
        children: []
      }
    })
    updateMenu({ ...activeMenu, items: [...activeMenu.items, ...newItems] })
  }

  function addItemsFromCategories(checkedIds: string[]) {
    if (!activeMenu) return
    const newItems: MenuItem[] = checkedIds.map(id => {
      const cat = categories.find(c => c.id === id)
      return {
        id: generateId(),
        label: cat?.name || id,
        url: cat ? categoryPath(cat) : `/kategoriler/${id}`,
        type: "category",
        children: []
      }
    })
    updateMenu({ ...activeMenu, items: [...activeMenu.items, ...newItems] })
  }

  function addCustomLink() {
    if (!activeMenu || !customLabel.trim() || !customUrl.trim()) return
    const item: MenuItem = {
      id: generateId(),
      label: customLabel.trim(),
      url: customUrl.trim(),
      type: "custom",
      children: []
    }
    updateMenu({ ...activeMenu, items: [...activeMenu.items, item] })
    setCustomUrl("")
    setCustomLabel("")
  }

  function removeItem(menuItems: MenuItem[] | undefined, id: string): MenuItem[] {
    return (menuItems ?? [])
      .filter(i => i.id !== id)
      .map(i => ({ ...i, children: removeItem(i.children, id) }))
  }

  function updateItem(menuItems: MenuItem[] | undefined, id: string, patch: Partial<MenuItem>): MenuItem[] {
    return (menuItems ?? []).map(i =>
      i.id === id
        ? { ...i, ...patch, children: i.children ?? [] }
        : { ...i, children: updateItem(i.children, id, patch) }
    )
  }

  function moveItem(items: MenuItem[] | undefined, id: string, direction: "up" | "down"): MenuItem[] {
    const safeItems = items ?? []
    const idx = safeItems.findIndex(i => i.id === id)
    if (idx === -1) return safeItems.map(i => ({ ...i, children: moveItem(i.children, id, direction) }))
    const newItems = [...safeItems]
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= newItems.length) return safeItems
    ;[newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]]
    return newItems
  }

  function indentItem(items: MenuItem[] | undefined, id: string): MenuItem[] {
    const safeItems = items ?? []
    const idx = safeItems.findIndex(i => i.id === id)
    if (idx <= 0) return safeItems.map(i => ({ ...i, children: indentItem(i.children, id) }))
    const newItems = [...safeItems]
    const [target] = newItems.splice(idx, 1)
    const parent = newItems[idx - 1]
    newItems[idx - 1] = {
      ...parent,
      children: [...(parent.children ?? []), target],
    }
    return newItems
  }

  function renderItem(item: MenuItem, depth = 0) {
    const typeLabel = item.type === "page" ? "Sayfa" : item.type === "category" ? "Kategori" : "Özel Bağlantı"
    const iconBg = item.type === "page" ? "bg-emerald-50 text-emerald-600" : item.type === "category" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
    const isEditing = editingItemId === item.id

    return (
      <div key={item.id} style={{ marginLeft: depth * 24 }} className="mb-2">
        <div className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
          isEditing ? "border-slate-300 shadow-sm ring-1 ring-slate-200" : "border-slate-200/90 shadow-2xs hover:border-slate-300"
        }`}>
          {/* Header Row */}
          <div
            onClick={() => setEditingItemId(prev => prev === item.id ? null : item.id)}
            className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition select-none ${
              isEditing ? "bg-slate-50/80 border-b border-slate-100" : "bg-white hover:bg-slate-50/50"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${iconBg}`}>
                {item.type === "page" ? <FileText className="w-3.5 h-3.5" /> : item.type === "category" ? <Folder className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-800 truncate">{item.label}</span>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                  {typeLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Yukarı Taşı"
                onClick={(e) => { e.stopPropagation(); updateMenu({ ...activeMenu!, items: moveItem(activeMenu!.items, item.id, "up") }) }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <MoveUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Aşağı Taşı"
                onClick={(e) => { e.stopPropagation(); updateMenu({ ...activeMenu!, items: moveItem(activeMenu!.items, item.id, "down") }) }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <MoveDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Alt Öge Yap"
                onClick={(e) => { e.stopPropagation(); updateMenu({ ...activeMenu!, items: indentItem(activeMenu!.items, item.id) }) }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title={isEditing ? "Kapat" : "Düzenle"}
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingItemId(prev => prev === item.id ? null : item.id)
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ml-1 flex items-center gap-1.5 ${
                  isEditing 
                    ? "bg-slate-900 text-white shadow-2xs" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? "Kapat" : "Düzenle"}</span>
                {isEditing ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Edit Details Panel */}
          {isEditing && (
            <div className="p-4 bg-slate-50/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    NAVİGASYON BAŞLIĞI
                  </label>
                  <input
                    type="text"
                    value={item.label}
                    onChange={e => updateMenuItem(item.id, { label: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484] transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                    URL / BAĞLANTI
                  </label>
                  <input
                    type="text"
                    value={item.url}
                    onChange={e => updateMenuItem(item.id, { url: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484] transition"
                  />
                </div>
              </div>

              {/* Quick direct page editor link if item is a Page */}
              {(item.type === "page" || item.url.startsWith("/")) && (
                <div className="bg-slate-100/80 border border-slate-200 p-3 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Sayfa İçerik Yönetimi ({item.label}):
                  </span>
                  <Link
                    href={`/admin/sayfalar?duzenle=${item.url.replace(/^\//, '') || 'yeni'}`}
                    target="_blank"
                    className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-lg text-xs transition flex items-center gap-1 shadow-2xs"
                  >
                    Sayfa Metnini Düzenle ↗
                  </Link>
                </div>
              )}

              {/* Mega Menü Right Promo Card Settings */}
              {depth === 0 && (
                <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-3.5 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      MEGA MENÜ PROMO KART AYARLARI ({item.label})
                    </span>
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={item.promo_enabled !== false}
                        onChange={e =>
                          updateMenuItem(item.id, { promo_enabled: e.target.checked })
                        }
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      />
                      <span className={item.promo_enabled !== false ? "text-emerald-600 font-bold" : "text-slate-400 font-bold"}>
                        {item.promo_enabled !== false ? "Promo Kart Aktif" : "Promo Kart Gizli"}
                      </span>
                    </label>
                  </div>

                  {item.promo_enabled !== false && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">ROZET (BADGE)</label>
                          <input
                            type="text"
                            value={item.promo_badge ?? "ÖNE ÇIKAN"}
                            placeholder="Örn: ÖNE ÇIKAN"
                            onChange={e => updateMenuItem(item.id, { promo_badge: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484] transition"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">PROMO BAŞLIĞI</label>
                          <input
                            type="text"
                            value={item.promo_title ?? ""}
                            placeholder="Örn: Kesimde Güç, Sonuçta Mükemmellik."
                            onChange={e => updateMenuItem(item.id, { promo_title: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484] transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">PROMO AÇIKLAMA METNİ</label>
                        <input
                          type="text"
                          value={item.promo_description ?? ""}
                          placeholder="Örn: Profesyonel kesim işleriniz için üstün performanslı çözümler."
                          onChange={e => updateMenuItem(item.id, { promo_description: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484] transition"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">KART RESMİ</label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={item.promo_image_url ?? ""}
                              placeholder="/images/kesme.png"
                              onChange={e => updateMenuItem(item.id, { promo_image_url: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484] transition min-w-0"
                            />
                            <button
                              type="button"
                              onClick={() => setMediaModalTargetItemId(item.id)}
                              className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition border border-slate-200 shrink-0 cursor-pointer"
                            >
                              Görsel Seç
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">BUTON METNİ</label>
                          <input
                            type="text"
                            value={item.promo_button_text ?? ""}
                            placeholder="Örn: Testere'yi Keşfet >"
                            onChange={e => updateMenuItem(item.id, { promo_button_text: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484] transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">BUTON LİNKİ</label>
                          <input
                            type="text"
                            value={item.promo_button_url ?? ""}
                            placeholder="Örn: /kategoriler/kesme-testere"
                            onChange={e => updateMenuItem(item.id, { promo_button_url: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484] transition"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => updateMenu({ ...activeMenu!, items: removeItem(activeMenu!.items, item.id) })}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Sil / Kaldır
                </button>
              </div>
            </div>
          )}
        </div>
        {item.children?.map(child => renderItem(child, depth + 1))}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 23, fontWeight: 700, color: "#1d2327" }}>Menü Yönetimi</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#646970" }}>
            Sayfaları, kategorileri veya özel bağlantıları seçip kolayca menülerinize ekleyin.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <AdminTabs label="Menü yönetimi"
        value={activeTab}
        onChange={setActiveTab}
        items={[{ value: "edit", label: "Menüleri Düzenle", icon: MenuIcon }, { value: "locations", label: "Menü Konumları", icon: LayoutGrid }]}/>

      {activeTab === "edit" && (
        <>
          {/* Menu Selector bar */}
          <div className="admin-card" style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1d2327" }}>Düzenlenecek Menü:</span>
            <select
              className="admin-select"
              value={activeMenuId ?? ""}
              onChange={e => setActiveMenuId(e.target.value)}
              style={{ minWidth: 220, fontSize: 13, fontWeight: 600 }}
            >
              {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>

            <span style={{ color: "#94a3b8", fontSize: 13 }}>veya yeni oluştur:</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="admin-input"
                style={{ width: 180 }}
                placeholder="Örn: Header Üst Menü"
                value={newMenuName}
                onChange={e => setNewMenuName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createMenu()}
              />
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={createMenu}
                disabled={creatingNew || !newMenuName.trim()}
              >
                <Plus className="w-4 h-4" /> Oluştur
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#646970" }}>Yükleniyor...</div>
          ) : !activeMenu ? (
            <div className="admin-card" style={{ padding: 40, textAlign: "center", color: "#646970" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Henüz menü oluşturulmadı.</p>
              <p style={{ fontSize: 12 }}>Yukarıdaki alandan menü adı yazıp 'Oluştur' butonuna basın.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>

              {/* ── LEFT SIDEBAR: ITEM PICKER PANELS ── */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* 1. PAGES PANEL */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <button
                    type="button"
                    onClick={() => setPanelPagesOpen(o => !o)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", background: "#f8fafc", border: "none",
                      borderBottom: panelPagesOpen ? "1px solid #e2e8f0" : "none",
                      cursor: "pointer"
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText className="w-4 h-4 text-[#16a34a]" /> Sayfalar
                    </span>
                    {panelPagesOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>

                  {panelPagesOpen && (
                    <PagesPanel pages={pages} onAdd={addItemsFromPages} />
                  )}
                </div>

                {/* 2. CATEGORIES PANEL */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <button
                    type="button"
                    onClick={() => setPanelCatsOpen(o => !o)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", background: "#f8fafc", border: "none",
                      borderBottom: panelCatsOpen ? "1px solid #e2e8f0" : "none",
                      cursor: "pointer"
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                      <Folder className="w-4 h-4 text-[#2563eb]" /> Kategoriler
                    </span>
                    {panelCatsOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>

                  {panelCatsOpen && (
                    <CategoriesPanel categories={categories} onAdd={addItemsFromCategories} />
                  )}
                </div>

                {/* 3. CUSTOM LINKS PANEL */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                  <button
                    type="button"
                    onClick={() => setPanelCustomOpen(o => !o)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", background: "#f8fafc", border: "none",
                      borderBottom: panelCustomOpen ? "1px solid #e2e8f0" : "none",
                      cursor: "pointer"
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                      <LinkIcon className="w-4 h-4 text-[#C98484]" /> Özel Bağlantılar
                    </span>
                    {panelCustomOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>

                  {panelCustomOpen && (
                    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                      {/* Page selector dropdown */}
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#646970", marginBottom: 4 }}>SAYFA SEÇİN (OTOMATİK)</label>
                        <select
                          className="admin-select"
                          style={{ width: "100%", fontSize: 12 }}
                          onChange={e => {
                            const selectedHandle = e.target.value
                            if (!selectedHandle) return
                            const p = pages.find(item => item.handle === selectedHandle)
                            if (p) {
                              setCustomLabel(p.title)
                              setCustomUrl(`/${p.handle}`)
                            }
                          }}
                        >
                          <option value="">— Varolan bir sayfa seçin —</option>
                          {pages.map(p => (
                            <option key={p.handle} value={p.handle}>{p.title}</option>
                          ))}
                        </select>
                      </div>

                      {/* Category selector dropdown */}
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#646970", marginBottom: 4 }}>KATEGORİ SEÇİN (OTOMATİK)</label>
                        <select
                          className="admin-select"
                          style={{ width: "100%", fontSize: 12 }}
                          onChange={e => {
                            const selectedId = e.target.value
                            if (!selectedId) return
                            const c = categories.find(item => item.id === selectedId)
                            if (c) {
                              setCustomLabel(c.name)
                              setCustomUrl(categoryPath(c))
                            }
                          }}
                        >
                          <option value="">— Varolan bir kategori seçin —</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 10 }}>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#646970", marginBottom: 4 }}>URL / BAĞLANTI</label>
                        <input className="admin-input" placeholder="https://... veya /hakkimizda" value={customUrl} onChange={e => setCustomUrl(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#646970", marginBottom: 4 }}>BAĞLANTI METNİ</label>
                        <input className="admin-input" placeholder="Örn: İletişim" value={customLabel} onChange={e => setCustomLabel(e.target.value)} />
                      </div>
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        style={{ width: "100%", justifyContent: "center", padding: "8px" }}
                        onClick={addCustomLink}
                        disabled={!customLabel.trim() || !customUrl.trim()}
                      >
                        <Plus className="w-4 h-4" /> Menüye Ekle
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* ── RIGHT COLUMN: MENU STRUCTURE ── */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ padding: "14px 18px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Menü Başlığı:</label>
                  <input
                    className="admin-input"
                    style={{ maxWidth: 260, fontSize: 14, fontWeight: 700 }}
                    value={activeMenu.name}
                    onChange={e => updateActiveMenu({ name: e.target.value })}
                  />
                </div>

                <div style={{ padding: 18, minHeight: 200 }}>
                  {activeMenu.items.length === 0 ? (
                    <div style={{ padding: "36px 20px", textAlign: "center", color: "#94a3b8", border: "2px dashed #e2e8f0", borderRadius: 8 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Menünüz şu an boş.</p>
                      <p style={{ margin: "4px 0 0 0", fontSize: 12 }}>Sol taraftaki 'Sayfalar', 'Kategoriler' veya 'Özel Bağlantılar' panelinden eleman ekleyebilirsiniz.</p>
                    </div>
                  ) : (
                    activeMenu.items.map(item => renderItem(item))
                  )}
                </div>

                {/* Position Settings & Save */}
                <div style={{ padding: 18, borderTop: "1px solid #e2e8f0", background: "#fafafa" }}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", display: "block", marginBottom: 10 }}>Menü Görüntülenme Konumları</label>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                      {MENU_LOCATIONS.map(loc => {
                        const isChecked = activeMenu.location.includes(loc.value)
                        return (
                          <label
                            key={loc.value}
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "10px 14px", borderRadius: 8,
                              background: isChecked ? "#fcf7f6" : "#ffffff",
                              border: isChecked ? "1px solid #C98484" : "1px solid #e2e8f0",
                              cursor: "pointer", transition: "all 0.2s"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              style={{ accentColor: "#C98484", width: 16, height: 16 }}
                              onChange={e => {
                                let newLoc = [...activeMenu.location]
                                if (e.target.checked) {
                                  newLoc.push(loc.value)
                                } else {
                                  newLoc = newLoc.filter(l => l !== loc.value)
                                }
                                updateMenu({ ...activeMenu, location: newLoc })
                              }}
                            />
                            <span style={{ fontSize: 13, fontWeight: 600, color: isChecked ? "#c2410c" : "#334155" }}>
                              {loc.label}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteMenu(true)}
                      disabled={saving}
                      className="admin-btn"
                      style={{ color: "#dc2626", borderColor: "#fca5a5", background: "#fef2f2" }}
                    >
                      <Trash2 className="w-4 h-4" /> Menüyü Sil
                    </button>

                    <button
                      type="button"
                      onClick={saveMenu}
                      disabled={saving}
                      className="admin-btn admin-btn-primary"
                      style={{ padding: "8px 20px" }}
                    >
                      {saving ? "Kaydediliyor..." : saved ? "✓ Menü Kaydedildi" : <><Save className="w-4 h-4" /> Menüyü Kaydet</>}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {activeTab === "locations" && (
        <div className="admin-card" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Tema Menü Konumları</h3>
          {MENU_LOCATIONS.map(loc => {
            const assignedMenu =
              menus.find(menu => menu.location.includes(loc.value))?.id || ""

            return (
            <div key={loc.value} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" }}>
              <label style={{ width: 240, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{loc.label}</label>
              <select
                className="admin-select"
                style={{ minWidth: 240 }}
                value={assignedMenu}
                onChange={event =>
                  assignMenuToLocation(loc.value, event.target.value)
                }
              >
                <option value="">— Menü seçin —</option>
                {menus.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            )
          })}
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 6 }}>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={locationSaving}
              onClick={saveMenuLocations}
              style={{ padding: "8px 20px" }}
            >
              {locationSaving
                ? "Kaydediliyor..."
                : locationSaved
                  ? "✓ Konumlar Kaydedildi"
                  : <><Save className="w-4 h-4" /> Değişiklikleri Kaydet</>}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDeleteMenu}
        title="Menüyü Sil"
        message={`"${activeMenu?.name}" menüsünü tamamen silmek istediğinizden emin misiniz?`}
        onConfirm={performDeleteMenu}
        onCancel={() => setConfirmDeleteMenu(false)}
        confirmText="Evet, Sil"
        cancelText="İptal"
      />

      <MediaSelectorModal
        isOpen={mediaModalTargetItemId !== null}
        onClose={() => setMediaModalTargetItemId(null)}
        onSelect={(urls) => {
          if (mediaModalTargetItemId && urls[0] && activeMenu) {
            updateMenu({
              ...activeMenu,
              items: updateItem(activeMenu.items, mediaModalTargetItemId, {
                promo_image_url: urls[0]
              })
            })
          }
          setMediaModalTargetItemId(null)
        }}
        multi={false}
      />
    </div>
  )
}

// ── Pages Panel Component ───────────────────────────────────────────────
function PagesPanel({ pages, onAdd }: { pages: PageItem[]; onAdd: (handles: string[]) => void }) {
  const [checked, setChecked] = useState<string[]>([])
  const [search, setSearch] = useState("")

  const filtered = pages.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))

  function toggle(handle: string) {
    setChecked(s => s.includes(handle) ? s.filter(x => x !== handle) : [...s, handle])
  }

  function addAll() {
    if (!checked.length) return
    onAdd(checked)
    setChecked([])
  }

  return (
    <div style={{ padding: 14 }}>
      <input
        className="admin-input"
        placeholder="Sayfa ara..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 10, fontSize: 12 }}
      />

      <div style={{
        maxHeight: 220,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        paddingRight: 4
      }}>
        {filtered.map(page => (
          <label
            key={page.handle}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 8px", borderRadius: 6,
              background: checked.includes(page.handle) ? "#f0fdf4" : "transparent",
              cursor: "pointer"
            }}
          >
            <input
              type="checkbox"
              checked={checked.includes(page.handle)}
              onChange={() => toggle(page.handle)}
              style={{ accentColor: "#16a34a" }}
            />
            <span style={{ fontSize: 13, color: "#1e293b", fontWeight: checked.includes(page.handle) ? 700 : 400 }}>
              {page.title}
            </span>
          </label>
        ))}
        {filtered.length === 0 && <span style={{ fontSize: 12, color: "#94a3b8", padding: "8px 0" }}>Sayfa bulunamadı.</span>}
      </div>

      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", color: "#646970" }}>
          <input
            type="checkbox"
            checked={checked.length === filtered.length && filtered.length > 0}
            onChange={e => setChecked(e.target.checked ? filtered.map(p => p.handle) : [])}
            style={{ accentColor: "#16a34a" }}
          />
          Tümünü Seç
        </label>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          style={{ padding: "5px 12px", fontSize: 12 }}
          onClick={addAll}
          disabled={!checked.length}
        >
          <Plus className="w-3.5 h-3.5" /> Menüye Ekle
        </button>
      </div>
    </div>
  )
}

// ── Categories Panel Component ───────────────────────────────────────────
function CategoriesPanel({ categories, onAdd }: { categories: Category[]; onAdd: (ids: string[]) => void }) {
  const [checked, setChecked] = useState<string[]>([])
  const [search, setSearch] = useState("")

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  function toggle(id: string) {
    setChecked(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  function addAll() {
    if (!checked.length) return
    onAdd(checked)
    setChecked([])
  }

  return (
    <div style={{ padding: 14 }}>
      <input
        className="admin-input"
        placeholder="Kategori ara..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 10, fontSize: 12 }}
      />

      <div style={{
        maxHeight: 220,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        paddingRight: 4
      }}>
        {filtered.map(cat => (
          <label
            key={cat.id}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 8px", borderRadius: 6,
              background: checked.includes(cat.id) ? "#eff6ff" : "transparent",
              cursor: "pointer"
            }}
          >
            <input
              type="checkbox"
              checked={checked.includes(cat.id)}
              onChange={() => toggle(cat.id)}
              style={{ accentColor: "#2563eb" }}
            />
            <span style={{ fontSize: 13, color: "#1e293b", fontWeight: checked.includes(cat.id) ? 700 : 400 }}>
              {cat.name}
            </span>
          </label>
        ))}
        {filtered.length === 0 && <span style={{ fontSize: 12, color: "#94a3b8", padding: "8px 0" }}>Kategori bulunamadı.</span>}
      </div>

      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", color: "#646970" }}>
          <input
            type="checkbox"
            checked={checked.length === filtered.length && filtered.length > 0}
            onChange={e => setChecked(e.target.checked ? filtered.map(c => c.id) : [])}
            style={{ accentColor: "#2563eb" }}
          />
          Tümünü Seç
        </label>
        <button
          type="button"
          className="admin-btn admin-btn-secondary"
          style={{ padding: "5px 12px", fontSize: 12 }}
          onClick={addAll}
          disabled={!checked.length}
        >
          <Plus className="w-3.5 h-3.5" /> Menüye Ekle
        </button>
      </div>
    </div>
  )
}
