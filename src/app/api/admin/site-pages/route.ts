import { getAdminSession } from "@lib/admin/auth"
import { query } from "@lib/admin/db"
import { defaultServicePageData } from "@lib/content/service-page"
import { defaultBlogPageContent, defaultFaqPageContent } from "@lib/content/knowledge-pages"
import { NextRequest, NextResponse } from "next/server"

const coreDefaults = {
  hakkimizda: {
    title: "Hakkımızda",
    description:
      "Geniş ürün yelpazesi, kaliteli markalar ve müşteri odaklı hizmet anlayışımızla perakende ve toptan satış yapan güvenilir çözüm ortağınızız.",
  },
  iletisim: {
    title: "İletişim",
    description:
      "Ürün seçimi, sipariş ve satış sonrası destek için ekibimizle iletişime geçin.",
  },
  "toptan-ve-kurumsal-satis": {
    title: "Toptan ve Kurumsal Satış",
    description:
      "İşletmeler için avantajlı fiyatlar, toplu sipariş kolaylığı ve özel kurumsal teklif çözümleri.",
  },
  markalar: {
    title: "Markalarımız",
    description:
      "Kalite ve güvenilirliğini kanıtlamış, alanında lider markaların ürünlerini sizlere sunuyoruz.",
  },
  sss: defaultFaqPageContent,
  blog: defaultBlogPageContent,
  "siparis-takibi": {
    title: "Sipariş Takibi",
    description: "Siparişinizin durumuna, kargo bilgilerine ve sipariş detaylarına kolayca ulaşabilirsiniz.",
    hero_text: "Siparişinizin durumuna, kargo bilgilerine ve sipariş detaylarına kolayca ulaşabilirsiniz.",
    hero_image: "/brand/placeholder.svg",
  },
  "garanti-ve-teknik-servis": defaultServicePageData,
}

