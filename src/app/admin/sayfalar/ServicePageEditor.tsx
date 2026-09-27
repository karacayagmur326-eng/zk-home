"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react"
import ImagePickerField from "../components/ImagePickerField"
import IconPickerModal from "../components/IconPickerModal"
import { AppIcon } from "@lib/icons"
import { defaultServicePageData, type ServiceIconItem } from "@lib/content/service-page"

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-[#C98484]"
const labelClass = "mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-slate-500"

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className={labelClass}>{label}</span><input className={inputClass} value={value || ""} onChange={(event) => onChange(event.target.value)} /></label>
}

export default function ServicePageEditor() {
  const [data, setData] = useState<any>(defaultServicePageData)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [iconPicker, setIconPicker] = useState<{ open: boolean; onSelect: (icon: string) => void }>({ open: false, onSelect: () => {} })

  useEffect(() => {
    fetch("/api/admin/site-pages")
      .then((response) => response.json())
      .then((payload) => {
        const page = (payload.pages || []).find((item: any) => item.handle === "garanti-ve-teknik-servis")
        if (page?.content) setData({ ...defaultServicePageData, ...page.content })
      })
      .finally(() => setLoaded(true))
  }, [])

  const setField = (key: string, value: any) => setData((current: any) => ({ ...current, [key]: value }))

  const updateIconItem = (key: "feature_cards" | "process_steps", index: number, patch: Partial<ServiceIconItem>) => {
    setData((current: any) => ({
      ...current,
      [key]: (current[key] || []).map((item: ServiceIconItem, itemIndex: number) => itemIndex === index ? { ...item, ...patch } : item),
    }))
  }

  const removeIconItem = (key: "feature_cards" | "process_steps", index: number) => {
    setData((current: any) => ({ ...current, [key]: (current[key] || []).filter((_: any, itemIndex: number) => itemIndex !== index) }))
  }

  const addIconItem = (key: "feature_cards" | "process_steps") => {
    setData((current: any) => ({
      ...current,
      [key]: [...(current[key] || []), { title: "Yeni Başlık", desc: "Açıklama metni", icon: "circle-check" }],
    }))
  }

  const openIconPicker = (callback: (icon: string) => void) => setIconPicker({ open: true, onSelect: callback })

  const save = async () => {
    setSaving(true)
    try {
      const serviceContent = { ...data }
      delete serviceContent.form_title
      delete serviceContent.form_description
      const response = await fetch("/api/admin/site-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle: "garanti-ve-teknik-servis",
          old_handle: "garanti-ve-teknik-servis",
          content: serviceContent,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Sayfa kaydedilemedi.")
      ;(window as any).showAdminAlert?.("Garanti ve Teknik Servis sayfası güncellendi.", "Başarılı", "success")
    } catch (error: any) {
      ;(window as any).showAdminAlert?.(error.message || "Sayfa kaydedilemedi.", "Hata", "error")
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs font-bold text-slate-500">Sayfa ayarları yükleniyor...</div>

  const renderIconItems = (key: "feature_cards" | "process_steps", title: string) => (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black text-slate-900">{title}</h2>
        <button type="button" onClick={() => addIconItem(key)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-[#C98484]"><Plus className="h-3.5 w-3.5" /> Ekle</button>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
        {(data[key] || []).map((item: ServiceIconItem, index: number) => (
          <article key={index} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="mb-2 flex items-center gap-2">
              <button type="button" onClick={() => openIconPicker((icon) => updateIconItem(key, index, { icon }))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-[#C98484]" title="İkon seç">
                <AppIcon name={item.icon} className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => openIconPicker((icon) => updateIconItem(key, index, { icon }))} className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-left text-[10px] font-bold text-slate-600">Tıkla ve ikon seç</button>
              <button type="button" onClick={() => removeIconItem(key, index)} className="rounded-lg border border-red-200 bg-white p-2 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <input className={`${inputClass} mb-2`} value={item.title || ""} onChange={(event) => updateIconItem(key, index, { title: event.target.value })} placeholder="Başlık" />
            <textarea className={`${inputClass} min-h-16 resize-y`} value={item.desc || ""} onChange={(event) => updateIconItem(key, index, { desc: event.target.value })} placeholder="Açıklama" />
          </article>
        ))}
      </div>
    </section>
  )

  return (
    <div className="w-full space-y-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div>
          <Link href="/admin/sayfalar" className="mb-1 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-[#C98484]"><ArrowLeft className="h-3.5 w-3.5" /> Sayfalara Dön</Link>
          <h1 className="text-lg font-black text-slate-900">Garanti ve Teknik Servis Sayfası</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/garanti-ve-teknik-servis" target="_blank" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700">Sayfayı Gör</Link>
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-[#C98484] px-4 py-2 text-[11px] font-black text-white disabled:opacity-60"><Save className="h-3.5 w-3.5" /> {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label="Sayfa Başlığı" value={data.title} onChange={(value) => setField("title", value)} />
          <TextField label="Hero Üst Başlığı" value={data.subtitle} onChange={(value) => setField("subtitle", value)} />
          <label className="sm:col-span-2"><span className={labelClass}>Hero Açıklaması</span><textarea className={`${inputClass} min-h-24 resize-y`} value={data.description || ""} onChange={(event) => setField("description", event.target.value)} /></label>
        </div>
        <ImagePickerField label="Standart Hero Görseli" value={data.hero_image || ""} onChange={(value) => setField("hero_image", value)} helpText="Medya kütüphanesinden tıklayarak seçin." />
      </section>

      {renderIconItems("feature_cards", "Üst Özellik Kartları")}

      <section className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-2">
        <div className="space-y-3">
          <TextField label="Garanti Kapsamı Başlığı" value={data.coverage_title} onChange={(value) => setField("coverage_title", value)} />
          <label><span className={labelClass}>Kapsam Açıklaması</span><textarea className={`${inputClass} min-h-16`} value={data.coverage_intro || ""} onChange={(event) => setField("coverage_intro", event.target.value)} /></label>
          <label><span className={labelClass}>Kapsam Maddeleri — Her satıra bir madde</span><textarea className={`${inputClass} min-h-32`} value={(data.coverage_items || []).join("\n")} onChange={(event) => setField("coverage_items", event.target.value.split("\n"))} /></label>
        </div>
        <div className="space-y-3">
          <TextField label="Kapsam Dışı Başlığı" value={data.exclusion_title} onChange={(value) => setField("exclusion_title", value)} />
          <label><span className={labelClass}>Kapsam Dışı Maddeler — Her satıra bir madde</span><textarea className={`${inputClass} min-h-52`} value={(data.exclusion_items || []).join("\n")} onChange={(event) => setField("exclusion_items", event.target.value.split("\n"))} /></label>
        </div>
      </section>

      <TextField label="Süreç Bölümü Başlığı" value={data.process_title} onChange={(value) => setField("process_title", value)} />
      {renderIconItems("process_steps", "Teknik Servis Süreç Adımları")}

      <section className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-3">
        <TextField label="İletişim Başlığı" value={data.contact_title} onChange={(value) => setField("contact_title", value)} />
        <TextField label="Telefon" value={data.phone} onChange={(value) => setField("phone", value)} />
        <TextField label="Telefon Alt Metni" value={data.phone_note} onChange={(value) => setField("phone_note", value)} />
        <TextField label="E-posta" value={data.email} onChange={(value) => setField("email", value)} />
        <TextField label="E-posta Alt Metni" value={data.email_note} onChange={(value) => setField("email_note", value)} />
        <TextField label="Adres" value={data.address} onChange={(value) => setField("address", value)} />
        <TextField label="Harita Bağlantısı" value={data.map_link} onChange={(value) => setField("map_link", value)} />
        <label className="md:col-span-2 xl:col-span-3"><span className={labelClass}>İletişim Açıklaması</span><textarea className={`${inputClass} min-h-20`} value={data.contact_description || ""} onChange={(event) => setField("contact_description", event.target.value)} /></label>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-black text-slate-900">İletişim Formu Ayarları</h2>
          <Link href="/admin/iletisim" className="text-[11px] font-bold text-[#C98484] hover:underline">Ana formu düzenle</Link>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <div className="text-xs font-extrabold text-slate-900">İletişim Formunu Bu Sayfada Göster</div>
            <p className="mt-1 text-[11px] font-medium text-slate-500">Aktif edildiğinde “İletişim & Mesajlar” panelinde yönetilen merkezi form şablonu bu sayfaya çekilir.</p>
          </div>
          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              checked={data.show_contact_form !== false}
              onChange={(event) => setField("show_contact_form", event.target.checked)}
              className="peer sr-only"
            />
            <span className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#C98484] peer-checked:after:translate-x-full peer-checked:after:border-white" />
          </label>
        </div>
      </section>

      <IconPickerModal
        isOpen={iconPicker.open}
        onClose={() => setIconPicker((current) => ({ ...current, open: false }))}
        onSelect={(icon) => {
          iconPicker.onSelect(icon)
          setIconPicker((current) => ({ ...current, open: false }))
        }}
      />
    </div>
  )
}
