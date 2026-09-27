"use client"

import React, { useState } from "react"
import { useFormState as useActionState } from "react-dom"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { convertToLocale } from "@lib/util/money"
import { createTransferRequest } from "@lib/data/orders"
import OrderJourney from "@modules/order/components/order-journey"
import {
  ShoppingBag,
  Clock,
  Truck,
  RotateCcw,
  Package,
  ArrowRight,
  FileText,
  CheckCircle,
  Loader2,
} from "@lib/icons"

type OrdersTemplateProps = {
  orders: HttpTypes.StoreOrder[]
}

type OrderStage = "pending" | "preparing" | "shipped" | "delivered" | "canceled"

function getOrderStage(order: HttpTypes.StoreOrder): OrderStage {
  const status = String(order.status || "").toLowerCase()
  const fulfillment = String(order.fulfillment_status || "").toLowerCase()
  const payment = String(order.payment_status || "").toLowerCase()

  if (
    ["cancelled", "canceled", "refunded"].includes(status) ||
    ["cancelled", "canceled", "returned"].includes(fulfillment) ||
    payment === "refunded"
  ) return "canceled"
  if (
    ["completed", "fulfilled", "delivered"].includes(status) ||
    fulfillment === "delivered"
  ) return "delivered"
  if (
    ["shipped", "partially_shipped"].includes(fulfillment) ||
    status === "shipped"
  ) return "shipped"
  if (fulfillment === "preparing" || status === "processing") return "preparing"
  return "pending"
}

