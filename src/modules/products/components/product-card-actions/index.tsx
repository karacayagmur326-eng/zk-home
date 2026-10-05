"use client"

import type { CartPreview } from "@lib/util/cart-state"
import { addToCart } from "@lib/util/cart-feedback"
import { Heart, ShoppingCart, Check, Loader2 } from "@lib/icons"
import { useToast } from "@modules/common/components/feedback"
import clsx from "clsx"
import { useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"

export const FAVORITES_STORAGE_KEY = "zkhome:favorites"
export const FAVORITES_CHANGED_EVENT = "zkhome:favorites-changed"

export type FavoriteProduct = {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
  preview?: CartPreview
  variantId?: string | null
  price?: string | null
}

export const readFavorites = (): FavoriteProduct[] => {
  try {
    const value = window.localStorage.getItem(FAVORITES_STORAGE_KEY)
    return value ? JSON.parse(value) : []
  } catch {
    return []
  }
}

export const writeFavorites = (favorites: FavoriteProduct[]) => {
  window.localStorage.setItem(
    FAVORITES_STORAGE_KEY,
    JSON.stringify(favorites)
  )
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT))
}

export async function mergeFavoritesWithAccount() {
  const response = await fetch("/api/account/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favorites: readFavorites() }),
  })
  if (!response.ok) return null

  const data = await response.json()
  if (data?.authenticated === false) return null
  const favorites = Array.isArray(data?.favorites) ? data.favorites : []
  writeFavorites(favorites)
  return favorites as FavoriteProduct[]
}

async function persistFavoriteChange(
  product: FavoriteProduct,
  shouldExist: boolean
) {
  const response = shouldExist
    ? await fetch("/api/account/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorites: [product] }),
      })
    : await fetch(
        `/api/account/favorites?productId=${encodeURIComponent(product.id)}`,
        { method: "DELETE" }
      )

  if (!response.ok) return
  const data = await response.json()
  if (data?.authenticated === false) return
  if (Array.isArray(data?.favorites)) writeFavorites(data.favorites)
}

export function FavoriteButton({
  product,
  className,
  variant = "icon",
}: {
  product: FavoriteProduct
  className?: string
  variant?: "icon" | "text"
}) {
  const [isFavorite, setIsFavorite] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsFavorite(readFavorites().some((item) => item.id === product.id))
  }, [product.id])

  const toggleFavorite = () => {
    const favorites = readFavorites()
    const exists = favorites.some((item) => item.id === product.id)
    const next = exists
      ? favorites.filter((item) => item.id !== product.id)
      : [...favorites, product]

    writeFavorites(next)
    setIsFavorite(!exists)
    void persistFavoriteChange(product, !exists)
    toast({
      title: exists ? "Favorilerden kaldırıldı" : "Favorilere eklendi",
      description: product.title,
      variant: "success",
      isFavoriteToast: true,
    })
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      aria-label={isFavorite ? "Favorilerden kaldır" : "Favorilere ekle"}
      aria-pressed={isFavorite}
      className={clsx(
        "inline-flex items-center justify-center bg-white/90 transition-colors hover:text-[#C98484] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484]",
        variant === "icon"
          ? "h-9 w-9 rounded-full shadow-sm"
          : "gap-2 rounded-md bg-transparent px-1 py-2 text-xs font-bold",
        isFavorite ? "text-[#C98484]" : "text-gray-500",
        className,
      )}
    >
      <Heart className={clsx("h-5 w-5", isFavorite && "fill-current")} />
      {variant === "text" && (
        <span>{isFavorite ? "Favorilerden Kaldır" : "Favorilere Ekle"}</span>
      )}
    </button>
  )
}

export function AddToCartButton({
  variantId,
  preview,
  className,
}: {
  variantId?: string | null
  preview?: CartPreview
  className?: string
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const addingRef = useRef(false)
  const params = useParams()
  const { toast } = useToast()
  const countryCode = (params?.countryCode as string) || "tr"

  const handleAdd = async () => {
    if (!variantId || addingRef.current || isAdding || isSuccess) return
    addingRef.current = true
    setIsAdding(true)
    try {
      const newCount = await addToCart({ variantId, quantity: 1, countryCode }, preview)
      if (newCount === null) { addingRef.current = false; return }
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        addingRef.current = false
      }, 1500)
    } catch {
      addingRef.current = false
      toast({
        title: "Ürün sepete eklenemedi",
        description: "Lütfen tekrar deneyin.",
        variant: "danger",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={!variantId || isAdding || isSuccess}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors disabled:cursor-not-allowed",
        isSuccess
          ? "bg-emerald-600 hover:bg-emerald-700"
          : "bg-[#C98484] hover:bg-[#A95E5E] disabled:bg-gray-300",
        className,
      )}
    >
      {isSuccess ? (
        <Check className="h-4 w-4 stroke-[3]" />
      ) : isAdding ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ShoppingCart className="h-4 w-4" />
      )}
      <span>{isAdding ? "Ekleniyor..." : isSuccess ? "Eklendi ✓" : variantId ? "Sepete Ekle" : "Stokta Yok"}</span>
    </button>
  )
}
