import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { NextResponse } from "next/server"

const defaultBrandsPageInfo = {
  title: "Markalarımız",
  description:
    "<p>Kalite ve güvenilirliğini kanıtlamış, alanında lider markaların ürünlerini sizlere sunuyoruz. İhtiyaç duyduğunuz tüm ürünler, en uygun fiyatlarla burada.</p>",
  hero_image: "/brand/placeholder.svg",
  hero_cta_text: "Teklif Talebi Oluştur",
  hero_cta_href: "/toptan-ve-kurumsal-satis",
  secondary_cta_text: "Bize Ulaşın",
  secondary_cta_href: "/iletisim",

  // 4 Feature Items Bar
  feat1_title: "Güvenilir Markalar", feat1_desc: "Kalitesi ve başarısı kanıtlanmış dünya markaları.", feat1_icon: "award",
  feat2_title: "Orijinal Ürün Garantisi", feat2_desc: "Tüm ürünler %100 orijinal ve garantilidir.", feat2_icon: "shield-check",
  feat3_title: "Uygun Fiyat Avantajı", feat3_desc: "En iyi markaları en avantajlı fiyatlarla sunuyoruz.", feat3_icon: "tag",
  feat4_title: "Uzman Destek", feat4_desc: "Doğru ürün seçimi için uzman ekibimiz yanınızda.", feat4_icon: "headphones",

  // Ana Markalarımız Section
  main_title: "Ana Markalarımız",
  main_cta_text: "Tüm Markaları Görüntüle",
  main_cta_href: "/magaza",

  // Size Özel Marka ve Ürün Çözümleri (Bottom CTA Card)
  cta_title: "Size Özel Marka ve Ürün Çözümleri",
  cta_desc: "İhtiyacınıza uygun marka, ürün ve fiyat teklifleri için uzman ekibimizle iletişime geçin.",
  cta_btn1_text: "Teklif Talebi Oluştur",
  cta_btn1_href: "/toptan-ve-kurumsal-satis",
  cta_btn2_text: "Bize Ulaşın",
  cta_btn2_href: "/iletisim",
}

function withoutPartnerSection<T extends Record<string, any>>(value: T) {
  const {
    partner_title: _partnerTitle,
    partner_sub_text: _partnerSubText,
    partner_sub_href: _partnerSubHref,
    ...rest
  } = value
  return rest
}

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    const rows = await query<{ value: typeof defaultBrandsPageInfo }>(
      `SELECT value FROM store_settings WHERE key = 'brands_page_info' LIMIT 1`
    )

    const brands_info = {
      ...defaultBrandsPageInfo,
      ...withoutPartnerSection(rows[0]?.value || {}),
    }

    return NextResponse.json({ brands_info })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const body = await req.json()
    const { brands_info } = body

    if (!brands_info || typeof brands_info !== "object") {
      return NextResponse.json({ error: "Geçersiz veri biçimi." }, { status: 400 })
    }

    await query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    const cleanBrandsInfo = withoutPartnerSection(brands_info)

    await query(
      `INSERT INTO store_settings (key, value, updated_at)
       VALUES ('brands_page_info', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [JSON.stringify(cleanBrandsInfo)]
    )

    return NextResponse.json({ success: true, brands_info: cleanBrandsInfo })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
