import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { NextResponse } from "next/server"

const defaultContentHtml = `<h3>Teslimat ve İade Bilgileri</h3>
`

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

    const rows = await query<{ key: string; value: any }>(
      `SELECT key, value FROM store_settings WHERE key = 'delivery_returns_info' LIMIT 1`
    )

    const defaultInfo = {
      eyebrow: "Müşteri Bilgilendirme",
      title: "Teslimat, İptal ve İade Koşulları",
      description: "Teslimat, iptal ve iade koşulları mağaza açılmadan önce yayınlanacaktır.",
      hero_image: "/brand/placeholder.svg",
      hero_cta_text: "",
      hero_cta_href: "",

      // Single Rich Text Content (HTML containing <h3> headings for accordions)
      content_html: defaultContentHtml,

      // Right Column Cards
      highlight_title: "Öne Çıkan Bilgiler",
      h1_title: "Teslimat Süresi", h1_desc: "Yönetim panelinden yapılandırılacaktır.",
      h2_title: "Kargo Ücreti", h2_desc: "Yönetim panelinden yapılandırılacaktır.",
      h3_title: "İade Koşulları", h3_desc: "Yönetim panelinden yapılandırılacaktır.",
      h4_title: "Garanti Koşulları", h4_desc: "Ürün bazında yapılandırılacaktır.",
      h5_title: "Destek Saatleri", h5_desc: "İletişim bilgileriyle birlikte yayınlanacaktır.",

      process_title: "İade Süreci Nasıl İşler?",
      step1_title: "İade talebi", step1_desc: "Süreç mağaza açılmadan önce yapılandırılacaktır.",
      step2_title: "Paketleme", step2_desc: "Süreç mağaza açılmadan önce yapılandırılacaktır.",
      step3_title: "Gönderim", step3_desc: "Süreç mağaza açılmadan önce yapılandırılacaktır.",
      step4_title: "İnceleme", step4_desc: "Süreç mağaza açılmadan önce yapılandırılacaktır.",
      process_btn_text: "İade Talebi Oluştur", process_btn_href: "/hesabim/siparislerim"
    }

    const info = rows[0]?.value ? { ...defaultInfo, ...rows[0].value } : defaultInfo
    return NextResponse.json({ delivery_returns_info: info })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const body = await request.json()
    const { delivery_returns_info } = body

    await query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    if (delivery_returns_info) {
      await query(
        `INSERT INTO store_settings (key, value, updated_at)
         VALUES ('delivery_returns_info', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(delivery_returns_info)]
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
