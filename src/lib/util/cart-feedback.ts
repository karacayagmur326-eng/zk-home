"use client"

import { addToCart as addAction, deleteLineItem as deleteAction, updateLineItem as updateAction } from "@lib/data/cart"

import { mutateCart, previewAddition, previewQuantity, type CartPreview } from "./cart-state"

export const CART_WARNING_EVENT = "zk_cart_warning"

export function showCartWarning(message: string) {
  window.dispatchEvent(new CustomEvent(CART_WARNING_EVENT, { detail: { message } }))
}

export async function addToCart(input: Parameters<typeof addAction>[0], preview?: CartPreview) {
  try {
    const result = await mutateCart(() => addAction(input), previewAddition(input.variantId, input.quantity, preview), true)
    if (result.success) return result.count
    showCartWarning(result.error)
  } catch {
    showCartWarning("Ürün sepete eklenemedi. Sepetiniz korundu; lütfen tekrar deneyin.")
  }
  return null
}

export async function updateLineItem(input: Parameters<typeof updateAction>[0]) {
  try {
    const result = await mutateCart(() => updateAction(input), previewQuantity(input.lineId, input.quantity))
    if (!result.success) showCartWarning(result.error)
    return result
  } catch {
    const error = "Ürün adedi güncellenemedi. Sepetiniz korundu; lütfen tekrar deneyin."
    showCartWarning(error)
    return { success: false as const, error }
  }
}

export async function deleteLineItem(lineId: string) {
  return mutateCart(() => deleteAction(lineId), previewQuantity(lineId, 0))
}
