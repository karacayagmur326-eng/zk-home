import fs from "node:fs"
import pg from "pg"

const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("="))
  .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]))
const base = process.env.SITE_TEST_URL || "http://localhost:8015"
const db = new pg.Client({ connectionString: env.DATABASE_URL, ssl: /localhost|127\.0\.0\.1/.test(env.DATABASE_URL) ? false : { rejectUnauthorized: false } })
await db.connect()
const categories = (await db.query("SELECT handle, name, metadata FROM store_category WHERE active=true ORDER BY rank,handle")).rows
const brands = (await db.query("SELECT handle FROM store_collection WHERE metadata->>'active' IS DISTINCT FROM 'false'")).rows
await db.end()

const errors = []
const titles = new Set()
const descriptions = new Set()
const check = async (category) => {
  const path = category.metadata.pretty_url === true ? `/${category.handle}` : `/kategoriler/${category.handle}`
  const response = await fetch(base + path)
  const html = await response.text()
  const title = html.match(/<title>(.*?)<\/title>/)?.[1] || ""
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] || ""
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] || ""
  const robots = html.match(/<meta name="robots" content="([^"]+)"/)?.[1] || ""
  const h1Count = (html.match(/<h1\b/g) || []).length
  const listHeadingHtml = html.match(/<h2\b[^>]*data-testid="store-page-title"[^>]*>(.*?)<\/h2>/s)?.[1] || ""
  const listHeading = listHeadingHtml.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").trim()
  const expectedListHeading = category.metadata.product_list_title?.trim() || category.name
  if (response.status !== 200) errors.push(`${path}: HTTP ${response.status}`)
  if (canonical !== base + path) errors.push(`${path}: canonical ${canonical}`)
  if (h1Count !== 1) errors.push(`${path}: ${h1Count} H1`)
  if (listHeading !== expectedListHeading) errors.push(`${path}: ürün listesi başlığı ${listHeading}`)
  if (!title || titles.has(title)) errors.push(`${path}: boş/tekrar eden title`)
  if (!description || descriptions.has(description)) errors.push(`${path}: boş/tekrar eden açıklama`)
  if (!robots.includes("noindex")) errors.push(`${path}: hazırlık döneminde noindex yok`)
  if (!html.includes('"@type":"BreadcrumbList"')) errors.push(`${path}: BreadcrumbList yok`)
  titles.add(title)
  descriptions.add(description)
}
for (let index = 0; index < categories.length; index += 5) {
  await Promise.all(categories.slice(index, index + 5).map(check))
}
for (const brand of brands) {
  const response = await fetch(`${base}/markalar/${brand.handle}`)
  if (response.status !== 200) errors.push(`/markalar/${brand.handle}: HTTP ${response.status}`)
}
const oldUrl = await fetch(`${base}/kategoriler/dekorasyon`, { redirect: "manual" })
if (oldUrl.status !== 308 || oldUrl.headers.get("location") !== "/dekorasyon") errors.push("Eski kategori yönlendirmesi hatalı")
for (const segment of ["categories", "collections", "products", "pages", "blog"]) {
  const sitemap = await (await fetch(`${base}/sitemap-${segment}.xml`)).text()
  if (sitemap.includes("<url>")) errors.push(`Hazırlık döneminde sitemap-${segment}.xml URL içeriyor`)
}
const admin = await fetch(`${base}/api/admin/categories`)
if (admin.status !== 401) errors.push("Kategori yönetim API oturum kontrolü hatalı")

console.log(`${categories.length} kategori, ${brands.length} marka, ürün listesi başlığı/canonical/title/description/H1/robots/schema/sitemap kontrol edildi.`)
if (errors.length) {
  console.error(errors.join("\n"))
  process.exitCode = 1
}
