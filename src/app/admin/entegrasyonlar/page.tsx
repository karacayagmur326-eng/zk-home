"use client"

import { useEffect, useState } from "react"
import {
  Check,
  Plus,
  Trash2,
  CreditCard,
  KeyRound,
  ReceiptText,
  Store,
  Workflow,
  Info,
  RefreshCw,
  AlertTriangle,
  X,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
} from "lucide-react"

type Integration = {
  provider: string
  name: string
  integration_type: "payment" | "invoice"
  enabled: boolean
  environment: "test" | "production"
  public_config: Record<string, any>
  secrets?: Record<string, string>
  secret_status: Record<string, boolean>
  updated_at: string | null
}

type TestStatus = "idle" | "testing" | "success" | "fail"

// Zorunlu alanlar
const REQUIRED_SECRETS: Record<string, string[]> = {
  iyzico: ["api_key", "secret_key"],
  birfatura: ["api_key"],
}

function getRequiredSecrets(provider: string, integrationType: string) {
  if (REQUIRED_SECRETS[provider]) return REQUIRED_SECRETS[provider]
  return integrationType === "payment" ? ["api_key", "secret_key"] : ["api_key"]
}

const SECRET_LABELS: Record<string, string> = {
  api_key: "API Şifresi / Token (GUID)",
  secret_key: "Gizli Anahtar (Secret Key)",
  username: "Kullanıcı Adı",
  password: "API Şifresi / Token",
}