const legalDefaults = {
  "mesafeli-satis-sozlesmesi": {
    title: "Mesafeli Satış Sözleşmesi",
    description: "Bu sözleşme, mağazamız üzerinden verilen siparişlerde satıcı ile alıcının hak ve yükümlülüklerini düzenler.\n\nSiparişe konu ürünlerin temel nitelikleri, vergiler dâhil toplam bedeli, teslimat masrafları ve ödeme yöntemi sipariş özeti ile ön bilgilendirme formunda gösterilir.\n\nTüketici, mevzuatta belirtilen istisnalar dışında ürünü teslim aldığı tarihten itibaren on dört gün içinde cayma hakkını kullanabilir. Cayma bildirimi iletişim kanallarımız üzerinden kalıcı veri saklayıcısı ile iletilebilir.\n\nSatıcının ticari unvanı, açık adresi, iletişim bilgileri, siparişe özel ürün ve fiyat bilgileri ödeme öncesinde oluşturulan sözleşme nüshasında ayrıca gösterilir.",
  },
  "on-bilgilendirme-formu": {
    title: "Ön Bilgilendirme Formu",
    description: "Sipariş vermeden önce ürünün temel nitelikleri, satıcının iletişim bilgileri, vergiler dâhil toplam fiyat, teslimat ve varsa ek masraflar müşteriye açık biçimde gösterilir.\n\nÖdeme yükümlülüğü doğuran sipariş onayından önce teslimat süresi, ödeme yöntemi, cayma hakkının kullanım şekli ve başvuru yolları müşterinin onayına sunulur.\n\nSiparişe özgü ön bilgilendirme formu sepet ve ödeme ekranındaki güncel bilgiler kullanılarak oluşturulur ve müşteriye kalıcı veri saklayıcısı ile iletilebilir.",
  },
  "gizlilik-politikasi": {
    title: "Gizlilik Politikası",
    description: "Mağazamız; üyelik, sipariş, teslimat, ödeme, destek ve yasal yükümlülüklerin yerine getirilmesi için gerekli kişisel verileri amaçla sınırlı ve ölçülü biçimde işler.\n\nİşlenen veriler; kimlik ve iletişim bilgileri, teslimat ve fatura bilgileri, sipariş kayıtları, müşteri işlem kayıtları ve güvenlik verilerinden oluşabilir. Ödeme kartı bilgileri mağaza veritabanında saklanmaz; yetkili ödeme kuruluşu tarafından işlenir.\n\nKişisel veriler yalnızca hizmetin yürütülmesi, yasal yükümlülükler ve açık rıza bulunan pazarlama faaliyetleri kapsamında yetkili hizmet sağlayıcılarla paylaşılır. İlgili kişiler erişim, düzeltme, silme ve itiraz taleplerini iletişim sayfasındaki kanallardan iletebilir.",
  },
  "kvkk-aydinlatma-metni": {
    title: "KVKK Aydınlatma Metni",
    description: "Şirketimiz kişisel verilerin korunmasına önem verir. Bu metin, verilerinizin hangi amaçlarla ve hangi hukuki sebeplerle işlendiğini açıklar.",
  },
  "cerez-politikasi": {
    title: "Çerez Politikası",
    description: "Sitede oturum, sepet, güvenlik ve tercihlerin çalışması için zorunlu çerezler kullanılabilir. Zorunlu olmayan analiz ve pazarlama çerezleri kullanıcı tercihi alınmadan etkinleştirilmemelidir.\n\nÇerez tercihleri daha sonra değiştirilebilir. Kullanılan çerezin adı, sağlayıcısı, amacı ve saklama süresi çerez yönetim panelinde güncel olarak gösterilmelidir.\n\nTarayıcı ayarlarından çerezler silinebilir; zorunlu çerezlerin engellenmesi sepet ve üyelik gibi temel işlevleri etkileyebilir.",
  },
  "teslimat-ve-iade": {
    title: "Teslimat ve İade Koşulları",
    description: "Stokta bulunan ürünler ödeme onayından sonra hazırlanır. Tahmini teslimat süresi, kargo firması ve varsa teslimat ücreti sipariş tamamlanmadan önce müşteriye gösterilir.\n\nPaket teslim alınırken görünür hasar bulunması hâlinde kargo görevlisine tutanak düzenletilmesi önerilir. Eksik veya hasarlı teslimatlar iletişim kanallarımızdan sipariş numarasıyla bildirilmelidir.\n\nTüketici, mevzuatta belirtilen istisnalar dışında teslimden itibaren on dört gün içinde cayma hakkını kullanabilir. Ürün, aksesuarları ve faturasıyla birlikte uygun biçimde iade edilmelidir. İade taşıyıcısı, adresi ve ücret sorumluluğu siparişe özel bilgilendirmede belirtilir.",
  },
  "kullanim-kosullari": {
    title: "Kullanım Koşulları",
    description: "Bu site ürünlerin tanıtımı, satışı ve satış sonrası hizmetlerin sunulması amacıyla işletilir.\n\nKullanıcılar üyelik ve sipariş işlemlerinde doğru ve güncel bilgi vermekle, hesap erişim bilgilerini korumakla yükümlüdür. Site içeriği, marka ve görseller hak sahibinin izni olmadan ticari amaçla kullanılamaz.\n\nFiyat, stok ve kampanya bilgileri sipariş onayı öncesinde güncellenebilir. Tüketici mevzuatından doğan emredici haklar saklıdır.",
  },
}

const defaults = { ...coreDefaults, ...legalDefaults }

