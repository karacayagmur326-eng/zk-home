import { query } from "@lib/admin/db"
import { isPublicContentPath } from "./indexing"

const settingPages: Record<string, { path: string; title: string }> = {
  contact_info: { path: "/iletisim", title: "İletişim ve Müşteri Hizmetleri" },
  brands_info: { path: "/markalar", title: "Markalar" },
  delivery_returns_info: { path: "/teslimat-ve-iade", title: "Teslimat ve İade" },
  wholesale_info: { path: "/toptan-ve-kurumsal-satis", title: "Kurumsal Hediyeler" },
}

export async function getPublicPageAliases() {
  const rows = await query<{ key: string; value: { custom_slug?: string } }>(
    "SELECT key, value FROM store_settings WHERE key = ANY($1::text[])", [Object.keys(settingPages)],
  )
  return rows.flatMap(({ key, value }) => {
    const path = value?.custom_slug ? `/${value.custom_slug}` : ""
    return path && isPublicContentPath(path) && path !== settingPages[key].path
      ? [{ source: settingPages[key].path, path, title: settingPages[key].title }] : []
  })
}
