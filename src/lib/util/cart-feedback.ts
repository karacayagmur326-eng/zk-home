"use client"

import { addToCart as addAction, updateLineItem as updateAction } from "@lib/data/cart"

export const CART_WARNING_EVENT = "zk_cart_warning"

export function showCartWarning(message: string) {
  window.dispatchEvent(new CustomEvent(CART_WARNING_EVENT, { detail: { message } }))
}

export async function addToCart(input: Parameters<typeof addAction>[0]) {
  try {
    const result = await addAction(input)
    if (typeof result === "number") return result
    showCartWarning(result.error)
  } catch {
    showCartWarning("Ürün sepete eklenemedi. Sepetiniz korundu; lütfen tekrar deneyin.")
  }
  return null
}

export async function updateLineItem(input: Parameters<typeof updateAction>[0]) {
  try {
    const result = await updateAction(input)
    if (!result.success) showCartWarning(result.error)
    return result
  } catch {
    const error = "Ürün adedi güncellenemedi. Sepetiniz korundu; lütfen tekrar deneyin."
    showCartWarning(error)
    return { success: false as const, error }
  }
}