const structuredPageDefaults: Record<string, Record<string, string>> = {
  hakkimizda: { hero_image: "/brand/placeholder.svg" },
  iletisim: { hero_image: "/brand/placeholder.svg" },
  "toptan-ve-kurumsal-satis": { hero_image: "/brand/placeholder.svg" },
  markalar: { hero_image: "/brand/placeholder.svg" },
  "garanti-ve-teknik-servis": { hero_image: "/brand/placeholder.svg" },
  "teslimat-ve-iade": { hero_image: "/brand/placeholder.svg" },
  "kullanim-kosullari": { hero_image: "/brand/placeholder.svg" },
  "siparis-takibi": { hero_image: "/brand/placeholder.svg" },
  "on-bilgilendirme-formu": { hero_image: "/brand/placeholder.svg" },
  "mesafeli-satis-sozlesmesi": { hero_image: "/brand/placeholder.svg" },
  "kvkk-aydinlatma-metni": { hero_image: "/brand/placeholder.svg" },
  "gizlilik-politikasi": { hero_image: "/brand/placeholder.svg" },
  "cerez-politikasi": { hero_image: "/brand/placeholder.svg" },
  sss: { hero_image: "/brand/placeholder.svg" },
  blog: { hero_image: "/brand/placeholder.svg" },
}

const pageMetaDefaults = {
  tags: [] as string[],
  status: "published",
}

