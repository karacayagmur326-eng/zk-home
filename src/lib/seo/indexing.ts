/** One policy for response headers, robots and sitemap eligibility. */
export const PRIVATE_PATHS = [
  "/admin", "/api", "/checkout", "/hesabim", "/sepet", "/favorilerim",
  "/son-gezdiklerim", "/koleksiyonlarim", "/sifremi-unuttum",
  "/sifremi-yenile", "/verify-account", "/siparis", "/siparis-takibi",
] as const

export function isPrivatePath(pathname: string): boolean {
  let path = pathname.toLowerCase()
  try { path = decodeURIComponent(path) } catch { return true }
  return PRIVATE_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export function isSearchOrFilterPage(pathname: string, params: URLSearchParams): boolean {
  if (isPrivatePath(pathname)) return false
  return ["q", "search", "sortBy", "collection_id", "hide_out_of_stock", "optionValueIds",
    "price_min", "price_max", "viewMode", "kategori"].some((key) => params.has(key)) ||
    Array.from(params.keys()).some((key) => key.startsWith("option_") || key.startsWith("utm_"))
}

export function isPublicContentPath(path: string): boolean {
  return /^\/[\p{L}\p{N}_-]+$/u.test(path) && !path.startsWith("/_") && !isPrivatePath(path)
}

export function paginatedPath(path: string, page?: string | string[]): string {
  const value = typeof page === "string" && /^[1-9]\d{0,6}$/.test(page) ? Number(page) : 1
  return value > 1 ? `${path}?page=${value}` : path
}

export function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

export function lastModifiedXml(value?: string | null): string {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : `<lastmod>${date.toISOString()}</lastmod>`
}
