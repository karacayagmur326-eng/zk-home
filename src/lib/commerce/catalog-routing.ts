import { isPrivatePath } from "@lib/seo/indexing"

const fixedPages = new Set([
  "urunler", "product-preview", "catalog-view", "blog", "cerez-politikasi", "garanti-ve-teknik-servis",
  "gizlilik-politikasi", "hakkimizda", "iletisim", "karsilastir", "kullanim-kosullari", "kvkk",
  "markalarimiz", "mesafeli-satis-sozlesmesi", "on-bilgilendirme-formu", "sss", "teslimat-ve-iade",
  "toptan-satis", "toptan-ve-kurumsal-satis", "brand", "hero", "uploads", "editorial", "images",
])
const filterKeys = new Set(["page", "sortBy", "collection_id", "hide_out_of_stock", "optionValueIds", "price_min", "price_max", "viewMode", "q"])

export function catalogRouteKind(pathname: string): "store" | "brand" | "category" | "legacy" | "slug" | null {
  if (isPrivatePath(pathname)) return null
  const parts = pathname.split("/").filter(Boolean)
  if (!parts.length || parts.some(part => part.startsWith("_") || part.includes("."))) return null
  if (parts[0] === "magaza") return parts.length === 1 ? "store" : null
  if (parts[0] === "markalar") return parts.length === 2 ? "brand" : null
  if (parts[0] === "kategoriler") return parts.length > 1 ? "legacy" : null
  if (fixedPages.has(parts[0])) return null
  return parts.length === 1 ? "slug" : "category"
}

export function hasCatalogFilters(params: URLSearchParams) {
  return [...params.keys()].some(key => filterKeys.has(key) || key.startsWith("option_"))
}

/** Empty search/filter submissions have the same content as their clean URL.
 * Preserve real filters, pagination and campaign parameters while consolidating
 * duplicate URLs such as /magaza?q=&page=2 into /magaza?page=2. */
export function cleanCatalogSearch(params: URLSearchParams): URLSearchParams | null {
  const clean = new URLSearchParams()
  let changed = false
  for (const [key, value] of params) {
    if ((filterKeys.has(key) || key.startsWith("option_")) && !value.trim()) {
      changed = true
    } else clean.append(key, value)
  }
  return changed ? clean : null
}

export function validCatalogFilters(params: URLSearchParams) {
  if (params.toString().length > 4096 || [...params].length > 128) return false
  for (const key of filterKeys) {
    const values = params.getAll(key)
    if (values.some(value => value.length > (key === "q" ? 100 : 512))) return false
    if (!["collection_id", "optionValueIds"].includes(key) && values.length > 1) return false
  }
  if (params.has("page") && !/^[1-9]\d{0,5}$/.test(params.get("page") || "")) return false
  if (params.has("sortBy") && !["created_at", "price_asc", "price_desc"].includes(params.get("sortBy") || "")) return false
  if (params.has("viewMode") && !["grid", "list"].includes(params.get("viewMode") || "")) return false
  for (const key of ["price_min", "price_max"]) {
    const value = params.get(key)
    if (value && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1_000_000_000)) return false
  }
  return true
}
