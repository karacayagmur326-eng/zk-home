"use client"
import AdminTabs from "@components/admin/AdminTabs"
import { CONTACT_SOURCES, contactSource, type ContactSource } from "@lib/contact/sources"

import { useUrlState } from "@lib/hooks/use-url-state"

import { useAdminAutoRefresh } from "@lib/hooks/use-admin-auto-refresh"

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  MessageSquare,
  Settings,
  Mail,
  CheckCircle,
  AlertCircle,
  Search,
  Trash2,
  Eye,
  EyeOff,
  RotateCcw,
  Server,
  X,
  Archive,
  BookOpen,
  ChevronRight,
  Inbox,
  ChevronDown,
  ShieldCheck,
  Lock,
  Sliders,
  CheckCircle2,
  Phone,
  MapPin,
  Send,
  Building2,
  ExternalLink,
  Gift,
  Star,
} from "lucide-react"


interface ContactMessage {
  id: string
  product_question_id?: string
  product_review_id?: string
  source_kind?: ContactSource
  rating?: number
  review_status?: "pending" | "approved" | "rejected"
  product_title?: string
  product_handle?: string
  name: string
  email: string
  phone?: string
  subject?: string
  order_no?: string
  message: string
  status: "new" | "read" | "replied" | "archived"
  admin_reply?: string
  replied_at?: string
  created_at: string
  history?: Array<{ id: string; direction: string; sender: string; body: string; created_at: string; delivery_status: string; sent_at?: string }>
}

