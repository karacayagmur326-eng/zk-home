"use client"

import { useEffect, useMemo, useState } from "react"
import { AppIcon, Plus, Save, Trash2, Smartphone, Sparkles, Image as ImageIcon, X } from "@lib/icons"
import ImagePickerField from "../components/ImagePickerField"
import LinkPickerSelect from "../components/LinkPickerSelect"
import IconPickerModal from "../components/IconPickerModal"
import MediaSelectorModal from "../components/MediaSelectorModal"
import type { MobileLinkItem, MobileSection, MobileSettings, MobileSlide } from "@lib/content/mobile-settings"

const input = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#C98484] transition-colors"
const label = "mb-1.5 block text-[11px] font-extrabold uppercase tracking-wider text-slate-500"

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

function Field({ title, value, onChange, multiline = false }: { title: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <label className="block w-full">
      <span className={label}>{title}</span>
      {multiline ? (
        <textarea className={`${input} min-h-24 resize-y`} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={input} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  )
}

function IconField({
  value,
  image,
  onOpenIconModal,
  onOpenImageModal,
  onRemoveImage,
}: {
  value: string
  image?: string
  onOpenIconModal: () => void
  onOpenImageModal: () => void
  onRemoveImage: () => void
}) {
  const hasImage = Boolean(image)

  return (
    <div className="w-full">
      <span className={label}>İkon / kategori görseli</span>

      <div className="flex min-w-0 items-center gap-2">
        <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-rose-200 bg-rose-50 text-[#C98484] shadow-2xs">
          {hasImage ? (
            <>
              <img src={image} alt="" className="h-full w-full object-contain p-1" />
              <button
                type="button"
                onClick={onRemoveImage}
                title="Görseli kaldır"
                aria-label="Görseli kaldır"
                className="absolute right-0 top-0 grid h-4 w-4 place-items-center rounded-bl-md bg-slate-900/75 text-white hover:bg-rose-600"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </>
          ) : (
            <AppIcon name={value || "Circle"} className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="truncate text-xs font-bold text-slate-700">{hasImage ? "Kategori görseli bağlı" : value || "İkon seçilmedi"}</p>
          <p className="truncate text-[10px] text-slate-400">{hasImage ? image : "Kategoriyle eşitlenir veya elle seçilir."}</p>
        </div>

        <button
          type="button"
          onClick={onOpenIconModal}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-extrabold text-[#D94F00] transition-colors hover:bg-rose-100 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" /> İkon
        </button>
        <button
          type="button"
          onClick={onOpenImageModal}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#C98484] px-3 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-[#D94F00] cursor-pointer"
        >
          <ImageIcon className="h-3.5 w-3.5" /> Görsel
        </button>
      </div>
    </div>
  )
}

function Card({ title, children, onRemove }: { title: string; children: React.ReactNode; onRemove?: () => void }) {
  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-black text-slate-900">{title}</h3>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Kaldır
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

export default function MobileAdminPage() {
  const [settings, setSettings] = useState<MobileSettings | null>(null)
  const [tab, setTab] = useState("general")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/admin/mobile-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setSettings(data.settings))
      .catch(() => setMessage("Mobil ayarlar yüklenemedi."))
  }, [])

  const tabs = useMemo(
    () => [
      ["general", "Genel"],
      ["slides", "Mobil Slider"],
      ["shortcuts", "Kısayollar"],
      ["sections", "Ürün Alanları"],
      ["navigation", "Alt Menü"],
      ["pages", "Mobil Sayfalar"],
    ],
    []
  )

  if (!settings) return <div className="p-8 text-sm font-bold text-slate-500">Mobil yönetim alanı yükleniyor...</div>

  const save = async () => {
    setSaving(true)
    setMessage("")
    const response = await fetch("/api/admin/mobile-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    })
    const data = await response.json().catch(() => ({}))
    if (response.ok) {
      setSettings(data.settings)
      setMessage("Mobil ayarlar kaydedildi ve siteyle senkronlandı.")
    } else setMessage(data.error || "Kaydedilemedi.")
    setSaving(false)
  }

  const updateList = <T,>(key: keyof MobileSettings, index: number, patch: Partial<T>) =>
    setSettings((current) =>
      current
        ? {
            ...current,
            [key]: (current[key] as T[]).map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
          }
        : current
    )

  const removeList = (key: keyof MobileSettings, index: number) =>
    setSettings((current) =>
      current
        ? {
            ...current,
            [key]: (current[key] as unknown[]).filter((_, i) => i !== index),
          }
        : current
    )

  return (
    <div className="w-full space-y-6 text-slate-900">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-[#C98484] shrink-0">
            <Smartphone className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-black text-slate-900">Mobil Deneyim Yönetimi</h1>
            <p className="text-xs font-medium text-slate-500">
              Yalnızca telefonlarda görünen alanları buradan yönetin. Tablet ve masaüstü etkilenmez.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-2.5 text-xs font-extrabold cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="accent-[#C98484] w-4 h-4 cursor-pointer"
            />
            Mobil tasarım aktif
          </label>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#C98484] hover:bg-[#d85204] px-5 py-3 text-xs font-extrabold text-white shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="w-full flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xs">
        {tabs.map(([id, text]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              tab === id ? "bg-[#C98484] text-white shadow-xs" : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {tab === "general" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
          <Card title="Mobil Üst Alan">
            <ImagePickerField
              label="Mobil Logo"
              value={settings.logoUrl}
              onChange={(logoUrl) => setSettings({ ...settings, logoUrl })}
              helpText="Sadece telefon başlığında kullanılır."
            />
            <div className="mt-4">
              <Field
                title="Arama kutusu metni"
                value={settings.searchPlaceholder}
                onChange={(searchPlaceholder) => setSettings({ ...settings, searchPlaceholder })}
              />
            </div>
          </Card>
          <Card title="Mobil Duyuru">
            <div className="grid gap-4">
              <Field
                title="Duyuru metni"
                value={settings.announcementText}
                onChange={(announcementText) => setSettings({ ...settings, announcementText })}
              />
              <LinkPickerSelect
                label="Duyuru bağlantısı"
                value={settings.announcementHref}
                onChange={(announcementHref) => setSettings({ ...settings, announcementHref })}
              />
            </div>
          </Card>
        </div>
      )}

      {tab === "slides" && (
        <div className="w-full space-y-5">
          {settings.slides.map((slide, index) => (
            <Card key={slide.id} title={`Mobil Slider ${index + 1}`} onRemove={() => removeList("slides", index)}>
              <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <ImagePickerField
                  label="Mobil slider görseli"
                  value={slide.image}
                  onChange={(image) => updateList<MobileSlide>("slides", index, { image })}
                  helpText="Önerilen oran 16:9, metin için sol tarafta boşluk bırakın."
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Field title="Rozet" value={slide.badge} onChange={(badge) => updateList<MobileSlide>("slides", index, { badge })} />
                  <Field title="Başlık" value={slide.title} onChange={(title) => updateList<MobileSlide>("slides", index, { title })} />
                  <Field title="Açıklama" value={slide.description} onChange={(description) => updateList<MobileSlide>("slides", index, { description })} />
                  <Field title="Buton metni" value={slide.buttonLabel} onChange={(buttonLabel) => updateList<MobileSlide>("slides", index, { buttonLabel })} />
                  <LinkPickerSelect label="Buton bağlantısı" value={slide.buttonHref} onChange={(buttonHref) => updateList<MobileSlide>("slides", index, { buttonHref })} />
                  <label className="flex items-center gap-2 pt-6 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={slide.active}
                      onChange={(e) => updateList<MobileSlide>("slides", index, { active: e.target.checked })}
                      className="accent-[#C98484] w-4 h-4 cursor-pointer"
                    />
                    Slider aktif
                  </label>
                </div>
              </div>
            </Card>
          ))}
          <button
            onClick={() =>
              setSettings({
                ...settings,
                slides: [
                  ...settings.slides,
                  {
                    id: uid("slide"),
                    badge: "",
                    title: "",
                    description: "",
                    buttonLabel: "",
                    buttonHref: "/magaza",
                    image: "",
                    active: true,
                    sortOrder: settings.slides.length + 1,
                  },
                ],
              })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#C98484] bg-white px-5 py-3.5 text-xs font-extrabold text-[#C98484] hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Yeni Mobil Slider Ekle
          </button>
        </div>
      )}

      {tab === "shortcuts" && (
        <ListEditor
          title="Mobil Kısayol"
          items={settings.shortcuts}
          onChange={(items) => setSettings({ ...settings, shortcuts: items })}
        />
      )}

      {tab === "navigation" && (
        <ListEditor
          title="Alt Menü Öğesi"
          items={settings.bottomNavigation}
          onChange={(items) => setSettings({ ...settings, bottomNavigation: items })}
        />
      )}

      {tab === "sections" && (
        <div className="w-full space-y-5">
          {settings.homeSections.map((section, index) => (
            <Card key={section.id} title={`Ürün Alanı ${index + 1}`} onRemove={() => removeList("homeSections", index)}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Field title="Başlık" value={section.title} onChange={(title) => updateList<MobileSection>("homeSections", index, { title })} />
                <Field title="Bağlantı metni" value={section.linkLabel} onChange={(linkLabel) => updateList<MobileSection>("homeSections", index, { linkLabel })} />
                <LinkPickerSelect label="Bağlantı" value={section.linkHref} onChange={(linkHref) => updateList<MobileSection>("homeSections", index, { linkHref })} />
                <label className="block w-full">
                  <span className={label}>Ürün kaynağı</span>
                  <select
                    className={input}
                    value={section.source}
                    onChange={(e) => updateList<MobileSection>("homeSections", index, { source: e.target.value as MobileSection["source"] })}
                  >
                    <option value="latest">En yeni ürünler</option>
                    <option value="featured">Öne çıkan ürünler</option>
                    <option value="bestseller">Çok satan ürünler</option>
                  </select>
                </label>
              </div>
            </Card>
          ))}
          <button
            onClick={() =>
              setSettings({
                ...settings,
                homeSections: [
                  ...settings.homeSections,
                  { id: uid("section"), title: "Yeni Ürün Alanı", linkLabel: "Tümünü Gör", linkHref: "/magaza", source: "latest", active: true },
                ],
              })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#C98484] bg-white px-5 py-3.5 text-xs font-extrabold text-[#C98484] hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Ürün Alanı Ekle
          </button>
        </div>
      )}

      {tab === "pages" && <PageSettings settings={settings} onChange={setSettings} />}
    </div>
  )
}

function ListEditor({ title, items, onChange }: { title: string; items: MobileLinkItem[]; onChange: (items: MobileLinkItem[]) => void }) {
  const [iconModalIndex, setIconModalIndex] = useState<number | null>(null)
  const [imageModalIndex, setImageModalIndex] = useState<number | null>(null)

  const update = (index: number, patch: Partial<MobileLinkItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))

  return (
    <div className="w-full space-y-5">
      {items.map((item, index) => (
        <Card key={item.id} title={`${title} ${index + 1}`} onRemove={() => onChange(items.filter((_, i) => i !== index))}>
          <div className="grid items-end gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <Field title="Başlık" value={item.label} onChange={(label) => update(index, { label })} />
            <Field title="Alt açıklama" value={item.subtitle || ""} onChange={(subtitle) => update(index, { subtitle })} />
            <IconField
              value={item.icon}
              image={item.image}
              onOpenIconModal={() => setIconModalIndex(index)}
              onOpenImageModal={() => setImageModalIndex(index)}
              onRemoveImage={() => update(index, { image: "" })}
            />
            <LinkPickerSelect
              label="Bağlantı"
              value={item.href}
              onChange={(href, autoData) => {
                const patch: Partial<MobileLinkItem> = { href }
                if (autoData?.icon) {
                  patch.icon = autoData.icon
                }
                patch.image = autoData?.image || ""
                if (autoData?.label) {
                  patch.label = autoData.label
                }
                update(index, patch)
              }}
              onAutoSync={(autoData) => {
                update(index, {
                  ...(!item.icon && autoData.icon ? { icon: autoData.icon } : {}),
                  image: item.image || autoData.image || "",
                })
              }}
            />
          </div>
        </Card>
      ))}

      <button
        onClick={() => onChange([...items, { id: uid("item"), label: "Yeni Öğe", subtitle: "", icon: "Circle", href: "/", active: true }])}
        className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#C98484] bg-white px-5 py-3.5 text-xs font-extrabold text-[#C98484] hover:bg-rose-50 transition-colors cursor-pointer"
      >
        <Plus className="h-4 w-4" /> Yeni Öğe Ekle
      </button>

      <IconPickerModal
        isOpen={iconModalIndex !== null}
        onClose={() => setIconModalIndex(null)}
        onSelect={(iconNameOrUrl) => {
          if (iconModalIndex !== null) {
            update(iconModalIndex, { icon: iconNameOrUrl, image: "" })
            setIconModalIndex(null)
          }
        }}
      />

      <MediaSelectorModal
        isOpen={imageModalIndex !== null}
        onClose={() => setImageModalIndex(null)}
        onSelect={(urls) => {
          if (imageModalIndex !== null && urls[0]) {
            update(imageModalIndex, { image: urls[0] })
          }
          setImageModalIndex(null)
        }}
        multi={false}
        allowIcons={false}
      />
    </div>
  )
}

function PageSettings({ settings, onChange }: { settings: MobileSettings; onChange: (s: MobileSettings) => void }) {
  const groups: Array<{ key: "favorites" | "history" | "collections" | "account" | "cart"; title: string; fields: Array<[string, string]> }> = [
    { key: "favorites", title: "Favoriler", fields: [["title", "Başlık"], ["description", "Açıklama"], ["emptyTitle", "Boş durum başlığı"], ["emptyDescription", "Boş durum açıklaması"], ["emptyButtonLabel", "Boş durum butonu"], ["emptyButtonHref", "Boş durum buton bağlantısı"]] },
    { key: "history", title: "Son Gezilenler", fields: [["title", "Başlık"], ["description", "Açıklama"], ["noticeTitle", "Bilgi başlığı"], ["noticeDescription", "Bilgi açıklaması"]] },
    { key: "collections", title: "Koleksiyonlar", fields: [["title", "Başlık"], ["description", "Açıklama"], ["bannerTitle", "Banner başlığı"], ["bannerDescription", "Banner açıklaması"], ["buttonLabel", "Buton metni"], ["emptyTitle", "Boş durum başlığı"], ["emptyDescription", "Boş durum açıklaması"]] },
    { key: "account", title: "Hesabım", fields: [["title", "Başlık"], ["description", "Açıklama"], ["noticeTitle", "Bilgi başlığı"], ["noticeDescription", "Bilgi açıklaması"]] },
    { key: "cart", title: "Sepet", fields: [["title", "Başlık"], ["freeShippingTitle", "Kargo başlığı"], ["freeShippingDescription", "Kargo açıklaması"], ["checkoutLabel", "Ödeme butonu"], ["emptyTitle", "Boş durum başlığı"], ["emptyDescription", "Boş durum açıklaması"], ["emptyButtonLabel", "Boş durum butonu"], ["emptyButtonHref", "Boş durum buton bağlantısı"]] },
  ]
  const update = (key: typeof groups[number]["key"], field: string, value: string) => onChange({ ...settings, [key]: { ...settings[key], [field]: value } } as MobileSettings)
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
      {groups.map((group) => (
        <Card key={group.key} title={`${group.title} Mobil Metinleri`}>
          <div className="grid gap-4">
            {group.fields.map(([field, text]) => (
              <Field key={field} title={text} value={String((settings[group.key] as unknown as Record<string, unknown>)[field] || "")} onChange={(value) => update(group.key, field, value)} />
            ))}
            {group.key === "favorites" && (
              <Field title="Filtre sekmeleri (virgülle ayırın)" value={settings.favorites.tabs.join(", ")} onChange={(value) => onChange({ ...settings, favorites: { ...settings.favorites, tabs: value.split(",").map((v) => v.trim()).filter(Boolean) } })} />
            )}
            {group.key === "history" && (
              <Field title="Filtreler (virgülle ayırın)" value={settings.history.filters.join(", ")} onChange={(value) => onChange({ ...settings, history: { ...settings.history, filters: value.split(",").map((v) => v.trim()).filter(Boolean) } })} />
            )}
          </div>
          {group.key === "account" && (
            <div className="mt-4">
              <p className={label}>Hesap menüleri</p>
              <ListEditor title="Hesap Menüsü" items={settings.account.menuItems} onChange={(menuItems) => onChange({ ...settings, account: { ...settings.account, menuItems } })} />
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
