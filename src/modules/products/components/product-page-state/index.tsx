"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"

const ProductPageState = createContext<{
  variantId: string | null
  setVariantId: (id: string | null) => void
} | null>(null)

export const useProductPageState = () => useContext(ProductPageState)

export default function ProductPageStateProvider({ children }: { children: ReactNode }) {
  const params = useSearchParams()
  const [variantId, setVariantId] = useState<string | null>(params.get("v_id"))
  useEffect(() => {
    // Let legacy links restore their selection before removing UI-only URL state.
    const timer = window.setTimeout(() => {
      const url = new URL(window.location.href)
      for (const key of ["v_id", "image", "product_tab", "reviews_tab"]) url.searchParams.delete(key)
      if (["#aciklama", "#ozellikler", "#teknik", "#taksit", "#yorumlar", "#degerlendir", "#sorular"].includes(url.hash)) url.hash = ""
      window.history.replaceState(window.history.state, "", url)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])
  return <ProductPageState.Provider value={{ variantId, setVariantId }}>{children}</ProductPageState.Provider>
}
