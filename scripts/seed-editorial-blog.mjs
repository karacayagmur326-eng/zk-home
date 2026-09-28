/** Seed three useful, admin-editable inspiration articles once. */
import fs from "node:fs"
import pg from "pg"

const env = Object.fromEntries(fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8")
  .split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("="))
  .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]))
if (!env.DATABASE_URL) throw new Error("DATABASE_URL gerekli")

const categories = [
  ["editorial-sofra", "Sofra Fikirleri", "sofra-fikirleri", "utensils", "Sofra düzeni ve sunum önerileri", 1],
  ["editorial-yasam", "Yaşam Alanları", "yasam-alanlari", "sofa", "Ev tekstili ve yaşam alanı önerileri", 2],
  ["editorial-dekorasyon", "Dekorasyon", "dekorasyon-fikirleri", "flower", "Dekoratif obje ve renk önerileri", 3],
]

const posts = [
  {
    id: "editorial-yilbasi-sofrasi", category: "editorial-sofra", slug: "yilbasi-sofrasi-nasil-hazirlanir",
    title: "Yılbaşı sofrası nasıl hazırlanır?",
    excerpt: "Sade bir renk paleti, ölçülü süsler ve rahat bir yerleşimle sıcak bir yılbaşı sofrası kurun.",
    image: "/editorial/article-holiday-table.png",
    content: `<h2>Önce sofranın düzenini planlayın</h2><p>Yılbaşı sofrasında güzel bir görünüm kadar rahat bir kullanım da önemlidir. Masanın ölçüsünü ve kaç kişiyi ağırlayacağınızı belirleyin; tabak, bardak ve servis parçaları için yeterli alan bırakın. Uzun bir masa örtüsü kullanacaksanız sandalye hareketini engellemediğinden emin olun.</p><h2>Az sayıda renk ve doku seçin</h2><p>Krem, sıcak beyaz ve doğal ahşap tonlarını temel alıp bir vurgu rengi eklemek sofrayı sakin tutar. Keten görünümlü peçeteler, seramik tabaklar ve birkaç küçük mum farklı dokular yaratır. Yüksek bir aranjman yerine alçak süsler seçmek karşılıklı sohbeti kolaylaştırır.</p><h2>Servisi kolaylaştırın</h2><p>İkram tabaklarını önceden gruplayın; sık kullanılacak servis parçalarını erişilebilir konumda tutun. Mumları yanıcı süslerden uzak, gözetim altında kullanın. <a href="/mutfak-sofra/servis-sunum">Servis ve sunum seçeneklerine</a> göz atarak sofranızın eksik parçalarını tamamlayabilirsiniz.</p>`,
  },
  {
    id: "editorial-kis-ev", category: "editorial-yasam", slug: "kis-aylarinda-evi-sicak-gostermek",
    title: "Kış aylarında evinizi daha sıcak ve davetkâr hâle getirin",
    excerpt: "Kırlent, örtü, ışık ve doğal tonlarla yaşam alanınızda dengeli bir kış atmosferi oluşturun.",
    image: "/editorial/article-winter-home.png",
    content: `<h2>Dokuları katmanlayın</h2><p>Bir odanın daha sıcak görünmesi için büyük mobilyaları değiştirmek gerekmez. Koltuk üzerine farklı dokuda birkaç kırlent ve hafif bir örtü eklemek oturma alanını yumuşatır. Renkleri birbirine yakın tutup bir veya iki vurgu tonu seçmek görsel kalabalığı önler.</p><h2>Işığı ve yerleşimi düşünün</h2><p>Gün ışığını perdeyle tamamen kapatmadan değerlendirin. Akşamları tek güçlü ışık yerine birkaç yumuşak ışık kaynağı daha rahat bir atmosfer kurabilir. Mum kullanıyorsanız ürünü ısıya dayanıklı zeminde ve gözetim altında tutun.</p><h2>Küçük köşelere odaklanın</h2><p>Bir sehpa üzerindeki vazo, bir tepsi veya mevsime uygun dallar düzeni yenileyebilir. Odanın geçiş alanlarını açık bırakın; seçtiğiniz dekoratif objeleri mobilya ölçüleriyle dengeleyin. <a href="/tekstil/kirlent">Kırlent seçenekleri</a> bu değişime kolay bir başlangıç olabilir.</p>`,
  },
  {
    id: "editorial-kucuk-dokunuslar", category: "editorial-dekorasyon", slug: "dekorasyonda-kucuk-dokunuslarla-buyuk-degisim",
    title: "Dekorasyonda küçük dokunuşlarla büyük değişim",
    excerpt: "Vazo, duvar objesi ve sofra aksesuarlarıyla evinizin karakterini adım adım yenileyin.",
    image: "/editorial/collection-decor.png",
    content: `<h2>Bir odak noktası belirleyin</h2><p>Her köşeyi aynı anda değiştirmek yerine önce konsol, sehpa veya boş bir duvar seçin. Mevcut mobilyaların rengi ve ölçüsüyle uyumlu birkaç parça eklemek daha bütünlüklü bir sonuç verir.</p><h2>Yükseklik ve boşlukla denge kurun</h2><p>Farklı boydaki vazoları ve objeleri yan yana kullanırken aralarında nefes alacak boşluk bırakın. Canlı çiçek için vazo kullanacaksanız suya uygunluğunu kontrol edin; yapay çiçeklerde dal boyunu vazo oranıyla karşılaştırın.</p><h2>Günlük kullanımı unutmayın</h2><p>Güzel görünen bir düzenin rahat temizlenmesi ve yaşadığınız alanı daraltmaması da önemlidir. Çocuk veya evcil hayvan bulunan evlerde kırılabilir parçaları güvenli yerlere koyun. <a href="/dekorasyon/dekoratif-objeler">Dekoratif obje seçeneklerini</a> inceleyerek kendi odak noktanıza uygun parçaları seçebilirsiniz.</p>`,
  },
]

const db = new pg.Client({ connectionString: env.DATABASE_URL, ssl: /localhost|127\.0\.0\.1/.test(env.DATABASE_URL) ? false : { rejectUnauthorized: false } })
try {
  await db.connect()
  await db.query("BEGIN")
  for (const row of categories) {
    await db.query(`INSERT INTO blog_categories (id, name, slug, icon, description, sort_order)
      VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`, row)
  }
  for (const post of posts) {
    await db.query(`INSERT INTO blog_posts (id, title, slug, category_id, excerpt, content, image, author, reading_time, status, featured, seo_title, seo_description, published_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'ZK Home Editörleri','3 dk','published',TRUE,$2,$5,NOW())
      ON CONFLICT (id) DO NOTHING`, [post.id, post.title, post.slug, post.category, post.excerpt, post.content, post.image])
  }
  await db.query("COMMIT")
  console.log("İlham Köşesi için üç blog yazısı eklendi; mevcut yazılar korunuyor.")
} catch (error) {
  await db.query("ROLLBACK")
  throw error
} finally {
  await db.end()
}
