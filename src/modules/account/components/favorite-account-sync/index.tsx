"use client"

import { useEffect } from "react"

import { mergeFavoritesWithAccount } from "@modules/products/components/product-card-actions"

export default function FavoriteAccountSync({
  enabled,
}: {
  enabled: boolean
}) {
  useEffect(() => {
    if (!enabled) return
    void mergeFavoritesWithAccount()
  }, [enabled])

  return null
}
