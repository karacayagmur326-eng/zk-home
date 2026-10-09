import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query, withTransaction } from "@lib/admin/db"
import { ensureManagedMenus } from "@lib/data/managed-menus"
import { revalidatePath } from "next/cache"

const defaultMenusToSeed = [
  {
    id: "footer_kurumsal",
    name: "Footer - Kurumsal Menüsü",
    handle: "footer-kurumsal",
    location: ["footer-kurumsal"],
    items: [
      { id: "fk1", label: "Hakkımızda", url: "/hakkimizda", type: "page" },
      { id: "fk2", label: "Toptan ve Kurumsal Satış", url: "/toptan-ve-kurumsal-satis", type: "page" },
      { id: "fk3", label: "Markalarımız", url: "/magaza", type: "custom" },
      { id: "fk4", label: "Ürün Rehberi ve Makaleler", url: "/blog", type: "custom" },
    ],
  },
  {
    id: "footer_musteri",
    name: "Footer - Müşteri Hizmetleri Menüsü",
    handle: "footer-musteri-hizmetleri",
    location: ["footer-musteri-hizmetleri"],
    items: [
      { id: "fm1", label: "İletişim", url: "/iletisim", type: "page" },
      { id: "fm2", label: "Sık Sorulan Sorular", url: "/sss", type: "page" },
      { id: "fm3", label: "Teslimat, İptal ve İade", url: "/teslimat-ve-iade", type: "page" },
      { id: "fm4", label: "Garanti ve Teknik Servis", url: "/garanti-ve-teknik-servis", type: "page" },
      { id: "fm5", label: "Sipariş Takibi", url: "/siparis-takibi", type: "custom" },
    ],
  },
  {
    id: "footer_yasal",
    name: "Footer - Yasal Bilgilendirme Menüsü",
    handle: "footer-yasal",
    location: ["footer-yasal"],
    items: [
      { id: "fy1", label: "Ön Bilgilendirme Formu", url: "/on-bilgilendirme-formu", type: "page" },
      { id: "fy2", label: "Mesafeli Satış Sözleşmesi", url: "/mesafeli-satis-sozlesmesi", type: "page" },
      { id: "fy3", label: "KVKK Aydınlatma Metni", url: "/kvkk", type: "page" },
      { id: "fy4", label: "Gizlilik Politikası", url: "/gizlilik-politikasi", type: "page" },
      { id: "fy5", label: "Çerez Politikası", url: "/cerez-politikasi", type: "page" },
    ],
  },
  {
    id: "footer_menu",
    name: "Footer Genel (Varsayılan Alt Linkler)",
    handle: "footer-menu",
    location: ["footer-menu"],
    items: [
      { id: "fg1", label: "Gizlilik Politikası", url: "/gizlilik-politikasi", type: "page" },
      { id: "fg2", label: "Kullanım Koşulları", url: "/kullanim-kosullari", type: "page" },
      { id: "fg3", label: "Çerez Politikası", url: "/cerez-politikasi", type: "page" },
    ],
  },
]

async function ensureColumnsExist() {
  await query(`
    CREATE TABLE IF NOT EXISTS navigation_menu (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      handle TEXT,
      location JSONB DEFAULT '[]',
      items JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `).catch(() => {})

  await query(`
    ALTER TABLE navigation_menu ALTER COLUMN id TYPE TEXT USING id::TEXT
  `).catch(() => {})

  await query(`
    ALTER TABLE navigation_menu ADD COLUMN IF NOT EXISTS location JSONB DEFAULT '[]'
  `).catch(() => {})

  await query(`
    ALTER TABLE navigation_menu ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'
  `).catch(() => {})

  await query(`
    ALTER TABLE navigation_menu ADD COLUMN IF NOT EXISTS handle TEXT
  `).catch(() => {})

  // Seed default footer menus if missing or set locations
  for (const m of defaultMenusToSeed) {
    await query(
      `INSERT INTO navigation_menu (id, name, handle, location, items, created_at, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [m.id, m.name, m.handle, JSON.stringify(m.location), JSON.stringify(m.items)]
    ).catch(() => {})
  }


}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    await ensureColumnsExist()
    await ensureManagedMenus()
    const menus = await query<{ id: string; name: string; location: string[]; items: any[] }>(
      `SELECT id, name, location, items FROM navigation_menu ORDER BY CASE WHEN location @> '["header-menu"]'::jsonb THEN 0 WHEN location @> '["category-sidebar"]'::jsonb THEN 1 ELSE 2 END, created_at ASC`
    )
    return NextResponse.json({ menus })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

import { clearMemoryCache } from "@lib/cache"

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    await ensureColumnsExist()
    const body = await req.json()
    const { id, name, items, location } = body

    if (typeof name !== "string" || !name.trim() || !Array.isArray(items) || !Array.isArray(location)) {
      return NextResponse.json({ error: "Menü adı, öğeleri ve konumları geçerli olmalıdır." }, { status: 400 })
    }
    const menuId = id || `menu_${crypto.randomUUID()}`
    const menu = await withTransaction(async client => {
      await client.query("SELECT pg_advisory_xact_lock(872194)")
      for (const value of location) {
        await client.query(`UPDATE navigation_menu SET location = location - $1::text, updated_at = NOW()
          WHERE id <> $2 AND location @> $3::jsonb`, [value, menuId, JSON.stringify([value])])
      }
      const result = await client.query(`INSERT INTO navigation_menu (id,name,items,location,created_at,updated_at)
        VALUES ($1,$2,$3::jsonb,$4::jsonb,NOW(),NOW())
        ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,items=EXCLUDED.items,location=EXCLUDED.location,updated_at=NOW()
        RETURNING id,name,location,items`, [menuId, name.trim(), JSON.stringify(items), JSON.stringify(location)])
      return result.rows[0]
    })
    revalidatePath("/", "layout")

    clearMemoryCache("navigation-menu:")
    return NextResponse.json({ menu })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Menü kimliği zorunludur." }, { status: 400 })
    }

    await query(`DELETE FROM navigation_menu WHERE id = $1`, [id])
    clearMemoryCache("navigation-menu:")
    revalidatePath("/", "layout")
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
