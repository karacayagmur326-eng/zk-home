/** One-time, additive catalog setup. Existing admin edits are never overwritten. */
import fs from "node:fs"
import pg from "pg"

const env = Object.fromEntries(
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)])
)
if (!env.DATABASE_URL) throw new Error("DATABASE_URL gerekli")

const entries = []
const add = (path, name, description, icon = "", homeOrder = 0, parentOverride) => {
  const parts = path.split("/")
  const parent = parentOverride || (parts.length > 1 ? parts.slice(0, -1).join("/") : null)
  entries.push({
    path, name, description, icon, homeOrder,
    parent,
    rank: entries.filter((entry) => entry.parent === parent).length,
  })
}

add("dekorasyon", "Dekorasyon", "Ev dekorasyonu için vazo, dekoratif obje, duvar aksesuarı, mum ve oda kokusu seçeneklerini yaşam alanınıza göre keşfedin.", "dekorasyon")
add("dekorasyon/dekoratif-objeler", "Dekoratif Objeler", "Salon, antre ve konsol düzenlemelerinde kullanılabilecek farklı biçim ve malzemelerde dekoratif objeleri inceleyin.", "dekorasyon")
add("dekorasyon/dekoratif-objeler/vazolar", "Vazolar", "Cam, seramik ve dekoratif vazolarla çiçeklerinizi sergileyin; masa, raf veya konsol için uygun formu seçin.", "vazolar", 2)
add("dekorasyon/dekoratif-objeler/dekoratif-kupler", "Dekoratif Küpler", "Dekoratif küp modelleriyle raf, vitrin ve sehpa düzenlemelerine hacim ve karakter katın.", "dekoratif-kupler")
add("dekorasyon/dekoratif-objeler/saksilar", "Saksılar", "Bitkilerinize ve yaşam alanınıza uygun dekoratif saksı modellerini boyut, malzeme ve tasarıma göre değerlendirin.", "saksilar")
add("dekorasyon/dekoratif-objeler/jardenyer", "Jardenyer", "Çiçek ve bitki düzenlemeleri için jardenyer seçeneklerini masa ve konsol dekorasyonuna uygun biçimde keşfedin.", "dekorasyon")
add("dekorasyon/dekoratif-objeler/dekoratif-tabak-kaseler", "Dekoratif Tabak & Kaseler", "Sehpa ve yemek masasında tamamlayıcı olarak kullanabileceğiniz dekoratif tabak ve kase modellerini inceleyin.", "dekorasyon")
add("dekorasyon/dekoratif-objeler/masaustu-dekoratif-objeler", "Masaüstü Dekoratif Objeler", "Çalışma masası, dresuar ve sehpa üzerinde küçük ama etkili dokunuşlar sağlayan masaüstü dekoratif objeleri bulun.", "dekorasyon")
add("dekorasyon/dekoratif-objeler/gondollar", "Gondollar", "Sunum ve dekorasyon amacıyla kullanılabilen gondol modellerini biçim ve kullanım alanına göre karşılaştırın.", "dekorasyon")
add("dekorasyon/duvar-dekorasyonu", "Duvar Dekorasyonu", "Boş duvarları tamamlamak için dekoratif duvar aksesuarları ve farklı stil seçeneklerini keşfedin.", "duvar-dekorasyonu")
add("dekorasyon/mum-oda-kokusu", "Mum & Oda Kokusu", "Mum, mumluk ve oda kokusu seçenekleriyle evin farklı köşelerinde istediğiniz atmosferi oluşturun.", "mum-oda-kokusu")
add("dekorasyon/mum-oda-kokusu/mumlar-mumluklar", "Mumlar & Mumluklar", "Dekoratif mum ve mumluk modellerini sofra, sehpa ve yaşam alanı düzenlemelerinize uygun olarak inceleyin.", "mum-oda-kokusu")
add("dekorasyon/mum-oda-kokusu/oda-kokulari", "Oda Kokuları", "Ev için oda kokusu seçeneklerini kullanım alanı, koku karakteri ve sunum biçimine göre keşfedin.", "mum-oda-kokusu")

