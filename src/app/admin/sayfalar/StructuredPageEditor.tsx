"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { AppIcon } from "@lib/icons"
import ImagePickerField from "../components/ImagePickerField"
import IconPickerModal from "../components/IconPickerModal"

type Section = { icon: string; title: string; body: string }
type Content = Record<string, any>

const routeForHandle = (handle: string) => handle === "kvkk-aydinlatma-metni" ? "/kvkk" : `/${handle}`
const iconSets: Record<string, string[]> = {
  "on-bilgilendirme-formu": ["store", "box", "credit-card", "truck", "rotate-ccw", "package-check", "user-check", "scale"],
  "mesafeli-satis-sozlesmesi": ["users", "file-text", "box", "list", "rotate-ccw", "coins", "truck", "credit-card", "scale", "file-check"],
  "kvkk-aydinlatma-metni": ["user-check", "shield-check", "file-text", "share-2", "database", "user-cog", "message-square"],
  "gizlilik-politikasi": ["user-check", "lock", "settings", "share-2", "database", "user-cog", "shield-check", "cookie", "file-text", "mail"],
  "cerez-politikasi": ["cookie", "list", "settings", "sliders", "share-2", "clock", "file-text", "mail"],
}
const pageMetaDefaults: Record<string, Content> = {
  "on-bilgilendirme-formu": { legal_note: "Bu ön bilgilendirme formu, mesafeli satış sözleşmesi yapılmadan önce tüketiciyi bilgilendirmek amacıyla hazırlanmıştır.", legal_action_label: "Mesafeli Satış Sözleşmesi", legal_action_href: "/mesafeli-satis-sozlesmesi", legal_aside: "" },
  "mesafeli-satis-sozlesmesi": { legal_note: "Bu sözleşme, Alıcı'nın siparişi onaylaması ile birlikte geçerlilik kazanır ve elektronik ortamda saklanır.", legal_aside: "download", legal_aside_title: "Sözleşmeyi PDF olarak kaydedin", legal_aside_text: "Belgeyi yazdırabilir veya cihazınıza PDF olarak kaydedebilirsiniz." },
  "kvkk-aydinlatma-metni": { legal_note: "İşbu Aydınlatma Metni güncel mevzuata uygun olarak hazırlanmış olup gerekli görüldüğünde güncellenebilir.", legal_aside: "contact", legal_aside_title: "KVKK ile ilgili sorularınız mı var?", legal_aside_text: "Her türlü soru ve talebiniz için ekibimize ulaşabilirsiniz." },
  "gizlilik-politikasi": { legal_note: "Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu'na uygun olarak hazırlanmıştır.", legal_aside: "contact", legal_aside_title: "Verileriniz Bizimle Güvende", legal_aside_text: "Gizlilik politikamız hakkında ekibimize ulaşabilirsiniz." },
  "cerez-politikasi": { legal_note: "Çerez tercihlerinizi dilediğiniz zaman tarayıcınızdan veya sitedeki tercih panelinden değiştirebilirsiniz.", legal_aside: "cookie", legal_aside_title: "Çerez Tercihlerinizi Yönetin", legal_aside_text: "Tercihlerinizi dilediğiniz zaman değiştirebilirsiniz." },
}

