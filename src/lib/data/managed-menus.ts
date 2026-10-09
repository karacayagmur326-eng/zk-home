import { query } from "@lib/admin/db"
import { listStoreCategories } from "@lib/commerce/repository"
import { categoryPath } from "@lib/seo/category"
import type { NavigationItem } from "@lib/types/navigation"

export async function ensureManagedMenus() {
  const rows = await query<{ id: string; handle: string; location: string[]; items: NavigationItem[] }>(
    "SELECT id, handle, location, items FROM navigation_menu"
  )
  const locations = ["header-menu", "category-sidebar"]
  const missing = locations.filter(location => !rows.some(row => row.handle === location || row.location?.includes(location)))
  if (!missing.length) return
  const categories = await listStoreCategories(true)
  const toItem = (category: (typeof categories)[number]): NavigationItem => ({
    id: `category_${category.id}`, label: category.name, url: categoryPath(category), type: "category",
    children: category.category_children.map(toItem),
  })
  const items = categories.filter(category => !category.parent_category_id).map(toItem)
  for (const location of missing) {
    const legacy = location === "category-sidebar" ? rows.find(row => row.handle === "ikincil-menu" || row.location?.includes("ikincil-menu")) : undefined
    const menuItems = legacy?.items || (location === "header-menu"
      ? [...items, { id: "brands", label: "Markalar", url: "/markalar", type: "custom", children: [] }]
      : [{ id: "all_categories", label: "Tüm Kategoriler", url: "/magaza", type: "custom", children: [] }, ...items])
    await query(`INSERT INTO navigation_menu (id, name, handle, location, items, created_at, updated_at)
      VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,NOW(),NOW()) ON CONFLICT (id) DO NOTHING`,
      [`managed_${location}`, location === "header-menu" ? "Header Menü (Üst Navigasyon)" : "Kategoriler", location, JSON.stringify([location]), JSON.stringify(menuItems)])
  }
}
