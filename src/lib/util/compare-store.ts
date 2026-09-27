import { formatTryPrice, parseTryPriceInput } from "./money"

export interface CompareProduct {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
  price?: string | number
  rawPrice?: number
  category?: string
  power?: string
  brand?: string
  inStock?: boolean
  rating?: number
  sku?: string
}

const STORAGE_KEY = "zkhome_compare_list"

export function formatComparePrice(price: string | number | undefined): string {
  if (!price) return "—"
  const amount = typeof price === "number" ? price / 100 : parseTryPriceInput(price)
  return formatTryPrice(amount)
}

export function getCompareList(): CompareProduct[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const parsed: CompareProduct[] = JSON.parse(data)
    return parsed.map((p) => ({
      ...p,
      price: formatComparePrice(p.price || p.rawPrice),
    }))
  } catch {
    return []
  }
}

export function saveCompareList(list: CompareProduct[]): void {
  if (typeof window === "undefined") return
  try {
    const formatted = list.map((p) => ({
      ...p,
      price: formatComparePrice(p.price || p.rawPrice),
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted))
    // Dispatch custom event for UI updates across header/pages
    window.dispatchEvent(new CustomEvent("compare_updated", { detail: formatted }))
  } catch (e) {
    console.error(e)
  }
}

export function addToCompare(product: CompareProduct): {
  success: boolean
  message: string
  list: CompareProduct[]
} {
  const current = getCompareList()
  const exists = current.some((p) => p.id === product.id)

  if (exists) {
    // Remove if already in list
    const updated = current.filter((p) => p.id !== product.id)
    saveCompareList(updated)
    return {
      success: true,
      message: "Ürün karşılaştırma listesinden çıkarıldı.",
      list: updated,
    }
  }

  if (current.length >= 4) {
    return {
      success: false,
      message: "En fazla 4 ürünü aynı anda karşılaştırabilirsiniz.",
      list: current,
    }
  }

  const formattedProduct = {
    ...product,
    price: formatComparePrice(product.price || product.rawPrice),
  }

  const updated = [...current, formattedProduct]
  saveCompareList(updated)
  return {
    success: true,
    message: "Ürün karşılaştırma listesine eklendi!",
    list: updated,
  }
}

export function removeFromCompare(productId: string): CompareProduct[] {
  const current = getCompareList()
  const updated = current.filter((p) => p.id !== productId)
  saveCompareList(updated)
  return updated
}

export function isInCompare(productId: string): boolean {
  const current = getCompareList()
  return current.some((p) => p.id === productId)
}

export function clearCompareList(): void {
  saveCompareList([])
}
