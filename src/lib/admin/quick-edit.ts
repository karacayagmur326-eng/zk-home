import { query } from "@lib/admin/db"

type EditTarget = { href: string; title: string }
const pageTarget = (handle: string): EditTarget => ({
  href: `/admin/sayfalar?duzenle=${encodeURIComponent(handle)}`,
  title: "Bu sayfayı düzenle",
})

export async function resolveAdminEditTarget(rawPath: string): Promise<EditTarget | null> {
  const path = decodeURIComponent(rawPath).replace(/^\/tr(?=\/|$)/, "").replace(/\/+$/, "") || "/"
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("?") || path.includes("#")) return null
  if (path === "/") return { href: "/admin/anasayfa-vitrini", title: "Ana sayfayı düzenle" }
  if (path === "/magaza" || path === "/urunler") return { href: "/admin/urunler", title: "Ürünleri düzenle" }
  if (path === "/kategoriler") return { href: "/admin/kategoriler", title: "Kategorileri düzenle" }
  if (path.startsWith("/urunler/")) {
    const rows = await query<{ id: string }>("SELECT id FROM store_product WHERE handle=$1 AND deleted_at IS NULL LIMIT 1", [path.slice(9)])
    return rows[0] ? { href: `/admin/urunler/${encodeURIComponent(rows[0].id)}`, title: "Bu ürünü düzenle" } : null
  }
  if (path.startsWith("/blog/")) {
    const rows = await query<{ id: string }>("SELECT id FROM blog_posts WHERE slug=$1 LIMIT 1", [path.slice(6)])
    return rows[0] ? { href: `/admin/blog/${encodeURIComponent(rows[0].id)}`, title: "Bu yazıyı düzenle" } : null
  }

  const handle = path.slice(1)
  const categoryHandle = path.startsWith("/kategoriler/") ? path.slice(13) : handle
  const categories = await query<{ id: string; metadata: { pretty_url?: boolean } }>(
    "SELECT id,metadata FROM store_category WHERE handle=$1 LIMIT 1", [categoryHandle],
  )
  if (categories[0] && (path.startsWith("/kategoriler/") || categories[0].metadata?.pretty_url === true)) {
    return { href: `/admin/kategoriler?duzenle=${encodeURIComponent(categories[0].id)}`, title: "Bu kategoriyi düzenle" }
  }
  const pages = await query<{ handle: string }>(
    "SELECT handle FROM content_pages WHERE handle=$1 OR content->>'custom_slug'=$1 ORDER BY (handle=$1) DESC LIMIT 1", [handle],
  )
  if (pages[0]) return pageTarget(pages[0].handle)

  const aliases = await query<{ key: string }>(
    "SELECT key FROM store_settings WHERE key = ANY($1::text[]) AND value->>'custom_slug'=$2 LIMIT 1",
    [["contact_info", "brands_info", "delivery_returns_info", "wholesale_info"], handle],
  )
  const aliasHandles: Record<string, string> = { contact_info: "iletisim", brands_info: "markalar", delivery_returns_info: "teslimat-ve-iade", wholesale_info: "toptan-ve-kurumsal-satis" }
  if (aliases[0]) return pageTarget(aliasHandles[aliases[0].key])
  const builtInPages = ["hakkimizda", "iletisim", "sss", "blog", "markalar", "teslimat-ve-iade", "toptan-ve-kurumsal-satis", "garanti-ve-teknik-servis", "kullanim-kosullari", "gizlilik-politikasi", "cerez-politikasi", "siparis-takibi", "on-bilgilendirme-formu", "mesafeli-satis-sozlesmesi"]
  if (path === "/kvkk") return pageTarget("kvkk-aydinlatma-metni")
  return builtInPages.includes(handle) ? pageTarget(handle) : null
}