add("mutfak-sofra", "Mutfak & Sofra", "Günlük kullanım ve özel davetler için yemek takımı, fincan, bardak ve servis ürünlerini bir arada inceleyin.", "mutfak-sofra")
add("mutfak-sofra/sofra-takimlari", "Sofra Takımları", "Yemek ve kahvaltı takımları, bardaklar ve servis parçalarıyla günlük sofralar ve özel davetler için seçenekleri keşfedin.", "yemek-takimlari")
add("mutfak-sofra/kahve-icecek", "Kahve & İçecek", "Kahve ve çay fincanları, kupalar, kahve yanı bardakları, sürahi ve karaf modellerini bir arada inceleyin.", "kahve-fincanlari")
add("mutfak-sofra/mutfak-saklama", "Mutfak & Saklama", "Kavanoz ve saklama çözümleriyle mutfağınızı düzenleyin; dondurmalık seçeneklerini keşfedin.", "mutfak-saklama")
add("mutfak-sofra/yemek-takimlari", "Yemek Takımları", "Günlük sofralardan misafir ağırlamaya uzanan yemek takımı modellerini parça sayısı, biçim ve tasarıma göre keşfedin.", "yemek-takimlari", 1, "mutfak-sofra/sofra-takimlari")
add("mutfak-sofra/kahvalti-takimlari", "Kahvaltı Takımları", "Kahvaltı sofranızı tamamlayan tabak, kase ve sunum parçalarından oluşan kahvaltı takımı seçeneklerini inceleyin.", "yemek-takimlari", 0, "mutfak-sofra/sofra-takimlari")
add("mutfak-sofra/bardak-kadeh", "Bardak & Kadeh", "Su bardağı, meşrubat bardağı ve kadeh seçenekleriyle günlük ve davet sofralarına uygun parçaları inceleyin.", "bardak-kadeh", 0, "mutfak-sofra/sofra-takimlari")
add("mutfak-sofra/servis-sunum", "Servis & Sunum", "İkram ve sofra düzeni için servis tabağı, sunumluk ve tamamlayıcı sunum ürünlerini keşfedin.", "servis-sunum", 5, "mutfak-sofra/sofra-takimlari")
add("mutfak-sofra/tepsiler", "Tepsiler", "Kahve, çay ve ikram sunumlarında kullanılabilecek dekoratif ve işlevsel tepsi modellerini inceleyin.", "servis-sunum", 0, "mutfak-sofra/sofra-takimlari")
add("mutfak-sofra/kahve-fincanlari", "Kahve Fincanları", "Türk kahvesi ve farklı kahve sunumları için kahve fincanı takımı ve tekli fincan modellerine göz atın.", "kahve-fincanlari", 3, "mutfak-sofra/kahve-icecek")
add("mutfak-sofra/cay-fincanlari", "Çay Fincanları", "Çay saatine uygun çay fincanı modellerini takım, hacim ve tasarım seçenekleriyle değerlendirin.", "kahve-fincanlari", 0, "mutfak-sofra/kahve-icecek")
add("mutfak-sofra/kupalar", "Kupalar", "Kahve, çay ve sıcak içecekler için günlük kullanıma uygun kupa ve mug modellerini keşfedin.", "kahve-fincanlari", 4, "mutfak-sofra/kahve-icecek")
add("mutfak-sofra/kahve-yani-bardaklari", "Kahve Yanı Bardakları", "Türk kahvesi ikramını tamamlayan kahve yanı su bardağı modellerini sunum stilinize göre seçin.", "kahve-fincanlari", 0, "mutfak-sofra/kahve-icecek")
add("mutfak-sofra/surahi-karaf", "Sürahi & Karaf", "Su ve soğuk içecek sunumları için sürahi ve karaf modellerini malzeme ve kapasiteye göre keşfedin.", "bardak-kadeh", 0, "mutfak-sofra/kahve-icecek")
add("mutfak-sofra/kavanoz-saklama", "Kavanoz & Saklama", "Mutfak düzenini kolaylaştıran kavanoz ve saklama kabı seçeneklerini boyut ve kullanım amacına göre bulun.", "mutfak-sofra", 0, "mutfak-sofra/mutfak-saklama")
add("mutfak-sofra/dondurmalik", "Dondurmalık", "Dondurma ve tatlı ikramları için dondurmalık ve tatlı kasesi modellerini inceleyin.", "mutfak-sofra", 0, "mutfak-sofra/mutfak-saklama")