export default function IntegrationsPage() {
  const [items, setItems] = useState<Integration[]>([])
  const [secrets, setSecrets] = useState<Record<string, Record<string, string>>>({})
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<"payment" | "invoice">("invoice")
  const [message, setMessage] = useState("")
  const [copiedKey, setCopiedKey] = useState("")
  const [busy, setBusy] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [testStatus, setTestStatus] = useState<Record<string, TestStatus>>({})
  const [testMessage, setTestMessage] = useState<Record<string, string>>({})
  const [validated, setValidated] = useState<Record<string, boolean>>({})
  const [originUrl, setOriginUrl] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin)
    }
  }, [])

  async function load() {
    try {
      const response = await fetch("/api/admin/integrations")
      if (response.status === 401) return window.location.assign("/admin")
      const data = await response.json()
      const integrations: Integration[] = data.integrations || []
      setItems(integrations)

      const loadedSecrets: Record<string, Record<string, string>> = {}
      for (const item of integrations) {
        if (item.secrets && Object.keys(item.secrets).length > 0) {
          loadedSecrets[item.provider] = { ...item.secrets }
        }
      }
      setSecrets((prev) => ({ ...loadedSecrets, ...prev }))

      setValidated((prev) => {
        const next = { ...prev }
        for (const item of integrations) {
          const required = getRequiredSecrets(item.provider, item.integration_type)
          const allSaved = required.every((f) => item.secret_status[f])
          if (allSaved && !next[item.provider]) {
            next[item.provider] = true
          }
        }
        return next
      })
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function update(provider: string, patch: Partial<Integration>) {
    setItems((current) =>
      current.map((item) =>
        item.provider === provider ? { ...item, ...patch } : item
      )
    )
  }

  function updatePublic(provider: string, field: string, value: any) {
    setItems((current) =>
      current.map((item) =>
        item.provider === provider
          ? { ...item, public_config: { ...item.public_config, [field]: value } }
          : item
      )
    )
  }

  function updateSecret(provider: string, field: string, value: string) {
    setSecrets((current) => ({
      ...current,
      [provider]: { ...current[provider], [field]: value },
    }))
    setValidated((prev) => ({ ...prev, [provider]: false }))
    setTestStatus((prev) => ({ ...prev, [provider]: "idle" }))
    setTestMessage((prev) => ({ ...prev, [provider]: "" }))
  }

  function generateRandomGuid(provider: string) {
    let guid = ""
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      guid = crypto.randomUUID()
    } else {
      guid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }
    updateSecret(provider, "api_key", guid)
    copyToClipboard(guid, `guid_${provider}`)
  }

  function copyToClipboard(textToCopy: string, keyName: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy)
      setCopiedKey(keyName)
      setTimeout(() => setCopiedKey(""), 2500)
    }
  }

  // ── Test Connection ───────────────────────────────────────────────────────
  async function testConnection(item: Integration) {
    const providerSecrets = secrets[item.provider] || {}
    const required = getRequiredSecrets(item.provider, item.integration_type)
    const savedStatus = item.secret_status

    const missing = required.filter(
      (f) => !providerSecrets[f]?.trim() && !savedStatus[f]
    )
    if (missing.length) {
      setTestStatus((prev) => ({ ...prev, [item.provider]: "fail" }))
      setTestMessage((prev) => ({
        ...prev,
        [item.provider]: `Zorunlu alanlar eksik: ${missing.map((f) => SECRET_LABELS[f] || f).join(", ")}`,
      }))
      return
    }

    setTestStatus((prev) => ({ ...prev, [item.provider]: "testing" }))
    setTestMessage((prev) => ({ ...prev, [item.provider]: "" }))

    try {
      const response = await fetch("/api/admin/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: item.provider,
          type: item.integration_type,
          api_key: providerSecrets.api_key || "",
          secret_key: providerSecrets.secret_key || "",
          username: providerSecrets.username || "",
          password: providerSecrets.password || "",
          environment: item.environment,
          api_url: item.public_config?.api_url || "",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setTestStatus((prev) => ({ ...prev, [item.provider]: "success" }))
        setTestMessage((prev) => ({ ...prev, [item.provider]: data.message }))
        setValidated((prev) => ({ ...prev, [item.provider]: true }))
      } else {
        setTestStatus((prev) => ({ ...prev, [item.provider]: "fail" }))
        setTestMessage((prev) => ({ ...prev, [item.provider]: data.message || data.error }))
        setValidated((prev) => ({ ...prev, [item.provider]: false }))
      }
    } catch (e: any) {
      setTestStatus((prev) => ({ ...prev, [item.provider]: "fail" }))
      setTestMessage((prev) => ({
        ...prev,
        [item.provider]: `Bağlantı hatası: ${e.message}`,
      }))
    }
  }

  function trySetEnabled(item: Integration, enabled: boolean) {
    if (enabled && !validated[item.provider]) {
      setTestStatus((prev) => ({ ...prev, [item.provider]: "fail" }))
      setTestMessage((prev) => ({
        ...prev,
        [item.provider]:
          "Entegrasyonu aktif etmeden önce bağlantıyı test edip doğrulayınız.",
      }))
      return
    }
    update(item.provider, { enabled })
  }

  async function addIntegration() {
    if (!newName.trim()) return setMessage("Lütfen entegrasyon adını yazın.")
    setBusy("new")
    try {
      const response = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, integration_type: newType }),
      })
      const data = await response.json()
      setMessage(data.message || data.error)
      if (response.ok) {
        setNewName("")
        setShowAdd(false)
        await load()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setBusy("")
    }
  }

  async function save(item: Integration) {
    setBusy(item.provider)
    try {
      const response = await fetch("/api/admin/integrations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, secrets: secrets[item.provider] || {} }),
      })
      const data = await response.json()
      setMessage(data.message || data.error)
      if (response.ok) await load()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy("")
    }
  }

  async function remove(provider: string) {
    if (
      !confirm(
        "Bu entegrasyonu ve tüm kayıtlı anahtarlarını kalıcı olarak silmek istiyor musunuz? Veritabanından tamamen kaldırılacaktır."
      )
    )
      return
    setBusy(provider)
    try {
      const response = await fetch(
        `/api/admin/integrations?provider=${encodeURIComponent(provider)}`,
        { method: "DELETE" }
      )
      const data = await response.json()
      setMessage(data.message || data.error)
      if (response.ok) await load()
    } catch (e) {
      console.error(e)
    } finally {
      setBusy("")
    }
  }

  return (
    <div className="w-full space-y-6 pb-16 font-sans text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Entegrasyonlar
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Ödeme, e-fatura (BirFatura) ve harici servis bağlantılarını yönetin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((prev) => !prev)}
          className="px-5 py-2.5 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Yeni Entegrasyon Ekle</span>
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 font-bold text-xs flex items-center justify-between shadow-2xs">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-800 transition-colors"
            aria-label="Bildirimi kapat"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ADD PANEL */}
      {showAdd && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#C98484]" />
              Yeni Entegrasyon Oluştur
            </h3>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Kapat ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Entegrasyon Adı <span className="text-[#C98484]">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Örn: BirFatura, iyzico, Paraşüt"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Entegrasyon Türü
              </label>
              <select
                value={newType}
                onChange={(e) =>
                  setNewType(e.target.value as "payment" | "invoice")
                }
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] cursor-pointer"
              >
                <option value="invoice">Faturalama sistemi (BirFatura vb.)</option>
                <option value="payment">Ödeme yöntemi (iyzico vb.)</option>
              </select>
            </div>
            <button
              type="button"
              onClick={addIntegration}
              disabled={busy === "new"}
              className="w-full py-2.5 px-4 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy === "new" ? "Ekleniyor..." : "Entegrasyonu Oluştur"}
            </button>
          </div>
        </div>
      )}

      {/* INTEGRATIONS LIST */}
      {!items.length ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 font-medium text-sm">
          Henüz entegrasyon eklenmedi. Yukarıdaki butonu kullanarak BirFatura veya ödeme entegrasyonu ekleyebilirsiniz.
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => {
            const isInvoice = item.integration_type === "invoice"
            const isBirFatura =
              item.provider === "birfatura" ||
              item.name.toLowerCase().includes("birfatura") ||
              isInvoice
            const badgeText =
              item.public_config.badge_text ||
              (isInvoice ? "Faturalama Sistemi" : "Ödeme Yöntemi")
            const description =
              item.public_config.description ||
              (isBirFatura
                ? "BirFatura Özel Entegrasyonu ve E-Fatura Sistemi"
                : isInvoice
                ? "E-fatura kesim ve yönetim entegrasyonu"
                : "Kredi kartı ve online ödeme altyapısı")
            const required = getRequiredSecrets(item.provider, item.integration_type)
            const providerSecrets = secrets[item.provider] || {}
            const isValidated = validated[item.provider]
            const tStatus = testStatus[item.provider] || "idle"
            const tMsg = testMessage[item.provider] || ""
            const isPassShown = showSecret[item.provider] || false

            const missingRequired = required.filter(
              (f) => !providerSecrets[f]?.trim() && !item.secret_status[f]
            )
            const hasAllRequired = missingRequired.length === 0

            return (
              <div
                key={item.provider}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden transition-all"
              >
                {/* CARD HEADER */}
                <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/40">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0 p-2">
                      {isBirFatura ? (
                        <div className="w-full h-full rounded-xl bg-rose-100 text-[#C98484] flex items-center justify-center font-black text-xs">
                          <ReceiptText className="w-6 h-6" />
                        </div>
                      ) : item.provider === "iyzico" ? (
                        <div className="w-full h-full rounded-xl bg-[#1e3a5f] text-white flex items-center justify-center font-black text-sm tracking-tighter">
                          iyzico
                        </div>
                      ) : isInvoice ? (
                        <ReceiptText className="w-6 h-6 text-amber-600" />
                      ) : (
                        <CreditCard className="w-7 h-7 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            update(item.provider, { name: e.target.value })
                          }
                          className="font-bold text-base text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#C98484] outline-none py-0.5"
                        />
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
                            isInvoice
                              ? "bg-amber-50 text-amber-800 border-amber-200/80"
                              : "bg-blue-50 text-blue-700 border-blue-200/80"
                          }`}
                        >
                          {badgeText}
                        </span>
                        {/* Validation badge */}
                        {isValidated ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 stroke-[3]" /> Doğrulandı
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> Doğrulanmadı
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span
                      className={`text-xs font-bold ${
                        item.enabled ? "text-emerald-700" : "text-slate-500"
                      }`}
                    >
                      {item.enabled ? "Aktif / Çalışıyor" : "Pasif"}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => trySetEnabled(item, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C98484]"></div>
                    </label>
                  </div>
                </div>

                {/* BIRFATURA CONNECTION GUIDE BOX */}
                {isBirFatura && (
                  <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-rose-950 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#C98484]" />
                        BirFatura Paneline Girilecek Mağaza Bilgileri
                      </h4>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                        Özel Entegrasyon Rehberi
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Store Name & Website */}
                      <div className="p-3 bg-white rounded-xl border border-rose-100 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">
                            Website Adresi (BirFatura URL):
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(originUrl, `url_${item.provider}`)
                            }
                            className="text-[10px] font-extrabold text-[#C98484] hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `url_${item.provider}` ? (
                              <><Check className="w-3 h-3 text-emerald-600" /> Kopyalandı</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Kopyala</>
                            )}
                          </button>
                        </div>
                        <div className="font-mono text-xs font-semibold text-slate-800 truncate bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          {originUrl}
                        </div>
                      </div>

                      {/* API Password / Token */}
                      <div className="p-3 bg-white rounded-xl border border-rose-100 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">
                            API Şifresi (GUID / Token):
                          </span>
                          {providerSecrets.api_key && (
                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(
                                  providerSecrets.api_key,
                                  `key_${item.provider}`
                                )
                              }
                              className="text-[10px] font-extrabold text-[#C98484] hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === `key_${item.provider}` ? (
                                <><Check className="w-3 h-3 text-emerald-600" /> Kopyalandı</>
                              ) : (
                                <><Copy className="w-3 h-3" /> Kopyala</>
                              )}
                            </button>
                          )}
                        </div>
                        <div className="font-mono text-xs font-semibold text-slate-800 truncate bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          {providerSecrets.api_key
                            ? providerSecrets.api_key
                            : item.secret_status.api_key
                            ? "•••••••••••••••••••••••• (Veritabanında Kayıtlı)"
                            : "Henüz token girilmedi"}
                        </div>
                      </div>
                    </div>

                    {/* Endpoint Reference Pill */}
                    <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 font-medium">
                      <span className="font-bold text-slate-700">Aktif Endpointler:</span>
                      <code className="bg-white/80 px-1.5 py-0.5 rounded border border-rose-200/50 text-[#C98484] font-mono text-[10px]">
                        /api/orders
                      </code>
                      <code className="bg-white/80 px-1.5 py-0.5 rounded border border-rose-200/50 text-[#C98484] font-mono text-[10px]">
                        /api/orderStatus
                      </code>
                      <code className="bg-white/80 px-1.5 py-0.5 rounded border border-rose-200/50 text-[#C98484] font-mono text-[10px]">
                        /api/paymentMethods
                      </code>
                      <code className="bg-white/80 px-1.5 py-0.5 rounded border border-rose-200/50 text-[#C98484] font-mono text-[10px]">
                        /api/orderCargoUpdate
                      </code>
                      <code className="bg-white/80 px-1.5 py-0.5 rounded border border-rose-200/50 text-[#C98484] font-mono text-[10px]">
                        /api/invoiceLinkUpdate
                      </code>
                    </div>
                  </div>
                )}

                {/* IYZICO CONNECTION GUIDE BOX */}
                {item.provider === "iyzico" && (
                  <div className="mx-6 mt-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-blue-950 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        iyzico Sanal POS Kurulum & Geri Dönüş Bilgileri
                      </h4>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                        3D Secure & Taksit Altyapısı
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Callback URL Card */}
                      <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">
                            Geri Dönüş URL (Callback URL):
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(
                                `${originUrl}/api/payments/iyzico/callback`,
                                `callback_${item.provider}`
                              )
                            }
                            className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === `callback_${item.provider}` ? (
                              <><Check className="w-3 h-3 text-emerald-600" /> Kopyalandı</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Kopyala</>
                            )}
                          </button>
                        </div>
                        <div className="font-mono text-xs font-semibold text-slate-800 truncate bg-slate-50 px-2 py-1 rounded border border-slate-100">
                          {originUrl}/api/payments/iyzico/callback
                        </div>
                      </div>

                      {/* iyzico Control Panel Link Card */}
                      <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">
                            iyzico Üye İşyeri Paneli:
                          </span>
                          <a
                            href={
                              item.environment === "production"
                                ? "https://merchant.iyzipay.com"
                                : "https://sandbox-merchant.iyzipay.com"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <span>Panele Git</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                          {item.environment === "production"
                            ? "Canlı panelinizde Ayarlar > Firma Ayarları > API Anahtarları bölümünden anahtarlarınızı alabilirsiniz."
                            : "Sandbox test panelinizde Ayarlar > Firma Ayarları > API Anahtarları bölümünden test anahtarlarınızı alabilirsiniz."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* REQUIRED FIELDS ALERT */}
                {!hasAllRequired && (
                  <div className="mx-6 mt-4 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900">
                        Zorunlu alanlar eksik
                      </p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Bu entegrasyonu aktif etmek için şu alanların doldurulması gerekir:{" "}
                        <strong>
                          {missingRequired
                            .map((f) => SECRET_LABELS[f] || f)
                            .join(", ")}
                        </strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* TEST CONNECTION RESULT */}
                {tMsg && (
                  <div
                    className={`mx-6 mt-4 px-4 py-3 rounded-2xl flex items-start gap-3 border ${
                      tStatus === "success"
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    {tStatus === "success" ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[3]" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <p
                      className={`text-xs font-bold ${
                        tStatus === "success" ? "text-emerald-800" : "text-red-800"
                      }`}
                    >
                      {tMsg}
                    </p>
                  </div>
                )}

                {/* CARD BODY */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                    {/* Section 1: Temel Bilgiler */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 border-b border-slate-100 pb-2">
                        <Info className="w-3.5 h-3.5 text-[#C98484]" />
                        <span>Temel Bilgiler</span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Tür
                        </label>
                        <select
                          value={item.integration_type}
                          onChange={(e) =>
                            update(item.provider, {
                              integration_type: e.target.value as Integration["integration_type"],
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484]"
                        >
                          <option value="invoice">Faturalama sistemi</option>
                          <option value="payment">Ödeme yöntemi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          API Adresi <span className="text-[10px] text-slate-400 font-normal">(Boş bırakılırsa otomatik atanır)</span>
                        </label>
                        <input
                          type="text"
                          value={String(item.public_config.api_url || "")}
                          onChange={(e) =>
                            updatePublic(item.provider, "api_url", e.target.value)
                          }
                          placeholder={
                            item.provider === "iyzico"
                              ? "https://api.iyzipay.com (Varsayılan)"
                              : isBirFatura
                              ? "https://uygulama.birfatura.com"
                              : "Sağlayıcının resmi API adresi"
                          }
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Yönetici Notu
                        </label>
                        <input
                          type="text"
                          value={String(item.public_config.notes || "")}
                          onChange={(e) =>
                            updatePublic(item.provider, "notes", e.target.value)
                          }
                          placeholder="Örn: Resmi fatura entegrasyonu"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484]"
                        />
                      </div>
                    </div>

                    {/* Section 2: Kimlik / API Bilgileri */}
                    <div className="space-y-3 xl:col-span-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 border-b border-slate-100 pb-2">
                        <KeyRound className="w-3.5 h-3.5 text-[#C98484]" />
                        <span>Kimlik ve API Bilgileri</span>
                      </div>

                      {/* API Key / Token (BirFatura Token) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-700">
                            {isBirFatura
                              ? "API Şifresi / Token (GUID)"
                              : "API Anahtarı"}{" "}
                            <span className="text-[#C98484]">*</span>
                          </label>
                          {isBirFatura && (
                            <button
                              type="button"
                              onClick={() => generateRandomGuid(item.provider)}
                              className="text-[10px] font-extrabold text-[#C98484] hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded-md hover:bg-rose-100 transition-all cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Rastgele Token (GUID) Üret</span>
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="password"
                            autoComplete="new-password"
                            value={providerSecrets.api_key || ""}
                            onChange={(e) =>
                              updateSecret(item.provider, "api_key", e.target.value)
                            }
                            placeholder={
                              item.secret_status.api_key
                                ? "•••••••••••••••••••••••• (Veritabanında Kayıtlı)"
                                : "API Şifresi / GUID girin"
                            }
                            className={`w-full px-3 py-2 border rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] ${
                              required.includes("api_key") &&
                              !item.secret_status.api_key &&
                              !providerSecrets.api_key
                                ? "border-amber-300 bg-amber-50/30"
                                : "border-slate-200"
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {isBirFatura
                            ? "BirFatura panelindeki 'API Şifresi' kutusuna bu token yazılacaktır."
                            : "Entegrasyon servisinin sağladığı gizli anahtar."}
                        </p>
                      </div>

                      {/* Secret Key (iyzico vb.) */}
                      {item.integration_type === "payment" && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Gizli Anahtar (Secret Key){" "}
                            <span className="text-[#C98484]">*</span>
                          </label>
                          <input
                            type="password"
                            autoComplete="new-password"
                            value={providerSecrets.secret_key || ""}
                            onChange={(e) =>
                              updateSecret(item.provider, "secret_key", e.target.value)
                            }
                            placeholder={
                              item.secret_status.secret_key
                                ? "•••••••••••••••• (Kayıtlı)"
                                : "Gizli anahtarınızı girin"
                            }
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484]"
                          />
                        </div>
                      )}

                      {/* Store code */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Mağaza Adı / Kodu
                        </label>
                        <input
                          type="text"
                          value={String(item.public_config.store_code || "")}
                          onChange={(e) =>
                            updatePublic(item.provider, "store_code", e.target.value)
                          }
                          placeholder="Örn: Mağaza Adınız veya Kodunuz"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484]"
                        />
                      </div>
                    </div>

                    {/* Section 3: Otomasyon ve Doğrulama */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 border-b border-slate-100 pb-2">
                        <Workflow className="w-3.5 h-3.5 text-[#C98484]" />
                        <span>Otomasyon & Ayarlar</span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Çalışma Ortamı
                        </label>
                        <select
                          value={item.environment}
                          onChange={(e) =>
                            update(item.provider, {
                              environment: e.target.value as Integration["environment"],
                            })
                          }
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-[#C98484] cursor-pointer"
                        >
                          <option value="production">Canlı Ortam (Production)</option>
                          <option value="test">Test Ortamı (Sandbox)</option>
                        </select>
                      </div>

                      {isInvoice ? (
                        <div className="space-y-1.5 pt-1">
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(item.public_config.auto_invoice)}
                              onChange={(e) =>
                                updatePublic(
                                  item.provider,
                                  "auto_invoice",
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4 accent-[#C98484] rounded mt-0.5 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-800 leading-snug">
                              Otomatik Fatura Bildirimi
                            </span>
                          </label>
                          <p className="text-[10px] text-slate-400 font-medium pl-6">
                            Ödeme tamamlandığında fatura hazır olarak işaretlenir.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(
                                item.public_config.auto_capture ?? true
                              )}
                              onChange={(e) =>
                                updatePublic(
                                  item.provider,
                                  "auto_capture",
                                  e.target.checked
                                )
                              }
                              className="w-4 h-4 accent-[#C98484] rounded mt-0.5 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-800 leading-snug">
                              Otomatik Ödeme Çekimi (Auto Capture)
                            </span>
                          </label>
                          <p className="text-[10px] text-slate-400 font-medium pl-6">
                            Sipariş oluşturulduğunda tutar doğrudan çekilir.
                          </p>
                        </div>
                      )}

                      {/* TEST CONNECTION CTA */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Bağlantı Doğrulama
                        </p>
                        <button
                          type="button"
                          onClick={() => testConnection(item)}
                          disabled={tStatus === "testing"}
                          className={`w-full py-2 px-3 rounded-xl border font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
                            isValidated
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                              : "bg-white border-[#C98484] text-[#C98484] hover:bg-rose-50"
                          } disabled:opacity-50 cursor-pointer`}
                        >
                          {tStatus === "testing" ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Test
                              Ediliyor...
                            </>
                          ) : isValidated ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Bağlantı
                              Doğrulandı
                            </>
                          ) : (
                            <>🔌 Bağlantıyı Test Et</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CARD FOOTER */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => remove(item.provider)}
                    disabled={busy === item.provider}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-red-300 bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Entegrasyonu Sil
                  </button>

                  <button
                    type="button"
                    onClick={() => save(item)}
                    disabled={busy === item.provider}
                    className="px-6 py-2.5 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-black text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {busy === item.provider ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 stroke-[3]" />
                    )}
                    {busy === item.provider
                      ? "Kaydediliyor..."
                      : "Değişiklikleri Kaydet"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* BOTTOM INFO */}
      <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200/80 text-slate-500 text-xs font-medium flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p>
            Gizli bilgiler (API Token ve Şifreler) AES-256 şifrelenerek veritabanında güvenle saklanır.
          </p>
          <p className="text-slate-400">
            Dilediğiniz zaman <strong>Entegrasyonu Sil</strong> butonuyla entegrasyonu tamamen silebilir, yeni BirFatura veya farklı sağlayıcı bilgileri ekleyebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  )
}
