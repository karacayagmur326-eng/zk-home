"use client"

import React, { useState } from "react"
import { useCartState } from "@lib/util/cart-state"
import { updateLineItem } from "@lib/util/cart-feedback"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
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
  Minus,
  Trash2,
} from "@lib/icons"


export default function CheckoutSummary({
  cart: initialCart,
}: {
  cart: HttpTypes.StoreCart | null
}) {
  const { cart, pending } = useCartState(initialCart)
  const [quantityError, setQuantityError] = useState<string | null>(null)
  const changeQuantity = async (lineId: string, quantity: number) => {
    setQuantityError(null)
    const result = await updateLineItem({ lineId, quantity })
    if (!result.success) setQuantityError(result.error)
  }
  const [showDiscountInput, setShowDiscountInput] = useState(false)
  const currencyCode = cart?.currency_code || "TRY"

  const items = cart?.items || []

  const subtotal = cart?.subtotal || 0
  const discountTotal = cart?.discount_total || 0
  const shippingTotal = cart?.shipping_total || 0
  const total = cart?.total || 0

  if (!items.length) return <div data-testid="checkout-summary" className="rounded-none border-y border-slate-200 bg-white p-6 text-slate-900 sm:rounded-3xl sm:border sm:p-7 sm:shadow-soft" aria-busy={pending}>
    <h2 className="text-lg font-bold">Sepetiniz boş</h2>
    <p className="mt-2 text-sm text-slate-500">Alışverişe devam ederek sepetinize ürün ekleyebilirsiniz.</p>
    <LocalizedClientLink href="/magaza" className="mt-5 inline-flex rounded-xl bg-[#C98484] px-5 py-3 text-sm font-bold text-white hover:bg-[#A95E5E]">Alışverişe devam et</LocalizedClientLink>
    {quantityError && <p role="alert" className="mt-3 text-xs text-[#A95E5E]">{quantityError}</p>}
  </div>

  return (
    <div className="space-y-4 font-sans text-slate-900" data-testid="checkout-summary">
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
              <span className={cart?.shipping_methods?.length ? "font-bold text-emerald-600" : "text-slate-500"}>
                {cart?.shipping_methods?.length ? "Ücretsiz" : "Teslimat yöntemini seçin"}
              </span>
            )}
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
              amount: item.unit_price * item.quantity,
              currency_code: currencyCode,
            })

            return (
              <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-xs" aria-busy={pending}>
                {/* Thumbnail */}
                <LocalizedClientLink href={`/urunler/${item.product_handle || item.product?.handle}`} className="w-20 aspect-[4/5] bg-white border border-slate-100 rounded-xl p-1 shrink-0 flex items-center justify-center overflow-hidden" aria-label={`${item.title || item.product_title} ürününü incele`}>
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title || item.product_title}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Thumbnail thumbnail={item.thumbnail} images={[]} size="square" />
                  )}
                </LocalizedClientLink>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <LocalizedClientLink href={`/urunler/${item.product_handle || item.product?.handle}`} className="block text-sm font-bold leading-snug text-slate-900 hover:text-[#A95E5E] transition-colors">
                    {item.title || item.product_title}
                  </LocalizedClientLink>
                  <p className="font-semibold text-slate-500 text-[11px] truncate">
                    Seçenek: {item.variant?.title || "Standart"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {convertToLocale({ amount: item.unit_price, currency_code: currencyCode })} / adet
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1">
                      <button type="button" aria-label={`${item.title || item.product_title} adet azalt`} disabled={pending || item.quantity <= 1} onClick={() => changeQuantity(item.id, item.quantity - 1)} className="grid h-8 w-8 place-items-center rounded-lg text-[#A95E5E] hover:bg-[#FCF7F6] disabled:opacity-30"><Minus className="h-4 w-4" /></button>
                      <span className="w-7 text-center text-sm font-bold" aria-live="polite">{item.quantity}</span>
                      <button type="button" aria-label={`${item.title || item.product_title} adet artır`} disabled={pending} onClick={() => changeQuantity(item.id, item.quantity + 1)} className="grid h-8 w-8 place-items-center rounded-lg bg-[#C98484] text-white hover:bg-[#A95E5E] disabled:opacity-30"><Plus className="h-4 w-4" /></button>
                    </div>
                    <span className="font-extrabold text-sm text-[#A95E5E]">{itemPriceFormatted}</span>
                  </div>
                  <button type="button" aria-label={`${item.title || item.product_title} ürününü sepetten sil`} disabled={pending} onClick={() => changeQuantity(item.id, 0)} className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[#A95E5E] hover:bg-[#FCF7F6] disabled:opacity-30"><Trash2 className="h-4 w-4" />Sil</button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Discount Code Accordion / Input */}
        {quantityError && <p role="alert" className="rounded-xl border border-[#C98484]/30 bg-[#FCF7F6] p-3 text-xs text-[#A95E5E]">{quantityError}</p>}
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