export default function StructuredPageEditor({ handle }: { handle: string }) {
  const router = useRouter()
  const isOrder = handle === "siparis-takibi"
  const [content, setContent] = useState<Content>({})
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [iconIndex, setIconIndex] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/site-pages").then((r) => r.json()),
      isOrder ? Promise.resolve("") : fetch(routeForHandle(handle)).then((r) => r.text()),
    ]).then(([data, html]) => {
      const found = (data.pages || []).find((page: any) => page.handle === handle)
      const nextContent = { ...(pageMetaDefaults[handle] || {}), ...(found?.content || {}) }
      setContent(nextContent)
      if (Array.isArray(nextContent.legal_sections) && nextContent.legal_sections.length) {
        setSections(nextContent.legal_sections)
      } else if (html) {
        const doc = new DOMParser().parseFromString(html, "text/html")
        const renderedHeroText = doc.querySelector("h1")?.parentElement?.querySelector("p")?.textContent?.trim()
        if (!nextContent.hero_text && renderedHeroText) setContent({ ...nextContent, hero_text: renderedHeroText })
        setSections(Array.from(doc.querySelectorAll("article section[id^='bolum-']")).map((node, index) => ({
          icon: iconSets[handle]?.[index] || "file-text",
          title: node.querySelector("h2")?.textContent?.trim() || "Yeni Bölüm",
          body: node.querySelector("p")?.textContent?.trim() || "",
        })))
      }
    }).finally(() => setLoading(false))
  }, [handle, isOrder])

  const update = (key: string, value: any) => setContent((current) => ({ ...current, [key]: value }))
  const updateSection = (index: number, patch: Partial<Section>) => setSections((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item))
  const moveSection = (index: number, direction: -1 | 1) => setSections((current) => {
    const target = index + direction
    if (target < 0 || target >= current.length) return current
    const copy = [...current]
    ;[copy[index], copy[target]] = [copy[target], copy[index]]
    return copy
  })

  const save = async () => {
    setSaving(true)
    try {
      const payload = { ...content, ...(isOrder ? {} : { legal_sections: sections }) }
      const response = await fetch("/api/admin/site-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, content: payload }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Kaydetme başarısız.")
      ;(window as any).showAdminAlert?.("Sayfa içeriği ve tasarım ayarları kaydedildi.", "Başarılı", "success")
    } catch (error: any) {
      ;(window as any).showAdminAlert?.(error.message || "Kaydetme başarısız.", "Hata", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Sayfa ayarları yükleniyor...</div>

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3"><button type="button" onClick={() => router.push("/admin/sayfalar")} className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /></button><div><h1 className="text-lg font-black text-slate-900">{content.title || handle}</h1><p className="text-[11px] text-slate-500">Tüm sayfa içeriği ve görünüm ayarları</p></div></div>
        <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#C98484] px-5 py-2.5 text-xs font-extrabold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}</button>
      </div>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold text-slate-700">Sayfa Başlığı<input value={content.title || ""} onChange={(e) => update("title", e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#C98484]" /></label>
          <label className="text-xs font-bold text-slate-700">Yayın Durumu<select value={content.status || "published"} onChange={(e) => update("status", e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="published">Yayınlanmış</option><option value="draft">Taslak</option></select></label>
          <label className="text-xs font-bold text-slate-700 sm:col-span-2">Hero Açıklaması<textarea value={content.hero_text || content.description || ""} onChange={(e) => update("hero_text", e.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-6 outline-none focus:border-[#C98484]" /></label>
        </div>
        <ImagePickerField label="Hero Görseli" value={content.hero_image || ""} onChange={(value) => update("hero_image", value)} helpText="Medya kütüphanesinden seçin veya yeni görsel yükleyin." />
      </section>

      {isOrder ? (
        <OrderFields content={content} update={update} />
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-sm font-black text-slate-900">İçerik Bölümleri</h2><p className="mt-1 text-[11px] text-slate-500">Başlıkları, metinleri, ikonları ve sıralamayı yönetin.</p></div><button type="button" onClick={() => setSections((current) => [...current, { icon: "file-text", title: "Yeni Bölüm", body: "" }])} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-extrabold text-[#C98484]"><Plus className="h-3.5 w-3.5" />Bölüm Ekle</button></div>
            <div className="space-y-3">
              {sections.map((section, index) => <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 lg:grid-cols-[42px_180px_minmax(0,1fr)_72px]">
                <button type="button" onClick={() => setIconIndex(index)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-white text-[#C98484]" title="İkon seç"><AppIcon name={section.icon || "file-text"} className="h-5 w-5" /></button>
                <input value={section.title} onChange={(e) => updateSection(index, { title: e.target.value })} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-[#C98484]" placeholder="Bölüm başlığı" />
                <textarea value={section.body} onChange={(e) => updateSection(index, { body: e.target.value })} rows={3} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 outline-none focus:border-[#C98484]" placeholder="Bölüm içeriği" />
                <div className="flex items-start justify-end gap-1"><button type="button" onClick={() => moveSection(index, -1)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500">↑</button><button type="button" onClick={() => moveSection(index, 1)} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500">↓</button><button type="button" onClick={() => setSections((current) => current.filter((_, i) => i !== index))} className="rounded-lg border border-rose-200 bg-white p-2 text-rose-500"><Trash2 className="h-3.5 w-3.5" /></button></div>
              </div>)}
            </div>
          </section>
          <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-bold text-slate-700 md:col-span-2">Alt Bilgilendirme Metni<textarea value={content.legal_note || ""} onChange={(e) => update("legal_note", e.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5" /></label>
            <label className="text-xs font-bold text-slate-700">Yan Kart Tipi<select value={content.legal_aside || ""} onChange={(e) => update("legal_aside", e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs"><option value="">Yok</option><option value="contact">İletişim</option><option value="cookie">Çerez Tercihi</option><option value="download">PDF / Yazdır</option></select></label>
            <div className="space-y-2"><label className="block text-xs font-bold text-slate-700">Alt Buton Metni<input value={content.legal_action_label || ""} onChange={(e) => update("legal_action_label", e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" /></label><label className="block text-xs font-bold text-slate-700">Alt Buton Bağlantısı<input value={content.legal_action_href || ""} onChange={(e) => update("legal_action_href", e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs" /></label></div>
            <label className="text-xs font-bold text-slate-700">Yan Kart Başlığı<input value={content.legal_aside_title || ""} onChange={(e) => update("legal_aside_title", e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label>
            <label className="text-xs font-bold text-slate-700 md:col-span-2">Yan Kart Açıklaması<textarea value={content.legal_aside_text || ""} onChange={(e) => update("legal_aside_text", e.target.value)} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5" /></label>
            <label className="text-xs font-bold text-slate-700">Yan Kart Telefonu<input value={content.legal_aside_phone || ""} onChange={(e) => update("legal_aside_phone", e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label>
            <label className="text-xs font-bold text-slate-700">Yan Kart E-postası<input value={content.legal_aside_email || ""} onChange={(e) => update("legal_aside_email", e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs" /></label>
          </section>
        </>
      )}

      <IconPickerModal isOpen={iconIndex !== null} onClose={() => setIconIndex(null)} onSelect={(icon) => { if (iconIndex !== null) updateSection(iconIndex, { icon }); setIconIndex(null) }} />
    </div>
  )
}

function OrderFields({ content, update }: { content: Content; update: (key: string, value: any) => void }) {
  const fields = [
    ["query_title", "Sorgulama Başlığı", "Siparişinizi Sorgulayın"], ["query_description", "Sorgulama Açıklaması", "Sipariş numaranızı ve e-posta adresinizi girin."],
    ["order_placeholder", "Sipariş No Alanı", "Sipariş Numaranız"], ["email_placeholder", "E-posta Alanı", "E-posta Adresiniz"], ["query_button", "Sorgulama Butonu", "Siparişimi Sorgula"],
    ["account_title", "Hesap Alanı Başlığı", "Sipariş Numaram Nerede?"], ["account_description", "Hesap Alanı Açıklaması", "Sipariş numaranız onay e-postanızda ve hesabınızda bulunur."],
    ["account_button", "Hesap Butonu", "Hesabıma Git"], ["process_title", "Süreç Başlığı", "Sipariş Süreci"], ["process_description", "Süreç Açıklaması", "Siparişiniz aşağıdaki aşamalardan geçerek size ulaşır."], ["help_title", "Yardım Başlığı", "Yardımcı Olalım"],
    ["support_title", "Destek Başlığı", "Hızlı Destek"], ["support_description", "Destek Açıklaması", "Siparişinizle ilgili farklı bir sorunuz mu var? Ekibimiz size yardımcı olmaktan memnuniyet duyar."], ["support_phone", "Destek Telefonu", ""], ["support_email", "Destek E-postası", ""],
  ]
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"><h2 className="mb-4 text-sm font-black text-slate-900">Sipariş Takibi İçerikleri</h2><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{fields.map(([key, label, fallback]) => <label key={key} className="text-xs font-bold text-slate-700">{label}<input value={content[key] || fallback} onChange={(e) => update(key, e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-[#C98484]" /></label>)}<label className="text-xs font-bold text-slate-700 md:col-span-2">Sipariş Aşamaları (Her satıra bir aşama)<textarea value={content.process_steps || "Sipariş Alındı\nHazırlanıyor\nKargoya Verildi\nYolda\nTeslim Edildi"} onChange={(e) => update("process_steps", e.target.value)} rows={5} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5" /></label><label className="text-xs font-bold text-slate-700 md:col-span-2 lg:col-span-1">SSS Soruları (Her satıra bir soru)<textarea value={content.help_questions || "Siparişim ne zaman kargoya verilir?\nKargo takibini nasıl yaparım?\nSiparişimi iptal edebilir miyim?\nÜrün iadesi nasıl yapılır?"} onChange={(e) => update("help_questions", e.target.value)} rows={5} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5" /></label></div></section>
}
