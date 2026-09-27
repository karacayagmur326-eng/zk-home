"use client"

import React, { useState } from "react"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { SellerQuestionButton } from "@components/common/SellerQuestion"
import {
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Building2,
  Clock,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  PhoneCall,
  ChevronRight,
} from "lucide-react"

type OrderItem = {
  id: string
  title: string
  product_title?: string
  thumbnail?: string | null
  quantity: number
  unit_price: number
  total: number
  variant?: {
    title?: string
    sku?: string
  }
}

type OrderCompletedTemplateProps = {
  order: any
}

export default function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const [copied, setCopied] = useState(false)

  const currencyCode = order.currency_code || "TRY"
  const orderNumber = order.display_id ? `#SCH-${order.display_id}` : `#${order.id?.slice(0, 8).toUpperCase()}`

  const copyOrderNo = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const items: OrderItem[] = Array.isArray(order.items) ? order.items : []
  const shippingAddr = order.shipping_address || {}
  const billingAddr = order.billing_address || {}
  const invoice = order.invoice || null

  const isKurumsal =
    billingAddr?.company ||
    billingAddr?.metadata?.address_type === "kurumsal" ||
    order.invoice_type === "corporate"

  const formatDate = (dStr?: string | null) => {
    if (!dStr) return new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    try {
      return new Date(dStr).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dStr
    }
  }

  const subtotal = Number(order.subtotal || 0)
  const shippingTotal = Number(order.shipping_total || 0)
  const discountTotal = Number(order.discount_total || 0)
  const taxTotal = Number(order.tax_total || 0)
  const grandTotal = Number(order.total || 0)

  // Dynamic Stepper Calculation based on order status and fulfillment
  let currentStep = 1
  const fStatus = String(order.fulfillment_status || "").toLowerCase()
  const oStatus = String(order.status || "").toLowerCase()

  if (fStatus === "delivered" || oStatus === "completed") {
    currentStep = 4
  } else if (fStatus === "shipped" || fStatus === "partially_shipped" || order.tracking_number) {
    currentStep = 3
  } else if (fStatus === "preparing" || oStatus === "processing" || oStatus === "pending" || order.payment_status === "paid") {
    currentStep = 2
  }

  const progressLineWidth =
    currentStep === 4 ? "100%" : currentStep === 3 ? "68%" : currentStep === 2 ? "35%" : "0%"

  return (
    <main className="min-h-screen bg-[#F8F9FA] py-8 sm:py-12 text-slate-900 font-sans">
      <div className="content-container mx-auto max-w-5xl px-4 sm:px-6 space-y-6">

        {/* ─── 1. TOP CELEBRATION & TIMELINE CARD ────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-soft space-y-8 relative overflow-hidden">
          {/* Subtle Top Accent */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#C98484] to-rose-500" />

          {/* Main Success Title & Badges */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100/80 text-emerald-800">
                    <Check className="w-3 h-3 stroke-[3]" /> {order.payment_status === "paid" ? "Ödeme Başarılı" : "Sipariş Alındı"}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {formatDate(order.created_at)}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {currentStep === 4
                    ? "Siparişiniz Teslim Edildi!"
                    : currentStep === 3
                    ? "Siparişiniz Kargoya Verildi!"
                    : "Siparişiniz Başarıyla Alındı!"}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sipariş güncellemeleri <strong className="text-slate-700">{order.email}</strong> adresine iletilmektedir.
                </p>
              </div>
            </div>

            {/* Order Number Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 shrink-0 w-full sm:w-auto">
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Sipariş No
                </span>
                <span className="text-base font-extrabold text-slate-900 font-mono">
                  {orderNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={copyOrderNo}
                title="Sipariş Numarasını Kopyala"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-[#C98484] hover:border-rose-200 shadow-2xs transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 text-[11px]">Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px]">Kopyala</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Connected Stepper Timeline */}
          <div className="border-t border-slate-100 pt-6">
            <div className="relative grid grid-cols-4 gap-2 sm:gap-4">
              
              {/* Progress Line */}
              <div className="absolute top-5 left-[12%] right-[12%] h-1 bg-slate-100 -z-0">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: progressLineWidth }}
                />
              </div>

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center z-10 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 ring-4 ring-white">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">Sipariş Alındı</span>
                  <span className="text-[10px] font-semibold text-emerald-600 hidden sm:block">Ödeme Onaylandı</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center z-10 space-y-2">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ring-4 ring-white shadow-md transition-all ${
                    currentStep > 2
                      ? "bg-emerald-600 text-white shadow-emerald-600/20"
                      : currentStep === 2
                      ? "bg-[#C98484] text-white shadow-rose-500/20 animate-pulse"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {currentStep > 2 ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Package className="w-5 h-5 stroke-[2.2]" />
                  )}
                </div>
                <div>
                  <span
                    className={`text-xs block ${
                      currentStep >= 2 ? "font-extrabold text-slate-900" : "font-bold text-slate-400"
                    }`}
                  >
                    Hazırlanıyor
                  </span>
                  <span
                    className={`text-[10px] hidden sm:block ${
                      currentStep === 2 ? "font-bold text-[#C98484]" : "text-slate-400"
                    }`}
                  >
                    {currentStep > 2 ? "Paketlendi" : "Atölyede Hazırlanıyor"}
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center z-10 space-y-2">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ring-4 ring-white shadow-md transition-all ${
                    currentStep > 3
                      ? "bg-emerald-600 text-white shadow-emerald-600/20"
                      : currentStep === 3
                      ? "bg-[#C98484] text-white shadow-rose-500/20 animate-pulse"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {currentStep > 3 ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <Truck className="w-5 h-5 stroke-[2.2]" />
                  )}
                </div>
                <div>
                  <span
                    className={`text-xs block ${
                      currentStep >= 3 ? "font-extrabold text-slate-900" : "font-bold text-slate-400"
                    }`}
                  >
                    {currentStep >= 3 ? "Kargoya Verildi" : "Kargoya Verilecek"}
                  </span>
                  <span
                    className={`text-[10px] hidden sm:block ${
                      currentStep === 3 ? "font-bold text-[#C98484]" : "text-slate-400"
                    }`}
                  >
                    {order.tracking_number ? "Kargo Yolda" : "1 - 2 İş Günü"}
                  </span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center z-10 space-y-2">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ring-4 ring-white shadow-md transition-all ${
                    currentStep === 4
                      ? "bg-emerald-600 text-white shadow-emerald-600/20"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span
                    className={`text-xs block ${
                      currentStep === 4 ? "font-extrabold text-emerald-700" : "font-bold text-slate-400"
                    }`}
                  >
                    {currentStep === 4 ? "Teslim Edildi" : "Teslimat"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium hidden sm:block">
                    {currentStep === 4 ? "Başarıyla Teslim Edildi" : "Kapınızda"}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ─── 2. MAIN 2-COLUMN GRID ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
          
          {/* LEFT COLUMN: Products & BirFatura */}
          <div className="space-y-6">

            {/* Ordered Products Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 text-[#C98484]">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Sipariş Edilen Ürünler
                  </h2>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                  {items.length} Kalem Ürün
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const itemTotalFormatted = convertToLocale({
                    amount: item.total || item.unit_price * (item.quantity || 1),
                    currency_code: currencyCode,
                  })
                  const unitPriceFormatted = convertToLocale({
                    amount: item.unit_price,
                    currency_code: currencyCode,
                  })

                  return (
                    <div key={item.id} className="py-4 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <Package className="w-7 h-7 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                            {item.title || item.product_title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[11px] font-semibold text-slate-500">
                              {item.quantity} Adet × {unitPriceFormatted}
                            </span>
                            {item.variant?.title && item.variant.title !== "Default" && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {item.variant.title}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold text-slate-900 block">
                          {itemTotalFormatted}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">KDV Dahil</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* BirFatura E-Fatura & Kargo Entegrasyon Kartı */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 text-[#C98484]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Resmi E-Fatura & Kargo Belgesi
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      BirFatura Entegrasyonu ile oluşturulan resmi fatura
                    </p>
                  </div>
                </div>

                {invoice?.pdf_url ? (
                  <a
                    href={invoice.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#C98484] text-white text-xs font-extrabold hover:bg-rose-600 shadow-sm transition cursor-pointer shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>E-Faturayı İndir (PDF)</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50/80 border border-rose-100 text-[11px] font-bold text-rose-900 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-[#C98484]" />
                    <span>E-Fatura Hazırlanıyor</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                  <span>
                    <strong className="text-slate-900">Fatura Durumu:</strong>{" "}
                    {invoice?.invoice_number ? `Kesildi (No: ${invoice.invoice_number})` : "Sipariş onaylandı, fatura oluşturuluyor."}
                  </span>
                  <span className="text-[11px] text-slate-400">PDF e-posta ile de iletilir</span>
                </div>
                {order.tracking_number && (
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-slate-900 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-[#C98484]" />
                      <span>{order.shipping_carrier || "Kargo Takip"}: {order.tracking_number}</span>
                    </span>
                    {order.tracking_url && (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#C98484] hover:underline text-xs flex items-center gap-1"
                      >
                        <span>Kargom Nerede</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Summary, Addresses, Actions */}
          <div className="space-y-6">

            {/* Totals Breakdown Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Ödeme Özeti</span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  Ödendi
                </span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Ara Toplam</span>
                  <span className="font-bold text-slate-900">
                    {convertToLocale({ amount: subtotal, currency_code: currencyCode })}
                  </span>
                </div>

                {discountTotal > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 font-bold">
                    <span>İndirim</span>
                    <span>-{convertToLocale({ amount: discountTotal, currency_code: currencyCode })}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Kargo</span>
                  {shippingTotal > 0 ? (
                    <span className="font-bold text-slate-900">
                      {convertToLocale({ amount: shippingTotal, currency_code: currencyCode })}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 line-through">99,00 TL</span>
                      <span className="font-bold text-emerald-600">Ücretsiz</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-slate-600 font-medium">
                  <span>Vergiler (KDV Dahil)</span>
                  <span className="font-semibold text-slate-500">
                    {convertToLocale({ amount: taxTotal, currency_code: currencyCode })}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3.5 flex items-baseline justify-between">
                  <div>
                    <span className="text-sm font-extrabold text-slate-900 block">Genel Toplam</span>
                    <span className="text-[10px] text-slate-400 font-medium">Kredi Kartı ile Tahsil Edildi</span>
                  </div>
                  <span className="text-2xl font-black text-[#C98484]">
                    {convertToLocale({ amount: grandTotal, currency_code: currencyCode })}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery & Billing Address Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-soft space-y-4 text-xs">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C98484]" />
                  <span>Teslimat Adresi</span>
                </h4>
                <p className="font-bold text-slate-900">
                  {shippingAddr.first_name} {shippingAddr.last_name}
                </p>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  {shippingAddr.address_1} {shippingAddr.address_2}
                </p>
                <p className="text-slate-700 font-semibold mt-0.5">
                  {shippingAddr.city} {shippingAddr.postal_code && `/ ${shippingAddr.postal_code}`}
                </p>
                {shippingAddr.phone && (
                  <p className="text-slate-400 text-[11px] mt-1.5 font-mono">Tel: {shippingAddr.phone}</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Fatura Türü: {isKurumsal ? "Kurumsal E-Fatura" : "Bireysel E-Arşiv"}</span>
                </h4>
                {isKurumsal && billingAddr?.company && (
                  <p className="text-slate-700 font-semibold">{billingAddr.company}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <LocalizedClientLink
                href="/hesabim/siparislerim"
                className="w-full h-12 rounded-2xl bg-[#C98484] text-white font-extrabold text-xs hover:bg-[#A95E5E] shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Siparişlerimi Görüntüle</span>
                <ArrowRight className="w-4 h-4" />
              </LocalizedClientLink>

              <LocalizedClientLink
                href="/magaza"
                className="w-full h-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>Alışverişe Devam Et</span>
              </LocalizedClientLink>
            </div>

            {/* Help & Support note */}
            <div className="flex items-center gap-3 bg-slate-100/70 border border-slate-200/60 rounded-2xl p-4 text-xs">
              <div className="p-2 rounded-xl bg-white text-[#C98484] shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div className="text-[11px] text-slate-500">
                Siparişinizle ilgili sorularınız için{" "}
                <SellerQuestionButton
                  className="font-bold text-[#C98484] hover:underline"
                  context={{
                    email: order.email || "",
                    orderNo: `#${order.display_id || order.id}`,
                    subject: "Sipariş & Teslimat",
                  }}
                >
                  Satıcıya Sor
                </SellerQuestionButton>{" "}
                formunu kullanabilirsiniz.
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>
  )
}
