import { plainText } from "@lib/seo/entity"

export type ProductFieldIssue = { field: string; message: string }
export function productFieldIssues(product: any): ProductFieldIssue[] {
  const issues: ProductFieldIssue[] = []
  const add = (field: string, message: string) =>
    issues.push({ field, message })
  if (!plainText(product.title)) add("title", "Ürün adı zorunludur.")
  const variants = product.variants?.length ? product.variants : [{}]
  if (variants.some((variant: any) => !String(variant.sku || "").trim()))
    add("sku", "Her varyant için stok kodu (SKU) zorunludur.")
  if (product.status !== "published") return issues
  if (
    variants.some((variant: any) => {
      const price =
        variant.calculated_price?.calculated_amount ??
        variant.prices?.find(
          (item: any) => String(item.currency_code).toLowerCase() === "try"
        )?.amount
      return !Number.isFinite(Number(price)) || Number(price) <= 0
    })
  )
    add("price", "Yayınlamak için her varyanta sıfırdan büyük bir fiyat girin.")
  if (
    !plainText(
      product.metadata?.product_summary || product.metadata?.short_description
    )
  )
    add("summary", "Ürün özeti zorunludur; ürüne özel kısa açıklama girin.")
  if (!plainText(product.description))
    add("description", "Detaylı ürün açıklaması zorunludur.")
  if (
    !product.thumbnail &&
    !product.images?.some(
      (image: any) => image?.url || (typeof image === "string" && image)
    )
  )
    add("image", "En az bir ürün görseli zorunludur.")
  if (!product.categories?.length)
    add("category", "En az bir ürün kategorisi seçin.")
  if (
    !product.collection_id &&
    !product.collection?.id &&
    !plainText(product.metadata?.brand_name || product.metadata?.brand)
  )
    add("brand", "Ürünün markasını seçin.")
  if (
    variants.some(
      (variant: any) =>
        variant.manage_inventory &&
        (!Number.isInteger(Number(variant.inventory_quantity)) ||
          Number(variant.inventory_quantity) < 0 ||
          variant.inventory_quantity === "" ||
          variant.inventory_quantity == null)
    )
  )
    add(
      "stock",
      "Her varyantın stok miktarı sıfır veya pozitif bir tam sayı olmalıdır."
    )
  return issues
}

export function validateProduct(product: any) {
  const issues = productFieldIssues(product)
  if (issues.length) {
    const error = new Error(issues[0].message) as Error & {
      issues: ProductFieldIssue[]
    }
    error.issues = issues
    throw error
  }
}
