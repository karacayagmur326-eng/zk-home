"use client"

import React, { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { AlertTriangle, CheckCircle2 } from "@lib/icons"
import { SellerQuestionPageContext } from "@components/common/SellerQuestion"
import { CalendarDays, Download, FileText, RotateCcw } from "lucide-react"
import LocalDeliveryNotice from "../local-delivery-notice"
import OrderJourney from "@modules/order/components/order-journey"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

// Türkiye'de Mesafeli Sözleşmeler Yönetmeliği gereği yasal cayma hakkı 14 gündür
const LEGAL_RETURN_DAYS = 14

const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  const [currentStatus, setCurrentStatus] = useState(order.status || "pending")
  const [fulfillmentStatus, setFulfillmentStatus] = useState<string>(
    order.fulfillment_status || "not_fulfilled"
  )
  const [isCanceling, setIsCanceling] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [cancelSuccess, setCancelSuccess] = useState(false)

  const invoice = (order as HttpTypes.StoreOrder & {
    invoice?: {
      invoice_number?: string | null
      pdf_url?: string | null
      status?: string | null
      created_at?: string | null
    } | null
  }).invoice
  const invoicePdfUrl =
    typeof invoice?.pdf_url === "string" && /^https:\/\//i.test(invoice.pdf_url)
      ? invoice.pdf_url
      : null
  const contactAddress = order.shipping_address || order.billing_address
  const contactName = [contactAddress?.first_name, contactAddress?.last_name]
    .filter(Boolean)
    .join(" ")

  const handleCancelOrder = async () => {
    setIsCanceling(true)
    setCancelError(null)
    try {
      const res = await fetch("/api/account/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Sipariş iptal edilirken bir hata oluştu.")
      }
      setCurrentStatus("canceled")
      setFulfillmentStatus("canceled")
      setCancelSuccess(true)
      setShowCancelModal(false)
    } catch (err: any) {
      setCancelError(err.message || "Bir hata oluştu.")
    } finally {
      setIsCanceling(false)
    }
  }

  const formatTurkishDate = (dateStr: string | Date) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return String(dateStr)
      return d.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
      })
    } catch {
      return String(dateStr)
    }
  }

  const getFulfillmentLabel = (st: string) => {
    switch (st) {
      case "not_fulfilled":
        return "Karşılanmadı"
      case "fulfilled":
        return "Karşılandı"
      case "shipped":
        return "Kargolandı"
      case "partially_shipped":
        return "Kısmen Kargolandı"
      case "delivered":
        return "Teslim Edildi"
      case "canceled":
      case "cancelled":
        return "İptal Edildi"
      case "returned":
        return "İade Edildi"
      default:
        return "Karşılanmadı"
    }
  }

  const getPaymentLabel = (st: string) => {
    switch (st) {
      case "awaiting":
      case "pending":
      case "not_paid":
        return "Beklemede"
      case "captured":
      case "paid":
        return "Ödendi"
      case "refunded":
        return "İade Edildi"
      case "canceled":
      case "cancelled":
        return "İptal Edildi"
      default:
        return "Beklemede"
    }
  }

  const getStatusBadgeStyle = (label: string) => {
    if (label === "Teslim Edildi" || label === "Ödendi" || label === "Karşılandı" || label === "Kargolandı") {
      return "bg-emerald-50 text-emerald-700 border-emerald-100"
    }
    if (label === "İptal Edildi" || label === "İade Edildi") {
      return "bg-rose-50 text-rose-700 border-rose-100"
    }
    return "bg-amber-50 text-amber-700 border-amber-100"
  }

  const statusLower = String(currentStatus || "").toLowerCase()
  const fulfillmentLower = String(fulfillmentStatus || "").toLowerCase()
  const paymentLower = String(order.payment_status || "").toLowerCase()

  const isCanceled =
    ["canceled", "cancelled", "refunded"].includes(statusLower) ||
    ["canceled", "cancelled", "returned"].includes(fulfillmentLower) ||
    paymentLower === "refunded"
  const isDelivered = fulfillmentStatus === "delivered"
  const isReturned = fulfillmentStatus === "returned"

  // 14 günlük iade süresi kontrolü (Türkiye yasal cayma hakkı)
  const deliveredAt = (order as any).delivered_at
  const returnWindowExpired = (() => {
    if (!deliveredAt) return false
    const deliveryDate = new Date(deliveredAt)
    const daysSinceDelivery =
      (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceDelivery > LEGAL_RETURN_DAYS
  })()

  const returnDeadlineDate = (() => {
    if (!deliveredAt) return null
    const d = new Date(deliveredAt)
    d.setDate(d.getDate() + LEGAL_RETURN_DAYS)
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  })()

  const canCancel =
    !isCanceled &&
    !isDelivered &&
    fulfillmentStatus !== "shipped"

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm mb-4">
      <SellerQuestionPageContext
        value={{
          name: contactName,
          email: order.email || "",
          phone: contactAddress?.phone || "",
          orderNo: `#${order.display_id || order.id}`,
          subject: "Sipariş & Teslimat",
        }}
      />
      {/* Upper row: Email Notice & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <p className="text-xs md:text-sm text-slate-700">
            Sipariş onay detayları şu adrese gönderildi:{" "}
            <span className="font-semibold text-slate-900" data-testid="order-email">
              {order.email}
            </span>
            .
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* İptal butonu — henüz teslim edilmemişse göster */}
          {canCancel && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="bg-[#C98484] hover:bg-[#A95E5E] text-white px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm flex items-center gap-2 transition shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
              <span>Siparişi iptal et</span>
            </button>
          )}

          {/* İptal edildi badge */}
          {isCanceled && (
            <span className="bg-red-50 text-red-700 border border-red-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Sipariş İptal Edildi</span>
            </span>
          )}

          {/* İade Et butonu — Teslim Edildi durumunda */}
          {isDelivered && !isReturned && (
            <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50/60 p-2 shadow-sm">
              <LocalizedClientLink
                href={returnWindowExpired ? "#" : "#iade-talebi"}
                aria-disabled={returnWindowExpired}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center gap-2 transition ${
                  returnWindowExpired
                    ? "pointer-events-none bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white text-[#C98484] hover:bg-rose-100"
                }`}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>İade Talebi</span>
              </LocalizedClientLink>
              <div className="border-l border-rose-200 px-2 pr-3">
                <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  <CalendarDays className="h-3 w-3" aria-hidden="true" />
                  Son başvuru
                </p>
                <p className={`mt-0.5 text-xs font-extrabold ${returnWindowExpired ? "text-slate-400" : "text-slate-800"}`}>
                  {returnWindowExpired
                    ? "İade süresi doldu"
                    : returnDeadlineDate || "Teslimattan sonra 14 gün"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {(invoice?.invoice_number || invoicePdfUrl) && (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">E-Faturanız hazır</p>
              <p className="mt-0.5 text-xs text-slate-600">
                {invoice?.invoice_number
                  ? `Fatura No: ${invoice.invoice_number}`
                  : "Fatura belgeniz oluşturuldu."}
              </p>
            </div>
          </div>
          {invoicePdfUrl ? (
            <a
              href={invoicePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 transition shadow-sm"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Faturayı Görüntüle / İndir
            </a>
          ) : (
            <span className="text-xs font-semibold text-amber-700">
              PDF bağlantısı hazırlanıyor
            </span>
          )}
        </div>
      )}

      {/* Toast mesajları */}
      {cancelSuccess && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-100 flex items-center gap-2">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
          Siparişiniz başarıyla iptal edildi.
        </div>
      )}
      {cancelError && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-800 text-xs font-medium border border-red-100 flex items-center gap-2">
          <AlertTriangle aria-hidden="true" className="h-4 w-4 shrink-0" />
          {cancelError}
        </div>
      )}

      {/* 4 Sütun Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-5">
        {/* Tarih */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1.5">Sipariş tarihi</p>
          <div
            className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-slate-800"
            data-testid="order-date"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-4 h-4 text-slate-400 flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              />
            </svg>
            <span>{formatTurkishDate(order.created_at)}</span>
          </div>
        </div>

        {/* Sipariş No */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1.5">Sipariş numarası</p>
          <p className="text-xs md:text-sm font-bold text-blue-600" data-testid="order-id">
            #{order.display_id || order.id}
          </p>
        </div>

        {/* Sipariş Durumu */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1.5">Sipariş durumu</p>
          {(() => {
            const label = isCanceled ? "İptal Edildi" : getFulfillmentLabel(fulfillmentStatus)
            return (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border inline-block ${getStatusBadgeStyle(label)}`}
                data-testid="order-status"
              >
                {label}
              </span>
            )
          })()}
        </div>

        {/* Ödeme Durumu */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1.5">Ödeme durumu</p>
          {(() => {
            const label = getPaymentLabel(order.payment_status)
            return (
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border inline-block ${getStatusBadgeStyle(label)}`}
                data-testid="order-payment-status"
              >
                {label}
              </span>
            )
          })()}
        </div>
      </div>

      <LocalDeliveryNotice order={order as any}/>
      {/* Sipariş Durumu İlerleme Çubuğu (Progress Tracker Bar) */}
      {!isCanceled ? (
        <div className="mt-6 pt-6 border-t border-slate-100">
          <OrderJourney localDelivery={(order as any).shipping_carrier === "ZK Home Teslimat"}
            stage={
              ["delivered"].includes(String(fulfillmentStatus).toLowerCase()) || ["completed", "fulfilled"].includes(String(currentStatus).toLowerCase())
                ? "delivered"
                : ["shipped", "partially_shipped", "delivery_scheduled"].includes(String(fulfillmentStatus).toLowerCase()) || String(currentStatus).toLowerCase() === "shipped"
                ? "shipped"
                : String(fulfillmentStatus).toLowerCase() === "preparing" || String(currentStatus).toLowerCase() === "processing"
                ? "preparing"
                : "pending"
            }
          />
          <div className="hidden" aria-hidden="true">
          {(() => {
            const fStatus = String(fulfillmentStatus || "").toLowerCase()
            const oStatus = String(currentStatus || "").toLowerCase()
            let currentStep = 1
            if (fStatus === "delivered" || oStatus === "completed" || oStatus === "fulfilled") {
              currentStep = 4
            } else if (fStatus === "shipped" || fStatus === "partially_shipped" || oStatus === "shipped") {
              currentStep = 3
            } else if (fStatus === "preparing" || oStatus === "processing") {
              currentStep = 2
            } else {
              currentStep = 1
            }

            const progressWidth = currentStep === 4 ? "100%" : currentStep === 3 ? "68%" : currentStep === 2 ? "35%" : "0%"

            return (
              <div className="space-y-4">
                <div className="relative flex items-center justify-between">
                  {/* Background Track Line */}
                  <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-slate-100 -z-0">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                      style={{ width: progressWidth }}
                    />
                  </div>

                  {/* Step 1: Sipariş Alındı */}
                  <div className="flex flex-col items-center space-y-1.5 z-10">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-4 ring-white">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-800">Sipariş Alındı</span>
                    <span className="text-[10px] text-emerald-600 font-semibold hidden sm:block">Ödeme Onaylandı</span>
                  </div>

                  {/* Step 2: Hazırlanıyor */}
                  <div className="flex flex-col items-center space-y-1.5 z-10">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-xs transition-all ${
                        currentStep > 2
                          ? "bg-emerald-600 text-white"
                          : currentStep === 2
                          ? "bg-[#C98484] text-white animate-pulse"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {currentStep > 2 ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-[11px] ${currentStep >= 2 ? "font-extrabold text-slate-800" : "font-semibold text-slate-400"}`}>
                      Hazırlanıyor
                    </span>
                    <span className={`text-[10px] hidden sm:block ${currentStep === 2 ? "font-bold text-[#C98484]" : "text-slate-400"}`}>
                      {currentStep > 2 ? "Paketlendi" : "Paketleniyor"}
                    </span>
                  </div>

                  {/* Step 3: Kargoya Verildi */}
                  <div className="flex flex-col items-center space-y-1.5 z-10">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-xs transition-all ${
                        currentStep >= 3
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      {currentStep > 3 ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8h4l3 3v5a1 1 0 01-1 1h-1m-6 0a2 2 0 004 0m-4 0a2 2 0 01-4 0" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-[11px] ${currentStep >= 3 ? "font-extrabold text-slate-800" : "font-semibold text-slate-400"}`}>
                      {currentStep >= 3 ? "Kargoya Verildi" : "Kargoya Verilecek"}
                    </span>
                    <span className={`text-[10px] hidden sm:block ${currentStep >= 3 ? "font-bold text-emerald-600" : "text-slate-400"}`}>
                      {currentStep >= 3 ? "Kargo Yolda" : "Sıradaki Adım"}
                    </span>
                  </div>

                  {/* Step 4: Teslim Edildi */}
                  <div className="flex flex-col items-center space-y-1.5 z-10">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-xs transition-all ${
                        currentStep === 4
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-400 border border-slate-200"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <span className={`text-[11px] ${currentStep === 4 ? "font-extrabold text-emerald-700" : "font-semibold text-slate-400"}`}>
                      Teslim Edildi
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:block">
                      {currentStep === 4 ? "Teslimat Tamamlandı" : "Son Adım"}
                    </span>
                  </div>
                </div>
              </div>
            )
          })()}
          </div>
        </div>
      ) : (
        <div className="mt-6 pt-6 border-t border-rose-100">
          <div className="space-y-4">
            <div className="relative flex items-center justify-between">
              {/* Background Track Line - Zarif Gül Kurusu */}
              <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-rose-100 -z-0">
                <div
                  className="h-full bg-rose-400 transition-all duration-500 ease-out"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Step 1: Sipariş Alındı */}
              <div className="flex flex-col items-center space-y-1.5 z-10">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-4 ring-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold text-rose-900">Sipariş Alındı</span>
                <span className="text-[10px] text-rose-600 hidden sm:block">
                  Sipariş Alınmıştı
                </span>
              </div>

              {/* Step 2: İptal Edildi */}
              <div className="flex flex-col items-center space-y-1.5 z-10">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-4 ring-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold text-rose-900">İptal Edildi</span>
                <span className="text-[10px] text-rose-600 hidden sm:block">
                  Sipariş İptali
                </span>
              </div>

              {/* Step 3: Ödeme İadesi */}
              <div className="flex flex-col items-center space-y-1.5 z-10">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-4 ring-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold text-rose-900">Ödeme İadesi</span>
                <span className="text-[10px] text-rose-600 hidden sm:block">
                  {paymentLower === "refunded" ? "İade Edildi" : "İade Sürecinde"}
                </span>
              </div>

              {/* Step 4: Kapatıldı */}
              <div className="flex flex-col items-center space-y-1.5 z-10">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-4 ring-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold text-rose-900">Kapatıldı</span>
                <span className="text-[10px] text-rose-600 hidden sm:block">
                  İşlem Sonlandı
                </span>
              </div>
            </div>

            {/* Bilgilendirme Kutusu - Sade ve abartısız */}
            <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200/60 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>
                Bu sipariş iptal edilmiştir. {paymentLower === "refunded" ? "Ödeme tutarı kartınıza iade edilmiştir." : "Ödeme iade süreciniz başlatılmıştır."}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* İptal Onay Modalı */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Siparişi İptal Et</h3>
            <p className="text-xs md:text-sm text-slate-600 mb-6">
              Bu siparişi iptal etmek istediğinizden emin misiniz? Bu işlem geri
              alınamaz.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isCanceling}
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-xs md:text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isCanceling}
                onClick={handleCancelOrder}
                className="px-4 py-2 rounded-xl text-xs md:text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition shadow-sm flex items-center gap-2"
              >
                {isCanceling ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>İptal Ediliyor...</span>
                  </>
                ) : (
                  <span>Evet, İptal Et</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default OrderDetails
