"use client"

import { useEffect, useState } from "react"
import { Plus, Save, Trash2 } from "lucide-react"
import ImagePickerField from "../components/ImagePickerField"
import LinkPickerSelect from "../components/LinkPickerSelect"
import { defaultHomeEditorialContent, type EditorialCard, type HomeEditorialContent } from "@lib/content/home-editorial"

type CardKey = "collection_cards" | "highlight_cards" | "room_cards"

export default function HomeEditorialAdminPage() {
  const [content, setContent] = useState<HomeEditorialContent>(defaultHomeEditorialContent)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/admin/home-editorial")
      .then(async (response) => { if (!response.ok) throw new Error("İçerik yüklenemedi."); return response.json() })
      .then((data) => setContent(data.content))
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false))
  }, [])

  function update<K extends keyof HomeEditorialContent>(key: K, value: HomeEditorialContent[K]) {
    setContent((current) => ({ ...current, [key]: value }))
  }

  function updateCard(key: CardKey, id: string, patch: Partial<EditorialCard>) {
    update(key, content[key].map((card) => card.id === id ? { ...card, ...patch } : card))
  }

  function addCard(key: CardKey) {
    update(key, [...content[key], { id: `editorial-${Date.now()}`, title: "Yeni Kart", description: "", image: "", href: "/magaza", active: true }])
  }

  async function save() {
    setSaving(true)
    setMessage("")
    try {
      const response = await fetch("/api/admin/home-editorial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Kaydedilemedi.")
      setMessage("Ana sayfa vitrini kaydedildi.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kaydedilemedi.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="rounded-2xl bg-white p-8 text-sm text-slate-500">Ana sayfa vitrini yükleniyor...</div>

  return <div className="space-y-5 pb-20">
    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
      <div><h1 className="text-xl font-bold text-slate-900">Ana Sayfa Vitrini</h1><p className="text-xs text-slate-500">Kategori şeridinin altındaki görsel alanları yönetin.</p></div>
      <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#C98484] px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</button>
    </div>
    {message && <p role="status" className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm text-[#a45d5f]">{message}</p>}

    <CardSection title="Yeni Sezon Koleksiyonu" enabled={content.collections_active} onEnabled={(value) => update("collections_active", value)} cards={content.collection_cards} onAdd={() => addCard("collection_cards")} onChange={(id, patch) => updateCard("collection_cards", id, patch)} onDelete={(id) => update("collection_cards", content.collection_cards.filter((card) => card.id !== id))}>
      <TextField label="Bölüm başlığı" value={content.collections_title} onChange={(value) => update("collections_title", value)} />
      <TextField label="Açıklama" value={content.collections_description} onChange={(value) => update("collections_description", value)} />
      <TextField label="Tümünü gör metni" value={content.collections_link_text} onChange={(value) => update("collections_link_text", value)} />
      <LinkPickerSelect label="Tümünü gör bağlantısı" value={content.collections_link_href} onChange={(value) => update("collections_link_href", value)} />
    </CardSection>

    <CardSection title="Öne Çıkan Seçkiler" enabled={content.highlights_active} onEnabled={(value) => update("highlights_active", value)} cards={content.highlight_cards} onAdd={() => addCard("highlight_cards")} onChange={(id, patch) => updateCard("highlight_cards", id, patch)} onDelete={(id) => update("highlight_cards", content.highlight_cards.filter((card) => card.id !== id))}>
      <TextField label="Başlık" value={content.highlights_title} onChange={(value) => update("highlights_title", value)} />
      <TextField label="Açıklama" value={content.highlights_description} onChange={(value) => update("highlights_description", value)} />
      <p className="text-xs text-slate-500 sm:col-span-2">Yayında ürün olduğunda gerçek ürün kartları gösterilir. Ürün yokken aşağıdaki seçki kartları görünür; fiyat veya ürün bilgisi uydurulmaz.</p>
    </CardSection>

    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeading title="Geniş Koleksiyon Banner’ı" enabled={content.banner_active} onEnabled={(value) => update("banner_active", value)} />
      <div className="grid gap-4 sm:grid-cols-2"><TextField label="Başlık" value={content.banner_title} onChange={(value) => update("banner_title", value)} /><TextField label="Vurgulu başlık" value={content.banner_accent} onChange={(value) => update("banner_accent", value)} /><TextField label="Açıklama" value={content.banner_description} onChange={(value) => update("banner_description", value)} /><TextField label="Buton metni" value={content.banner_link_text} onChange={(value) => update("banner_link_text", value)} /><LinkPickerSelect label="Buton bağlantısı" value={content.banner_link_href} onChange={(value) => update("banner_link_href", value)} /><ImagePickerField label="Banner görseli" value={content.banner_image} onChange={(value) => update("banner_image", value)} /></div>
    </section>

    <CardSection title="Yaşam Alanına Göre Keşfet" enabled={content.rooms_active} onEnabled={(value) => update("rooms_active", value)} cards={content.room_cards} onAdd={() => addCard("room_cards")} onChange={(id, patch) => updateCard("room_cards", id, patch)} onDelete={(id) => update("room_cards", content.room_cards.filter((card) => card.id !== id))}>
      <TextField label="Başlık" value={content.rooms_title} onChange={(value) => update("rooms_title", value)} />
      <TextField label="Açıklama" value={content.rooms_description} onChange={(value) => update("rooms_description", value)} />
    </CardSection>

    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeading title="İlham Köşesi" enabled={content.inspiration_active} onEnabled={(value) => update("inspiration_active", value)} />
      <div className="grid gap-4 sm:grid-cols-2"><TextField label="Başlık" value={content.inspiration_title} onChange={(value) => update("inspiration_title", value)} /><TextField label="Açıklama" value={content.inspiration_description} onChange={(value) => update("inspiration_description", value)} /></div>
      <p className="text-xs text-slate-500">Yazılar ve görseller <a href="/admin/blog" className="font-semibold text-[#C98484] underline">Blog yönetiminden</a> eklenir veya kaldırılır.</p>
    </section>

    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <SectionHeading title="E-posta Bülteni" enabled={content.newsletter_active} onEnabled={(value) => update("newsletter_active", value)} />
      <div className="grid gap-4 sm:grid-cols-2"><TextField label="Başlık" value={content.newsletter_title} onChange={(value) => update("newsletter_title", value)} /><TextField label="Açıklama" value={content.newsletter_description} onChange={(value) => update("newsletter_description", value)} /></div>
    </section>
  </div>
}

function SectionHeading({ title, enabled, onEnabled }: { title: string; enabled: boolean; onEnabled: (value: boolean) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-bold text-slate-900">{title}</h2><label className="flex items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={enabled} onChange={(event) => onEnabled(event.target.checked)} className="accent-[#C98484]" />Yayında</label></div>
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-xs font-semibold text-slate-700">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C98484]" /></label>
}

function CardSection({ title, enabled, onEnabled, cards, onAdd, onChange, onDelete, children }: { title: string; enabled: boolean; onEnabled: (value: boolean) => void; cards: EditorialCard[]; onAdd: () => void; onChange: (id: string, patch: Partial<EditorialCard>) => void; onDelete: (id: string) => void; children: React.ReactNode }) {
  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><SectionHeading title={title} enabled={enabled} onEnabled={onEnabled} /><div className="grid gap-4 sm:grid-cols-2">{children}</div><div className="flex items-center justify-between border-t border-slate-100 pt-4"><h3 className="text-sm font-semibold text-slate-800">Kartlar ({cards.length})</h3><button type="button" onClick={onAdd} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-[#C98484]"><Plus className="h-4 w-4" />Kart Ekle</button></div><div className="grid gap-4 lg:grid-cols-2">{cards.map((card) => <div key={card.id} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><label className="text-xs font-semibold text-slate-600"><input type="checkbox" checked={card.active} onChange={(event) => onChange(card.id, { active: event.target.checked })} className="mr-1.5 accent-[#C98484]" />Aktif</label><button type="button" onClick={() => onDelete(card.id)} aria-label={`${card.title} kartını sil`} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div><TextField label="Kart başlığı" value={card.title} onChange={(value) => onChange(card.id, { title: value })} /><TextField label="Kısa açıklama" value={card.description} onChange={(value) => onChange(card.id, { description: value })} /><LinkPickerSelect label="Bağlantı" value={card.href} onChange={(value) => onChange(card.id, { href: value })} /><ImagePickerField label="Görsel" value={card.image} onChange={(value) => onChange(card.id, { image: value })} /></div>)}</div></section>
}
