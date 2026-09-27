import { query } from "@lib/admin/db"
import { getCached } from "@lib/cache"
import { NavigationItem, NavigationMenu } from "@lib/types/navigation"

type MenuRow = {
  id: string
  name: string
  handle?: string | null
  location?: unknown
  items?: unknown
}

const defaultMenuSeeds: Record<string, { name: string; items: any[] }> = {
  "footer-kurumsal": {
    name: "Footer 1 - Kurumsal",
    items: [
      { id: "fk1", label: "Hakkımızda", url: "/hakkimizda", type: "page" },
      { id: "fk2", label: "Toptan ve Kurumsal Satış", url: "/toptan-ve-kurumsal-satis", type: "page" },
      { id: "fk3", label: "Markalarımız", url: "/magaza", type: "custom" },
      { id: "fk4", label: "Ürün Rehberi ve Makaleler", url: "/blog", type: "custom" },
    ],
  },
  "footer-musteri-hizmetleri": {
    name: "Footer 2 - Müşteri Hizmetleri",
    items: [
      { id: "fm1", label: "İletişim", url: "/iletisim", type: "page" },
      { id: "fm2", label: "Sık Sorulan Sorular", url: "/sss", type: "page" },
      { id: "fm3", label: "Teslimat, İptal ve İade", url: "/teslimat-ve-iade", type: "page" },
      { id: "fm4", label: "Garanti ve Teknik Servis", url: "/iletisim", type: "page" },
      { id: "fm5", label: "Sipariş Takibi", url: "/siparis-takibi", type: "custom" },
    ],
  },
  "footer-yasal": {
    name: "Footer 3 - Yasal Bilgilendirme",
    items: [
      { id: "fy1", label: "Ön Bilgilendirme Formu", url: "/on-bilgilendirme-formu", type: "page" },
      { id: "fy2", label: "Mesafeli Satış Sözleşmesi", url: "/mesafeli-satis-sozlesmesi", type: "page" },
      { id: "fy3", label: "KVKK Aydınlatma Metni", url: "/kvkk", type: "page" },
      { id: "fy4", label: "Gizlilik Politikası", url: "/gizlilik-politikasi", type: "page" },
      { id: "fy5", label: "Çerez Politikası", url: "/cerez-politikasi", type: "page" },
    ],
  },
}

function normalizeMenuItem(value: unknown): NavigationItem | null {
  if (!value || typeof value !== "object") return null

  const item = value as Record<string, unknown>
  const label = typeof item.label === "string" ? item.label.trim() : ""

  if (!label) return null

  const type =
    item.type === "category" || item.type === "page" || item.type === "custom"
      ? item.type
      : undefined
  const children = Array.isArray(item.children)
    ? item.children
        .map(normalizeMenuItem)
        .filter((child): child is NavigationItem => child !== null)
    : []

  return {
    id: typeof item.id === "string" ? item.id : undefined,
    label,
    url: typeof item.url === "string" && item.url.trim() ? item.url : "#",
    type,
    children,
  }
}

function normalizeMenu(row: MenuRow): NavigationMenu {
  const location = Array.isArray(row.location)
    ? row.location.filter((value): value is string => typeof value === "string")
    : []
  const items = Array.isArray(row.items)
    ? row.items
        .map(normalizeMenuItem)
        .filter((item): item is NavigationItem => item !== null)
    : []

  return {
    id: row.id,
    name: row.name,
    handle: row.handle || undefined,
    location,
    items,
  }
}

export async function getMenu(
  locationName: string
): Promise<NavigationMenu | null> {
  return getCached<NavigationMenu | null>(
    `navigation-menu:${locationName}`,
    async () => {
      try {
        const menus = await query<MenuRow>(
          `SELECT id, name, handle, location, items FROM navigation_menu
           WHERE location IS NOT NULL AND location @> $1::jsonb
           LIMIT 1`,
          [JSON.stringify([locationName])]
        )

        if (menus.length > 0) {
          return normalizeMenu(menus[0])
        }

        const byHandle = await query<MenuRow>(
          `SELECT id, name, handle, location, items FROM navigation_menu
           WHERE handle = $1
           LIMIT 1`,
          [locationName]
        )

        if (byHandle.length > 0) {
          return normalizeMenu(byHandle[0])
        }

        // Auto-seed and return default menu if missing
        const seed = defaultMenuSeeds[locationName]
        if (seed) {
          const newId = `menu_${locationName.replace(/-/g, "_")}`
          await query(
            `INSERT INTO navigation_menu (id, name, handle, location, items, created_at, updated_at)
             VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, NOW(), NOW())
             ON CONFLICT (id) DO UPDATE SET items = EXCLUDED.items, location = EXCLUDED.location`,
            [newId, seed.name, locationName, JSON.stringify([locationName]), JSON.stringify(seed.items)]
          ).catch(() => {})

          return {
            id: newId,
            name: seed.name,
            handle: locationName,
            location: [locationName],
            items: seed.items.map((i) => ({ ...i, children: [] })),
          }
        }

        return null
      } catch (error) {
        console.error("Error fetching menu:", error)
        return null
      }
    },
    300
  )
}
