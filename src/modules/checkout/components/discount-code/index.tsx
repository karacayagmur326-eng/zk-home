"use client"

import React, { useState } from "react"
import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Tag, Trash, CheckCircle2, Loader2, ArrowRight } from "@lib/icons"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const [codeInputValue, setCodeInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { promotions = [] } = cart

  const removePromotionCode = async (code: string) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      await applyPromotions([])
    } catch (e: any) {
      setErrorMessage(e.message || "İndirim kodu kaldırılırken hata oluştu.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeInputValue.trim()) return

    setIsLoading(true)
    setErrorMessage(null)

    try {
      await applyPromotions([codeInputValue.trim()])
      setCodeInputValue("")
    } catch (e: any) {
      setErrorMessage(e.message || "İndirim kodu uygulanamadı.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-3 font-sans">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
        <Tag className="h-3.5 w-3.5 text-[#C98484]" />
        <span>İndirim kodu ekle</span>
      </div>

      {/* Modern Input & Apply Button Group (Matching User Screenshot) */}
      <form onSubmit={handleApply} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={codeInputValue}
            onChange={(e) => setCodeInputValue(e.target.value.toUpperCase())}
            placeholder="İndirim kupon kodunuz"
            disabled={isLoading}
            className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/60 pl-3.5 pr-3 text-xs font-bold uppercase tracking-wide text-slate-900 outline-none focus:border-[#C98484] focus:bg-white focus:ring-2 focus:ring-[#C98484]/15 transition-all disabled:opacity-50 placeholder:normal-case placeholder:font-medium placeholder:tracking-normal placeholder:text-slate-400"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !codeInputValue.trim()}
          className="h-10 px-4 rounded-xl bg-[#C98484] hover:bg-rose-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <>
              <span>Ekle</span>
            </>
          )}
        </button>
      </form>

      {/* Error Message */}
      {errorMessage && (
        <p className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
          <span>• {errorMessage}</span>
        </p>
      )}

      {/* Applied Promotions Pills */}
      {promotions.length > 0 && (
        <div className="pt-1 space-y-2">
          {promotions.map((promotion) => {
            const isPercentage = promotion.application_method?.type === "percentage"
            const value = promotion.application_method?.value

            return (
              <div
                key={promotion.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-bold shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[11px]">
                      {promotion.code}
                    </span>
                    <span className="text-emerald-700 text-[11px] font-semibold">
                      ({isPercentage
                        ? `%${value} İndirim`
                        : `${convertToLocale({
                            amount: Number(value) || 0,
                            currency_code: cart.currency_code || "TRY",
                          })} İndirim`})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => promotion.code && removePromotionCode(promotion.code)}
                  disabled={isLoading}
                  title="Kuponu Kaldır"
                  className="p-1 rounded-lg text-emerald-700 hover:text-red-600 hover:bg-emerald-100/80 transition-colors cursor-pointer"
                >
                  <Trash className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DiscountCode
