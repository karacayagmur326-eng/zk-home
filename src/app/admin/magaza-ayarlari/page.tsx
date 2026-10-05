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
        body: JSON.stringify({ ...settings, shipping_methods: settings.shipping_methods.map((method: any) => {
          const price = method.name.trim().toLocaleLowerCase("tr-TR") === "ücretsiz kargo" ? 0 : method._priceDraft === undefined ? method.price : parseMoneyInput(method._priceDraft)
          const draft = method._thresholdDraft
          const freeThreshold = draft === undefined ? method.freeThreshold : draft.trim() === "" ? null : parseMoneyInput(draft)
          if (price === null || (draft?.trim() && freeThreshold === null)) throw new Error((method.name || "Teslimat yöntemi") + ": geçerli bir tutar girin. Örnek: 125,50. Ücretsiz kargo alt limiti boş bırakılabilir.")
          const { _priceDraft, _thresholdDraft, ...saved } = method
          return { ...saved, price, freeThreshold }
        }) }),
      })
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
  const freeShippingRule = settings.shipping_methods.find((method: any) => method.active && method.name.trim().toLocaleLowerCase("tr-TR") === "ücretsiz kargo" && method.freeThreshold !== null)

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

      <section className="mb-5 rounded border border-slate-300 bg-white">
        <header className="border-b border-slate-300 px-4 py-3 font-bold">Teslimat yöntemleri</header>
        <div className="space-y-3 p-4">
          <p className="text-sm text-slate-600">Kargo ücreti sipariş toplamına eklenir. “Belirli tutardan sonra ücretsiz” sınırına ulaşınca ücret otomatik sıfırlanır. Etkin “Ücretsiz Kargo” satırındaki sınır tüm kargo yöntemlerine uygulanır; müşteri ayrıca seçim yapmaz.</p>
          {settings.shipping_methods.map((method: any, index: number) => (
            <div key={method.id} className="grid gap-3 rounded border border-slate-200 p-3 md:grid-cols-7">
              {method.name.trim().toLocaleLowerCase("tr-TR") === "ücretsiz kargo" && <p className="md:col-span-7 rounded bg-rose-50 p-2 text-sm text-slate-700">Bu satır bir ücretsiz kargo kuralıdır. Kargo ücreti alanı uygulanmaz; sağdaki alt limit esas alınır. Limit ve üzerindeki sepetlerde kargo otomatik ücretsiz olur.</p>}
              <input className="rounded border p-2 md:col-span-2" value={method.name} placeholder="Yöntem adı" onChange={(e) => {
                const rows = [...settings.shipping_methods]; rows[index] = { ...method, name: e.target.value }; setSettings({ ...settings, shipping_methods: rows })
              }} />
              <input className="rounded border p-2" value={method.coverage} placeholder="Kapsam" onChange={(e) => {
                const rows = [...settings.shipping_methods]; rows[index] = { ...method, coverage: e.target.value }; setSettings({ ...settings, shipping_methods: rows })
              }} />
              <label className="min-w-0 text-xs font-semibold text-slate-600">Kargo ücreti (TL)
                <div className="relative"><input className="mt-1 w-full rounded border p-2 pr-9 text-sm disabled:bg-slate-100" type="text" inputMode="decimal" disabled={method.name.trim().toLocaleLowerCase("tr-TR") === "ücretsiz kargo"} value={method.name.trim().toLocaleLowerCase("tr-TR") === "ücretsiz kargo" ? money(0) : method._priceDraft ?? money(method.price)} aria-label="Kargo ücreti TL" onBlur={() => {
                  const value = method._priceDraft === undefined ? method.price : parseMoneyInput(method._priceDraft)
                  if (value !== null) { const rows = [...settings.shipping_methods]; rows[index] = { ...method, price: value, _priceDraft: money(value) }; setSettings({ ...settings, shipping_methods: rows }) }
                }} onChange={(e) => {
                  const rows = [...settings.shipping_methods]; rows[index] = { ...method, _priceDraft: e.target.value }; setSettings({ ...settings, shipping_methods: rows })
                }} /><span className="absolute right-3 top-3 text-sm text-slate-500">TL</span></div>
              </label>
              <div className="min-w-0 text-xs font-semibold text-slate-600">
                <label className="flex items-center gap-2"><input type="checkbox" checked={method.freeThreshold !== null} onChange={(e) => {
                  const rows = [...settings.shipping_methods]; rows[index] = { ...method, freeThreshold: e.target.checked ? (method.freeThreshold ?? 250000) : null, _thresholdDraft: e.target.checked ? money(method.freeThreshold ?? 250000) : "" }; setSettings({ ...settings, shipping_methods: rows })
                }} />Belirli tutardan sonra ücretsiz</label>
                <div className="relative"><input className="mt-1 w-full rounded border p-2 pr-9 text-sm disabled:bg-slate-100" type="text" inputMode="decimal" disabled={method.freeThreshold === null} value={method._thresholdDraft ?? (method.freeThreshold === null ? "" : money(method.freeThreshold))} aria-label="Ücretsiz kargo alt limiti TL" placeholder="Ücretsiz kargo kapalı" onBlur={() => {
                  const value = method._thresholdDraft === undefined ? method.freeThreshold : parseMoneyInput(method._thresholdDraft)
                  if (value !== null) { const rows = [...settings.shipping_methods]; rows[index] = { ...method, freeThreshold: value, _thresholdDraft: money(value) }; setSettings({ ...settings, shipping_methods: rows }) }
                }} onChange={(e) => {
                  const rows = [...settings.shipping_methods]; rows[index] = { ...method, _thresholdDraft: e.target.value }; setSettings({ ...settings, shipping_methods: rows })
                }} /><span className="absolute right-3 top-3 text-sm text-slate-500">TL</span></div>
                <p className="mt-1 font-normal">{(method._thresholdDraft !== undefined ? method._thresholdDraft === "" : method.freeThreshold === null) ? (freeShippingRule && method.icon !== "store" ? `Genel kural: ${money(freeShippingRule.freeThreshold)} TL ve üzeri ücretsiz.` : "Kargo ücreti tüm siparişlere eklenir.") : "Bu tutar ve üzerindeki siparişlerde kargo ücreti alınmaz."}</p>
              </div>
              <input className="rounded border p-2" value={method.estimatedDays} placeholder="2-4 iş günü" onChange={(e) => {
                const rows = [...settings.shipping_methods]; rows[index] = { ...method, estimatedDays: e.target.value }; setSettings({ ...settings, shipping_methods: rows })
              }} />
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={method.active} onChange={(e) => {
                  const rows = [...settings.shipping_methods]; rows[index] = { ...method, active: e.target.checked }; setSettings({ ...settings, shipping_methods: rows })
                }} /> Etkin</label>
                <button className="text-sm text-red-600" onClick={() => setSettings({ ...settings, shipping_methods: settings.shipping_methods.filter((_: any, i: number) => i !== index) })}>Sil</button>
              </div>
            </div>
          ))}
          <button className="rounded border border-[#C98484] px-4 py-2 text-sm font-bold text-[#C98484]" onClick={() => setSettings({
            ...settings,
            shipping_methods: [...settings.shipping_methods, {
              id: `kargo_${Date.now()}`, name: "", coverage: "Tüm Türkiye", price: 0,
              freeThreshold: null, estimatedDays: "2-4 iş günü", active: true, icon: "truck"
            }]
          })}>+ Teslimat yöntemi ekle</button>
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