add("tekstil", "Tekstil", "Yatak odası ve sofra için nevresim, pike, örtü, runner ve kırlent seçeneklerini bir arada keşfedin.", "tekstil")
add("tekstil/yatak-odasi", "Yatak Odası", "Yatak odasına uygun nevresim takımı, pike ve yatak örtüsü seçeneklerini doku ve tasarıma göre inceleyin.", "tekstil")
add("tekstil/yatak-odasi/nevresim-takimlari", "Nevresim Takımları", "Tek kişilik ve çift kişilik nevresim takımı modellerini kumaş, desen ve ölçü seçenekleriyle karşılaştırın.", "nevresim-takimlari", 6)
add("tekstil/yatak-odasi/pike-takimlari", "Pike Takımları", "Mevsim geçişlerinde ve yaz aylarında kullanılabilecek pike takımı modellerini ölçü ve dokusuna göre seçin.", "nevresim-takimlari")
add("tekstil/yatak-odasi/yatak-ortuleri", "Yatak Örtüleri", "Yatak odasına düzenli bir görünüm veren yatak örtüsü modellerini renk, desen ve ölçüye göre keşfedin.", "nevresim-takimlari")
add("tekstil/sofra-tekstili", "Sofra Tekstili", "Masa örtüsü, runner ve Amerikan servis seçenekleriyle günlük veya özel gün sofralarınızı tamamlayın.", "tekstil")
add("tekstil/sofra-tekstili/masa-ortuleri", "Masa Örtüleri", "Yemek masasına uygun masa örtüsü modellerini ölçü, kumaş ve desen seçenekleriyle inceleyin.", "masa-ortuleri")
add("tekstil/sofra-tekstili/runner", "Runner", "Masa ortasında tek başına veya örtüyle birlikte kullanılabilecek runner modellerini keşfedin.", "masa-ortuleri")
add("tekstil/sofra-tekstili/amerikan-servisleri", "Amerikan Servisleri", "Tabak altı düzeni ve masa koruması için Amerikan servis modellerini farklı malzeme ve tasarımlarla inceleyin.", "masa-ortuleri")
add("tekstil/kirlent", "Kırlent", "Koltuk ve yatak dekorasyonunu tamamlayan kırlent modellerini renk, doku ve ölçüye göre keşfedin.", "kirlent", 7)

add("banyo", "Banyo", "Banyo düzeni için havlu, banyo seti ve paspas seçeneklerini uyumlu renk ve dokularla inceleyin.", "banyo")
add("banyo/havlu", "Havlu", "El, yüz ve banyo havlusu modellerini ölçü, doku ve kullanım ihtiyacına göre değerlendirin.", "havlu", 8)
add("banyo/banyo-setleri", "Banyo Setleri", "Sabunluk, diş fırçalık ve tamamlayıcı parçalardan oluşan banyo seti modellerini keşfedin.", "banyo")
add("banyo/banyo-paspaslari", "Banyo Paspasları", "Banyo zemini için uygun paspas modellerini ölçü, malzeme ve tasarıma göre inceleyin.", "banyo")

add("yapay-cicek-bitki", "Yapay Çiçek & Bitki", "Bakım gerektirmeyen dekoratif düzenlemeler için yapay çiçek ve yapay ağaç seçeneklerini keşfedin.", "yapay-cicek-bitki")
add("yapay-cicek-bitki/yapay-cicekler", "Yapay Çiçekler", "Vazo ve aranjmanlarda kullanılabilecek yapay çiçek modellerini renk, boy ve çiçek türüne göre inceleyin.", "yapay-cicekler", 9)
add("yapay-cicek-bitki/yapay-agaclar", "Yapay Ağaçlar", "Salon, antre ve ofis köşeleri için dekoratif yapay ağaç modellerini boyut ve görünümüne göre keşfedin.", "yapay-cicekler")

add("yilbasi-urunleri", "Yılbaşı Ürünleri", "Yılbaşı ağacı, süs ve sofra dekorasyonu seçenekleriyle kutlama hazırlıklarını tek bir kategoride planlayın.", "yilbasi-urunleri", 10)

