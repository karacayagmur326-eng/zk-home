"use client"

import React, { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import DiscountCode from "@modules/checkout/components/discount-code"
import Thumbnail from "@modules/products/components/thumbnail"
import {
  ShoppingCart,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Tag,
  Plus,
} from "@lib/icons"


export default function CheckoutSummary({
  cart,
}: {
  cart: HttpTypes.StoreCart | null
}) {
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const currencyCode = cart?.currency_code || "TRY"

  const items = cart?.items || []

  const subtotal = cart?.subtotal || 0
  const discountTotal = cart?.discount_total || 0
  const shippingTotal = cart?.shipping_total || 0
  const taxTotal = cart?.tax_total || 0
  const total = cart?.total || 0

  return (
    <div className="space-y-4 font-sans text-slate-900 lg:sticky lg:top-24">
      {/* Main Sepetiniz Card */}
      <div className="rounded-none sm:rounded-3xl border-x-0 sm:border border-y border-slate-200/80 sm:border-slate-100 bg-white p-4 sm:p-7 shadow-none sm:shadow-soft space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-[#C98484] border border-rose-100/60 shadow-2xs">
            <ShoppingCart className="h-5 w-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Sepetiniz
            </h2>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Sipariş özeti ve ödeme detayları
            </p>
          </div>
        </div>

        {/* Totals Breakdown */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between text-slate-600 font-medium">
            <span>Ara toplam</span>
            <span className="font-bold text-slate-900">
              {convertToLocale({ amount: subtotal, currency_code: currencyCode })}
            </span>
          </div>

          {discountTotal > 0 && (
            <div className="flex items-center justify-between text-emerald-600 font-bold">
              <span className="flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                <span>İndirim ({cart?.promotions?.[0]?.code || "Kupon"})</span>
              </span>
              <span>
                -{convertToLocale({ amount: discountTotal, currency_code: currencyCode })}
              </span>
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
            <span>Vergiler</span>
            <span className="font-semibold text-slate-500">
              {convertToLocale({ amount: taxTotal, currency_code: currencyCode })}
            </span>
          </div>

          <div className="border-t border-slate-100 pt-3.5 flex items-baseline justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900 block">Toplam</span>
              <span className="text-[11px] font-medium text-slate-400">KDV dahil</span>
            </div>
            <span className="text-xl font-extrabold text-slate-900">
              {convertToLocale({ amount: total, currency_code: currencyCode })}
            </span>
          </div>
        </div>

        {/* Cart Line Items Preview */}
        <div className="border-t border-slate-100 pt-4 space-y-4">
          {items.map((item: any) => {
            const itemPriceFormatted = convertToLocale({
              amount: item.total || item.unit_price * (item.quantity || 1),
              currency_code: currencyCode,
            })

            return (
              <div key={item.id} className="flex items-center gap-3 text-xs">
                {/* Thumbnail */}
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title || item.product_title}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Thumbnail thumbnail={item.thumbnail} images={[]} size="square" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-500 text-[11px] truncate">
                    Seçenek: {item.variant?.title || item.variant || "Standart"}
                  </p>
                  <p className="font-bold text-slate-700 text-xs">
                    {item.quantity || 1}x {convertToLocale({ amount: item.unit_price, currency_code: currencyCode })}
                  </p>
                </div>

                {/* Total */}
                <span className="font-extrabold text-slate-900 text-xs shrink-0">
                  {itemPriceFormatted}
                </span>
              </div>
            )
          })}
        </div>

        {/* Discount Code Accordion / Input */}
        <div className="border-t border-slate-100 pt-4">
          {cart ? (
            <DiscountCode cart={cart} />
          ) : (
            <button
              type="button"
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 flex items-center justify-between text-xs font-bold text-slate-700 hover:border-slate-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                <span>İndirim kodu ekle</span>
              </div>
              <Plus className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
