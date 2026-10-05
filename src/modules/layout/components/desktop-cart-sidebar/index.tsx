"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { usePathname } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { deleteLineItem } from "@lib/data/cart"
import { updateLineItem } from "@lib/util/cart-feedback"
import { ShoppingCart, Trash2, ChevronRight, ChevronLeft, Loader2 } from "@lib/icons"
import { convertToLocale } from "@lib/util/money"

function formatMoney(amount: number = 0) {
  return convertToLocale({ amount, currency_code: "TRY" })
}

export default function DesktopCartSidebar({
  cart,
}: {
  cart?: HttpTypes.StoreCart | null
}) {
  const pathname = usePathname()
  // Sepet ayırıcı her sayfa yüklemesinde kapalı başlar; yalnızca kullanıcı açar.
  const [collapsed, setCollapsed] = useState(true)
  const [updatingLineId, setUpdatingLineId] = useState<string | null>(null)
  const [items, setItems] = useState(() => cart?.items || [])
  const [, startTransition] = useTransition()

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)
  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.unit_price * item.quantity, 0),
    [items],
  )

  useEffect(() => {
    setItems(cart?.items || [])
  }, [cart?.updated_at, cart?.items])

  // Hide on checkout / cart pages or mobile
  if (pathname?.includes("/checkout") || pathname?.includes("/sepet")) {
    return null
  }

  if (totalItems === 0) {
    return null
  }

  const handleUpdateQuantity = (lineId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta
    const previousItems = items
    setItems((current) => newQty <= 0
      ? current.filter((item) => item.id !== lineId)
      : current.map((item) => item.id === lineId ? { ...item, quantity: newQty } : item))
    setUpdatingLineId(lineId)
    startTransition(async () => {
      try {
        if (newQty <= 0) {
          await deleteLineItem(lineId)
        } else {
          const result = await updateLineItem({ lineId, quantity: newQty })
          if (!result.success) { setItems(previousItems); return }
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cart_updated"))
        }
      } catch (err) {
        setItems(previousItems)
        console.error(err)
      } finally {
        setUpdatingLineId(null)
      }
    })
  }

  const handleDeleteItem = (lineId: string) => {
    const previousItems = items
    setItems((current) => current.filter((item) => item.id !== lineId))
    setUpdatingLineId(lineId)
    startTransition(async () => {
      try {
        await deleteLineItem(lineId)
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cart_updated"))
        }
      } catch (err) {
        setItems(previousItems)
        console.error(err)
      } finally {
        setUpdatingLineId(null)
      }
    })
  }

  // Collapsed Badge State (Floating on Right Edge)
  if (collapsed) {
    return (
      <div className="hidden xl:block fixed right-0 top-1/3 z-[95] font-sans">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 rounded-l-2xl bg-[#C98484] text-white px-3 py-3 shadow-xl hover:bg-rose-600 transition-all cursor-pointer border-y border-l border-rose-400"
          title="Sepet Panelini Aç"
        >
          <ChevronLeft className="w-4 h-4 animate-pulse" />
          <div className="flex flex-col items-center">
            <ShoppingCart className="w-4 h-4" />
            <span className="text-[10px] font-black mt-0.5">{totalItems} Ürün</span>
          </div>
        </button>
      </div>
    )
  }

  return (
    <aside className="hidden xl:flex fixed right-0 top-0 bottom-0 w-[240px] bg-white border-l border-slate-200/90 shadow-2xl z-[95] flex-col justify-between font-sans animate-in slide-in-from-right duration-200">
      {/* ── TOP HEADER SECTION (Trendyol Style Buttons & Subtotal) ── */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2.5 shrink-0">
        {/* Collapse / Close Control Row */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5 text-[#C98484]" />
            <span>Sepet Ayrıcı ({totalItems})</span>
          </span>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="w-6 h-6 rounded-full bg-slate-200/60 hover:bg-slate-300 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            title="Paneli Gizle"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action Button 1: Ödemeye Geç (Primary Orange) */}
        <LocalizedClientLink
          href="/checkout?step=address"
          className="flex flex-col items-center justify-center rounded-xl bg-[#C98484] hover:bg-rose-600 text-white py-2 px-2 shadow-xs transition-all active:scale-98 cursor-pointer"
        >
          <span className="text-xs font-black leading-none">Ödemeye Geç ({totalItems})</span>
          <span className="text-[9px] font-medium opacity-90 mt-0.5 leading-none">
            {totalItems} ürün sepetinizde
          </span>
        </LocalizedClientLink>

        {/* Action Button 2: Sepete Git (Secondary White) */}
        <LocalizedClientLink
          href="/sepet"
          className="flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 py-1.5 px-2 text-xs font-extrabold shadow-2xs transition-all cursor-pointer"
        >
          Sepete Git
        </LocalizedClientLink>

        {/* Subtotal Row */}
        <div className="text-center pt-0.5">
          <span className="text-[10px] font-bold text-slate-400 block">Ara Toplam</span>
          <span className="text-sm font-black text-[#C98484] block leading-tight">
            {formatMoney(subtotal)}
          </span>
        </div>
      </div>

      {/* ── MIDDLE SCROLLABLE ITEM LIST (1x1 Single Column List) ── */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 no-scrollbar">
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const isUpdating = updatingLineId === item.id
            const itemPrice = item.unit_price * item.quantity

            return (
              <div
                key={item.id}
                className={`relative group rounded-xl border border-slate-200/80 bg-white p-2 flex items-center gap-2.5 shadow-2xs hover:border-rose-200 transition-all ${
                  isUpdating ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Thumbnail Image */}
                <LocalizedClientLink
                  href={`/urunler/${item.product_handle}`}
                  className="block h-16 w-16 shrink-0 relative overflow-hidden rounded-lg bg-slate-50 border border-slate-100"
                >
                  <img
                    src={item.thumbnail || "/images/placeholder.svg"}
                    alt={item.title}
                    className="w-full h-full object-contain p-0.5"
                  />
                </LocalizedClientLink>

                {/* Info & Controls */}
                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                  <div className="pr-5">
                    <LocalizedClientLink
                      href={`/urunler/${item.product_handle}`}
                      className="block text-[11px] font-medium text-slate-700 line-clamp-2 leading-tight hover:text-[#C98484]"
                    >
                      {item.title}
                    </LocalizedClientLink>
                  </div>

                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs font-black text-[#C98484]">
                      {formatMoney(itemPrice)}
                    </span>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                        className="w-4 h-4 rounded bg-white text-slate-700 font-bold text-[10px] flex items-center justify-center cursor-pointer shadow-2xs"
                        disabled={isUpdating}
                      >
                        -
                      </button>
                      <span className="text-[11px] font-black text-slate-900 px-1">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                        className="w-4 h-4 rounded bg-white text-slate-700 font-bold text-[10px] flex items-center justify-center cursor-pointer shadow-2xs"
                        disabled={isUpdating}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Top Right Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                  title="Kaldır"
                >
                  {isUpdating ? (
                    <Loader2 className="w-3 h-3 animate-spin text-red-500" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── BOTTOM FOOTER BAR ── */}
      <div className="p-2 border-t border-slate-100 bg-slate-50 text-center shrink-0">
        <LocalizedClientLink
          href="/sepet"
          className="text-[10px] font-extrabold text-slate-500 hover:text-[#C98484] transition-colors"
        >
          Tüm Sepet Detaylarını Gör →
        </LocalizedClientLink>
      </div>
    </aside>
  )
}
