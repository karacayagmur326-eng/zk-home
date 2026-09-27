import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { NextResponse } from "next/server"

const defaultWholesaleInfo = {
  eyebrow: "Kurumsal",
  title: "İşinizi Güçlendiren Profesyonel Çözümler",
  description: "Kurumsal satış koşulları ve ürün grupları yönetim panelinden yapılandırılır.",
  hero_image: "",
  hero_cta1_text: "Teklif Talebi Oluştur",
  hero_cta1_href: "#quote-form",
  hero_cta2_text: "Bize Ulaşın",
  hero_cta2_href: "tel:08503030047",

  // 6 Feature Items Bar (3x2 Layout Under Hero)
  feat1_title: "Toptan Fiyat Avantajı", feat1_desc: "Yüksek adetli alımlarda özel fiyatlandırma fırsatları.", feat1_icon: "tag",
  feat2_title: "Güvenilir Tedarik", feat2_desc: "Stoktan hızlı teslimat ve kesintisiz tedarik.", feat2_icon: "package",
  feat3_title: "Uzman Destek", feat3_desc: "İhtiyacınıza uygun ürün ve çözüm önerileri.", feat3_icon: "headphones",
  feat4_title: "Özel Çözümler", feat4_desc: "Projenize özel ürün, paketleme ve lojistik çözümleri.", feat4_icon: "wrench",
  feat5_title: "Fatura ve Ödeme", feat5_desc: "Kolay fatura yönetimi ve esnek ödeme seçenekleri.", feat5_icon: "receipt",
  feat6_title: "Hızlı Sevkiyat", feat6_desc: "Türkiye geneli aynı gün kargo ve güvenli teslimat.", feat6_icon: "truck",

  // "Neden ZK Home?" & "Kimler İçin Uygun?"
  why_title: "Neden ZK Home?",
  why_desc: "Yılların deneyimi ve geniş ürün yelpazemizle, farklı sektörlerdeki işletmelerin üretim gücünü artırıyoruz. Kaliteyi uygun fiyatla buluşturuyor, işinizi büyütmenize katkı sağlıyoruz.",
  stat1_value: "10.000+", stat1_label: "Ürün Çeşidi", stat1_icon: "tag",
  stat2_value: "500+", stat2_label: "Kurumsal Müşteri", stat2_icon: "users",
  stat3_value: "Hızlı", stat3_label: "Teslimat", stat3_icon: "truck",
  stat4_value: "%100", stat4_label: "Müşteri Memnuniyeti", stat4_icon: "award",

  target_title: "Kimler İçin Uygun?",
  target_item1: "Sanayi ve üretim tesisleri",
  target_item2: "İnşaat ve taahhüt firmaları",
  target_item3: "Otomotiv servis ve yedek parça bayileri",
  target_item4: "Perakende satış yapan işletmeler",
  target_item5: "Kamu kurum ve kuruluşları",
  target_item6: "Özel atölyeler ve teknik servisler",

  // 6-Step Process Bar (3x2 Layout)
  process_title: "Toptan Satış Sürecimiz",
  step1_title: "Talep", step1_desc: "İhtiyacınızı ve istediğiniz ürünleri bize iletin.", step1_icon: "file-text",
  step2_title: "Teklif", step2_desc: "Size özel fiyat ve teslimat teklifimizi sunalım.", step2_icon: "receipt",
  step3_title: "Sipariş", step3_desc: "Teklifinizi onaylayın, siparişinizi oluşturalım.", step3_icon: "package-check",
  step4_title: "Teslimat", step4_desc: "Ürünlerinizi hızlı ve güvenli şekilde teslim edelim.", step4_icon: "truck",
  step5_title: "Destek", step5_desc: "Satış sonrası teknik destekte yanınızda olalım.", step5_icon: "shield-check",
  step6_title: "Memnuniyet", step6_desc: "Kesintisiz iş ortaklığı ve müşteri memnuniyeti takibi.", step6_icon: "award",

  // Form & Contact Info Section
  form_title: "Size Özel Teklif Alın",
  form_desc: "İhtiyacınızı belirtin, en kısa sürede size geri dönüş yapalım.",
  phone: "0850 303 00 47",
  phone_sub: "Hafta içi 09:00 - 18:00",
  email: "info@zk-home.com",
  email_sub: "Ortalama yanıt süresi: 2 saat",
  address: "İkitelli OSB Mah. İkbal Cad. No: 45/1 Başakşehir / İstanbul",
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

    const rows = await query<{ key: string; value: any }>(
      `SELECT key, value FROM store_settings WHERE key = 'wholesale_info' LIMIT 1`
    )

    const info = rows[0]?.value ? { ...defaultWholesaleInfo, ...rows[0].value } : defaultWholesaleInfo
    return NextResponse.json({ wholesale_info: info })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })

  try {
    const body = await request.json()
    const { wholesale_info } = body

    await query(`
      CREATE TABLE IF NOT EXISTS store_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    if (wholesale_info) {
      await query(
        `INSERT INTO store_settings (key, value, updated_at)
         VALUES ('wholesale_info', $1, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(wholesale_info)]
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