const brands = ["ZK Home", "Mikasa Moor", "Lucky Art", "La Medore"]
const brandSlug = (name) => name.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
const seoTitles = {
  dekorasyon: "Ev Dekorasyon Ürünleri | ZK Home",
  "mutfak-sofra": "Mutfak ve Sofra Ürünleri | ZK Home",
  tekstil: "Ev Tekstili Ürünleri | ZK Home",
  banyo: "Banyo Ürünleri | ZK Home",
  "yapay-cicek-bitki": "Yapay Çiçek ve Bitki Modelleri | ZK Home",
  "yilbasi-urunleri": "Yılbaşı Süsleri ve Dekorasyonu | ZK Home",
}
const listingTitles = {
  dekorasyon: "Dekorasyon Ürünleri",
  "dekorasyon/dekoratif-objeler": "Dekoratif Obje Modelleri",
  "dekorasyon/dekoratif-objeler/vazolar": "Vazo Modelleri",
  "dekorasyon/dekoratif-objeler/dekoratif-kupler": "Dekoratif Küp Modelleri",
  "dekorasyon/dekoratif-objeler/saksilar": "Saksı Modelleri",
  "dekorasyon/dekoratif-objeler/jardenyer": "Jardenyer Modelleri",
  "dekorasyon/dekoratif-objeler/dekoratif-tabak-kaseler": "Dekoratif Tabak ve Kase Modelleri",
  "dekorasyon/dekoratif-objeler/masaustu-dekoratif-objeler": "Masaüstü Dekoratif Obje Modelleri",
  "dekorasyon/dekoratif-objeler/gondollar": "Gondol Modelleri",
  "dekorasyon/duvar-dekorasyonu": "Duvar Dekorasyonu Ürünleri",
  "dekorasyon/mum-oda-kokusu": "Mum ve Oda Kokusu Ürünleri",
  "dekorasyon/mum-oda-kokusu/mumlar-mumluklar": "Mum ve Mumluk Modelleri",
  "dekorasyon/mum-oda-kokusu/oda-kokulari": "Oda Kokusu Çeşitleri",
  "mutfak-sofra": "Mutfak ve Sofra Ürünleri",
  "mutfak-sofra/sofra-takimlari": "Sofra Takımı Modelleri",
  "mutfak-sofra/kahve-icecek": "Kahve ve İçecek Ürünleri",
  "mutfak-sofra/mutfak-saklama": "Mutfak ve Saklama Ürünleri",
  "mutfak-sofra/yemek-takimlari": "Yemek Takımı Ürünleri",
  "mutfak-sofra/kahvalti-takimlari": "Kahvaltı Takımı Modelleri",
  "mutfak-sofra/kahve-fincanlari": "Kahve Fincanı Modelleri",
  "mutfak-sofra/cay-fincanlari": "Çay Fincanı Modelleri",
  "mutfak-sofra/kupalar": "Kupa Modelleri",
  "mutfak-sofra/kahve-yani-bardaklari": "Kahve Yanı Bardak Modelleri",
  "mutfak-sofra/bardak-kadeh": "Bardak ve Kadeh Modelleri",
  "mutfak-sofra/servis-sunum": "Servis ve Sunum Ürünleri",
  "mutfak-sofra/tepsiler": "Tepsi Modelleri",
  "mutfak-sofra/kavanoz-saklama": "Kavanoz ve Saklama Ürünleri",
  "mutfak-sofra/surahi-karaf": "Sürahi ve Karaf Modelleri",
  "mutfak-sofra/dondurmalik": "Dondurmalık Modelleri",
  tekstil: "Ev Tekstili Ürünleri",
  "tekstil/yatak-odasi": "Yatak Odası Tekstili",
  "tekstil/yatak-odasi/nevresim-takimlari": "Nevresim Takımı Modelleri",
  "tekstil/yatak-odasi/pike-takimlari": "Pike Takımı Modelleri",
  "tekstil/yatak-odasi/yatak-ortuleri": "Yatak Örtüsü Modelleri",
  "tekstil/sofra-tekstili": "Sofra Tekstili Ürünleri",
  "tekstil/sofra-tekstili/masa-ortuleri": "Masa Örtüsü Modelleri",
  "tekstil/sofra-tekstili/runner": "Runner Modelleri",
  "tekstil/sofra-tekstili/amerikan-servisleri": "Amerikan Servis Modelleri",
  "tekstil/kirlent": "Kırlent Modelleri",
  banyo: "Banyo Ürünleri",
  "banyo/havlu": "Havlu Modelleri",
  "banyo/banyo-setleri": "Banyo Seti Modelleri",
  "banyo/banyo-paspaslari": "Banyo Paspası Modelleri",
  "yapay-cicek-bitki": "Yapay Çiçek ve Bitki Modelleri",
  "yapay-cicek-bitki/yapay-cicekler": "Yapay Çiçek Modelleri",
  "yapay-cicek-bitki/yapay-agaclar": "Yapay Ağaç Modelleri",
  "yilbasi-urunleri": "Yılbaşı Ürünleri",
}
if (Object.keys(listingTitles).length !== entries.length || entries.some((entry) => !listingTitles[entry.path])) {
  throw new Error("Her kategori için ürün listesi başlığı tanımlanmalı")
}
const seoTitleFor = (entry) => seoTitles[entry.path] || `${listingTitles[entry.path]} | ZK Home`
const client = new pg.Client({ connectionString: env.DATABASE_URL, ssl: /localhost|127\.0\.0\.1/.test(env.DATABASE_URL) ? false : { rejectUnauthorized: false } })
await client.connect()
try {
  await client.query("BEGIN")
  const ids = new Map()
  for (const entry of entries) {
    const id = `pcat_zk_${entry.path.replace(/[^a-z0-9]/g, "_")}`
    const parentId = entry.parent ? ids.get(entry.parent) : null
    if (entry.parent && !parentId) throw new Error(`Üst kategori eksik: ${entry.parent}`)
    const iconPath = entry.icon ? `/category-icons/${entry.icon}.svg` : ""
    const metadata = {
      seo_title: seoTitleFor(entry),
      seo_description: entry.description,
      product_list_title: listingTitles[entry.path],
      pretty_url: true,
      is_indexable: false,
      card_image_url: iconPath,
      card_title: entry.name,
      card_description: entry.description,
      show_on_homepage: entry.homeOrder > 0,
      homepage_order: entry.homeOrder,
      icon: iconPath,
    }
    await client.query(
      `INSERT INTO store_category (id,name,handle,description,parent_id,rank,active,metadata)
       VALUES ($1,$2,$3,$4,$5,$6,true,$7::jsonb) ON CONFLICT (handle) DO NOTHING`,
      [id, entry.name, entry.path, entry.description, parentId, entry.rank, JSON.stringify(metadata)]
    )
    const existing = await client.query("SELECT id FROM store_category WHERE handle=$1", [entry.path])
    ids.set(entry.path, existing.rows[0].id)
    await client.query(
      `UPDATE store_category SET metadata=jsonb_set(metadata, '{seo_title}', to_jsonb($2::text))
       WHERE handle=$1 AND metadata->>'seo_title'=$3`,
      [entry.path, seoTitleFor(entry), `${entry.name} Modelleri ve Fiyatları | ZK Home`]
    )
    await client.query(
      `UPDATE store_category SET metadata=jsonb_set(metadata, '{product_list_title}', to_jsonb($2::text))
       WHERE handle=$1 AND NOT (metadata ? 'product_list_title')`,
      [entry.path, listingTitles[entry.path]]
    )
    await client.query(
      `UPDATE store_category SET metadata=jsonb_set(metadata, '{seo_description}', to_jsonb($2::text))
       WHERE handle=$1 AND metadata->>'seo_description'=$3`,
      [entry.path, entry.description, `${entry.description} ZK Home'da seçenekleri inceleyin.`]
    )
  }
  for (let index = 0; index < brands.length; index++) {
    const name = brands[index]
    const handle = brandSlug(name)
    await client.query(
      `INSERT INTO store_collection (id,title,handle,metadata) VALUES ($1,$2,$3,$4::jsonb)
       ON CONFLICT (handle) DO NOTHING`,
      [`pcol_zk_${handle.replace(/-/g, "_")}`, name, handle, JSON.stringify({
        description: `${name} ürünlerini ve yeni koleksiyonlarını ZK Home'da keşfedin.`,
        seo_title: `${name} Ürünleri | ZK Home`,
        seo_description: `${name} ev ve yaşam ürünlerini ZK Home'da inceleyin. Koleksiyon seçeneklerini ve ürün detaylarını keşfedin.`,
        is_indexable: false,
        active: true, featured: true, sort_order: index + 1,
      })]
    )
    await client.query(
      `UPDATE store_collection SET metadata = metadata || $2::jsonb
       WHERE id=$1 AND NOT (metadata ? 'seo_title')`,
      [`pcol_zk_${handle.replace(/-/g, "_")}`, JSON.stringify({
        seo_title: `${name} Ürünleri | ZK Home`,
        seo_description: `${name} ev ve yaşam ürünlerini ZK Home'da inceleyin. Koleksiyon seçeneklerini ve ürün detaylarını keşfedin.`,
        is_indexable: false,
      })]
    )
  }
  await client.query("COMMIT")
  console.log(`${entries.length} kategori ve ${brands.length} marka kontrol edildi.`)
} catch (error) {
  await client.query("ROLLBACK")
  throw error
} finally {
  await client.end()
}
