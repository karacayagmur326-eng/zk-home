"use client"

import { addToCart, showCartWarning } from "@lib/util/cart-feedback"
import { HttpTypes } from "@medusajs/types"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState, useRef } from "react"
import { ShoppingCart, Zap, ShieldCheck, Truck, Shield, Check, Loader2 } from "@lib/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPrice from "../product-price"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const sameOptions = (
  left: Record<string, string | undefined> | undefined,
  right: Record<string, string | undefined>
) => {
  const leftEntries = Object.entries(left || {}).sort(([a], [b]) =>
    a.localeCompare(b)
  )
  const rightEntries = Object.entries(right).sort(([a], [b]) =>
    a.localeCompare(b)
  )
  return (
    leftEntries.length === rightEntries.length &&
    leftEntries.every(
      ([key, value], index) =>
        rightEntries[index]?.[0] === key && rightEntries[index]?.[1] === value
    )
  )
}

export default function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const addingRef = useRef(false)
  const [quantity, setQuantity] = useState(1)
  const countryCode = (useParams()?.countryCode as string) || "tr"

  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return
    if (product.variants.length === 1) return product.variants[0]
    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return sameOptions(variantOptions, options)
    })
  }, [product.variants, options])

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  const increaseQuantity = () => {
    if (selectedVariant?.manage_inventory && !selectedVariant.allow_backorder && quantity >= Number(selectedVariant.inventory_quantity || 0)) {
      showCartWarning(`Bu üründen en fazla ${Number(selectedVariant.inventory_quantity || 0)} adet ekleyebilirsiniz.`)
      return
    }
    setQuantity(quantity + 1)
  }

  const isValidVariant = useMemo(() => {
    if (product.variants?.length === 1) return true
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return sameOptions(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null
    if (params.get("v_id") === value) return
    if (value) params.set("v_id", value)
    else params.delete("v_id")
    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  const handleAddToCart = async () => {
    if (!selectedVariant?.id || addingRef.current || isAdding || isSuccess) return null
    addingRef.current = true
    setIsAdding(true)
    try {
      const newCount = await addToCart({
        variantId: selectedVariant.id,
        quantity: quantity,
        countryCode,
      })
      if (newCount === null) { addingRef.current = false; return }
      setIsSuccess(true)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("cart_updated", { detail: { count: newCount } })
        )
      }
      router.refresh()
      setTimeout(() => {
        setIsSuccess(false)
        addingRef.current = false
      }, 1500)
    } catch {
      addingRef.current = false
    } finally {
      setIsAdding(false)
    }
  }

  const handleBuyNow = async () => {
    if (!selectedVariant?.id || addingRef.current || isAdding) return null
    addingRef.current = true
    setIsAdding(true)
    try {
      const newCount = await addToCart({
        variantId: selectedVariant.id,
        quantity: quantity,
        countryCode,
      })
      if (newCount === null) { addingRef.current = false; return }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("cart_updated", { detail: { count: newCount } })
        )
      }
      router.push(`/sepet`)
    } catch {
      addingRef.current = false
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      {/* ── DESKTOP & VARIANT OPTIONS CONTAINER ── */}
      <div className={`${(product.variants?.length ?? 0) <= 1 ? "hidden lg:flex" : "flex"} border-0 sm:border sm:border-slate-200/80 sm:rounded-2xl bg-transparent sm:bg-white p-0 sm:p-5 sm:shadow-xs lg:!border-0 lg:!rounded-none lg:!bg-transparent lg:!p-0 lg:!shadow-none flex-col gap-4 sm:gap-5 font-sans`}>
        {/* Variant Selection (shown if multiple options exist) */}
        {(product.variants?.length ?? 0) > 1 && (
          <div className="space-y-3 pb-2 border-b border-slate-100">
            {(product.options || []).map((option) => (
              <OptionSelect
                key={option.id}
                option={option}
                current={options[option.id]}
                updateOption={setOptionValue}
                title={option.title ?? ""}
                disabled={!!disabled || isAdding}
              />
            ))}
          </div>
        )}

        {/* ── INLINE BUY SECTION (HIDDEN ON MOBILE, ONLY VISIBLE ON DESKTOP - lg:flex) ── */}
        <div className="hidden lg:flex flex-col gap-4">
          {/* Main Price Card Display */}
          <div>
            <ProductPrice product={product} variant={selectedVariant} />
          </div>

          {/* Quantity Stepper Row */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-black text-slate-900">Adet</span>
            <div className="flex h-9 items-center rounded-xl border border-slate-200 bg-slate-50 px-2 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={isAdding || quantity <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 transition-colors disabled:opacity-30 font-bold text-sm cursor-pointer shadow-2xs"
              >
                -
              </button>
              <span className="px-3.5 text-xs font-black text-slate-900">{quantity}</span>
              <button
                type="button"
                onClick={increaseQuantity}
                disabled={isAdding}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 hover:bg-white hover:text-slate-900 transition-colors font-bold text-sm cursor-pointer shadow-2xs"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons (Sepete Ekle & Hemen Al) */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedVariant || isAdding || isSuccess || !!disabled}
              className={`flex w-full h-11 items-center justify-center gap-2 rounded-xl text-xs font-black text-white shadow-md active:scale-[0.99] transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer ${
                isSuccess
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-[#C98484] hover:bg-rose-600"
              }`}
            >
              {isSuccess ? (
                <Check className="h-4 w-4 stroke-[3]" />
              ) : isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
              <span>{isAdding ? "Ekleniyor..." : isSuccess ? "Eklendi ✓" : "Sepete Ekle"}</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!selectedVariant || isAdding || !!disabled}
              className="flex w-full h-11 items-center justify-center gap-2 rounded-xl border-2 border-slate-800 bg-white text-xs font-black text-slate-900 hover:bg-slate-50 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <Zap className="h-4 w-4 fill-slate-900 text-slate-900" />
              <span>Hemen Al</span>
            </button>
          </div>
        </div>

        {/* Trust Badges List (Matching Reference Mockup) */}
        <div className="hidden lg:block border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-start gap-3">
            <Truck className="h-4.5 w-4.5 text-slate-800 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-slate-900">1-3 İş Gününde Kargo</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">Hızlı ve güvenli teslimat</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="h-4.5 w-4.5 text-slate-800 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-slate-900">14 Gün İçinde Kolay İade</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">Memnun kalmazsanız iade edin</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="h-4.5 w-4.5 text-slate-800 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-black text-slate-900">Alışveriş Desteği</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">Sipariş ve iade sorularınız için bize ulaşın</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE PERMANENT STICKY BOTTOM BUY BAR (ALWAYS VISIBLE FROM SECOND 1 ON MOBILE) ── */}
      <div className="lg:hidden fixed inset-x-0 bottom-[68px] z-[85] bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgba(15,23,42,0.15)] px-3 py-2.5">
        {/* Top Row: Price + Quantity Stepper */}
        <div className="flex items-center justify-between mb-2">
          <ProductPrice product={product} variant={selectedVariant} compact />

          {/* Compact Quantity Stepper for Mobile Bar */}
          <div className="flex h-8 items-center rounded-lg border border-slate-200 bg-slate-50 px-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={isAdding || quantity <= 1}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-700 disabled:opacity-30 font-bold text-xs"
            >
              -
            </button>
            <span className="px-2 text-xs font-black text-slate-900">{quantity}</span>
            <button
              type="button"
              onClick={increaseQuantity}
              disabled={isAdding}
              className="flex h-6 w-6 items-center justify-center rounded text-slate-700 font-bold text-xs"
            >
              +
            </button>
          </div>
        </div>

        {/* Bottom Row: Buttons (Sepete Ekle & Hemen Al) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedVariant || isAdding || isSuccess || !!disabled}
            className={`flex h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-black text-white shadow-md active:scale-95 transition-all disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer ${
              isSuccess
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-[#C98484] hover:bg-rose-600"
            }`}
          >
            {isSuccess ? (
              <Check className="h-4 w-4 stroke-[3]" />
            ) : isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            <span>{isAdding ? "Ekleniyor..." : isSuccess ? "Eklendi ✓" : "Sepete Ekle"}</span>
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!selectedVariant || isAdding || !!disabled}
            className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#0f172a] text-xs font-black text-white hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Zap className="h-4 w-4 fill-white text-white" />
            <span>Hemen Al</span>
          </button>
        </div>
      </div>
    </>
  )
}