function Toggle({
  checked,
  onChange,
  label = "Bildirim izni",
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{ width: 44, height: 24, minHeight: 24, padding: 0, border: 0 }}
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484] focus-visible:ring-offset-2 motion-reduce:transition-none ${
        checked ? "bg-[#C98484] hover:bg-[#b87171]" : "bg-slate-300 hover:bg-slate-400"
      }`}
    >
      <span
        aria-hidden="true"
        style={{ position: "absolute", top: 3, left: 3, width: 18, height: 18, transform: checked ? "translateX(20px)" : "translateX(0)" }}
        className="pointer-events-none rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out motion-reduce:transition-none"
      />
    </button>
  )
}

export default function AdminContactPage() {
  const [activeTab, setActiveTab] = useUrlState<"messages" | ContactSource | "info_settings" | "smtp_settings">("messages", "tab", ["messages", "contact", "gifts", "questions", "reviews", "info_settings", "smtp_settings"])
  const isInboxTab = activeTab === "messages" || activeTab in CONTACT_SOURCES
  const channel = isInboxTab ? activeTab : "messages"
  const requestVersion = useRef(0)
  const [totals, setTotals] = useState({ messages: 0, contact: 0, gifts: 0, questions: 0, reviews: 0 })
  const [unread, setUnread] = useState({ messages: 0, contact: 0, gifts: 0, questions: 0, reviews: 0 })
  const [sourceFilter, setSourceFilter] = useState("")
  const [moderatingReview, setModeratingReview] = useState(false)
  const [messageCounts, setMessageCounts] = useState({total:0,new:0,replied:0,archived:0})
  const [publishAnswer, setPublishAnswer] = useState(false)
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [dateFilter, setDateFilter] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [replyText, setReplyText] = useState("")
  const [syncingInbox, setSyncingInbox] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const [testingSmtp, setTestingSmtp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [lastTestResult, setLastTestResult] = useState<{
    status: "success" | "error" | null
    time: string | null
    response: string | null
  }>({
    status: null,
    time: null,
    response: null,
  })

  const [contactInfo, setContactInfo] = useState({
    eyebrow: "7/24 DESTEK EKİBİ",
    title: "İletişim",
    description: "Ürün seçimi, sipariş ve satış sonrası destek için ekibimizle iletişime geçin.",
    phone: "",
    phone_raw: "",
    phone_hours: "Hafta içi 09:00 - 18:00",
    email: "",
    email_response_time: "Ortalama yanıt süresi: 2 saat",
    address: "",
    street_address: "",
    district: "Merkez",
    city: "İSTANBUL",
    country: "Türkiye",
    full_address: "",
    whatsapp_phone: "",
    whatsapp_text: "WhatsApp Canlı Destek Hattı",
    whatsapp_enabled: true,
    additional_notification_emails: "",
    company_name: "E-Ticaret ve Mağazacılık A.Ş.",
    brand_name: "Mağazamız",
    website: "",
    tax_office: "İstanbul V.D.",
    tax_no: "",
    mersis_no: "",
    kep_address: "",
    trade_reg_no: "",
    work_hours: "Hafta içi 09:00 - 18:00",
    form_title: "Mesaj Gönderin",
    form_description: "Formu doldurun; mesajınız destek ekibimize kaydedilsin.",
    kvkk_url: "/kvkk",
  })


  const [smtpSettings, setSmtpSettings] = useState({
    host: "smtp.gmail.com",
    port: "587",
    user: "",
    pass: "••••••••••••",
    from_email: "",
    recipient_email: "",
    enable_notifications: true,
    secure: false,
  })

  const showToast = (type: "success" | "error", msg: string) => {
    if (type === "success") {
      setSuccessMsg(msg)
      setErrorMsg("")
      setTimeout(() => setSuccessMsg(""), 3500)
    } else {
      setErrorMsg(msg)
      setSuccessMsg("")
      setTimeout(() => setErrorMsg(""), 3500)
    }
  }

  const fetchMessages = async (status = "", silent = false, signal?: AbortSignal) => {
    const version = ++requestVersion.current
    if (!silent) setLoading(true)
    try {
      const url = `/api/admin/contact-messages?kind=${channel}&status=${encodeURIComponent(status)}`
      const res = await fetch(url, { cache: "no-store", signal })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Mesajlar yüklenemedi.")
      if (version === requestVersion.current && !signal?.aborted) {
        setTotals(data.totals || { messages: 0, contact: 0, gifts: 0, questions: 0, reviews: 0 })
        setUnread(data.unread || { messages: 0, contact: 0, gifts: 0, questions: 0, reviews: 0 })
        setMessageCounts(data.counts)
        setMessages(data.messages || [])
        setSelectedMessage((current) => current ? data.messages?.find((item: ContactMessage) => String(item.id) === String(current.id)) || current : null)
      }
    } catch {
      if (version === requestVersion.current && !silent && !signal?.aborted) showToast("error", "Mesajlar yüklenirken bir hata oluştu.")
    } finally {
      if (version === requestVersion.current && !silent && !signal?.aborted) setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/contact-settings")
      const data = await res.json()
      if (res.ok) {
        if (data.contact_info) setContactInfo((current) => ({ ...current, ...data.contact_info }))
        if (data.smtp_settings) setSmtpSettings(data.smtp_settings)
      }
    } catch {}
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchMessages(statusFilter, false, controller.signal)
    return () => controller.abort()
  }, [statusFilter, channel])

  useAdminAutoRefresh((signal) => fetchMessages(statusFilter, true, signal), { refreshKey: `${channel}:${statusFilter}`, enabled: isInboxTab })

  useEffect(() => { setSelectedMessage(null); setReplyText(""); setPublishAnswer(false); setSourceFilter("") }, [channel])

  const handleReviewStatus = async (reviewStatus: "pending" | "approved" | "rejected") => {
    if (!selectedMessage?.product_review_id) return
    setModeratingReview(true)
    try {
      const response = await fetch("/api/admin/contact-messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedMessage.id, review_status: reviewStatus }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || "Yayın durumu güncellenemedi.")
      setSelectedMessage(current => current ? { ...current, review_status: reviewStatus } : null)
      showToast("success", "Yorumun yayın durumu güncellendi.")
      fetchMessages(statusFilter, true)
    } catch (error) { showToast("error", error instanceof Error ? error.message : "Yayın durumu güncellenemedi.") }
    finally { setModeratingReview(false) }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/contact-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (res.ok) {
        showToast("success", "Mesaj durumu güncellendi.")
        if (selectedMessage?.id === id) setSelectedMessage({ ...selectedMessage, status: newStatus as any })
        fetchMessages(statusFilter)
        window.dispatchEvent(new Event("admin-notifications:refresh"))
      }
    } catch {
      showToast("error", "Durum güncellenemedi.")
    }
  }

  const handleReply = async () => {
    if (!selectedMessage || replyText.trim().length < 3) {
      showToast("error", "Lütfen müşteriye gönderilecek yanıtı yazın.")
      return
    }
    setSendingReply(true)
    try {
      const res = await fetch("/api/admin/contact-messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedMessage.id, reply: replyText, publish_answer: publishAnswer }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Yanıt gönderilemedi.")
      setSelectedMessage(data.message)
      setReplyText("")
      setPublishAnswer(false)
      showToast(
        "success",
        data.notifications?.customer_sent
          ? "Yanıt müşterinin e-posta sunucusuna iletilmek üzere kabul edildi. Gelen kutusuna teslim henüz doğrulanmadı."
          : "Yanıt kaydedildi; e-postalar gönderim kuyruğuna alındı."
      )
      fetchMessages(statusFilter)
    } catch (error: any) {
      showToast("error", error?.message || "Yanıt gönderilemedi.")
    } finally {
      setSendingReply(false)
    }
  }

  const handleDeleteMessage = async (id: string) => {
    if (!confirm("Bu mesajı silmek istediğinize emin misiniz?")) return
    try {
      const res = await fetch(`/api/admin/contact-messages?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        showToast("success", "Mesaj silindi.")
        if (selectedMessage?.id === id) setSelectedMessage(null)
        fetchMessages(statusFilter)
      }
    } catch {
      showToast("error", "Mesaj silinemedi.")
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/contact-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact_info: contactInfo, smtp_settings: smtpSettings }),
      })
      if (res.ok) showToast("success", "İletişim ve SMTP ayarları başarıyla kaydedildi.")
      else showToast("error", "Ayarlar kaydedilemedi.")
    } catch {
      showToast("error", "Kaydetme sırasında bir hata oluştu.")
    } finally {
      setSaving(false)
    }
  }

  const handleTestSmtp = async () => {
    setTestingSmtp(true)
    try {
      const res = await fetch("/api/admin/contact-settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpSettings),
      })
      const data = await res.json()
      const nowStr = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) + " • " + new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      if (res.ok) {
        showToast("success", data.message || "SMTP bağlantısı başarılı!")
        setLastTestResult({
          status: "success",
          time: nowStr,
          response: "SMTP bağlantısı ve kimlik doğrulaması başarılı. Bu test e-posta göndermez.",
        })
      } else {
        showToast("error", data.error || "SMTP bağlantısı başarısız.")
        setLastTestResult({
          status: "error",
          time: nowStr,
          response: data.error || "550 Authentication failed",
        })
      }
    } catch {
      showToast("error", "Test sırasında bağlantı hatası oluştu.")
      setLastTestResult({ status: "error", time: new Date().toLocaleString("tr-TR"), response: "Test sırasında bağlantı hatası oluştu." })
    } finally {
      setTestingSmtp(false)
    }
  }

  const filterByDate = (msgs: ContactMessage[]) => {
    if (!dateFilter) return msgs
    const now = new Date()
    return msgs.filter((m) => {
      const d = new Date(m.created_at)
      if (dateFilter === "today") return d.toDateString() === now.toDateString()
      if (dateFilter === "week") return now.getTime() - d.getTime() < 7 * 86400000
      if (dateFilter === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      return true
    })
  }

  const filteredMessages = filterByDate(
    messages.filter((m) => {
      if (sourceFilter && contactSource(m) !== sourceFilter) return false
      if (!search) return true
      const s = search.toLowerCase()
      return (
        m.name?.toLowerCase().includes(s) ||
        m.email?.toLowerCase().includes(s) ||
        m.subject?.toLowerCase().includes(s) ||
        m.message?.toLowerCase().includes(s) ||
        CONTACT_SOURCES[contactSource(m)].label.toLowerCase().includes(s) ||
        m.product_title?.toLowerCase().includes(s) ||
        m.phone?.toLowerCase().includes(s)
      )
    })
  )

  const counts = { all: messageCounts.total, new: messageCounts.new, replied: messageCounts.replied, archived: messageCounts.archived }

  const statusBadge = (status: string) => {
    if (status === "new") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#B98787] text-white shadow-sm"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-white" />Yeni · Okunmadı</span>
    if (status === "read") return <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">İncelendi</span>
    if (status === "replied") return <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100">Yanıtlandı</span>
    if (status === "archived") return <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-50 text-purple-600 border border-purple-100">Arşiv</span>
    return null
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="admin-toast admin-toast--success !top-auto !bottom-6" role="status" aria-live="polite">
          <CheckCircle className="w-4 h-4" />
          <span className="font-semibold text-xs">{successMsg}</span>
          <button className="admin-icon-button !h-7 !min-h-7 !w-7 ml-auto" aria-label="Bildirimi kapat" onClick={() => setSuccessMsg("")}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {errorMsg && (
        <div className="admin-toast admin-toast--error !top-auto !bottom-6" role="alert">
          <AlertCircle className="w-4 h-4" />
          <span className="font-semibold text-xs">{errorMsg}</span>
          <button className="admin-icon-button !h-7 !min-h-7 !w-7 ml-auto" aria-label="Bildirimi kapat" onClick={() => setErrorMsg("")}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#C98484] text-white rounded-xl text-xs font-bold hover:bg-[#A95E5E] transition-all shadow-sm cursor-pointer disabled:opacity-60 shrink-0"
        >
          <Settings className="w-4 h-4" />
          {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
        </button>
        <Link
          href="/iletisim"
          target="_blank"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 shadow-sm transition hover:border-rose-200 hover:text-[#C98484]"
        >
          <ExternalLink className="h-4 w-4" /> Formu Görüntüle
        </Link>
      </div>

      {/* Tab Buttons Row */}
      <AdminTabs label="İletişim bölümleri"
        value={activeTab}
        onChange={setActiveTab}
        items={[
          { value: "messages", label: `Gelen Mesajlar${unread.messages ? ` · ${unread.messages} Yeni` : ""}`, count: totals.messages, icon: Inbox },
          { value: "contact", label: `İletişim Formu${unread.contact ? ` · ${unread.contact} Yeni` : ""}`, count: totals.contact, icon: Mail },
          { value: "gifts", label: `Hediye Talepleri${unread.gifts ? ` · ${unread.gifts} Yeni` : ""}`, count: totals.gifts, icon: Gift },
          { value: "questions", label: `Soru & Cevap${unread.questions ? ` · ${unread.questions} Yeni` : ""}`, count: totals.questions, icon: MessageSquare },
          { value: "reviews", label: `Yorumlar${unread.reviews ? ` · ${unread.reviews} Yeni` : ""}`, count: totals.reviews, icon: Star },
          { value: "info_settings", label: "İletişim & Sayfa Ayarları", icon: Settings },
          { value: "smtp_settings", label: "SMTP / E-posta Gönderme İzinleri", icon: Mail },
        ]}/>

      {/* ── TAB 1: MESSAGES ─────────────────────────────────────────── */}
      {isInboxTab && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-extrabold text-slate-900">{channel === "messages" ? "Tüm Gelen Mesajlar" : CONTACT_SOURCES[channel as ContactSource].label}</h2><p className="mt-1 text-xs text-slate-500">{channel === "messages" ? "İletişim, hediye, soru ve yorum kayıtları tek gelen kutusunda." : "Bu bölümün kayıtlarını ortak yazışma ve yanıt ekranından yönetin."}</p></div>
            {counts.new > 0 && <button type="button" onClick={() => setStatusFilter("new")} className="rounded-xl bg-[#B98787] px-4 py-2 text-xs font-bold text-white">{counts.new} Yeni · Okunmamış kaydı göster</button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#FFF8F5] border border-rose-100/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-rose-100/60 border border-rose-200/60 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-[#C98484]" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 leading-none">{counts.all}</span>
                <span className="text-[11px] font-bold text-slate-400 mt-1">{channel === "questions" ? "Toplam Soru" : "Toplam Mesaj"}</span>
              </div>
            </div>

            <div className="bg-[#F0F7FF] border border-blue-100/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100/60 border border-blue-200/60 flex items-center justify-center shrink-0">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-blue-200/70" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 leading-none">{counts.new}</span>
                <span className="text-[11px] font-bold text-slate-600 mt-1">Yeni · Okunmadı</span>
              </div>
            </div>

            <div className="bg-[#F0FDF4] border border-emerald-100/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/60 border border-emerald-200/60 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 leading-none">{counts.replied}</span>
                <span className="text-[11px] font-bold text-slate-400 mt-1">Yanıtlandı</span>
              </div>
            </div>

            <div className="bg-[#F8F5FF] border border-purple-100/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-purple-100/60 border border-purple-200/60 flex items-center justify-center shrink-0">
                <Archive className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-900 leading-none">{counts.archived}</span>
                <span className="text-[11px] font-bold text-slate-400 mt-1">Arşiv</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Müşteri, ürün, kaynak veya mesajda ara..."
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#C98484] transition"
                  />
                </div>

                {channel === "messages" && <select aria-label="Mesaj kaynağı" value={sourceFilter} onChange={event => setSourceFilter(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"><option value="">Tüm bölümler</option>{Object.entries(CONTACT_SOURCES).map(([value, source]) => <option key={value} value={value}>{source.label}</option>)}</select>}
                <div className="relative w-36">
                  <span className="absolute -top-2 left-2.5 bg-white px-1 text-[9px] font-bold text-slate-400">
                    Durum
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                    }}
                    className="w-full appearance-none border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#C98484] cursor-pointer pr-7"
                  >
                    <option value="">Tümü</option>
                    <option value="new">Yeni</option>
                    <option value="read">İncelendi</option>
                    <option value="replied">Yanıtlandı</option>
                    <option value="archived">Arşiv</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="relative w-36">
                  <span className="absolute -top-2 left-2.5 bg-white px-1 text-[9px] font-bold text-slate-400">
                    Tarih Aralığı
                  </span>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full appearance-none border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#C98484] cursor-pointer pr-7"
                  >
                    <option value="">Tümü</option>
                    <option value="today">Bugün</option>
                    <option value="week">Bu Hafta</option>
                    <option value="month">Bu Ay</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("")
                    setStatusFilter("")
                    setDateFilter("")
                    setSourceFilter("")
                    fetchMessages("")
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Sıfırla
                </button>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-700 font-extrabold">
                    <tr>
                      <th className="py-3 px-3 text-left w-8">
                        <input type="checkbox" className="accent-[#C98484] rounded" />
                      </th>
                      <th className="py-3 px-3 text-left">Gönderen</th>
                      <th className="py-3 px-3 text-left">Konu</th>
                      <th className="py-3 px-3 text-left">Kaynak / Bölüm</th>
                      <th className="py-3 px-3 text-left">Durum</th>
                      <th className="py-3 px-3 text-left">
                        <span className="flex items-center gap-1">Tarih <ChevronDown className="w-3 h-3 text-slate-400" /></span>
                      </th>
                      <th className="py-3 px-3 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <div className="w-6 h-6 border-2 border-[#C98484] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-medium">Mesajlar yükleniyor...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredMessages.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
                            <div className="w-20 h-20 rounded-full bg-[#FFF5EE] flex items-center justify-center relative">
                              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center">
                                <Inbox className="w-6 h-6 text-slate-700" />
                              </div>
                              <span className="absolute top-2 right-3 text-rose-300 text-xs">✨</span>
                              <span className="absolute bottom-2 left-3 text-rose-200 text-xs">+</span>
                            </div>

                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900">Kayıtlı mesaj bulunamadı</h3>
                              <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">
                                Henüz hiçbir mesaj alınmamış görünür.<br />Yeni mesajlar burada listelenecektir.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredMessages.map((m) => (
                        <tr
                          key={m.id}
                          className={`transition-colors group ${m.status === "new" ? "bg-rose-50/80 hover:bg-rose-100/70" : "hover:bg-slate-50/60"}`}
                        >
                          <td className="py-3 px-3">
                            <input type="checkbox" className="accent-[#C98484] rounded" />
                          </td>
                          <td className="py-3 px-3">
                            <div>
                              <p className="font-extrabold text-slate-900">{m.name}</p>
                              <p className="text-[11px] text-slate-400 font-medium">{m.email}</p>
                            </div>
                          </td>
                          <td className={`py-3 px-3 max-w-[240px] ${m.status === "new" ? "border-l-4 border-l-[#B98787]" : ""}`}>
                            <div className="mb-1 flex flex-wrap items-center gap-2"><span className={`inline-flex rounded-lg border px-2 py-1 text-[10px] font-bold ${CONTACT_SOURCES[contactSource(m)].badge}`}>{CONTACT_SOURCES[contactSource(m)].label}</span>{m.status === "new" && <span className="text-[10px] font-black text-[#9A5555]">YENİ</span>}</div>
                            <p className={`${m.status === "new" ? "font-black text-slate-950" : "font-bold text-slate-800"} truncate`}>{m.subject || "Genel İletişim"}</p>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{m.message}</p>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex whitespace-nowrap rounded-lg border px-2 py-1 text-[10px] font-bold ${CONTACT_SOURCES[contactSource(m)].badge}`}>{CONTACT_SOURCES[contactSource(m)].label}</span>
                            <div className="mt-1 text-[10px] text-slate-500">{m.product_handle ? <Link href={`/urunler/${m.product_handle}`} target="_blank" className="inline-flex items-center gap-1 hover:text-[#C98484]"><ExternalLink className="h-3 w-3" />Ürün sayfası</Link> : m.order_no ? `Sipariş #${m.order_no}` : contactSource(m) === "gifts" ? "Toptan ve kurumsal satış" : "İletişim sayfası"}</div>
                          </td>
                          <td className="py-3 px-3">{statusBadge(m.status)}</td>
                          <td className="py-3 px-3 text-slate-400 font-medium whitespace-nowrap">
                            {new Date(m.created_at).toLocaleDateString("tr-TR")}{" "}
                            <span className="text-[10px]">
                              {new Date(m.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMessage(m)
                                  setReplyText("")
                                  setPublishAnswer(Boolean(m.product_question_id && !m.admin_reply))
                                  if (m.status === "new") handleUpdateStatus(m.id, "read")
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                title="Görüntüle"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Görüntüle
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMessage(m)
                                  setReplyText("")
                                  setPublishAnswer(Boolean(m.product_question_id && !m.admin_reply))
                                  if (m.status === "new") handleUpdateStatus(m.id, "read")
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[10px] font-bold text-[#C98484] hover:bg-rose-100 cursor-pointer"
                                title="Müşteriye yanıtla"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Yanıtla
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(m.id, "archived")}
                                className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-500 cursor-pointer"
                                title="Arşivle"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(m.id)}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-2">
                <h3 className="text-xs font-black text-slate-900">Mesaj akışı hakkında</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  İletişim formları, hediye talepleri, ürün soruları ve yorumlar burada birlikte listelenir. Kaynak etiketlerinden hangi bölümden geldiğini görebilirsiniz. Üst sekmeler aynı kayıtları bölümüne göre ayırır.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                <h3 className="text-xs font-black text-slate-900">Hızlı İpuçları</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-slate-500 text-[10px]">
                      ⏱
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                      Yeni mesajlar otomatik olarak <strong className="text-slate-700">"Yeni"</strong> statüsünde gelir.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-slate-500 text-[10px]">
                      ✉
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                      Yanıtladığınız mesajlar <strong className="text-slate-700">"Yanıtlandı"</strong> olarak işaretlenir.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 text-slate-500 text-[10px]">
                      📥
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                      Önemli mesajları arşivleyerek gelen kutunuzu düzenli tutabilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-rose-200 text-xs font-extrabold text-[#C98484] hover:bg-rose-50/50 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-[#C98484]" />
                      Kullanım Kılavuzunu İncele
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#C98484]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: INFO SETTINGS (CLEAN INPUTS WITHOUT INNER ICONS) ── */}
      {activeTab === "info_settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5 items-start">
          {/* Left Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
            <div>
              <h2 className="text-base font-black text-slate-900">İletişim Sayfası İçeriği</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                İletişim sayfanızda görüntülenecek metinleri ve bilgileri düzenleyin.
              </p>
            </div>

            <div className="space-y-4 text-xs font-semibold">
              {/* Row 1 */}
              <div className="grid grid-cols-1 gap-4">

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">Ana Başlık</label>
                  <input
                    type="text"
                    value={contactInfo.title}
                    onChange={(e) => setContactInfo({ ...contactInfo, title: e.target.value })}
                    placeholder="İletişim"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                  />
                </div>
              </div>

              {/* Row 2: Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">Sayfa Alt Açıklama Metni</label>
                <textarea
                  value={contactInfo.description}
                  onChange={(e) => setContactInfo({ ...contactInfo, description: e.target.value })}
                  rows={2}
                  placeholder="Ürün seçimi, sipariş ve satış sonrası destek için ekibimizle iletişime geçin."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                />
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">Müşteri Hizmetleri Telefon Numarası</label>
                  <input
                    type="text"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    placeholder="0850 303 00 47"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">Çalışma Saatleri Bilgisi</label>
                  <input
                    type="text"
                    value={contactInfo.phone_hours}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone_hours: e.target.value })}
                    placeholder="Hafta içi 09:00 - 18:00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                  />
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">E-Posta Destek Adresi</label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    placeholder=""
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">Ortalama Yanıt Süresi Metni</label>
                  <input
                    type="text"
                    value={contactInfo.email_response_time}
                    onChange={(e) => setContactInfo({ ...contactInfo, email_response_time: e.target.value })}
                    placeholder="Ortalama yanıt süresi: 2 saat"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                  />
                </div>
              </div>

              {/* Row 5 */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
                <label className="block text-xs font-extrabold text-slate-800">Ek Admin Bildirim E-Postaları</label>
                <input
                  type="text"
                  value={contactInfo.additional_notification_emails || ""}
                  onChange={(e) => setContactInfo({ ...contactInfo, additional_notification_emails: e.target.value })}
                  placeholder="ortak@firma.com, calisan@firma.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                />
                <p className="text-[10px] leading-4 text-slate-500">Birden fazla adresi virgülle ayırın. Form, sipariş, kargo, teslimat ve fatura bildirimlerinin admin kopyaları bu adreslere de gider.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">Genel Merkez & Mağaza Adresi</label>
                  <input
                    type="text"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value, full_address: e.target.value })}
                    placeholder="[Şirket adresi yönetim panelinden eklenecektir]"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-xs font-extrabold text-slate-700">WhatsApp Telefon Numarası (Ülke koduyla)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500">{contactInfo.whatsapp_enabled ? "Aktif" : "Pasif"}</span>
                      <Toggle
                        label="WhatsApp iletişimi"
                        checked={Boolean(contactInfo.whatsapp_enabled)}
                        onChange={(value) => setContactInfo({ ...contactInfo, whatsapp_enabled: value })}
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={contactInfo.whatsapp_phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, whatsapp_phone: e.target.value })}
                    placeholder="9"
                    disabled={!contactInfo.whatsapp_enabled}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                  />
                  <p className="text-[10px] font-medium text-slate-500">Örnek: 9. Başında 0 ile yazarsanız sistem otomatik olarak Türkiye ülke koduna çevirir.</p>
                </div>
              </div>

              {/* Row 6 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">Form Kartı Başlığı</label>
                  <input
                    type="text"
                    value={contactInfo.form_title}
                    onChange={(e) => setContactInfo({ ...contactInfo, form_title: e.target.value })}
                    placeholder="Mesaj Gönderin"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700">Form Kartı Açıklaması</label>
                  <input
                    type="text"
                    value={contactInfo.form_description}
                    onChange={(e) => setContactInfo({ ...contactInfo, form_description: e.target.value })}
                    placeholder="Formu doldurun; mesajınız destek ekibimize kaydedilsin."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                  />
                </div>
              </div>

              {/* Firma Bilgileri (Yasal / SEO) */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-[#C98484]" />
                  Firma Yasal Bilgileri (SEO & Sözleşmeler)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">Şirket Tam Unvanı</label>
                    <input
                      type="text"
                      value={contactInfo.company_name || ""}
                      onChange={(e) => setContactInfo({ ...contactInfo, company_name: e.target.value })}
                      placeholder="Örn: Şirket Ünvanı San. Tic. Ltd. Şti."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">Marka Adı (Kısa)</label>
                    <input
                      type="text"
                      value={contactInfo.brand_name || ""}
                      onChange={(e) => setContactInfo({ ...contactInfo, brand_name: e.target.value })}
                      placeholder="Örn: Mağaza Adınız"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">Vergi Dairesi</label>
                    <input
                      type="text"
                      value={contactInfo.tax_office || ""}
                      onChange={(e) => setContactInfo({ ...contactInfo, tax_office: e.target.value })}
                      placeholder="Esenler V.D."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">Vergi Numarası</label>
                    <input
                      type="text"
                      value={contactInfo.tax_no || ""}
                      onChange={(e) => setContactInfo({ ...contactInfo, tax_no: e.target.value })}
                      placeholder="7570982314"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">MERSİS Numarası</label>
                    <input
                      type="text"
                      value={contactInfo.mersis_no || ""}
                      onChange={(e) => setContactInfo({ ...contactInfo, mersis_no: e.target.value })}
                      placeholder="0757098231400001"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-700">KEP Adresi</label>
                    <input
                      type="text"
                      value={contactInfo.kep_address || ""}
                      onChange={(e) => setContactInfo({ ...contactInfo, kep_address: e.target.value })}
                      placeholder=""
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                    />
                  </div>
                </div>
              </div>

              {/* Row 7 */}
              <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
                <div className="flex-1 space-y-1.5 w-full">
                  <label className="block text-xs font-extrabold text-slate-700">KVKK Aydınlatma Metni Bağlantısı (URL)</label>
                  <input
                    type="text"
                    value={contactInfo.kvkk_url}
                    onChange={(e) => setContactInfo({ ...contactInfo, kvkk_url: e.target.value })}
                    placeholder="/kvkk"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#C98484] text-white rounded-xl text-xs font-extrabold hover:bg-[#A95E5E] transition shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-60 shrink-0"
                >
                  {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Preview Card */}
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Canlı Önizleme</h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  İletişim sayfanızın ziyaretçilere nasıl görüneceğini buradan inceleyebilirsiniz.
                </p>
              </div>

              {/* Storefront Contact Page Live Preview Canvas */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-5 relative overflow-hidden">
                {/* Decorative background vectors */}
                <div className="absolute top-4 right-4 w-28 h-28 bg-[#FFF5EE] rounded-full flex items-center justify-center opacity-70 pointer-events-none">
                  <div className="w-16 h-12 rounded-xl bg-white border border-slate-200/60 shadow-2xs flex items-center justify-center">
                    <span className="text-xs text-rose-400 font-extrabold">•••</span>
                  </div>
                </div>

                {/* Badge */}
                <span className="inline-block px-3 py-1 bg-rose-50 text-[#C98484] text-[10px] font-black rounded-full border border-rose-100">
                  {contactInfo.eyebrow || "7/24 DESTEK EKİBİ"}
                </span>

                {/* Title & Desc */}
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">
                    {contactInfo.title || "İletişim"}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1 max-w-[240px]">
                    {contactInfo.description}
                  </p>
                </div>

                {/* Contact Items */}
                <div className="space-y-3 pt-1 text-xs">
                  {/* Phone */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5 text-[#C98484]" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs">{contactInfo.phone}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{contactInfo.phone_hours}</p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5 text-[#C98484]" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs">{contactInfo.email}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{contactInfo.email_response_time}</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-[#C98484]" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs">{contactInfo.address}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Genel Merkez & Mağaza Adresi</p>
                    </div>
                  </div>

                  {/* WhatsApp */}
                  {contactInfo.whatsapp_enabled && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-[11px]">+{contactInfo.whatsapp_phone}</p>
                        <p className="text-[9px] text-slate-400 font-medium">WhatsApp ile hızlı destek alın</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 bg-[#25D366] text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 shrink-0"
                    >
                      <span>💬</span> WhatsApp ile İletişime Geç
                    </button>
                  </div>
                  )}
                </div>

                {/* Form Card Live Preview */}
                <div className="bg-[#FFF9F6] border border-rose-100/80 rounded-xl p-3.5 space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                      <Send className="w-3 h-3 text-[#C98484]" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-xs">{contactInfo.form_title}</p>
                      <p className="text-[9px] text-slate-400 font-medium">{contactInfo.form_description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-white border border-slate-200/80 rounded-lg p-2 text-[9px] text-slate-400">
                      Adınız Soyadınız
                    </div>
                    <div className="bg-white border border-slate-200/80 rounded-lg p-2 text-[9px] text-slate-400">
                      E-posta Adresiniz
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SMTP (CLEAN INPUTS WITHOUT INNER ICONS) ─────── */}
      {activeTab === "smtp_settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-5 items-start">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5 text-[#C98484]" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">SMTP Sunucu ve E-Posta Bildirim İzinleri</h2>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Üyelik doğrulaması, şifre sıfırlama, sipariş ve iletişim e-postaları için gönderim hesabını yapılandırın.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto bg-slate-50/50 px-3 py-1.5 rounded-xl border border-slate-100">
                <Toggle
                  label="E-posta bildirimleri"
                  checked={smtpSettings.enable_notifications}
                  onChange={(v) => setSmtpSettings({ ...smtpSettings, enable_notifications: v })}
                />
                <span className="text-xs font-extrabold text-slate-800">E-Posta Bildirimleri {smtpSettings.enable_notifications ? "Aktif" : "Kapalı"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">SMTP Sunucu Adresi (Host)</label>
                <input
                  type="text"
                  value={smtpSettings.host}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                  placeholder="smtp.gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">Port Numarası</label>
                <input
                  type="text"
                  value={smtpSettings.port}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, port: e.target.value })}
                  placeholder="587"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">SMTP Kullanıcı Adı (Email)</label>
                <input
                  type="text"
                  value={smtpSettings.user}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, user: e.target.value })}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">SMTP Şifresi</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={smtpSettings.pass}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, pass: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">Gönderen E-Posta Adresi (From)</label>
                <input
                  type="email"
                  value={smtpSettings.from_email}
                  onChange={(e) => setSmtpSettings({ ...smtpSettings, from_email: e.target.value })}
                  placeholder=""
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#C98484] transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">Admin Bildirim E-Postası</label>
                <input
                  type="email"
                  value={contactInfo.email}
                  readOnly
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                />
                <p className="text-[10px] leading-4 text-slate-400">
                  Bu adres İletişim &amp; Sayfa Ayarları bölümündeki ana e-posta alanından yönetilir ve tüm siteye uygulanır.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleTestSmtp}
                disabled={testingSmtp || !smtpSettings.host}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-extrabold transition cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${testingSmtp ? "animate-spin" : ""}`} />
                {testingSmtp ? "Test Ediliyor..." : "SMTP Bağlantısını Test Et"}
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#C98484] text-white rounded-xl text-xs font-extrabold hover:bg-[#A95E5E] transition shadow-md shadow-rose-500/20 cursor-pointer disabled:opacity-60"
              >
                <Settings className="w-4 h-4" />
                {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">Güvenlik Notu</h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                  SMTP şifrenizi düzenli olarak güncellemeniz hesabınızın güvenliği için önemlidir.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900">Şifreleme</h3>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-1">
                  Güvenli bağlantı için STARTTLS önerilir. SSL bağlantılar için 465 portu kullanılabilir.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                  <Sliders className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-xs font-black text-slate-900">Önerilen Portlar</h3>
              </div>

              <div className="space-y-2 text-xs font-medium pl-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-black text-[11px]">587</span>
                  <span className="text-slate-500 font-semibold">• STARTTLS (Önerilen)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-black text-[11px]">465</span>
                  <span className="text-slate-500 font-semibold">• SSL/TLS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-black text-[11px]">25</span>
                  <span className="text-slate-400">• Eski sistemler için</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full ${lastTestResult.status === null ? "bg-slate-50 border border-slate-100" : lastTestResult.status === "success" ? "bg-emerald-50 border border-emerald-100" : "bg-rose-50 border border-rose-100"} flex items-center justify-center shrink-0`}>
                    <CheckCircle2 className={`w-4 h-4 ${lastTestResult.status === null ? "text-slate-400" : lastTestResult.status === "success" ? "text-emerald-600" : "text-rose-600"}`} />
                  </div>
                  <h3 className="text-xs font-black text-slate-900">Son Test Durumu</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${lastTestResult.status === null ? "bg-slate-100 text-slate-600" : lastTestResult.status === "success" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {lastTestResult.status === null ? "Test yapılmadı" : lastTestResult.status === "success" ? "Başarılı" : "Başarısız"}
                </span>
              </div>

              <div className="space-y-1.5 text-xs pt-1 border-t border-slate-100/80">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-semibold">Test zamanı</span>
                  <span className="text-slate-700 font-bold">{lastTestResult.time || "—"}</span>
                </div>
                <div className="space-y-0.5 text-[11px]">
                  <span className="text-slate-400 font-semibold block">Yanıt</span>
                  <p className="text-slate-600 font-mono text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100 break-all">
                    {lastTestResult.response || "Bağlantıyı kontrol etmek için SMTP testini çalıştırın."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div role="dialog" aria-label={`${CONTACT_SOURCES[contactSource(selectedMessage)].label} Detayı`} className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">{CONTACT_SOURCES[contactSource(selectedMessage)].label} Detayı</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {new Date(selectedMessage.created_at).toLocaleString("tr-TR")}
                </p>
              </div>

              <button
                type="button"
                aria-label="Mesaj detayını kapat"
                onClick={() => setSelectedMessage(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <span className={`inline-flex rounded-lg border px-3 py-1.5 font-bold ${CONTACT_SOURCES[contactSource(selectedMessage)].badge}`}>{CONTACT_SOURCES[contactSource(selectedMessage)].label}</span>
              {selectedMessage.product_review_id && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-3"><span className="font-bold text-slate-700">{selectedMessage.rating}/5 yıldız · {selectedMessage.review_status === "approved" ? "Yayında" : selectedMessage.review_status === "rejected" ? "Yayınlanmıyor" : "Onay bekliyor"}</span><select aria-label="Yorum yayın durumu" disabled={moderatingReview} value={selectedMessage.review_status || "pending"} onChange={event => handleReviewStatus(event.target.value as "pending" | "approved" | "rejected")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><option value="pending">Onay bekliyor</option><option value="approved">Yayınla</option><option value="rejected">Yayından kaldır</option></select></div>}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {[
                  { label: "Ad Soyad", value: selectedMessage.name },
                  { label: "E-Posta", value: selectedMessage.email, isEmail: true },
                  { label: "Telefon", value: selectedMessage.phone || "—" },
                  { label: "Sipariş No", value: selectedMessage.order_no ? `#${selectedMessage.order_no}` : "—", isOrder: !!selectedMessage.order_no },
                ].map((f) => (
                  <div key={f.label}>
                    <span className="text-slate-400 font-bold block mb-0.5 uppercase tracking-wide text-[10px]">{f.label}</span>
                    {f.isEmail ? (
                      <a href={`mailto:${f.value}`} className="text-blue-600 font-bold hover:underline">{f.value}</a>
                    ) : (
                      <span className={`font-black ${f.isOrder ? "text-[#C98484]" : "text-slate-800"}`}>{f.value}</span>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <span className="text-slate-400 font-bold block mb-1.5 uppercase tracking-wide text-[10px]">İletişim Konusu</span>
                <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 font-extrabold rounded-lg">
                  {selectedMessage.subject || "Genel İletişim"}
                </span>
                {selectedMessage.product_handle && <Link href={`/urunler/${selectedMessage.product_handle}`} target="_blank" className="ml-3 inline-flex items-center gap-1 font-bold text-[#C98484]"><ExternalLink className="h-3.5 w-3.5" />Ürünü Gör</Link>}
              </div>

              <section aria-label="Yazışma geçmişi" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-800">Yazışma Geçmişi</h4>
                  <button type="button" disabled={syncingInbox} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold hover:bg-slate-50 disabled:opacity-50"
                    onClick={async () => {
                      setSyncingInbox(true)
                      try {
                        const response = await fetch("/api/admin/contact-messages", { method: "POST" })
                        const result = await response.json()
                        if (!response.ok) throw new Error(result.error)
                        const refreshed = await fetch(`/api/admin/contact-messages?kind=${channel}`).then(r=>r.json())
                        const current = refreshed.messages?.find((m: ContactMessage)=>String(m.id)===String(selectedMessage.id))
                        if (current) setSelectedMessage(current)
                        fetchMessages(statusFilter)
                        showToast("success", `${result.imported} yeni müşteri yanıtı eklendi.`)
                      } catch (error: any) { showToast("error",error.message || "Posta kutusu okunamadı.") }
                      finally { setSyncingInbox(false) }
                    }}>
                    {syncingInbox ? "Posta kutusu okunuyor…" : "E-posta Yanıtlarını Al"}
                  </button>
                </div>
                <ol className="space-y-3">
                  {(selectedMessage.history || [{ id: `original_${selectedMessage.id}`, direction: "incoming", sender: selectedMessage.email, body: selectedMessage.message, created_at: selectedMessage.created_at, delivery_status: "received", sent_at: undefined }]).map(entry => (
                    <li key={entry.id} className={`rounded-2xl border p-4 ${entry.direction === "incoming" ? "mr-6 border-slate-200 bg-slate-50" : "ml-6 border-rose-100 bg-rose-50/60"}`}>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <strong>{entry.direction === "incoming" ? "Müşteriden gelen" : "Müşteriye yanıt"}</strong>
                        {entry.direction === "outgoing" && (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${entry.delivery_status === "delivered" ? "text-emerald-600" : entry.delivery_status === "failed" ? "text-red-600" : "text-slate-500"}`}
                            title={entry.delivery_status === "delivered" ? "Müşteri bu e-postaya yanıt verdi; ulaştığı doğrulandı." : entry.delivery_status === "sent" ? "E-posta sunucusu gönderimi kabul etti; teslimat henüz doğrulanmadı." : undefined}>
                            {entry.delivery_status === "delivered" ? <CheckCircle2 size={16} /> : entry.delivery_status === "failed" ? <AlertCircle size={16} /> : <Send size={14} />}
                            {entry.delivery_status === "delivered" ? "Ulaştı" : entry.delivery_status === "sent" ? "Gönderildi" : entry.delivery_status === "failed" ? "Gönderilemedi" : entry.delivery_status === "unknown" ? "Eski kayıt" : "Kuyrukta"}
                          </span>
                        )}
                        <time dateTime={entry.created_at} className="text-[11px] text-slate-500">{new Date(entry.created_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}</time>
                      </div>
                      <p className="mb-2 break-all text-[11px] text-slate-500">{entry.direction === "incoming" ? entry.sender : selectedMessage.email}</p>
                      <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-800">{entry.body}</p>
                    </li>
                  ))}
                </ol>
              </section>

              <div>
                <span className="text-slate-400 font-bold block mb-1.5 uppercase tracking-wide text-[10px]">Müşteriye Yanıt</span>
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  rows={5}
                  maxLength={10000}
                  placeholder="Kurumsal ve açıklayıcı yanıtınızı yazın…"
                  className="w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-xs font-medium leading-relaxed text-slate-800 outline-none transition focus:border-[#C98484] focus:ring-2 focus:ring-rose-100"
                />
                {selectedMessage.product_question_id && <label className="mt-3 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50/40 p-3 text-xs text-slate-600"><input type="checkbox" checked={publishAnswer} onChange={event => setPublishAnswer(event.target.checked)} className="mt-0.5 accent-[#C98484]" /><span>Bu yanıtı ürünün Soru & Cevap bölümünde yayınla.<small className="mt-1 block text-slate-400">Yazışmanın devamı müşteriye özeldir. İşaretlerseniz ürünün yayınlanan yanıtı güncellenir.</small></span></label>}
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[10px] leading-4 text-slate-400">
                    Gönderildiğinde müşteriye yanıt, merkezi admin adresine de bilgi kopyası gider.
                  </p>
                  <button
                    type="button"
                    onClick={handleReply}
                    disabled={sendingReply || replyText.trim().length < 3}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#C98484] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#A95E5E] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {sendingReply ? "Gönderiliyor…" : "Yanıtı Gönder"}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Durum:</span>
                <select
                  value={selectedMessage.status}
                  onChange={(e) => handleUpdateStatus(selectedMessage.id, e.target.value)}
                  className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-[#C98484] cursor-pointer"
                >
                  <option value="new">Yeni</option>
                  <option value="read">İncelendi</option>
                  <option value="replied">Yanıtlandı</option>
                  <option value="archived">Arşivlendi</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-extrabold transition cursor-pointer"
                >
                  Sil
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-extrabold transition cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