export default function OrdersTemplate({ orders = [] }: OrdersTemplateProps) {
  // KPI Calculations
  const totalOrders = orders.length
  const pendingCount = orders.filter((order) =>
    ["pending", "preparing"].includes(getOrderStage(order))
  ).length
  const deliveredCount = orders.filter((order) =>
    getOrderStage(order) === "delivered"
  ).length
  const canceledCount = orders.filter((order) =>
    getOrderStage(order) === "canceled"
  ).length

  // Transfer Form State
  const [transferState, formAction, isPending] = useActionState(createTransferRequest, {
    success: false,
    error: null,
    order: null,
  })

  return (
    <div className="w-full space-y-6 text-slate-900 font-sans" data-testid="orders-page-wrapper">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Siparişlerim</h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
          Geçmiş siparişlerinizi ve durumlarını görüntüleyin.
        </p>
      </div>

      {/* KPI Stats Cards Grid (4 Cards matching Screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Toplam Sipariş */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-[#C98484] border border-rose-100/60 shadow-2xs">
            <ShoppingBag className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Toplam Sipariş
            </span>
            <span className="block text-xl font-extrabold text-slate-900 mt-0.5">
              {totalOrders}
            </span>
          </div>
        </div>

        {/* Card 2: Hazırlanıyor */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100/60 shadow-2xs">
            <Clock className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Hazırlanıyor
            </span>
            <span className="block text-xl font-extrabold text-slate-900 mt-0.5">
              {pendingCount}
            </span>
          </div>
        </div>

        {/* Card 3: Teslim Edildi */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-2xs">
            <Truck className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Teslim Edildi
            </span>
            <span className="block text-xl font-extrabold text-slate-900 mt-0.5">
              {deliveredCount}
            </span>
          </div>
        </div>

        {/* Card 4: İade / İptal */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft flex items-center gap-4 transition-all hover:shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100/60 shadow-2xs">
            <RotateCcw className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              İade / İptal
            </span>
            <span className="block text-xl font-extrabold text-slate-900 mt-0.5">
              {canceledCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Section: Orders List or Empty State */}
      {orders.length > 0 ? (
        <div className="space-y-4" data-testid="orders-list">
          {orders.map((order) => {
            const formattedDate = new Date(order.created_at).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })

            const stage = getOrderStage(order)
            const isDelivered = stage === "delivered"
            const isCanceled = stage === "canceled"
            const isShipped = stage === "shipped"

            const statusText = isCanceled
              ? "İptal Edildi"
              : isDelivered
              ? "Teslim Edildi"
              : isShipped
              ? "Kargolandı"
              : "Hazırlanıyor"

            const statusColor = isCanceled
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : isDelivered
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : isShipped
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"

            return (
              <div
                key={order.id}
                className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft space-y-4 hover:shadow-md transition-all"
                data-testid="order-card"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-extrabold text-slate-900">
                      Sipariş #{String(order.display_id || 0).padStart(4, "0")}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      Tarih: {formattedDate}
                    </span>
                    <span className={`px-3 py-1 rounded-full border text-[11px] font-bold ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-400 block">Toplam Tutar</span>
                    <span className="text-base font-extrabold text-slate-900">
                      {convertToLocale({
                        amount: order.total,
                        currency_code: order.currency_code || "TRY",
                      })}
                    </span>
                  </div>
                </div>

                {/* 4-Step Progress Tracker Bar */}
                {!isCanceled ? (
                  <div className="py-3 px-4 bg-slate-50/70 rounded-2xl border border-slate-100">
                    <OrderJourney stage={stage} compact />
                    <div className="hidden" aria-hidden="true">
                    {(() => {
                      let cardStep = 1
                      if (stage === "delivered") {
                        cardStep = 4
                      } else if (stage === "shipped") {
                        cardStep = 3
                      } else if (stage === "preparing") {
                        cardStep = 2
                      } else {
                        cardStep = 1
                      }

                      const cardWidth = cardStep === 4 ? "100%" : cardStep === 3 ? "68%" : cardStep === 2 ? "35%" : "0%"

                      return (
                        <div className="relative flex items-center justify-between">
                          {/* Track */}
                          <div className="absolute top-3.5 left-[10%] right-[10%] h-1 bg-slate-200/80 -z-0">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-500"
                              style={{ width: cardWidth }}
                            />
                          </div>

                          {/* Step 1 */}
                          <div className="flex flex-col items-center space-y-1 z-10">
                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-white">
                              ✓
                            </div>
                            <span className="text-[10px] font-extrabold text-slate-800">Sipariş Alındı</span>
                          </div>

                          {/* Step 2 */}
                          <div className="flex flex-col items-center space-y-1 z-10">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs transition-all ${
                                cardStep > 2
                                  ? "bg-emerald-600 text-white"
                                  : cardStep === 2
                                  ? "bg-[#C98484] text-white animate-pulse"
                                  : "bg-slate-200 text-slate-400"
                              }`}
                            >
                              {cardStep > 2 ? "✓" : "📦"}
                            </div>
                            <span className={`text-[10px] ${cardStep >= 2 ? "font-extrabold text-slate-800" : "font-semibold text-slate-400"}`}>
                              Hazırlanıyor
                            </span>
                          </div>

                          {/* Step 3 */}
                          <div className="flex flex-col items-center space-y-1 z-10">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs transition-all ${
                                cardStep >= 3
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 text-slate-400"
                              }`}
                            >
                              {cardStep > 3 ? "✓" : "🚚"}
                            </div>
                            <span className={`text-[10px] ${cardStep >= 3 ? "font-extrabold text-emerald-700" : "font-semibold text-slate-400"}`}>
                              {cardStep >= 3 ? "Kargolandı" : "Kargolanacak"}
                            </span>
                          </div>

                          {/* Step 4 */}
                          <div className="flex flex-col items-center space-y-1 z-10">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs transition-all ${
                                cardStep === 4
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-200 text-slate-400"
                              }`}
                            >
                              {cardStep === 4 ? "✓" : "🏠"}
                            </div>
                            <span className={`text-[10px] ${cardStep === 4 ? "font-extrabold text-emerald-700" : "font-semibold text-slate-400"}`}>
                              {cardStep === 4 ? "Teslim Edildi" : "Teslimat"}
                            </span>
                          </div>
                        </div>
                      )
                    })()}
                    </div>
                  </div>
                ) : (
                  <div className="py-3 px-4 bg-rose-50/40 rounded-2xl border border-rose-100/70">
                    <div className="relative flex items-center justify-between">
                      {/* Track */}
                      <div className="absolute top-3.5 left-[10%] right-[10%] h-1 bg-rose-100 -z-0">
                        <div
                          className="h-full bg-rose-400 transition-all duration-500"
                          style={{ width: "100%" }}
                        />
                      </div>

                      {/* Step 1 */}
                      <div className="flex flex-col items-center space-y-1 z-10">
                        <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs">
                          ✓
                        </div>
                        <span className="text-[10px] font-bold text-rose-800">Sipariş Alındı</span>
                      </div>

                      {/* Step 2 */}
                      <div className="flex flex-col items-center space-y-1 z-10">
                        <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs">
                          ✕
                        </div>
                        <span className="text-[10px] font-bold text-rose-800">İptal Edildi</span>
                      </div>

                      {/* Step 3 */}
                      <div className="flex flex-col items-center space-y-1 z-10">
                        <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs">
                          ↩
                        </div>
                        <span className="text-[10px] font-bold text-rose-800">
                          {order.payment_status === "refunded" ? "İade Edildi" : "İade Sürecinde"}
                        </span>
                      </div>

                      {/* Step 4 */}
                      <div className="flex flex-col items-center space-y-1 z-10">
                        <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-xs">
                          ✓
                        </div>
                        <span className="text-[10px] font-bold text-rose-800">Kapatıldı</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Items Thumbnails & Titles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-slate-50/70 border border-slate-100 rounded-2xl p-2.5">
                      <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-white border border-slate-200/80 flex items-center justify-center">
                        <Thumbnail thumbnail={item.thumbnail} images={[]} size="square" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {item.title}
                        </h4>
                        <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                          {item.quantity} Adet × {convertToLocale({ amount: item.unit_price, currency_code: order.currency_code || "TRY" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions Row */}
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <LocalizedClientLink
                    href={`/hesabim/siparislerim/detaylar/${order.id}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 transition-colors"
                  >
                    <span>Sipariş Detayı</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </LocalizedClientLink>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Empty State Matching Screenshot */
        <div
          className="rounded-3xl border border-slate-100 bg-white p-10 sm:p-14 text-center shadow-soft flex flex-col items-center justify-center space-y-4 mb-6"
          data-testid="no-orders-container"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50/80 text-[#C98484] border border-rose-100 shadow-xs mb-1">
            <Package className="h-10 w-10 stroke-[1.8]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Henüz sipariş yok
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
            Henüz hiç siparişiniz yok, hadi onu değiştirelim! :)
          </p>

          <div className="pt-2">
            <LocalizedClientLink
              href="/magaza"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#C98484] hover:bg-rose-600 px-8 py-3.5 text-xs font-bold text-white shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              data-testid="continue-shopping-button"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Alışverişe Devam Et</span>
            </LocalizedClientLink>
          </div>
        </div>
      )}

      {/* Sipariş Transferi Card Matching Screenshot */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-soft flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Sipariş transferi
          </h3>
          <p className="text-xs font-medium text-slate-500 leading-relaxed">
            Aradığınız siparişi bulamıyor musunuz?
            <br />
            Bir siparişi hesabınıza bağlayın.
          </p>
        </div>

        <form action={formAction} className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              name="order_id"
              required
              placeholder="Sipariş ID (ör. ord_01...)"
              className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] focus:bg-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto h-11 px-6 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shrink-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Transfer İste</span>
          </button>
        </form>
      </div>

      {transferState?.error && (
        <div className="rounded-2xl bg-red-50 p-3.5 text-xs font-bold text-red-600">
          {transferState.error}
        </div>
      )}

      {transferState?.success && transferState.order && (
        <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-xs font-bold text-green-700 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="font-bold">{transferState.order.id} numaralı sipariş için transfer istendi.</p>
            <p className="font-medium text-green-600 mt-0.5">Transfer doğrulama e-postası gönderildi.</p>
          </div>
        </div>
      )}
    </div>
  )
}
