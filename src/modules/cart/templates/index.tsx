"use client"

import React, { useState } from "react"
import { useCartState } from "@lib/util/cart-state"
import FeedbackPopup from "@modules/common/components/feedback-popup"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import DiscountCode from "@modules/checkout/components/discount-code"
import { convertToLocale } from "@lib/util/money"
import { updateLineItem, deleteLineItem } from "@lib/util/cart-feedback"
import {
  Trash,
  Plus,
  Minus,
  Lock,
  ArrowLeft,
  ShieldCheck,
  Tag,
  Info,
  CheckCircle,
  ShoppingBag,
  Loader2,
  Truck,
} from "@lib/icons"
import type { MobileSettings } from "@lib/content/mobile-settings"

export default function CartTemplate({
  cart: initialCart,
  customer,
  mobileSettings,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  mobileSettings?: MobileSettings
}) {
  const { cart, pending } = useCartState(initialCart)
  const items = cart?.items || []
  const [popupMessage, setPopupMessage] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const totalItemCount = items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0)

  // Subtotal Calculation
  const subtotal = items.reduce(
    (acc, i) => acc + (Number(i.unit_price || 0) * (Number(i.quantity) || 1)),
    0
  )
  const shippingTotal = cart?.shipping_total || 0
  const discountTotal = cart?.discount_total || 0
  const grandTotal = Math.max(0, (cart?.total ?? (subtotal + shippingTotal - discountTotal)) + subtotal - (cart?.subtotal ?? subtotal))

  const currencyCode = cart?.currency_code || "TRY"

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return
    setUpdatingId(itemId)
    try { await updateLineItem({ lineId: itemId, quantity: newQty }) }
    finally { setUpdatingId(null) }
  }
  const handleDeleteItem = async (itemId: string) => {
    setUpdatingId(itemId)
    try { await deleteLineItem(itemId) }
    catch { setPopupMessage("Ürün sepetten çıkarılamadı. Sepetiniz korundu; lütfen tekrar deneyin.") }
    finally { setUpdatingId(null) }
  }

  if (items.length === 0) {
    return (
      <><main className={`${mobileSettings?.enabled ? "hidden md:block" : "block"} min-h-[65vh] bg-[#F8F9FA] py-8 sm:py-12 text-slate-900 font-sans`}>
        <div className="content-container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-3xl border border-slate-100 bg-white p-10 sm:p-14 text-center shadow-soft flex flex-col items-center justify-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 text-[#C98484] border border-rose-100 shadow-xs mb-1">
              <ShoppingBag className="h-10 w-10 stroke-[1.8]" />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Sepetinizde ürün bulunmuyor
            </h2>
            <p className="text-xs sm:text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
              Alışverişe devam etmek için ürünlerimizi inceleyebilir ve sepete ekleyebilirsiniz.
            </p>

            <div className="pt-2">
              <LocalizedClientLink
                href="/magaza"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#C98484] hover:bg-rose-600 px-8 py-3.5 text-xs font-bold text-white shadow-md shadow-rose-500/20 transition-all"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Alışverişe Başla</span>
              </LocalizedClientLink>
            </div>
          </div>
        </div>
      </main>{mobileSettings?.enabled && <main className="min-h-[70vh] bg-[#f5f6f7] p-3 pb-24 md:hidden"><div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><ShoppingBag className="mx-auto h-14 w-14 text-[#C98484]" /><h1 className="mt-4 text-xl font-black">{mobileSettings.cart.emptyTitle}</h1><p className="mt-2 text-xs leading-relaxed text-slate-500">{mobileSettings.cart.emptyDescription}</p><LocalizedClientLink href={mobileSettings.cart.emptyButtonHref} className="mt-5 inline-flex rounded-xl bg-[#C98484] px-5 py-3 text-xs font-extrabold text-white">{mobileSettings.cart.emptyButtonLabel}</LocalizedClientLink></div></main>}</>
    )
  }

  return (<>
    <FeedbackPopup message={popupMessage} title="Sepet güncellenemedi" onClose={() => setPopupMessage("")} />
    {mobileSettings?.enabled && <main className="bg-[#f5f6f7] pb-24 md:hidden overflow-x-hidden w-full">
      <div className="flex items-center justify-between bg-white px-4 py-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-black text-slate-950">{mobileSettings.cart.title}</h1>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{totalItemCount} ürün</p>
        </div>
        <ShoppingBag className="h-6 w-6 text-[#C98484]" />
      </div>
      <div className="my-2.5 flex gap-3 border-y border-rose-200/80 bg-rose-50/90 px-4 py-3.5">
        <Truck className="h-5 w-5 shrink-0 text-[#C98484]" />
        <div>
          <h2 className="text-xs font-black text-slate-900">Kargo: {shippingTotal === 0 ? "Ücretsiz" : convertToLocale({ amount: shippingTotal, currency_code: currencyCode })}</h2>
          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-600">Sepet tutarınıza göre otomatik hesaplanır{shippingTotal > 0 ? " ve toplamınıza eklenir." : "; toplamınıza kargo ücreti eklenmez."}</p>
        </div>
      </div>
      <div className="bg-white border-y border-slate-200/80 divide-y divide-slate-100">
        {items.map((item: any) => {
          const isUpdating = pending || updatingId === item.id;
          return (
            <article key={item.id} className="p-4 bg-white space-y-3">
              <div className="flex gap-3">
                <LocalizedClientLink href={`/urunler/${item.handle || item.product_handle}`} className="grid h-20 w-20 place-items-center rounded-xl bg-slate-50 border border-slate-100 p-1.5 shrink-0">
                  {item.thumbnail ? <img src={item.thumbnail} alt={item.title || item.product_title} className="h-full w-full object-contain" /> : <ShoppingBag className="h-8 w-8 text-slate-300" />}
                </LocalizedClientLink>
                <div className="min-w-0 flex-1">
                  <LocalizedClientLink href={`/urunler/${item.handle || item.product_handle}`} className="line-clamp-2 text-xs font-bold text-slate-900 leading-snug hover:text-[#C98484] transition-colors">
                    {item.title || item.product_title}
                  </LocalizedClientLink>
                  <p className="mt-1 text-[10px] font-semibold text-slate-400">Seçenek: {item.variant?.title || item.variant || "Standart"}</p>
                  <p className="mt-0.5 text-[10px] font-bold text-emerald-600">Stokta var · Güvenli teslimat</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                {/* Large, Touch-Friendly Stepper */}
                <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (item.quantity > 1) {
                        handleUpdateQuantity(item.id, item.quantity - 1)
                      }
                    }}
                    disabled={isUpdating || item.quantity <= 1}
                    aria-label="Adet azalt"
                    className="grid h-9 w-9 place-items-center rounded-lg bg-white text-slate-700 font-extrabold shadow-2xs disabled:opacity-30 active:scale-95 transition-all cursor-pointer"
                  >
                    <Minus className="h-4 w-4 stroke-[2.5]" />
                  </button>

                  <span className="w-9 text-center text-xs font-black text-slate-900 flex items-center justify-center">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUpdateQuantity(item.id, item.quantity + 1)
                    }}
                    disabled={isUpdating}
                    aria-label="Adet artır"
                    className="grid h-9 w-9 place-items-center rounded-lg bg-[#C98484] text-white font-extrabold shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-400 block">Toplam</span>
                    <span className="text-sm font-black text-[#C98484]">
                      {convertToLocale({ amount: item.total || item.unit_price * item.quantity, currency_code: currencyCode })}
                    </span>
                  </div>

                  {/* Large Trash Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteItem(item.id)
                    }}
                    disabled={isUpdating}
                    aria-label="Ürünü sepetten çıkar"
                    className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin text-rose-500" /> : <Trash className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <div className="fixed inset-x-3 bottom-[78px] z-50 flex items-center justify-between rounded-2xl bg-slate-950 p-3.5 text-white shadow-xl">
        <div>
          <small className="text-[9.5px] text-slate-300 block">Genel Toplam</small>
          <div className="text-base font-black text-[#C98484]">{convertToLocale({ amount: grandTotal, currency_code: currencyCode })}</div>
        </div>
        <LocalizedClientLink href="/checkout?step=address" className="rounded-xl bg-[#C98484] px-5 py-3 text-xs font-extrabold text-white shadow-md shadow-rose-500/30 active:scale-95 transition-all">
          {mobileSettings.cart.checkoutLabel} →
        </LocalizedClientLink>
      </div>
    </main>}
    <main className={`${mobileSettings?.enabled ? "hidden md:block" : "block"} min-h-[65vh] bg-[#F8F9FA] py-8 sm:py-12 text-slate-900 font-sans`}>
      <div className="content-container mx-auto" data-testid="cart-container">
        {/* Page Header matching screenshot */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Sepetim</h1>
            <span className="text-sm font-bold text-slate-500">({totalItemCount} ürün)</span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Seçtiğiniz ürünleri aşağıda görebilir, adet ve seçenekleri düzenleyebilirsiniz.
          </p>
        </div>

        {/* 2-Column Grid Layout matching screenshot */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Left Column: Cart Items Card */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-soft space-y-6">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-[1fr_140px_100px_100px] items-center pb-4 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <div>ÜRÜN</div>
              <div className="text-center">ADET</div>
              <div className="text-right">FİYAT</div>
              <div className="text-right">TOPLAM</div>
            </div>

            {/* Cart Line Items */}
            <div className="divide-y divide-slate-100">
              {items.map((item: any) => {
                const isUpdating = pending || updatingId === item.id
                const unitPriceFormatted = convertToLocale({
                  amount: item.unit_price,
                  currency_code: currencyCode,
                })
                const totalPriceFormatted = convertToLocale({
                  amount: item.total || item.unit_price * item.quantity,
                  currency_code: currencyCode,
                })

                return (
                  <div
                    key={item.id}
                    className="py-5 first:pt-0 last:pb-0 flex flex-col sm:grid sm:grid-cols-[1fr_140px_100px_100px] items-center gap-4"
                    data-testid="product-row"
                  >
                    {/* Item Details Column */}
                    <div className="flex items-center gap-4 w-full">
                      <LocalizedClientLink
                        href={`/urunler/${item.handle || item.product_handle}`}
                        className="w-20 h-20 bg-slate-50/70 border border-slate-100 rounded-2xl shrink-0 flex items-center justify-center p-2 overflow-hidden group"
                      >
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title || item.product_title}
                            className="h-full w-full object-contain group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Thumbnail thumbnail={item.thumbnail} images={[]} size="square" />
                        )}
                      </LocalizedClientLink>

                      <div className="min-w-0 flex-1">
                        <LocalizedClientLink
                          href={`/urunler/${item.handle || item.product_handle}`}
                          className="text-sm font-bold text-slate-900 hover:text-[#C98484] transition-colors line-clamp-2"
                        >
                          {item.title || item.product_title}
                        </LocalizedClientLink>

                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                          Seçenek: {item.variant?.title || item.variant || "Standart"}
                        </p>

                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 mt-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Stokta var</span>
                        </div>
                      </div>
                    </div>

                    {/* Quantity Stepper & Trash Button Column */}
                    <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
                      {/* Trash Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isUpdating}
                        aria-label="Ürünü sepetten çıkar"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-500" /> : <Trash className="h-4 w-4" />}
                      </button>

                      {/* Stepper */}
                      <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={isUpdating || item.quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 font-bold hover:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>

                        <span className="w-8 text-center text-xs font-extrabold text-slate-900 flex items-center justify-center">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={isUpdating}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                    {/* Unit Price Column */}
                    <div className="text-right text-xs font-semibold text-slate-400 hidden sm:block">
                      {unitPriceFormatted}
                    </div>

                    {/* Total Price Column */}
                    <div className="text-right text-sm font-extrabold text-slate-900 w-full sm:w-auto">
                      {totalPriceFormatted}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Sipariş Özeti Sticky Sidebar matching screenshot */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-soft sticky top-24 space-y-6">
            <h2 className="text-lg font-extrabold text-slate-900">Sipariş Özeti</h2>

            {/* Discount Code Input / Accordion */}
            <div>
              {cart ? (
                <DiscountCode cart={cart} />
              ) : (
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="İndirim kodu ekle"
                    className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-3.5 text-xs font-medium text-slate-800 outline-none focus:border-[#C98484] transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Totals Breakdown */}
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span>Ara toplam</span>
                <span className="font-bold text-slate-900">
                  {convertToLocale({ amount: subtotal, currency_code: currencyCode })}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 font-medium">
                <div className="flex items-center gap-1">
                  <span>Kargo</span>
                  <Info className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <span className="font-bold text-slate-900">
                  {shippingTotal === 0
                    ? (cart?.shipping_methods?.length ? "Ücretsiz" : "Teslimat seçiminizde hesaplanır")
                    : convertToLocale({ amount: shippingTotal, currency_code: currencyCode })}
                </span>
              </div>



              <div className="border-t border-slate-100 pt-4 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-bold text-slate-900 block">Toplam</span>
                  <span className="text-[11px] font-medium text-slate-400">KDV dahil</span>
                </div>
                <span className="text-xl font-extrabold text-slate-900">
                  {convertToLocale({ amount: grandTotal, currency_code: currencyCode })}
                </span>
              </div>
            </div>

            {/* Actions Stack */}
            <div className="space-y-3 pt-2">
              <LocalizedClientLink
                href="/checkout?step=address"
                className="w-full h-12 rounded-2xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                data-testid="checkout-button"
              >
                <Lock className="h-4 w-4" />
                <span>Ödemeye Geç</span>
              </LocalizedClientLink>

              <LocalizedClientLink
                href="/magaza"
                className="w-full h-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Alışverişe Devam Et</span>
              </LocalizedClientLink>
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50/80 border border-emerald-100 p-3.5 rounded-2xl mt-4">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
              <span>Ödeme bilgileri yetkili ödeme kuruluşu tarafından işlenir.</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </>)
}