async function ensurePagesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS content_pages (
      handle TEXT PRIMARY KEY,
      content JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(`
    CREATE TABLE IF NOT EXISTS content_pages_deleted (
      handle TEXT PRIMARY KEY,
      content JSONB NOT NULL,
      original_updated_at TIMESTAMPTZ,
      deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  for (const [handle, content] of Object.entries(defaults)) {
    await query(
      `INSERT INTO content_pages (handle, content)
       SELECT $1, $2::jsonb
       WHERE NOT EXISTS (SELECT 1 FROM content_pages_deleted WHERE handle = $1)
       ON CONFLICT (handle) DO NOTHING`,
      [handle, JSON.stringify(content)],
    )
  }
  for (const [handle, patch] of Object.entries(structuredPageDefaults)) {
    await query(
      `UPDATE content_pages
       SET content = content || $2::jsonb
       WHERE handle = $1
         AND (
           NOT (content ? 'hero_image')
           OR COALESCE(content->>'hero_image', '') IN ('', '/brand/placeholder.svg')
         )`,
      [handle, JSON.stringify(patch)],
    )
  }
  for (const [handle, fallback] of Object.entries({ sss: defaultFaqPageContent, blog: defaultBlogPageContent })) {
    await query(
      "UPDATE content_pages SET content = $2::jsonb || content WHERE handle = $1",
      [handle, JSON.stringify(fallback)],
    )
  }
}

export async function GET() {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  try {
    await ensurePagesTable()
    const rows = await query<{
      handle: string
      content: unknown
      updated_at: string
    }>("SELECT handle, content, updated_at FROM content_pages ORDER BY handle")
    const deletedRows = await query<{
      handle: string
      content: unknown
      original_updated_at: string | null
      deleted_at: string
    }>("SELECT handle, content, original_updated_at, deleted_at FROM content_pages_deleted ORDER BY deleted_at DESC")
    return NextResponse.json({
      pages: rows.map((row) => ({
        ...row,
        content: { ...pageMetaDefaults, ...(row.content as object) },
      })),
      deleted_pages: deletedRows.map((row) => ({
        ...row,
        content: { ...pageMetaDefaults, ...(row.content as object) },
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  try {
    await ensurePagesTable()
    const body = await request.json()

    if (body.action === "restore") {
      const handles = Array.isArray(body.handles) ? body.handles : []
      if (handles.length === 0) {
        return NextResponse.json({ error: "Geri yüklenecek sayfa seçilmedi." }, { status: 400 })
      }
      await query(
        `INSERT INTO content_pages (handle, content, updated_at)
         SELECT handle, content, COALESCE(original_updated_at, NOW())
         FROM content_pages_deleted
         WHERE handle = ANY($1::text[])
         ON CONFLICT (handle) DO UPDATE
         SET content = EXCLUDED.content, updated_at = NOW()`,
        [handles],
      )
      await query("DELETE FROM content_pages_deleted WHERE handle = ANY($1::text[])", [handles])
      return NextResponse.json({ success: true })
    }

    if (body.action === "duplicate") {
      const { handle } = body
      const rows = await query<{ content: any }>("SELECT content FROM content_pages WHERE handle = $1 LIMIT 1", [handle])
      if (rows[0]) {
        const newHandle = `${handle}-kopya-${Date.now().toString().slice(-4)}`
        const newContent = {
          ...rows[0].content,
          title: `${rows[0].content?.title || handle} (Kopya)`,
          custom_slug: newHandle,
        }
        await query(
          "INSERT INTO content_pages (handle, content, updated_at) VALUES ($1, $2::jsonb, NOW())",
          [newHandle, JSON.stringify(newContent)]
        )
        return NextResponse.json({ success: true, new_handle: newHandle })
      }
      return NextResponse.json({ error: "Kopyalanacak sayfa bulunamadı." }, { status: 404 })
    }

    const { handle, old_handle, content } = body
    if (!handle || !content || typeof content !== "object") {
      return NextResponse.json(
        { error: "Geçersiz sayfa verisi." },
        { status: 400 },
      )
    }

    const requestedSlug = (content.custom_slug || handle).trim().toLowerCase()

    // 1. Sitede aynı kalıcı bağlantının (URL/slug) başka bir sayfada kullanılıp kullanılmadığını kontrol et
    const existingRows = await query<{ handle: string; content: any }>(
      "SELECT handle, content FROM content_pages WHERE handle = $1 OR content->>'custom_slug' = $1",
      [requestedSlug]
    )

    const conflict = existingRows.find(
      (row) => row.handle !== handle && row.handle !== old_handle
    )

    if (conflict) {
      const conflictTitle = conflict.content?.title || conflict.handle
      return NextResponse.json(
        {
          error: `"${requestedSlug}" kalıcı bağlantısı (URL) zaten "${conflictTitle}" sayfası tarafından kullanılıyor. Sitede aynı kalıcı bağlantıdan yalnızca bir tane bulunabilir.`,
        },
        { status: 400 }
      )
    }

    const previousRows = await query<{ content: any }>("SELECT content FROM content_pages WHERE handle=$1", [old_handle || handle])
    const previous = previousRows[0]?.content || {}
    const previousSlug = previous.custom_slug || old_handle || handle
    const mergedContent = { ...previous, ...content }
    if (previousRows.length && previousSlug !== requestedSlug) mergedContent.slug_history = Array.from(new Set([...(previous.slug_history || []), previousSlug])).filter(value => value !== requestedSlug).slice(-100)

    // 2. Eğer sayfanın kalıcı bağlantısı/handle değişmişse eski handle kaydını sil
    if (old_handle && old_handle !== handle) {
      await query("DELETE FROM content_pages WHERE handle = $1", [old_handle])
    }

    // 3. Yeni veya güncellenen sayfayı kaydet
    await query(
      "INSERT INTO content_pages (handle, content, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (handle) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()",
      [handle, JSON.stringify(mergedContent)],
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 })
  }
  try {
    await ensurePagesTable()
    const { handles, permanent = false } = await request.json()
    if (!Array.isArray(handles) || handles.length === 0) {
      return NextResponse.json({ error: "Silinecek sayfa seçilmedi." }, { status: 400 })
    }
    if (permanent) {
      await query("DELETE FROM content_pages_deleted WHERE handle = ANY($1::text[])", [handles])
      return NextResponse.json({ success: true })
    }

    await query(
      `INSERT INTO content_pages_deleted (handle, content, original_updated_at, deleted_at)
       SELECT handle, content, updated_at, NOW()
       FROM content_pages
       WHERE handle = ANY($1::text[])
       ON CONFLICT (handle) DO UPDATE
       SET content = EXCLUDED.content,
           original_updated_at = EXCLUDED.original_updated_at,
           deleted_at = NOW()`,
      [handles],
    )
    await query("DELETE FROM content_pages WHERE handle = ANY($1::text[])", [handles])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
