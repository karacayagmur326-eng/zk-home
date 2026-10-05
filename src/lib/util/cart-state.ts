"use client"

import { useEffect, useSyncExternalStore } from "react"
import type { HttpTypes } from "@medusajs/types"

type Cart = HttpTypes.StoreCart | null
type Change = (cart: Cart) => Cart
let confirmed: Cart | undefined
let snapshot: { cart: Cart; pending: boolean } | undefined
let queue: Promise<unknown> = Promise.resolve()
let nextId = 0
const pending = new Map<number, Change>()
const listeners = new Set<() => void>()

function publish() {
  snapshot = { cart: [...pending.values()].reduce((cart, change) => change(cart), confirmed ?? null), pending: pending.size > 0 }
  listeners.forEach((listener) => listener())
  window.dispatchEvent(new CustomEvent("cart_updated", {
    detail: { count: snapshot.cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0 },
  }))
}

export function useCartState(initial?: Cart) {
  const state = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    () => snapshot,
    () => undefined,
  )
  useEffect(() => {
    if (confirmed === undefined || (!pending.size && initial &&
      (!confirmed || new Date(initial.updated_at ?? 0).getTime() > new Date(confirmed.updated_at ?? 0).getTime()))) {
      confirmed = initial ?? null; publish()
    }
  }, [initial])
  return state ?? { cart: initial ?? null, pending: false }
}

export type CartPreview = {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
  unitPrice: number
}

function withItems(cart: Cart, items: HttpTypes.StoreCartLineItem[]): Cart {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const total = Math.max(0, (cart?.total ?? 0) + subtotal - (cart?.subtotal ?? 0))
  return { ...cart, items, subtotal, item_total: subtotal, total } as HttpTypes.StoreCart
}

export function previewAddition(variantId: string, quantity: number, product?: CartPreview): Change {
  return (cart) => {
    if (!product) return cart
    const items = cart?.items ?? []
    const existing = items.find((item) => item.variant_id === variantId)
    if (existing) return withItems(cart, items.map((item) => item === existing
      ? { ...item, quantity: item.quantity + quantity } : item))
    return withItems(cart, [...items, {
      id: `pending_${variantId}`, variant_id: variantId, product_id: product.id,
      title: product.title, quantity, unit_price: product.unitPrice,
      thumbnail: product.thumbnail, product_handle: product.handle, product: { ...product },
    } as unknown as HttpTypes.StoreCartLineItem])
  }
}

export function previewQuantity(lineId: string, quantity: number): Change {
  return (cart) => withItems(cart, (cart?.items ?? []).flatMap((item) =>
    item.id !== lineId ? [item] : quantity > 0 ? [{ ...item, quantity }] : []))
}

// Serialize writes to preserve the cart cookie and mutation order, while every
// pending change is rendered immediately. A rejected write only removes its own preview.
export function mutateCart<T extends { success: boolean; cart?: Cart }>(
  action: () => Promise<T>, change: Change, added = false,
): Promise<T> {
  const id = ++nextId
  pending.set(id, change)
  publish()
  if (added) window.dispatchEvent(new CustomEvent("cart_item_added"))
  const task = queue.then(async () => {
    try {
      const result = await action()
      if (result.success && result.cart !== undefined) confirmed = result.cart
      return result
    } finally { pending.delete(id); publish() }
  })
  queue = task.catch(() => {})
  return task
}
