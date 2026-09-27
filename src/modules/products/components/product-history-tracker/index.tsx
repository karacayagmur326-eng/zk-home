"use client"

import { useEffect } from "react"

export const PRODUCT_HISTORY_KEY = "zkhome_recent_products_v1"

export type HistoryProduct = { id: string; title: string; handle: string; thumbnail?: string | null; price?: string | null }

export default function ProductHistoryTracker({ product }: { product: HistoryProduct }) {
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(PRODUCT_HISTORY_KEY) || "[]")
      const list = Array.isArray(stored) ? stored.filter((item) => item?.id !== product.id) : []
      localStorage.setItem(PRODUCT_HISTORY_KEY, JSON.stringify([{ ...product, viewedAt: Date.now() }, ...list].slice(0, 30)))
    } catch {}
  }, [product])
  return null
}
