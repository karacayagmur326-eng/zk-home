"use client"

import { Activity, Bot, BrainCircuit, CheckCircle2, ExternalLink, Gauge, GripVertical, KeyRound, MessageCircleQuestion, Plus, RefreshCw, Save, Trash2, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { CHATBOT_DEFAULTS, ChatbotQuestion, ChatbotSettings } from "@lib/chatbot/config"

type ContactSettings = {
  whatsapp_enabled: boolean
  whatsapp_phone: string
  whatsapp_text: string
}

type AiProviderKind = "gemini" | "openai" | "anthropic"
type AiResetPeriod = "daily" | "monthly" | "never"
type AiProvider = {
  id: string; provider: AiProviderKind; name: string; model: string; enabled: boolean; priority: number
  token_limit: number | null; reset_period: AiResetPeriod; prompt_tokens: number; completion_tokens: number
  total_tokens: number; request_count: number; error_count: number; period_ends_at: string | null
  last_used_at: string | null; last_tested_at: string | null; last_status: "untested" | "healthy" | "error"
  last_error: string; key_hint: string
}

const PROVIDER_OPTIONS: Record<AiProviderKind, { label: string; keyUrl: string; keyLabel: string; models: { value: string; label: string }[] }> = {
  gemini: { label: "Google Gemini", keyUrl: "https://aistudio.google.com/app/apikey", keyLabel: "Google AI Studio'da API anahtarı oluştur", models: [
    { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite" },
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  ] },
  openai: { label: "OpenAI / ChatGPT", keyUrl: "https://platform.openai.com/api-keys", keyLabel: "OpenAI Platform'da API anahtarı oluştur", models: [
    { value: "gpt-5-mini", label: "GPT-5 mini" },
    { value: "gpt-5", label: "GPT-5" },
  ] },
  anthropic: { label: "Anthropic Claude", keyUrl: "https://platform.claude.com/settings/keys", keyLabel: "Claude Platform'da API anahtarı oluştur", models: [
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
  ] },
}

const freshProvider = () => ({ provider: "gemini" as AiProviderKind, name: "", model: "gemini-2.5-flash-lite", api_key: "", enabled: true, priority: 100, token_limit: "", reset_period: "monthly" as AiResetPeriod })

const emptyQuestion = (): ChatbotQuestion => ({
  id: crypto.randomUUID(), question: "", answer: "", keywords: "", link_url: "", link_text: "", active: true,
})

export default function ChatbotAdminPage() {
  const [settings, setSettings] = useState<ChatbotSettings>(CHATBOT_DEFAULTS)
  const [contact, setContact] = useState<ContactSettings>({ whatsapp_enabled: true, whatsapp_phone: "", whatsapp_text: "WhatsApp ile iletişime geç" })
  const [fullContact, setFullContact] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [providerDraft, setProviderDraft] = useState(freshProvider)
  const [addingProvider, setAddingProvider] = useState(false)
  const [providerBusy, setProviderBusy] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/chatbot", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/contact-settings", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/chatbot/providers", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([botData, contactData, providerData]) => {
      if (botData.settings) setSettings({ ...CHATBOT_DEFAULTS, ...botData.settings })
      setProviders(providerData.providers || [])
      const info = contactData.contact_info || {}
      setFullContact(info)
      setContact({
        whatsapp_enabled: info.whatsapp_enabled !== false,
        whatsapp_phone: info.whatsapp_phone || "",
        whatsapp_text: info.whatsapp_text || "WhatsApp ile iletişime geç",
      })
    }).finally(() => setLoading(false))
  }, [])

  function updateQuestion(id: string, patch: Partial<ChatbotQuestion>) {
    setSettings((current) => ({ ...current, questions: current.questions.map((item) => item.id === id ? { ...item, ...patch } : item) }))
  }

  async function save() {
    setSaving(true)
    try {
      const [botResponse, contactResponse] = await Promise.all([
        fetch("/api/admin/chatbot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ settings }) }),
        fetch("/api/admin/contact-settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contact_info: { ...fullContact, ...contact } }) }),
      ])
      const botData = await botResponse.json()
      const contactData = await contactResponse.json()
      if (!botResponse.ok || !contactResponse.ok) throw new Error(botData.error || contactData.error || "Ayarlar kaydedilemedi.")
      setSettings(botData.settings || settings)
      ;(window as any).showAdminAlert?.("ZK Home Asistan ve WhatsApp ayarları canlı site için kaydedildi.", "Kaydedildi", "success")
    } catch (error) {
      ;(window as any).showAdminAlert?.(error instanceof Error ? error.message : "Ayarlar kaydedilemedi.", "Hata", "error")
    } finally {
      setSaving(false)
    }
  }

  async function addProvider() {
    setAddingProvider(true)
    try {
      const response = await fetch("/api/admin/chatbot/providers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...providerDraft, name: providerDraft.name || PROVIDER_OPTIONS[providerDraft.provider].label }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "AI bağlantısı eklenemedi.")
      setProviders(data.providers || [])
      setProviderDraft(freshProvider())
      ;(window as any).showAdminAlert?.("API anahtarı şifrelenerek eklendi.", "AI bağlantısı eklendi", "success")
    } catch (error) {
      ;(window as any).showAdminAlert?.(error instanceof Error ? error.message : "Bağlantı eklenemedi.", "Hata", "error")
    } finally {
      setAddingProvider(false)
    }
  }

  async function providerAction(id: string, action: "test" | "delete" | "reset" | "toggle") {
    setProviderBusy(`${action}:${id}`)
    try {
      const current = providers.find((item) => item.id === id)
      const response = action === "test"
        ? await fetch("/api/admin/chatbot/providers/test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) })
        : action === "delete"
          ? await fetch(`/api/admin/chatbot/providers?id=${encodeURIComponent(id)}`, { method: "DELETE" })
          : await fetch("/api/admin/chatbot/providers", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, ...(action === "reset" ? { reset_usage: true } : { enabled: !current?.enabled }) }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "İşlem tamamlanamadı.")
      setProviders(data.providers || [])
      ;(window as any).showAdminAlert?.(action === "test" ? "Bağlantı doğrulandı ve gerçek token kullanımı kaydedildi." : "AI bağlantısı güncellendi.", "İşlem başarılı", "success")
    } catch (error) {
      ;(window as any).showAdminAlert?.(error instanceof Error ? error.message : "İşlem tamamlanamadı.", "AI bağlantı hatası", "error")
      const refreshed = await fetch("/api/admin/chatbot/providers", { cache: "no-store" }).then((r) => r.json()).catch(() => null)
      if (refreshed?.providers) setProviders(refreshed.providers)
    } finally { setProviderBusy("") }
  }

  function patchProvider(id: string, patch: Partial<AiProvider>) {
    setProviders((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  async function saveProviderRecord(provider: AiProvider) {
    setProviderBusy(`save:${provider.id}`)
    try {
      const response = await fetch("/api/admin/chatbot/providers", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: provider.id, name: provider.name, model: provider.model, priority: provider.priority, token_limit: provider.token_limit, reset_period: provider.reset_period }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "AI bağlantısı kaydedilemedi.")
      setProviders(data.providers || [])
      ;(window as any).showAdminAlert?.("Model, öncelik ve dönemsel bütçe güncellendi.", "AI bağlantısı kaydedildi", "success")
    } catch (error) {
      ;(window as any).showAdminAlert?.(error instanceof Error ? error.message : "Bağlantı kaydedilemedi.", "Hata", "error")
    } finally { setProviderBusy("") }
  }

  if (loading) return <div className="admin-card p-8 text-sm font-bold text-slate-500">ZK Home Asistan ayarları yükleniyor…</div>

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">ZK Home Asistan & Canlı İletişim</h2>
          <p className="mt-1 text-xs font-medium text-slate-500">Hazır yanıtları, ZK Home Asistanı ve WhatsApp kanalını tek merkezden yönetin.</p>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-[#C98484] px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-rose-100 transition hover:bg-[#d94f00] disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? "Kaydediliyor…" : "Ayarları Kaydet"}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="admin-card p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-[#C98484]"><Bot className="h-5 w-5" /></span><div><h3 className="text-sm font-black text-slate-900">ZK Home Asistan</h3><p className="text-[11px] text-slate-500">Müşterilere otomatik ve bağlama uygun yanıt verir.</p></div></div>
            <Toggle checked={settings.enabled} onChange={(enabled) => setSettings({ ...settings, enabled })} />
          </div>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <SourceToggle title="Canlı ürün kataloğu" description="Fiyat, stok ve ürün özelliklerini anlık analiz eder." checked={settings.catalog_search_enabled} onChange={(catalog_search_enabled) => setSettings({ ...settings, catalog_search_enabled })} />
              <SourceToggle title="Site sayfaları" description="Admin panelindeki güncel sayfa içeriklerinde arar." checked={settings.page_search_enabled} onChange={(page_search_enabled) => setSettings({ ...settings, page_search_enabled })} />
            </div>
            <Field label="Asistan adı" value={settings.bot_name} onChange={(bot_name) => setSettings({ ...settings, bot_name })} />
            <Area label="Karşılama mesajı" value={settings.welcome_message} onChange={(welcome_message) => setSettings({ ...settings, welcome_message })} />
            <Area label="Cevap bulunamadığında" value={settings.fallback_message} onChange={(fallback_message) => setSettings({ ...settings, fallback_message })} />
            <div className="grid grid-cols-[1fr_100px_110px] gap-3"><Field label="Yazı alanı açıklaması" value={settings.input_placeholder} onChange={(input_placeholder) => setSettings({ ...settings, input_placeholder })} /><label className="block text-[11px] font-extrabold text-slate-700">Tema rengi<input type="color" value={settings.accent_color} onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white p-1" /></label><label className="block text-[11px] font-extrabold text-slate-700">Ürün sonucu<input type="number" min={1} max={8} value={settings.max_product_results} onChange={(e) => setSettings({ ...settings, max_product_results: Number(e.target.value) })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold" /></label></div>
          </div>
        </section>

        <section className="admin-card p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><MessageCircleQuestion className="h-5 w-5" /></span><div><h3 className="text-sm font-black text-slate-900">WhatsApp İletişimi</h3><p className="text-[11px] text-slate-500">ZK Home Asistandan bağımsız açılıp kapatılabilir.</p></div></div>
            <Toggle checked={contact.whatsapp_enabled} onChange={(whatsapp_enabled) => setContact({ ...contact, whatsapp_enabled })} />
          </div>
          <div className="space-y-3">
            <Field label="WhatsApp numarası" value={contact.whatsapp_phone} onChange={(whatsapp_phone) => setContact({ ...contact, whatsapp_phone })} placeholder="9" />
            <Field label="Buton açıklaması" value={contact.whatsapp_text} onChange={(whatsapp_text) => setContact({ ...contact, whatsapp_text })} />
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-xs leading-5 text-emerald-800">Numara WhatsApp hesabına kayıtlı olmalıdır. `05xx` biçiminde girerseniz sistem otomatik olarak `905xx` biçimine dönüştürür.</div>
          </div>
        </section>
      </div>

      <section className="admin-card p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><BrainCircuit className="h-5 w-5" /></span>
            <div><h3 className="text-sm font-black text-slate-900">AI Sağlayıcıları & Kullanım</h3><p className="text-[11px] text-slate-500">Birden fazla anahtarı öncelik sırasıyla ve otomatik yedeklemeyle yönetin.</p></div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-extrabold text-violet-700">{providers.filter((item) => item.enabled).length} aktif bağlantı</span>
            <Toggle checked={settings.ai_enabled} onChange={(ai_enabled) => setSettings({ ...settings, ai_enabled })} />
          </div>
        </div>
        <div className="mb-4"><Area label="Konuşma tonu ve davranışı" value={settings.ai_tone} onChange={(ai_tone) => setSettings({ ...settings, ai_tone })} /></div>

        <div className="space-y-3">
          {providers.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center"><BrainCircuit className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-2 text-xs font-extrabold text-slate-700">Henüz AI bağlantısı eklenmemiş</p><p className="mt-1 text-[11px] text-slate-500">Aşağıdaki formdan Gemini, OpenAI veya Claude anahtarı ekleyebilirsiniz.</p></div>}
          {providers.map((provider) => {
            const limit = provider.token_limit
            const remaining = limit === null ? null : Math.max(0, limit - provider.total_tokens)
            const percentage = limit ? Math.min(100, Math.round((provider.total_tokens / limit) * 100)) : 0
            return <article key={provider.id} className={`rounded-2xl border p-4 ${provider.enabled ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-75"}`}>
              <div className="flex flex-wrap items-start gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${provider.last_status === "healthy" ? "bg-emerald-50 text-emerald-600" : provider.last_status === "error" ? "bg-rose-50 text-rose-600" : "bg-violet-50 text-violet-600"}`}><Activity className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-black text-slate-900">{provider.name}</h4><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold uppercase text-slate-600">{PROVIDER_OPTIONS[provider.provider].label}</span><span className="text-[10px] font-bold text-slate-400">Öncelik {provider.priority}</span></div><p className="mt-1 text-[11px] font-semibold text-slate-500">{provider.model} · {provider.key_hint}</p>{provider.last_error && <p className="mt-1 line-clamp-2 text-[10px] text-rose-600">{provider.last_error}</p>}</div>
                <div className="flex items-center gap-2"><Toggle checked={provider.enabled} onChange={() => providerAction(provider.id, "toggle")} /><button type="button" onClick={() => providerAction(provider.id, "delete")} disabled={Boolean(providerBusy)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50" aria-label="AI bağlantısını sil"><Trash2 className="h-4 w-4" /></button></div>
              </div>
              <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Model<select value={provider.model} onChange={(e) => patchProvider(provider.id, { model: e.target.value })} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold normal-case text-slate-700">{PROVIDER_OPTIONS[provider.provider].models.map((model) => <option key={model.value} value={model.value}>{model.label}</option>)}</select></label>
                <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Token bütçesi<input type="number" min={1} value={provider.token_limit ?? ""} onChange={(e) => patchProvider(provider.id, { token_limit: e.target.value ? Number(e.target.value) : null })} placeholder="Limitsiz" className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold normal-case text-slate-700" /></label>
                <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Sayaç dönemi<select value={provider.reset_period} onChange={(e) => patchProvider(provider.id, { reset_period: e.target.value as AiResetPeriod })} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold normal-case text-slate-700"><option value="daily">Günlük</option><option value="monthly">Aylık</option><option value="never">Sıfırlanmasın</option></select></label>
                <label className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">Öncelik<div className="mt-1 flex gap-1"><input type="number" min={1} max={999} value={provider.priority} onChange={(e) => patchProvider(provider.id, { priority: Number(e.target.value) || 100 })} className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold normal-case text-slate-700" /><button type="button" onClick={() => saveProviderRecord(provider)} disabled={Boolean(providerBusy)} className="rounded-lg bg-slate-900 px-3 text-[10px] font-extrabold normal-case text-white">{providerBusy === `save:${provider.id}` ? "…" : "Kaydet"}</button></div></label>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <UsageStat label="Kullanılan · giriş/çıkış" value={`${formatTokens(provider.total_tokens)} · ${formatTokens(provider.prompt_tokens)}/${formatTokens(provider.completion_tokens)}`} icon={<Gauge className="h-3.5 w-3.5" />} />
                <UsageStat label="Kalan yerel bütçe" value={remaining === null ? "Limitsiz" : `${formatTokens(remaining)} token`} />
                <UsageStat label="İstek / hata" value={`${provider.request_count} / ${provider.error_count}`} />
                <UsageStat label="Sayaç yenileme" value={provider.period_ends_at ? formatDate(provider.period_ends_at) : "Yenilenmez"} />
              </div>
              {limit !== null && <div className="mt-3"><div className="mb-1 flex justify-between text-[9px] font-bold text-slate-500"><span>Dönemsel kullanım</span><span>%{percentage}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${percentage >= 90 ? "bg-rose-500" : percentage >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${percentage}%` }} /></div></div>}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3"><div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">{provider.last_status === "healthy" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : provider.last_status === "error" ? <XCircle className="h-3.5 w-3.5 text-rose-500" /> : <Activity className="h-3.5 w-3.5" />}{provider.last_tested_at ? `Son test: ${formatDate(provider.last_tested_at)}` : "Henüz test edilmedi"}</div><div className="flex gap-2"><button type="button" onClick={() => providerAction(provider.id, "reset")} disabled={Boolean(providerBusy)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-extrabold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" /> Sayacı sıfırla</button><button type="button" onClick={() => providerAction(provider.id, "test")} disabled={Boolean(providerBusy)} className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[10px] font-extrabold text-violet-700 hover:bg-violet-100">{providerBusy === `test:${provider.id}` ? "Test ediliyor…" : "Bağlantıyı test et"}</button></div></div>
            </article>
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
          <div className="mb-3 flex items-center gap-2"><Plus className="h-4 w-4 text-violet-600" /><h4 className="text-xs font-black text-slate-900">Yeni AI bağlantısı ekle</h4></div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="min-w-0 text-[10px] font-extrabold text-slate-600">Sağlayıcı<select value={providerDraft.provider} onChange={(e) => { const provider = e.target.value as AiProviderKind; setProviderDraft({ ...providerDraft, provider, model: PROVIDER_OPTIONS[provider].models[0].value }) }} className="mt-1 h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold">{Object.entries(PROVIDER_OPTIONS).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}</select><a href={PROVIDER_OPTIONS[providerDraft.provider].keyUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex max-w-full items-center gap-1.5 text-[10px] font-extrabold leading-4 text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900"><span className="min-w-0 break-words">{PROVIDER_OPTIONS[providerDraft.provider].keyLabel}</span><ExternalLink className="h-3.5 w-3.5 shrink-0" /></a></label>
            <Field label="Bağlantı adı" value={providerDraft.name} onChange={(name) => setProviderDraft({ ...providerDraft, name })} placeholder="Örn. Gemini ana hesap" />
            <label className="text-[10px] font-extrabold text-slate-600">Model<select value={providerDraft.model} onChange={(e) => setProviderDraft({ ...providerDraft, model: e.target.value })} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold">{PROVIDER_OPTIONS[providerDraft.provider].models.map((model) => <option key={model.value} value={model.value}>{model.label}</option>)}</select></label>
            <Field label="Öncelik" value={String(providerDraft.priority)} onChange={(priority) => setProviderDraft({ ...providerDraft, priority: Number(priority) || 100 })} placeholder="100" />
            <label className="relative block text-[10px] font-extrabold text-slate-600 md:col-span-2">API anahtarı<KeyRound className="absolute bottom-3 left-3 h-4 w-4 text-slate-400" /><input type="password" value={providerDraft.api_key} onChange={(e) => setProviderDraft({ ...providerDraft, api_key: e.target.value })} autoComplete="new-password" placeholder="Anahtar yalnız sunucuda şifreli saklanır" className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold outline-none focus:border-violet-400" /></label>
            <Field label="Dönemsel token bütçesi (isteğe bağlı)" value={String(providerDraft.token_limit)} onChange={(token_limit) => setProviderDraft({ ...providerDraft, token_limit })} placeholder="Örn. 1000000" />
            <label className="text-[10px] font-extrabold text-slate-600">Sayaç dönemi<select value={providerDraft.reset_period} onChange={(e) => setProviderDraft({ ...providerDraft, reset_period: e.target.value as AiResetPeriod })} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"><option value="daily">Günlük</option><option value="monthly">Aylık</option><option value="never">Sıfırlanmasın</option></select></label>
          </div>
          <div className="mt-3 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"><p className="max-w-3xl text-[10px] leading-4 text-violet-800">Kalan değer, bu site üzerinden ölçülen gerçek token tüketiminin tanımladığınız dönemsel bütçeden çıkarılmasıdır. Sağlayıcı hesabının genel bakiyesi değildir.</p><button type="button" onClick={addProvider} disabled={addingProvider || providerDraft.api_key.trim().length < 12} className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-violet-700 disabled:opacity-40 sm:w-auto">{addingProvider ? "Ekleniyor…" : "Bağlantıyı ekle"}</button></div>
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div><h3 className="text-sm font-black text-slate-900">Hazır Soru ve Cevaplar</h3><p className="mt-1 text-[11px] text-slate-500">Anahtar kelimeler müşterinin farklı ifadelerle sorduğu soruları eşleştirir.</p></div>
          <button type="button" onClick={() => setSettings({ ...settings, questions: [...settings.questions, emptyQuestion()] })} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-extrabold text-[#C98484] hover:bg-rose-100"><Plus className="h-4 w-4" /> Yeni Soru</button>
        </div>
        <div className="space-y-4 p-5">
          {settings.questions.map((item, index) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="mb-3 flex items-center gap-2"><GripVertical className="h-4 w-4 text-slate-300" /><span className="text-xs font-black text-slate-500">Soru {index + 1}</span><span className="flex-1" /><span className="text-[10px] font-bold text-slate-500">{item.active ? "Aktif" : "Pasif"}</span><Toggle checked={item.active} onChange={(active) => updateQuestion(item.id, { active })} /><button type="button" onClick={() => setSettings({ ...settings, questions: settings.questions.filter((q) => q.id !== item.id) })} className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50" aria-label="Soruyu sil"><Trash2 className="h-4 w-4" /></button></div>
              <div className="grid gap-3 lg:grid-cols-2"><Field label="Müşterinin göreceği soru" value={item.question} onChange={(question) => updateQuestion(item.id, { question })} /><Field label="Anahtar kelimeler" value={item.keywords} onChange={(keywords) => updateQuestion(item.id, { keywords })} placeholder="kargo takip teslimat nerede" /></div>
              <div className="mt-3"><Area label="Kurumsal yanıt" value={item.answer} onChange={(answer) => updateQuestion(item.id, { answer })} /></div>
              <div className="mt-3 grid gap-3 lg:grid-cols-2"><Field label="Bağlantı (isteğe bağlı)" value={item.link_url || ""} onChange={(link_url) => updateQuestion(item.id, { link_url })} placeholder="/hesabim/siparislerim" /><Field label="Bağlantı butonu yazısı" value={item.link_text || ""} onChange={(link_text) => updateQuestion(item.id, { link_text })} placeholder="Siparişlerime Git" /></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function Field({ label, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="block text-[11px] font-extrabold text-slate-700">{label}<input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 outline-none focus:border-[#C98484]" /></label>
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="block text-[11px] font-extrabold text-slate-700">{label}<textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold leading-5 text-slate-900 outline-none focus:border-[#C98484]" /></label>
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-6 w-11 flex-none rounded-full transition ${checked ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} /></button>
}

function SourceToggle({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className={`flex items-start gap-3 rounded-xl border p-3 ${checked ? "border-rose-200 bg-rose-50/60" : "border-slate-200 bg-slate-50"}`}><div className="min-w-0 flex-1"><p className="text-xs font-extrabold text-slate-800">{title}</p><p className="mt-0.5 text-[10px] leading-4 text-slate-500">{description}</p></div><Toggle checked={checked} onChange={onChange} /></div>
}

function UsageStat({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return <div className="rounded-xl bg-slate-50 px-3 py-2.5"><div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">{icon}{label}</div><p className="mt-1 text-[11px] font-black text-slate-700">{value}</p></div>
}

function formatTokens(value: number) {
  return new Intl.NumberFormat("tr-TR").format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
}
