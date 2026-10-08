"use client"

import LocalDeliveryFields from "../../components/LocalDeliveryFields"
import CustomerMessageButton from "../../components/CustomerMessageButton"
import { DeliveryPlan, validateDeliveryPlan, ZK_HOME_DELIVERY } from "@lib/util/local-delivery"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { convertToLocale } from "@lib/util/money"
import {
  ArrowLeft,
  Printer,
  FileText,
  Pencil,
  Trash2,
  Truck,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle,
  X,
  ChevronRight,
  Package,
  ShieldCheck,
  DollarSign,
  AlertCircle,
  Laptop,
  Smartphone,
  Globe,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Save,
  Lock,
  RefreshCw,
} from "lucide-react"

interface OrderItem {
  id: string
  title: string
  thumbnail?: string
  sku?: string
  quantity: number
  unit_price: number
  total: number
}

interface Address {
  first_name?: string
  last_name?: string
  company?: string
  address_1?: string
  address_2?: string
  city?: string
  postal_code?: string
  country_code?: string
  phone?: string
}

interface Payment {
  id: string
  provider_id: string
  status: string
  amount: number
  currency_code: string
  created_at: string
}

interface InvoiceInfo {
  id?: string
  invoice_number?: string
  pdf_url?: string
  status?: string
  created_at?: string
}

interface OrderDetail {
  order: {
    id: string
    display_id: number
    customer_id?: string | null
    email: string
    status: string
    payment_status: string
    fulfillment_status: string
    currency_code: string
    subtotal: number
    shipping_total: number
    total: number
    shipping_address?: Address | null
    billing_address?: Address | null
    shipping_carrier?: string | null
    tracking_number?: string | null
    tracking_url?: string | null
    metadata?: {
      delivery_plan?: DeliveryPlan
      ip?: string
      device?: string
      payment_method?: string
      source?: string
      views?: number
    } | null
    created_at: string
    updated_at: string
  }
  items: OrderItem[]
  payments: Payment[]
  refunds?: Array<{ id: string; amount: number; reason?: string; status: string; provider_reference?: string; created_at: string }>
  history: Array<{ id: string; status: string; note: string; created_at: string }>
  customer_stats?: {
    total_orders: number
    total_spent: number
    avg_order_value: number
  }
  invoice?: InvoiceInfo | null
}

function money(amount: number, currency: string = "try") {
  return convertToLocale({ amount: amount || 0, currency_code: currency })
}

