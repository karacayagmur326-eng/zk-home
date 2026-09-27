import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"

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
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         handle = EXCLUDED.handle,
         location = EXCLUDED.location,
         items = CASE
           WHEN navigation_menu.items IS NULL OR jsonb_array_length(navigation_menu.items) = 0
           THEN EXCLUDED.items
           ELSE navigation_menu.items
         END`,
      [m.id, m.name, m.handle, JSON.stringify(m.location), JSON.stringify(m.items)]
    ).catch(() => {})
  }

  await query(`
    UPDATE navigation_menu
    SET items = COALESCE((
      SELECT jsonb_agg(
        CASE
          WHEN item->>'id' = 'fm4'
          THEN jsonb_set(item, '{url}', '"/garanti-ve-teknik-servis"'::jsonb)
          ELSE item
        END
      )
      FROM jsonb_array_elements(items) AS item
    ), '[]'::jsonb), updated_at = NOW()
    WHERE id = 'footer_musteri'
      AND EXISTS (
        SELECT 1 FROM jsonb_array_elements(items) AS item
        WHERE item->>'id' = 'fm4' AND item->>'url' <> '/garanti-ve-teknik-servis'
      )
  `).catch(() => {})
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    await ensureColumnsExist()
    const menus = await query<{ id: string; name: string; location: string[]; items: any[] }>(
      `SELECT id, name, location, items FROM navigation_menu ORDER BY created_at ASC`
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

    let menu: any

    if (id) {
      // Update existing
      const [updated] = await query<{ id: string; name: string; location: string[]; items: any[] }>(
        `UPDATE navigation_menu SET name = $1, items = $2::jsonb, location = $3::jsonb, updated_at = NOW()
         WHERE id = $4 RETURNING id, name, location, items`,
        [name, JSON.stringify(items || []), JSON.stringify(location || []), id]
      )
      menu = updated
    } else {
      // Create new
      const newId = `menu_${Date.now()}`
      const now = new Date().toISOString()
      const [created] = await query<{ id: string; name: string; location: string[]; items: any[] }>(
        `INSERT INTO navigation_menu (id, name, items, location, created_at, updated_at)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $5)
         RETURNING id, name, location, items`,
        [newId, name, JSON.stringify(items || []), JSON.stringify(location || []), now]
      )
      menu = created
    }

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
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
