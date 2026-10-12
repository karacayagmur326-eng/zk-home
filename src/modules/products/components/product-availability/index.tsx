"use client"

import { HttpTypes } from "@medusajs/types"
import { Check, X } from "@lib/icons"
import { useProductPageState } from "../product-page-state"

export default function ProductAvailability({ product }: { product: HttpTypes.StoreProduct }) {
  const selected = useProductPageState()?.variantId
  const variant = product.variants?.find(item => item.id === selected) || product.variants?.[0]
  const md = (product.metadata || {}) as Record<string, unknown>
  const sku = String(variant?.sku || md.sku || "").trim()
  const inStock = !variant?.manage_inventory || variant.allow_backorder || (variant.inventory_quantity ?? 999) > 0

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
      <span className={`inline-flex items-center gap-1.5 font-semibold ${inStock ? "text-emerald-700" : "text-red-600"}`}>
        {inStock ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        {inStock ? "Stokta Mevcut" : "Stokta Yok"}
      </span>
      {sku && <span className="min-w-0 text-slate-500">Stok Kodu <strong className="ml-1.5 break-all font-semibold text-slate-700">{sku}</strong></span>}
    </div>
  )
}