function formatDateTR(dateString: string) {
  if (!dateString) return "—"
  const d = new Date(dateString)
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return "—"
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatTimeTR(dateString: string) {
  if (!dateString) return "00:00"
  const d = new Date(dateString)
  if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return "00:00"
  return d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const orderId = resolvedParams.id
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Form states for Order
  const [orderDate, setOrderDate] = useState("")
  const [orderHour, setOrderHour] = useState("12")
  const [orderMinute, setOrderMinute] = useState("00")
  const [orderStatus, setOrderStatus] = useState("completed")
  const [fulfillmentStatus, setFulfillmentStatus] = useState("not_fulfilled")
  const [shippingCarrier, setShippingCarrier] = useState("Yurtiçi Kargo")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [deliveryStart, setDeliveryStart] = useState("10:00")
  const [deliveryEnd, setDeliveryEnd] = useState("18:00")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [trackingUrl, setTrackingUrl] = useState("")
  const [customerType, setCustomerType] = useState<"member" | "guest">("guest")

  // Modals for editing addresses and refund
  const [editingAddressType, setEditingAddressType] = useState<"shipping" | "billing" | null>(null)
  const [addressForm, setAddressForm] = useState<Address>({})
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [refundAmount, setRefundAmount] = useState("")
  const [refundReason, setRefundReason] = useState("")

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  async function fetchOrder() {
    setLoading(true)
    setErrorMsg("")
    try {
      const res = await fetch(`/api/admin/orders?id=${encodeURIComponent(orderId)}`)
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || "Sipariş bulunamadı.")
        setLoading(false)
        return
      }
      setDetail(data)

      // Initialize form values from DB record
      if (data.order) {
        const dt = new Date(data.order.created_at || Date.now())
        const validDate = isNaN(dt.getTime()) ? new Date() : dt
        setOrderDate(validDate.toISOString().split("T")[0])
        setOrderHour(String(validDate.getHours()).padStart(2, "0"))
        setOrderMinute(String(validDate.getMinutes()).padStart(2, "0"))
        setOrderStatus(data.order.status || "processing")
        setFulfillmentStatus(data.order.fulfillment_status || "not_fulfilled")
        setShippingCarrier(data.order.shipping_carrier || "Yurtiçi Kargo")
        setDeliveryDate(data.order.metadata?.delivery_plan?.date || "")
        setDeliveryStart(data.order.metadata?.delivery_plan?.start || "10:00")
        setDeliveryEnd(data.order.metadata?.delivery_plan?.end || "18:00")
        setTrackingNumber(data.order.tracking_number || "")
        setTrackingUrl(data.order.tracking_url || "")
        setCustomerType(data.order.customer_id ? "member" : "guest")
      }
    } catch {
      setErrorMsg("Sipariş yüklenirken bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveChanges() {
    if (!detail) return
    if (shippingCarrier === ZK_HOME_DELIVERY && ["shipped", "delivery_scheduled"].includes(fulfillmentStatus)) {
      try { validateDeliveryPlan({ date: deliveryDate, start: deliveryStart, end: deliveryEnd }) }
      catch (error) { setErrorMsg(error instanceof Error ? error.message : "Teslimat planını kontrol edin."); document.getElementById("local-delivery-date")?.focus(); return }
    }
    setSaving(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      // Construct created_at ISO string from date inputs
      const combinedDateTime = new Date(`${orderDate}T${orderHour}:${orderMinute}:00`)
      const payload: Record<string, unknown> = {
        id: detail.order.id,
        status: orderStatus,
        fulfillment_status: fulfillmentStatus,
        shipping_carrier: shippingCarrier,
        delivery_plan: shippingCarrier === ZK_HOME_DELIVERY ? { date: deliveryDate, start: deliveryStart, end: deliveryEnd } : null,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        created_at: combinedDateTime.toISOString(),
        customer_id: customerType === "member" ? (detail.order.customer_id || "cust_member") : null,
      }

      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const resData = await res.json()

      if (!res.ok) {
        setErrorMsg(resData.error || "Sipariş güncellenemedi.")
      } else {
        const emailNote = resData.email_delivery
          ? resData.email_delivery.sent > 0
            ? " Müşteri e-postası gönderildi."
            : " Müşteri e-postası gönderilemedi; yeniden denenmek üzere kuyrukta."
          : ""
        if (resData.birfatura_sync_queued) {
          setSuccessMsg(`Sipariş kargoya verildi ve BirFatura için hazırlandı.${emailNote}`)
        } else {
          setSuccessMsg(`Sipariş değişiklikleri başarıyla kaydedildi.${emailNote}`)
        }
        await fetchOrder()
      }
    } catch {
      setErrorMsg("Güncelleme sırasında bir sunucu hatası oluştu.")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAddress() {
    if (!detail || !editingAddressType) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        id: detail.order.id,
        [editingAddressType === "shipping" ? "shipping_address" : "billing_address"]: addressForm,
      }
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSuccessMsg(`${editingAddressType === "shipping" ? "Gönderim" : "Fatura"} adresi güncellendi.`)
        setEditingAddressType(null)
        fetchOrder()
      } else {
        const d = await res.json()
        setErrorMsg(d.error || "Adres güncellenemedi.")
      }
    } catch {
      setErrorMsg("Adres kaydedilirken hata oluştu.")
    } finally {
      setSaving(false)
    }
  }

  async function handleSyncInvoice() {
    if (!detail?.order?.id) return
    setSaving(true)
    setErrorMsg("")
    setSuccessMsg("")
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync_invoice",
          order_id: detail.order.id,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMsg(data.message || "Sipariş BirFatura'nın çekmesi için hazırlandı.")
        fetchOrder()
      } else {
        setErrorMsg(data.error || "Fatura senkronizasyonu gerçekleştirilemedi.")
      }
    } catch {
      setErrorMsg("Fatura senkronizasyonu sırasında sunucu hatası oluştu.")
    } finally {
      setSaving(false)
    }
  }

  async function handleCancelOrder() {
    if (!detail) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: detail.order.id,
          status: "cancelled",
          confirm_cancel: true,
        }),
      })
      if (res.ok) {
        setSuccessMsg("Sipariş iptal edildi.")
        setShowCancelConfirm(false)
        await fetchOrder()
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error || "İşlem gerçekleştirilemedi.")
      }
    } catch {
      setErrorMsg("İşlem gerçekleştirilemedi.")
    } finally {
      setSaving(false)
    }
  }

  async function handleProcessRefund() {
    if (!detail) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: detail.order.id,
          amount: Math.round(Number(refundAmount) * 100),
          reason: refundReason || "Müşteri talebi iadesi",
        }),
      })
      if (res.ok) {
        setSuccessMsg("Para iadesi başarıyla işlendi.")
        setShowRefundModal(false)
        fetchOrder()
      } else {
        const d = await res.json()
        setErrorMsg(d.error || "Para iadesi başarısız oldu.")
      }
    } catch {
      setErrorMsg("İade işlemi sırasında hata oluştu.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-24 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-slate-200 rounded"></div>
          <div className="h-48 bg-slate-200 rounded"></div>
          <div className="h-48 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (errorMsg && !detail) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4">
        <Link href="/admin/siparisler" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Siparişlere Dön
        </Link>
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-medium">
          {errorMsg}
        </div>
      </div>
    )
  }

  if (!detail) return null

  const order = detail.order
  const displayCode = String(order.display_id || 0).padStart(4, "0")
  const rawShipping = order.shipping_address || {}
  const rawBilling = order.billing_address || {}
  
  const shippingAddr = {
    first_name: rawShipping.first_name || rawBilling.first_name || "",
    last_name: rawShipping.last_name || rawBilling.last_name || "",
    company: rawShipping.company || rawBilling.company || "",
    address_1: rawShipping.address_1 || rawBilling.address_1 || "",
    address_2: rawShipping.address_2 || rawBilling.address_2 || "",
    city: rawShipping.city || rawBilling.city || "",
    postal_code: rawShipping.postal_code || rawBilling.postal_code || "",
    phone: rawShipping.phone || rawBilling.phone || "",
  }
  const billingAddr = {
    first_name: rawBilling.first_name || rawShipping.first_name || "",
    last_name: rawBilling.last_name || rawShipping.last_name || "",
    company: rawBilling.company || rawShipping.company || "",
    address_1: rawBilling.address_1 || rawShipping.address_1 || "",
    address_2: rawBilling.address_2 || rawShipping.address_2 || "",
    city: rawBilling.city || rawShipping.city || "",
    postal_code: rawBilling.postal_code || rawShipping.postal_code || "",
    phone: rawBilling.phone || rawShipping.phone || "",
  }
  const metadata = order.metadata || {}
  const isRefunded =
    order.payment_status === "refunded" ||
    fulfillmentStatus === "returned" ||
    Boolean(detail.refunds && detail.refunds.some((r: any) => r.status === "completed" || r.status === "succeeded"))
  const isCancelled = orderStatus === "cancelled" || fulfillmentStatus === "cancelled"
  const paymentMethodLabel = metadata.payment_method || "Banka/Kredi Kartı ile Öde"
  const customerIp = metadata.ip || "176.233.28.185"
  const customerStats = detail.customer_stats || {
    total_orders: 1,
    total_spent: order.total || 0,
    avg_order_value: order.total || 0,
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-800">
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-white" />
          <span className="font-semibold text-sm">{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg("")} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-white" />
          <span className="font-semibold text-sm">{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg("")} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── PRINT AREA WRAPPER ─── */}
      <div id="print-area">
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
              <Link href="/admin/siparisler" className="hover:text-slate-700">Siparişler</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-600">Sipariş #{displayCode}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Sipariş #{displayCode}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                order.payment_status === "refunded"
                  ? "bg-rose-100 text-rose-800 border-rose-200"
                  : order.payment_status === "partially_refunded"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-emerald-100 text-emerald-800 border-emerald-200"
              }`}>
                {order.payment_status === "refunded" ? "İade Edildi" : order.payment_status === "partially_refunded" ? "Kısmi İade" : "Ödeme Alındı"}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                fulfillmentStatus === "cancelled"
                  ? "bg-rose-100 text-rose-800 border-rose-200"
                  : fulfillmentStatus === "delivered"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : "bg-rose-100 text-[#C98484] border-rose-200"
              }`}>
                {fulfillmentStatus === "delivered"
                  ? "Teslim Edildi"
                  : fulfillmentStatus === "delivery_scheduled" ? "ZK Home Teslimat Planlandı"
                  : fulfillmentStatus === "shipped"
                  ? "Kargolandı"
                  : fulfillmentStatus === "cancelled"
                  ? "İptal Edildi"
                  : fulfillmentStatus === "returned"
                  ? "İade Edildi"
                  : "Hazırlanıyor"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 mt-1.5">
              <span>{paymentMethodLabel}</span>
              <span>•</span>
              <span>{formatDateTR(order.created_at)}, {formatTimeTR(order.created_at)}</span>
              <span>•</span>
              <span>Müşteri IP: {customerIp}</span>
            </div>
          </div>

          {/* Top Right Action Buttons */}
          <div id="print-header-buttons" className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const style = document.createElement("style")
                style.id = "__print_style__"
                style.innerHTML = `
                  @media print {
                    @page { size: A4 portrait; margin: 10mm 10mm 10mm 10mm; }
                    body * { visibility: hidden !important; }
                    #print-area, #print-area * { visibility: visible !important; }
                    #print-area {
                      position: absolute;
                      top: 0; left: 0;
                      width: 190mm;
                      padding: 0;
                      margin: 0;
                      background: white;
                      font-size: 9px;
                    }
                    #print-header-buttons { display: none !important; visibility: hidden !important; }
                    #print-no-print { display: none !important; visibility: hidden !important; }
                    button { display: none !important; }
                    input, select { border: none !important; background: transparent !important; padding: 0 !important; font-weight: bold; }
                  }
                `
                document.head.appendChild(style)
                window.print()
                setTimeout(() => { const s = document.getElementById("__print_style__"); if (s) s.remove() }, 2000)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Yazdır
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={saving || isRefunded}
              className="flex items-center gap-2 px-5 py-2 bg-[#C98484] hover:bg-[#A95E5E] text-white rounded-xl text-xs font-extrabold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? "Kaydediliyor..." : "Siparişi Kaydet"}
            </button>
          </div>
        </div>

        {/* ─── 3-COLUMN UNIFIED MAIN GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── LEFT 2 COLUMNS (Main Details, Products, Shipping) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Top 3 Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: Genel Bilgiler */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C98484]" />
                  Genel Bilgiler
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Oluşturulma Tarihi</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-[#C98484]"
                      />
                      <input
                        type="text"
                        value={orderHour}
                        onChange={(e) => setOrderHour(e.target.value)}
                        maxLength={2}
                        className="w-10 bg-slate-50 border border-slate-200 rounded-xl p-2 text-center font-bold text-slate-800 focus:outline-none focus:border-[#C98484]"
                      />
                      <span>:</span>
                      <input
                        type="text"
                        value={orderMinute}
                        onChange={(e) => setOrderMinute(e.target.value)}
                        maxLength={2}
                        className="w-10 bg-slate-50 border border-slate-200 rounded-xl p-2 text-center font-bold text-slate-800 focus:outline-none focus:border-[#C98484]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Sipariş & Kargo Süreci</label>
                    {isRefunded ? (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-rose-700 font-extrabold text-xs">
                          <Lock className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          <span>Sipariş İade Edildi (Kilitli)</span>
                        </div>
                        <p className="text-[11px] text-rose-600 font-medium">
                          Para iadesi İyzico üzerinden tamamlandığı için kargo ve hazırlık süreci kapatılmıştır.
                        </p>
                      </div>
                    ) : isCancelled ? (
                      <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-700 font-extrabold text-xs">
                          <Lock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                          <span>Sipariş İptal Edildi</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Sipariş iptal edildiği için kargo ve hazırlık işlemleri sonlandırılmıştır.
                        </p>
                      </div>
                    ) : (
                      <select
                        value={
                          fulfillmentStatus === "delivered" || orderStatus === "completed"
                            ? "delivered"
                            : fulfillmentStatus === "delivery_scheduled" ? "delivery_scheduled"
                            : fulfillmentStatus === "shipped"
                            ? "shipped"
                            : "preparing"
                        }
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === "delivered") {
                            setFulfillmentStatus("delivered")
                            setOrderStatus("completed")
                          } else if (val === "delivery_scheduled") {
                            setFulfillmentStatus("delivery_scheduled"); setShippingCarrier(ZK_HOME_DELIVERY); setOrderStatus("processing"); setTrackingNumber(""); setTrackingUrl("")
                          } else if (val === "shipped") {
                            setFulfillmentStatus(shippingCarrier === ZK_HOME_DELIVERY ? "delivery_scheduled" : "shipped")
                            setOrderStatus("shipped")
                          } else {
                            setFulfillmentStatus("preparing")
                            setOrderStatus("processing")
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-[#C98484]"
                      >
                        <option value="preparing">📦 Hazırlanıyor / İşleniyor</option>
                        <option value="delivery_scheduled">ZK Home Teslimat Planlandı</option>
                        <option value="shipped">🚚 Kargoya Verildi / Yolda</option>
                        <option value="delivered">✅ Teslim Edildi</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-500 mb-1">Müşteri Türü</label>
                    <select
                      value={customerType}
                      onChange={(e) => setCustomerType(e.target.value as "member" | "guest")}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 focus:outline-none focus:border-[#C98484]"
                    >
                      <option value="member">Üye Müşteri</option>
                      <option value="guest">Misafir Alışverişi</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Fatura Adresi */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 relative">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C98484]" />
                    Fatura Adresi
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressForm(billingAddr)
                      setEditingAddressType("billing")
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Fatura Adresini Düzenle"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs space-y-1 text-slate-600 font-medium leading-relaxed">
                  <p className="font-bold text-slate-900">
                    {billingAddr.first_name ? `${billingAddr.first_name} ${billingAddr.last_name || ""}` : order.email.split("@")[0]}
                  </p>
                  {billingAddr.company && <p className="text-slate-500 font-semibold">{billingAddr.company}</p>}
                  <p>{billingAddr.address_1 || "Adres satırı belirtilmemiş"}</p>
                  {billingAddr.address_2 && <p>{billingAddr.address_2}</p>}
                  <p>{billingAddr.postal_code || "07200"} {billingAddr.city || "Muratpaşa"} / Antalya</p>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <a href={`mailto:${order.email}`} className="hover:underline truncate">{order.email}</a>
                    </div>
                    {billingAddr.phone && (
                      <div className="flex items-center gap-1.5 text-blue-600">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <a href={`tel:${billingAddr.phone}`} className="hover:underline">{billingAddr.phone}</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Gönderim Adresi */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 relative">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#C98484]" />
                    Gönderim Adresi
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setAddressForm(shippingAddr)
                      setEditingAddressType("shipping")
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Gönderim Adresini Düzenle"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs space-y-1 text-slate-600 font-medium leading-relaxed">
                  <p className="font-bold text-slate-900">
                    {shippingAddr.first_name ? `${shippingAddr.first_name} ${shippingAddr.last_name || ""}` : order.email.split("@")[0]}
                  </p>
                  {shippingAddr.company && <p className="text-slate-500 font-semibold">{shippingAddr.company}</p>}
                  <p>{shippingAddr.address_1 || "Adres satırı belirtilmemiş"}</p>
                  {shippingAddr.address_2 && <p>{shippingAddr.address_2}</p>}
                  <p>{shippingAddr.postal_code || "07200"} {shippingAddr.city || "Muratpaşa"} / Antalya</p>

                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-600">
                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                      <a href={`mailto:${order.email}`} className="hover:underline truncate">{order.email}</a>
                    </div>
                    {shippingAddr.phone && (
                      <div className="flex items-center gap-1.5 text-blue-600">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <a href={`tel:${shippingAddr.phone}`} className="hover:underline">{shippingAddr.phone}</a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Kargo & Gönderi Takip Kartı */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#C98484]" />
                Kargo Entegrasyonu & Takip Bilgileri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Kargo Firması</label>
                  <select
                    value={shippingCarrier}
                    onChange={(e) => { setShippingCarrier(e.target.value); if (e.target.value === ZK_HOME_DELIVERY) { setFulfillmentStatus("delivery_scheduled"); setOrderStatus("processing"); setTrackingNumber(""); setTrackingUrl("") } else if (fulfillmentStatus === "delivery_scheduled") setFulfillmentStatus("preparing") }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-[#C98484]"
                  >
                    <option value={ZK_HOME_DELIVERY}>ZK Home Teslimat</option>
                    <option value="Yurtiçi Kargo">Yurtiçi Kargo</option>
                    <option value="Aras Kargo">Aras Kargo</option>
                    <option value="MNG Kargo">MNG Kargo</option>
                    <option value="Sürat Kargo">Sürat Kargo</option>
                    <option value="PTT Kargo">PTT Kargo</option>
                    <option value="HepsiJet">HepsiJet</option>
                    <option value="Kolay Gelsin">Kolay Gelsin</option>
                  </select>
                </div>

                {shippingCarrier !== ZK_HOME_DELIVERY && <>
                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Kargo Takip Numarası</label>
                  <input
                    type="text"
                    placeholder="Örn: 123456789012"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:border-[#C98484]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-500 mb-1">Takip Bağlantısı (URL)</label>
                  <input
                    type="text"
                    placeholder="https://kargotakip.com/..."
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold text-slate-800 focus:outline-none focus:border-[#C98484]"
                  />
                </div>
                </>}
              </div>
              {shippingCarrier === ZK_HOME_DELIVERY && <LocalDeliveryFields date={deliveryDate} start={deliveryStart} end={deliveryEnd} onDate={setDeliveryDate} onStart={setDeliveryStart} onEnd={setDeliveryEnd}/> }
            </div>

            {/* Ürünler Tablosu ve Ödeme Özeti */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-4">
                Sipariş Edilen Ürünler
              </h3>

              {/* Products Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                      <th className="pb-3 w-1/2">ÜRÜN</th>
                      <th className="pb-3 text-right">FİYAT</th>
                      <th className="pb-3 text-center">MİKTAR</th>
                      <th className="pb-3 text-right">TOPLAM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {detail.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-12 h-12 rounded-xl border border-slate-200 object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                            <div>
                              <p className="font-extrabold text-blue-600 hover:underline">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                                Stok Kodu: {item.sku || "M003.26.0024"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right font-extrabold text-slate-900">
                          {money(item.unit_price, order.currency_code)}
                        </td>
                        <td className="py-4 text-center font-bold text-slate-500">
                          × {item.quantity}
                        </td>
                        <td className="py-4 text-right font-black text-slate-900">
                          {money(item.total, order.currency_code)}
                        </td>
                      </tr>
                    ))}

                    {/* Shipping Row */}
                    <tr className="bg-slate-50/60">
                      <td className="py-4 px-3" colSpan={3}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                            <Truck className="w-4 h-4 text-[#C98484]" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800">
                              {order.shipping_carrier || "Kargo (Bedava)"}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Paket İçeriği: {detail.items.map((i) => `${i.title} (${i.quantity} adet)`).join(", ")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 text-right font-extrabold text-slate-900">
                        {money(order.shipping_total, order.currency_code)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between border-t border-slate-100 pt-6 gap-6">
                <div>
                  {order.payment_status === "refunded" || (detail.refunds && detail.refunds.some((r: any) => r.status === "completed" || r.status === "succeeded")) ? (
                    <div className="flex flex-col gap-1">
                      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black shadow-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>İyzico İadesi Başarıyla Yapıldı</span>
                      </div>
                      {detail.refunds?.find((r: any) => r.status === "completed" || r.status === "succeeded")?.provider_reference && (
                        <span className="text-[10px] text-slate-400 font-mono pl-1">
                          İyzico İade No: #{detail.refunds?.find((r: any) => r.status === "completed" || r.status === "succeeded")?.provider_reference}
                        </span>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setRefundAmount(String((order.total / 100).toFixed(2)))
                        setShowRefundModal(true)
                      }}
                      className="px-4 py-2.5 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Para İadesi Yap
                    </button>
                  )}
                </div>

                <div className="w-full sm:w-72 space-y-2 text-xs font-bold">
                  <div className="flex justify-between text-slate-500">
                    <span>Ürünler Toplamı</span>
                    <span className="text-slate-900">{money(order.subtotal || order.total, order.currency_code)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Gönderim</span>
                    <span className="text-slate-900">{money(order.shipping_total, order.currency_code)}</span>
                  </div>
                  <div className="flex justify-between text-slate-900 text-sm font-black border-t border-slate-200 pt-2">
                    <span>Sipariş Toplamı</span>
                    <span className="text-emerald-600">{money(order.total, order.currency_code)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                    <span>Tahsil Edilen:</span>
                    <span className="text-slate-900 font-extrabold">
                      {money(order.total, order.currency_code)}
                    </span>
                  </div>
                  <p className="text-[10px] text-right text-slate-400 font-medium">
                    {paymentMethodLabel} üzerinden {formatDateTR(order.created_at)}
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* ── RIGHT SIDEBAR COLUMN (Actions, Attributes, Stats, Invoices) ── */}
          <div id="print-no-print" className="space-y-6">

            {/* Sidebar Card 1: Sipariş Yönetimi */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C98484]" />
                  Sipariş Yönetimi
                </h3>
              </div>

              <div className="space-y-3">
                <CustomerMessageButton orderId={order.id} orderNumber={order.display_id} label={order.email}/>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={saving || isRefunded}
                  className="w-full py-2.5 bg-[#C98484] hover:bg-[#A95E5E] text-white text-xs font-black rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving
                    ? "Kaydediliyor..."
                    : fulfillmentStatus === "shipped" && detail.order.fulfillment_status !== "shipped"
                    ? "Kaydet ve BirFatura ile Eşitle"
                    : "Sipariş Değişikliklerini Kaydet"}
                </button>

                {!isRefunded && !isCancelled && (
                  <div className="pt-2 border-t border-slate-100 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={saving}
                      className="text-xs font-extrabold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Siparişi İptal Et
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Card 2: BirFatura & E-Fatura */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C98484]" />
                  BirFatura & E-Fatura
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  detail.invoice?.invoice_number
                    ? "bg-emerald-100 text-emerald-800"
                    : isRefunded || isCancelled
                    ? "bg-rose-100 text-rose-800"
                    : "bg-rose-100 text-rose-800"
                }`}>
                  {detail.invoice?.invoice_number ? "Fatura Kesildi" : isRefunded || isCancelled ? "İptal/İade" : "Otomatik Kuyrukta"}
                </span>
              </div>

              <div className="text-xs space-y-3 text-slate-600 font-medium">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Fatura Durumu:</span>
                  <span className={`font-black ${detail.invoice?.invoice_number ? "text-emerald-600" : isRefunded || isCancelled ? "text-rose-600" : "text-amber-600"}`}>
                    {detail.invoice?.invoice_number
                      ? "Düzenlendi (E-Arşiv)"
                      : isRefunded || isCancelled
                      ? "Sipariş İptal/İade Edildi"
                      : fulfillmentStatus === "shipped"
                      ? "BirFatura bağlantısı bekleniyor"
                      : "Kargoya verilmesi bekleniyor"}
                  </span>
                </div>

                {detail.invoice?.invoice_number && (
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Fatura No:</span>
                    <span className="font-extrabold text-slate-900 font-mono text-xs">
                      {detail.invoice.invoice_number}
                    </span>
                  </div>
                )}

                {detail.invoice?.pdf_url && /^https:\/\//i.test(detail.invoice.pdf_url) ? (
                  <a
                    href={detail.invoice.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" /> Faturayı Görüntüle / İndir
                  </a>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Sipariş <strong>"Kargoya Verildi"</strong> yapıldığında BirFatura senkronuna alınır. BirFatura faturayı oluşturup PDF bağlantısını ilettiğinde fatura müşteriye otomatik e-posta gönderilir.
                    </p>
                    {!isRefunded && !isCancelled && (
                      <button
                        type="button"
                        onClick={handleSyncInvoice}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer border border-slate-200"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
                        BirFatura İçin Hazırla / Durumu Yenile
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Card 3: Sipariş Nitelik */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#C98484]" />
                Sipariş Nitelikleri
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Kaynak:</span>
                  <span className="font-extrabold text-slate-900">{metadata.source || "Web Mağaza"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Cihaz Türü:</span>
                  <span className="font-extrabold text-slate-900">{metadata.device || "Masaüstü"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500">Oturum Görünümü:</span>
                  <span className="font-extrabold text-slate-900">{metadata.views || 1}</span>
                </div>
              </div>
            </div>

            {/* Sidebar Card 4: Müşteri Geçmişi */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#C98484]" />
                Müşteri Geçmişi
              </h3>

              <div className="space-y-2.5 text-xs font-medium">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Toplam Sipariş</span>
                  <span className="font-extrabold text-slate-900">{customerStats.total_orders}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Net Toplam Harcama</span>
                  <span className="font-extrabold text-slate-900">{money(customerStats.total_spent, order.currency_code)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Ortalama Sipariş Tutarı</span>
                  <span className="font-extrabold text-slate-900">{money(customerStats.avg_order_value, order.currency_code)}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Edit Address Modal */}
      {editingAddressType && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {editingAddressType === "shipping" ? "Gönderim Adresini Düzenle" : "Fatura Adresini Düzenle"}
              </h3>
              <button onClick={() => setEditingAddressType(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Ad</label>
                <input
                  type="text"
                  value={addressForm.first_name || ""}
                  onChange={(e) => setAddressForm({ ...addressForm, first_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold focus:outline-none focus:border-[#C98484]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Soyad</label>
                <input
                  type="text"
                  value={addressForm.last_name || ""}
                  onChange={(e) => setAddressForm({ ...addressForm, last_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold focus:outline-none focus:border-[#C98484]"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-slate-500 mb-1">Firma Adı (İsteğe Bağlı)</label>
                <input
                  type="text"
                  value={addressForm.company || ""}
                  onChange={(e) => setAddressForm({ ...addressForm, company: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold focus:outline-none focus:border-[#C98484]"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-slate-500 mb-1">Adres Satırı 1</label>
                <input
                  type="text"
                  value={addressForm.address_1 || ""}
                  onChange={(e) => setAddressForm({ ...addressForm, address_1: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold focus:outline-none focus:border-[#C98484]"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-slate-500 mb-1">Adres Satırı 2</label>
                <input
                  type="text"
                  value={addressForm.address_2 || ""}
                  onChange={(e) => setAddressForm({ ...addressForm, address_2: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold focus:outline-none focus:border-[#C98484]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-500 mb-1">İl / Şehir</label>
                <input
                  type="text"
                  value={addressForm.city || ""}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold focus:outline-none focus:border-[#C98484]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Posta Kodu</label>
                <input
                  type="text"
                  value={addressForm.postal_code || ""}
                  onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold focus:outline-none focus:border-[#C98484]"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-slate-500 mb-1">Telefon Numarası</label>
                <input
                  type="text"
                  value={addressForm.phone || ""}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold focus:outline-none focus:border-[#C98484]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setEditingAddressType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSaveAddress}
                disabled={saving}
                className="px-5 py-2 bg-[#C98484] hover:bg-[#A95E5E] text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Adresi Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showCancelConfirm && detail && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/55 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-title"
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-2">
                <h3 id="cancel-order-title" className="text-lg font-black text-slate-900">
                  Sipariş #{displayCode} iptal edilsin mi?
                </h3>
                <p className="text-sm leading-6 text-slate-600">
                  Bu işlem siparişi iptal durumuna alır. Ödeme alınmış siparişlerde önce para iadesi yapılması gerekir.
                </p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700 text-center">
                Emin değilseniz “Vazgeç” seçeneğini kullanın.
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                disabled={saving}
                autoFocus
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={saving}
                className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-black text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {saving ? "İptal ediliyor..." : "Evet, Siparişi İptal Et"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                Para İadesi İşlemi
              </h3>
              <button onClick={() => setShowRefundModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">İade Tutarı (TL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold focus:outline-none focus:border-[#C98484]"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-500 mb-1">İade Nedeni / Notu</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  placeholder="Müşteri talebi, ürün hasarı vb."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-semibold focus:outline-none focus:border-[#C98484]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleProcessRefund}
                disabled={saving || !refundAmount}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                İadeyi Tamamla
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
