"use client"

import { useEffect, useState } from "react"
import { parseMoneyInput } from "@lib/util/money-input"
import FeedbackPopup from "@modules/common/components/feedback-popup"

const tl = (value: unknown) => (Number(value || 0) / 100).toFixed(2)
const money = (value: unknown) => (Number(value || 0) / 100).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const kurus = (value: unknown) =>
  Math.max(0, Math.round(Number(String(value).replace(",", ".")) * 100))

export default function MagazaAyarlariPage() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/admin/commerce-settings")
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        setSettings(data.settings)
      })
      .catch((err) => setError(err.message || "Ayarlar yüklenemedi."))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const response = await fetch("/api/admin/commerce-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, shipping_ranges: settings.shipping_ranges.map((range: any) => {
          const min = range._minDraft === undefined ? range.min : parseMoneyInput(range._minDraft)
          const max = range._maxDraft === undefined ? range.max : range._maxDraft.trim() === "" ? null : parseMoneyInput(range._maxDraft)
          const price = range._priceDraft === undefined ? range.price : parseMoneyInput(range._priceDraft)
          if (min === null || price === null || (range._maxDraft?.trim() && max === null)) throw new Error("Kargo aralıklarına geçerli tutarlar girin.")
          return { id: range.id, min, max, price }
        }) }),      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setSettings(data.settings)
      setMessage(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ayarlar kaydedilemedi.")
    } finally {
      setSaving(false)
    }
  }

  const nested = (section: string, key: string, value: unknown) =>
    setSettings((current: any) => ({
      ...current,
      [section]: { ...current[section], [key]: value },
    }))

  if (loading) return <div className="p-8">Mağaza ayarları yükleniyor…</div>
  if (!settings) return <div className="p-8 text-red-700">{error}</div>

  return (
    <main className="min-h-screen bg-[#f0f0f1] p-5 text-[#1d2327]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mağaza Ayarları</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kargo, ödeme, vergi, fatura ve sipariş kurallarını buradan yönetin.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded bg-[#C98484] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
        </button>
      </div>

      <FeedbackPopup message={error || message} title={error ? "Ayarlar kaydedilemedi" : "Ayarlar kaydedildi"} onClose={() => { setError(""); setMessage("") }} />

      <section className="mb-5 rounded-xl border border-slate-200 bg-white">
        <header className="border-b border-slate-200 px-4 py-3 font-bold">Sepet tutarına göre kargo ücretleri</header>
        <div className="space-y-3 p-4">
          <p className="text-sm text-slate-600">Kargo, ürünlerin KDV dahil ara toplamına göre otomatik hesaplanır. Alt sınır dahildir, üst sınır bir sonraki aralığa aittir. Son üst sınırı boş bırakın. Ücretsiz kargo için ücreti 0 TL girin.</p>
          {settings.shipping_ranges.map((range: any, index: number) => <div key={range.id} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            {[["min", "Sepet alt sınırı", false], ["max", "Sepet üst sınırı", true], ["price", "Kargo ücreti", false]].map(([key, label, optional]) => <label key={String(key)} className="text-xs font-semibold text-slate-600">{String(label)} (TL)
              <div className="relative"><input className="mt-1 w-full rounded-lg border p-2 pr-9 text-sm" inputMode="decimal" aria-label={`${label} ${index + 1}`} placeholder={optional ? "Sınırsız" : "0,00"} value={range[`_${key}Draft`] ?? (range[String(key)] === null ? "" : money(range[String(key)]))} onChange={e => { const rows = [...settings.shipping_ranges]; rows[index] = { ...range, [`_${key}Draft`]: e.target.value }; setSettings({ ...settings, shipping_ranges: rows }) }} onBlur={() => { const draft = range[`_${key}Draft`]; if (draft === undefined) return; const value = optional && !draft.trim() ? null : parseMoneyInput(draft); if (value !== null || (optional && !draft.trim())) { const rows = [...settings.shipping_ranges]; rows[index] = { ...range, [String(key)]: value, [`_${key}Draft`]: value === null ? "" : money(value) }; setSettings({ ...settings, shipping_ranges: rows }) } }} /><span className="absolute right-3 top-3 text-slate-400">TL</span></div>
            </label>)}
            <button className="self-end rounded-lg px-3 py-2 text-sm text-red-600" onClick={() => setSettings({ ...settings, shipping_ranges: settings.shipping_ranges.filter((_: any, i: number) => i !== index) })}>Sil</button>
          </div>)}
          <button className="rounded-lg border border-[#C98484] px-4 py-2 text-sm font-bold text-[#A95E5E]" onClick={() => setSettings({ ...settings, shipping_ranges: [...settings.shipping_ranges, { id: `range_${Date.now()}`, min: settings.shipping_ranges.at(-1)?.max ?? 0, max: null, price: 0 }] })}>+ Fiyat aralığı ekle</button>
        </div>
      </section>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded border border-slate-300 bg-white">
          <header className="border-b border-slate-300 px-4 py-3 font-bold">Ödeme yöntemleri</header>
          <div className="space-y-3 p-4 text-sm">
            {[
              ["creditCard", "Kredi / banka kartı (iyzico)"],
              ["bankTransfer", "Havale / EFT"],
              ["cashOnDelivery", "Kapıda ödeme"],
              ["installment", "Taksit seçenekleri"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between rounded border p-3">
                <span>{label}</span>
                <input type="checkbox" checked={Boolean(settings.payment_methods[key])} onChange={(e) => nested("payment_methods", key, e.target.checked)} />
              </label>
            ))}
            <label className="block">
              <span className="mb-1 block font-semibold">Azami taksit</span>
              <input className="w-full rounded border p-2" type="number" min="1" max="12" value={settings.payment_methods.maxInstallment} onChange={(e) => nested("payment_methods", "maxInstallment", e.target.value)} />
            </label>
            <p className="rounded bg-amber-50 p-3 text-amber-900">
              Kartla ödeme, yalnızca Entegrasyonlar bölümünde doğrulanmış iyzico hesabı etkinse müşteriye gösterilir.
            </p>
          </div>
        </section>

        <section className="rounded border border-slate-300 bg-white">
          <header className="border-b border-slate-300 px-4 py-3 font-bold">Vergi ayarları</header>
          <div className="space-y-3 p-4 text-sm">
            <label className="block"><span className="mb-1 block font-semibold">KDV oranı (%)</span><input className="w-full rounded border p-2" type="number" min="0" max="100" value={settings.tax_settings.vatRate} onChange={(e) => nested("tax_settings", "vatRate", e.target.value)} /></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.tax_settings.includeVat} onChange={(e) => nested("tax_settings", "includeVat", e.target.checked)} /> Fiyatlara KDV dâhil</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.tax_settings.showPricesWithVat} onChange={(e) => nested("tax_settings", "showPricesWithVat", e.target.checked)} /> KDV dâhil fiyat göster</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={settings.tax_settings.roundPrices} onChange={(e) => nested("tax_settings", "roundPrices", e.target.checked)} /> Fiyatları yuvarla</label>
            <div className="rounded bg-slate-100 p-3 font-semibold">Para birimi: Türk lirası (TRY)</div>
          </div>
        </section>
      </div>

      <section className="my-5 rounded border border-slate-300 bg-white">
        <header className="border-b border-slate-300 px-4 py-3 font-bold">Havale / EFT hesapları</header>
        <div className="space-y-3 p-4">
          {settings.bank_accounts.map((account: any, index: number) => (
            <div key={account.id} className="grid gap-3 rounded border p-3 md:grid-cols-6">
              {[
                ["bankName", "Banka"],
                ["accountHolder", "Hesap sahibi"],
                ["iban", "TR ile başlayan IBAN"],
                ["branch", "Şube"],
              ].map(([key, placeholder]) => (
                <input key={key} className="rounded border p-2" value={account[key]} placeholder={placeholder} onChange={(e) => {
                  const rows = [...settings.bank_accounts]; rows[index] = { ...account, [key]: e.target.value }; setSettings({ ...settings, bank_accounts: rows })
                }} />
              ))}
              <div className="space-y-1 text-xs">
                <label className="flex gap-2"><input type="checkbox" checked={account.active} onChange={(e) => {
                  const rows = [...settings.bank_accounts]; rows[index] = { ...account, active: e.target.checked }; setSettings({ ...settings, bank_accounts: rows })
                }} /> Etkin</label>
                <label className="flex gap-2"><input type="checkbox" checked={account.showInCheckout} onChange={(e) => {
                  const rows = [...settings.bank_accounts]; rows[index] = { ...account, showInCheckout: e.target.checked }; setSettings({ ...settings, bank_accounts: rows })
                }} /> Ödemede göster</label>
              </div>
              <button className="text-sm text-red-600" onClick={() => setSettings({ ...settings, bank_accounts: settings.bank_accounts.filter((_: any, i: number) => i !== index) })}>Hesabı sil</button>
            </div>
          ))}
          <button className="rounded border border-[#C98484] px-4 py-2 text-sm font-bold text-[#C98484]" onClick={() => setSettings({
            ...settings,
            bank_accounts: [...settings.bank_accounts, {
              id: `banka_${Date.now()}`, bankName: "", accountHolder: "", branch: "",
              iban: "", referenceCode: "", active: true, isDefault: settings.bank_accounts.length === 0,
              showInCheckout: true
            }]
          })}>+ Banka hesabı ekle</button>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded border border-slate-300 bg-white p-4">
          <h2 className="mb-4 font-bold">Sipariş kuralları</h2>
          <div className="space-y-3 text-sm">
            <label className="block"><span className="mb-1 block font-semibold">Minimum sipariş tutarı (TL)</span><input className="w-full rounded border p-2" type="number" step="0.01" value={tl(settings.order_settings.minOrderAmount)} onChange={(e) => nested("order_settings", "minOrderAmount", kurus(e.target.value))} /></label>
            <label className="block"><span className="mb-1 block font-semibold">Ödenmemiş sipariş iptal süresi (saat)</span><input className="w-full rounded border p-2" type="number" min="0" max="168" value={settings.order_settings.cancelWindow} onChange={(e) => nested("order_settings", "cancelWindow", e.target.value)} /></label>
            <label className="flex gap-2"><input type="checkbox" checked={settings.order_settings.requirePhone} onChange={(e) => nested("order_settings", "requirePhone", e.target.checked)} /> Telefon zorunlu</label>
            <label className="flex gap-2"><input type="checkbox" checked={settings.order_settings.guestCheckout} onChange={(e) => nested("order_settings", "guestCheckout", e.target.checked)} /> Üyeliksiz siparişe izin ver</label>
          </div>
        </section>

        <section className="rounded border border-slate-300 bg-white p-4">
          <h2 className="mb-4 font-bold">Fatura ayarları</h2>
          <div className="space-y-3 text-sm">
            <label className="block"><span className="mb-1 block font-semibold">Sağlayıcı kodu</span><input className="w-full rounded border p-2" value={settings.invoice_settings.provider} onChange={(e) => nested("invoice_settings", "provider", e.target.value)} /></label>
            <label className="block"><span className="mb-1 block font-semibold">Fatura öneki</span><input className="w-full rounded border p-2" value={settings.invoice_settings.invoicePrefix} onChange={(e) => nested("invoice_settings", "invoicePrefix", e.target.value)} /></label>
            <label className="block"><span className="mb-1 block font-semibold">Sonraki fatura numarası</span><input className="w-full rounded border p-2" value={settings.invoice_settings.nextInvoiceNo} onChange={(e) => nested("invoice_settings", "nextInvoiceNo", e.target.value)} /></label>
            <label className="flex gap-2"><input type="checkbox" checked={settings.invoice_settings.autoInvoice} onChange={(e) => nested("invoice_settings", "autoInvoice", e.target.checked)} /> Ödeme doğrulanınca otomatik faturala</label>
            <p className="rounded bg-amber-50 p-3 text-amber-900">Otomatik faturalama için Entegrasyonlar bölümünde resmi sağlayıcı API bilgileri doğrulanmalıdır.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
