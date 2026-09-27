# ZK Home Storefront

Bağımsız ZK Home e-ticaret uygulaması. Kod tabanı temiz bir mağaza başlangıcıdır; ürün, müşteri, sipariş, görsel, entegrasyon ve canlı ortam verisi içermez.

## İzolasyon kuralları

- Başka projelerin `.env`, `.vercel`, Git geçmişi, veritabanı, medya ve entegrasyon anahtarları bu projeye kopyalanmaz.
- ZK Home için ayrı Supabase ve Vercel projeleri kullanılır.
- Canlı ortamda medya yüklemek için kalıcı depolama yapılandırılmadan yükleme açılmaz.
- Chatbot, ödeme rozetleri, doğrulanmamış iletişim bilgileri ve SEO indeksleme başlangıçta kapalıdır.

## Yerel kurulum

1. `.env.example` dosyasını `.env.local` adıyla kopyalayın.
2. ZK Home'a ait yeni bağlantıları ve güçlü, benzersiz sırları ekleyin.
3. `pnpm install` ve ardından `pnpm dev` çalıştırın.
4. İlk boş veritabanı kurulumu sırasında `RUN_SCHEMA_BOOTSTRAP=1` kullanın; tablolar oluşunca değeri tekrar `0` yapın.

## Canlıya çıkmadan önce

- Yeni Supabase projesi ve Storage bucket'ı oluşturulmalı.
- Yeni Vercel projesi bu klasöre bağlanmalı.
- `zk-home.com` yalnızca yeni Vercel projesine yönlendirilmeli.
- Firma, KVKK, satış, teslimat, iade ve iletişim metinleri gerçek bilgilerle girilmeli.
- Ödeme, e-fatura, e-posta ve AI entegrasyonları yeni hesaplarla tek tek doğrulanmalı.
- İçerik hazırlandıktan sonra SEO indeksleme açılmalı.

Vercel yüklemesine yalnızca uygulamanın çalışması için gereken kaynaklar gider; yerel ortam dosyaları, belgeler, test çıktıları, migration klasörü ve yüklemeler `.vercelignore` ile hariç tutulur.
