"use client"

import { Fragment, useRef, useState, useTransition } from "react"
import { Transition } from "@headlessui/react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import {
  ShoppingCart,
  X,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  Loader2,
} from "@lib/icons"

function formatMoney(amount: number = 0) {
  return convertToLocale({ amount, currency_code: "TRY" })
}

const CartDropdown = ({
  cart: cartState,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)
  const [updatingLineId, setUpdatingLineId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems =
    cartState?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cartState?.subtotal ?? 0
  const handleUpdateQuantity = (lineId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta
    setUpdatingLineId(lineId)
    startTransition(async () => {
      try {
        if (newQty <= 0) {
          await deleteLineItem(lineId)
        } else {
          await updateLineItem({ lineId, quantity: newQty })
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cart_updated"))
        }
      } catch (err) {
        console.error("Cart update error:", err)
      } finally {
        setUpdatingLineId(null)
      }
    })
  }

  const handleDeleteItem = (lineId: string) => {
    setUpdatingLineId(lineId)
    startTransition(async () => {
      try {
        await deleteLineItem(lineId)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cart_updated"))
        }
      } catch (err) {
        console.error("Cart delete error:", err)
      } finally {
        setUpdatingLineId(null)
      }
    })
  }

  return (
    <div
      ref={dropdownRef}
      className="relative z-50"
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          close()
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          close()
        }
      }}
    >
      {/* Header Cart Icon Badge */}
      <LocalizedClientLink
        aria-label={`Sepetim, ${totalItems} ürün`}
        aria-haspopup="dialog"
        aria-expanded={cartDropdownOpen}
        aria-controls="nav-cart-dropdown"
        className="relative flex h-10 w-10 items-center justify-center rounded-circle border border-border bg-input text-muted transition-all hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        href="/sepet"
        data-testid="nav-cart-link"
      >
        <ShoppingCart aria-hidden="true" className="h-5 w-5 text-primary" />
        <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-circle bg-[#C98484] px-1 text-[10px] font-extrabold text-white shadow-sm">
          {totalItems}
        </span>
      </LocalizedClientLink>

      <Transition
        show={cartDropdownOpen}
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-2 scale-95"
        enterTo="opacity-100 translate-y-0 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0 scale-100"
        leaveTo="opacity-0 translate-y-2 scale-95"
      >
        <div
          id="nav-cart-dropdown"
          role="dialog"
          aria-label="Sepet özeti"
          className="absolute right-0 top-[calc(100%+14px)] hidden w-[420px] max-w-[calc(100vw-24px)] rounded-3xl border border-slate-100 bg-white p-5 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.16)] lg:block z-[100]"
          data-testid="nav-cart-dropdown"
        >
          {/* Top Notch Pointer Arrow pointing to cart icon */}
          <div className="absolute right-[14px] -top-2 h-4 w-4 rotate-45 border-l border-t border-slate-100 bg-white" />

          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50/90 text-[#C98484]">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  Sepetim
                </h3>
                <span className="text-xs font-medium text-slate-500 mt-0.5 block">
                  {totalItems} ürün sepetinizde
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100/80 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              title="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {cartState && cartState.items?.length ? (
            <>
              {/* Product Item Cards List */}
              <div className="mt-4 max-h-[70vh] sm:max-h-[600px] overflow-y-auto pr-1 space-y-3">
                {cartState.items
                  .sort((a, b) => {
                    return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                  })
                  .map((item) => {
                    const isUpdating = updatingLineId === item.id
                    const variantTitle = item.variant?.title || "Standart"

                    return (
                      <div
                        key={item.id}
                        className={`group relative flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-white p-3.5 transition-all hover:border-slate-200 hover:shadow-2xs ${
                          isUpdating ? "opacity-60 pointer-events-none" : ""
                        }`}
                        data-testid="cart-item"
                      >
                        {/* Product Image Thumbnail */}
                        <LocalizedClientLink
                          href={`/urunler/${item.product_handle}`}
                          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50 p-1"
                        >
                          <img
                            src={item.thumbnail || "/images/placeholder.svg"}
                            alt={item.title}
                            className="h-full w-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                          />
                        </LocalizedClientLink>

                        {/* Product Info & Quantity Stepper */}
                        <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
                          <div>
                            <LocalizedClientLink
                              href={`/urunler/${item.product_handle}`}
                              className="block text-[11.5px] sm:text-xs font-semibold text-slate-800 line-clamp-2 leading-tight pr-6 hover:text-primary transition-colors"
                            >
                              {item.title}
                            </LocalizedClientLink>

                            {/* Option Pill */}
                            <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                              Seçenek: {variantTitle}
                            </span>

                            {/* Stock Indicator */}
                            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Stokta Var</span>
                            </div>
                          </div>

                          {/* Stepper Pill Controller */}
                          <div className="mt-2.5 flex items-center justify-between">
                            <div className="flex items-center rounded-full bg-slate-100/90 p-0.5 border border-slate-200/60 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-700 hover:bg-slate-200 font-bold transition-all shadow-2xs disabled:opacity-50"
                                disabled={isUpdating}
                                title="Azalt"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="px-3 text-xs font-bold text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-700 hover:bg-slate-200 font-bold transition-all shadow-2xs disabled:opacity-50"
                                disabled={isUpdating}
                                title="Artır"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Item Total Price */}
                            <div className="text-right pl-2">
                              <span className="block text-sm sm:text-base font-extrabold text-[#C98484]">
                                {formatMoney(item.unit_price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Top Right Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100/70 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Ürünü sepetten kaldır"
                          disabled={isUpdating}
                        >
                          {isUpdating && updatingLineId === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    )
                  })}
              </div>

              {/* Subtotal Card (Ara Toplam) */}
              <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100/80 text-[#C98484]">
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="block text-xs sm:text-sm font-bold text-slate-900">
                      Ara Toplam
                    </span>
                    <span className="block text-[10px] font-medium text-slate-500">
                      Kargo ve vergiler ödeme adımında hesaplanır.
                    </span>
                  </div>
                </div>

                <span className="text-base sm:text-lg font-extrabold text-slate-900 whitespace-nowrap pl-2">
                  {formatMoney(subtotal)}
                </span>
              </div>

              {/* Footer Action Buttons */}
              <div className="mt-4 flex gap-3">
                <LocalizedClientLink
                  href="/sepet"
                  onClick={close}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 px-3 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Sepeti Görüntüle</span>
                </LocalizedClientLink>

                <LocalizedClientLink
                  href="/checkout?step=address"
                  onClick={close}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#C98484] to-rose-600 py-3 px-3 text-xs font-bold text-white shadow-md shadow-rose-500/20 hover:from-rose-600 hover:to-rose-700 transition-all"
                >
                  <span>Ödemeye Geç</span>
                  <ArrowRight className="h-4 w-4" />
                </LocalizedClientLink>
              </div>
            </>
          ) : (
            /* Empty Cart State */
            <div className="py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-[#C98484] mb-3">
                <ShoppingCart className="h-8 w-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Sepetiniz şu an boş.
              </h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Mağazamızdaki fırsat ürünlerini keşfetmeye hemen başlayın!
              </p>
              <LocalizedClientLink
                href="/magaza"
                onClick={close}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C98484] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-600 transition-all"
              >
                <span>Ürünleri Keşfet</span>
                <ArrowRight className="h-4 w-4" />
              </LocalizedClientLink>
            </div>
          )}
        </div>
      </Transition>
    </div>
  )
}

export default CartDropdown
