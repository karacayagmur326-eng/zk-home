"use client"

import { useEffect, useState } from "react"
import { Heart } from "@lib/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { FAVORITES_CHANGED_EVENT, FAVORITES_STORAGE_KEY, readFavorites } from "@modules/products/components/product-card-actions"

export default function FavoriteCounter() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const update = () => {
      const items = readFavorites()
      setCount(Array.isArray(items) ? new Set(items.map(item => item.id)).size : 0)
    }
    const storage = (event: StorageEvent) => { if (!event.key || event.key === FAVORITES_STORAGE_KEY) update() }
    update()
    window.addEventListener(FAVORITES_CHANGED_EVENT, update)
    window.addEventListener("storage", storage)
    return () => { window.removeEventListener(FAVORITES_CHANGED_EVENT, update); window.removeEventListener("storage", storage) }
  }, [])
  return <LocalizedClientLink href="/favorilerim" title={`${count} favori ürününüz var`} aria-label={`Favorilerim, ${count} ürün`}
    className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-[#F8EEEE] hover:text-[#A95E5E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484]">
    <Heart aria-hidden="true" className="h-[19px] w-[19px]" />
    {count > 0 && <span aria-hidden="true" className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C98484] px-1 text-[9px] font-bold text-white">{count > 99 ? "99+" : count}</span>}
  </LocalizedClientLink>
}
