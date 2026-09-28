# E-Ticaret Kategori Mimarisi ve Global SEO Uygulama Planı

Bu doküman, aşağıdaki kategori yapısını temel alarak e-ticaret sitesinde kategori mimarisinin, URL yapısının, teknik SEO kurallarının ve Codex uygulama adımlarının standartlaştırılması için hazırlanmıştır.

Amaç:

- Kullanıcıların ürünleri hızlı ve anlaşılır biçimde bulmasını sağlamak
- Kategori hiyerarşisini sade ve ölçeklenebilir tutmak
- SEO açısından gereksiz kategori çoğalmasını engellemek
- Duplicate content ve cannibalization risklerini azaltmak
- Kategori, ürün ve filtre sayfalarının indekslenmesini kontrollü yönetmek
- İleride çoklu dil desteğine hazır bir mimari kurmak
- Mevcut SEO değerini koruyarak güvenli migration yapmak

---

# 1. Ana Kategori Yapısı

Ana navigasyon aşağıdaki kategorilerden oluşacaktır:

1. Dekorasyon
2. Mutfak & Sofra
3. Tekstil
4. Banyo
5. Yapay Çiçek & Bitki
6. Yılbaşı Ürünleri
7. Markalar

> Not: Ana kategori sayısı gereksiz şekilde artırılmamalıdır. Yeni ana kategori ancak yeterli ürün hacmi, belirgin kullanıcı niyeti ve bağımsız navigasyon ihtiyacı oluştuğunda eklenmelidir.

---

# 2. Nihai Kategori Ağacı

## DEKORASYON

### Dekoratif Objeler

- Vazolar
- Dekoratif Küpler
- Saksılar
- Jardenyer
- Dekoratif Tabak & Kaseler
- Masaüstü Dekoratif Objeler
- Gondollar

### Duvar Dekorasyonu

### Mum & Oda Kokusu

- Mumlar & Mumluklar
- Oda Kokuları

---

## MUTFAK & SOFRA

- Yemek Takımları
- Kahvaltı Takımları
- Kahve Fincanları
- Çay Fincanları
- Kupalar
- Kahve Yanı Bardakları
- Bardak & Kadeh
- Servis & Sunum
- Tepsiler
- Kavanoz & Saklama
- Sürahi & Karaf
- Dondurmalık

---

## TEKSTİL

### Yatak Odası

- Nevresim Takımları
- Pike Takımları
- Yatak Örtüleri

### Sofra Tekstili

- Masa Örtüleri
- Runner
- Amerikan Servisleri

### Kırlent

---

## BANYO

- Havlu
- Banyo Setleri
- Banyo Paspasları

---

## YAPAY ÇİÇEK & BİTKİ

- Yapay Çiçekler
- Yapay Ağaçlar

---

## YILBAŞI ÜRÜNLERİ

Yılbaşı ürünleri bağımsız ana kategori olarak yönetilecektir.

Ürün sayısı arttığında aşağıdaki gibi alt kategorilere ayrılabilir:

- Yılbaşı Süsleri
- Yılbaşı Masa Dekorasyonu
- Yılbaşı Tekstili
- Yılbaşı Dekoratif Objeleri
- Yılbaşı Ağaçları
- Yılbaşı Aydınlatmaları

Bu alt kategoriler, yeterli ürün hacmi oluşmadan oluşturulmamalıdır.

---

## MARKALAR

- ZK Home
- Mikasa Moor
- Lucky Art
- La Medore

Marka sayfaları kategori sayfası değil, marka landing page mantığında ele alınmalıdır.

---

# 3. Önerilen URL Mimarisi

URL yapısı:

- kısa
- okunabilir
- küçük harfli
- ASCII uyumlu
- Türkçe karakter içermeyen
- gereksiz parametrelerden arındırılmış
- kalıcı

olmalıdır.

## Ana kategoriler

```text
/dekorasyon
/mutfak-sofra
/tekstil
/banyo
/yapay-cicek-bitki
/yilbasi-urunleri
/markalar
```

---

# 4. Kategori URL Slug Listesi

## Dekorasyon

```text
/dekorasyon
/dekorasyon/dekoratif-objeler
/dekorasyon/dekoratif-objeler/vazolar
/dekorasyon/dekoratif-objeler/dekoratif-kupler
/dekorasyon/dekoratif-objeler/saksilar
/dekorasyon/dekoratif-objeler/jardenyer
/dekorasyon/dekoratif-objeler/dekoratif-tabak-kaseler
/dekorasyon/dekoratif-objeler/masaustu-dekoratif-objeler
/dekorasyon/dekoratif-objeler/gondollar
/dekorasyon/duvar-dekorasyonu
/dekorasyon/mum-oda-kokusu
/dekorasyon/mum-oda-kokusu/mumlar-mumluklar
/dekorasyon/mum-oda-kokusu/oda-kokulari
```

## Mutfak & Sofra

```text
/mutfak-sofra
/mutfak-sofra/yemek-takimlari
/mutfak-sofra/kahvalti-takimlari
/mutfak-sofra/kahve-fincanlari
/mutfak-sofra/cay-fincanlari
/mutfak-sofra/kupalar
/mutfak-sofra/kahve-yani-bardaklari
/mutfak-sofra/bardak-kadeh
/mutfak-sofra/servis-sunum
/mutfak-sofra/tepsiler
/mutfak-sofra/kavanoz-saklama
/mutfak-sofra/surahi-karaf
/mutfak-sofra/dondurmalik
```

## Tekstil

```text
/tekstil
/tekstil/yatak-odasi
/tekstil/yatak-odasi/nevresim-takimlari
/tekstil/yatak-odasi/pike-takimlari
/tekstil/yatak-odasi/yatak-ortuleri
/tekstil/sofra-tekstili
/tekstil/sofra-tekstili/masa-ortuleri
/tekstil/sofra-tekstili/runner
/tekstil/sofra-tekstili/amerikan-servisleri
/tekstil/kirlent
```

## Banyo

```text
/banyo
/banyo/havlu
/banyo/banyo-setleri
/banyo/banyo-paspaslari
```

## Yapay Çiçek & Bitki

```text
/yapay-cicek-bitki
/yapay-cicek-bitki/yapay-cicekler
/yapay-cicek-bitki/yapay-agaclar
```

## Yılbaşı Ürünleri

```text
/yilbasi-urunleri
```

## Markalar

```text
/markalar
/markalar/zk-home
/markalar/mikasa-moor
/markalar/lucky-art
/markalar/la-medore
```

---

# 5. Hiyerarşi Kuralları

Kategori sistemi mümkün olduğunca şu yapıyı aşmamalıdır:

```text
Ana Kategori
└── Alt Kategori
    └── Ürün Tipi
```

Maksimum önerilen kategori derinliği:

```text
3 seviye
```

Örnek:

```text
Dekorasyon
└── Dekoratif Objeler
    └── Vazolar
```

Gereksiz 4. ve 5. seviye kategori açılmamalıdır.

---

# 6. Kategori Açma Kriterleri

Yeni bir kategori yalnızca aşağıdaki şartlardan biri veya birkaçı oluştuğunda açılmalıdır:

- Belirgin kullanıcı arama niyeti varsa
- Yeterli ürün sayısı varsa
- Mevcut kategoriden anlamlı biçimde ayrışıyorsa
- Navigasyonda kullanıcıya gerçek fayda sağlıyorsa
- SEO açısından bağımsız landing page olmayı hak ediyorsa

Sadece 1-2 ürün olduğu için kategori açılmamalıdır.

---

# 7. Kategori Sayfalarının SEO Yapısı

Her indekslenebilir kategori sayfasında aşağıdakiler bulunmalıdır:

- Benzersiz `<title>`
- Benzersiz meta description
- Tek bir H1
- Kısa kategori açıklaması
- Ürün grid/listesi
- Breadcrumb
- İç bağlantılar
- Canonical
- Index/follow kontrolü
- Structured data
- Pagination yönetimi

---

# 8. Title Standardı

Önerilen genel yapı:

```text
{Kategori Adı} | Marka Adı
```

Alternatif:

```text
{Kategori Adı} Modelleri ve Fiyatları | Marka Adı
```

Arama niyeti ve kategori bağlamına göre özelleştirilebilir.

---

# 9. Meta Description Standardı

Meta açıklamalar:

- benzersiz olmalı
- kategori bağlamını doğru anlatmalı
- spam anahtar kelime tekrarından kaçınmalı
- kullanıcıyı yanıltmamalı
- otomatik oluşturuluyorsa boş ve anlamsız cümle üretmemeli

---

# 10. H1 Standardı

Her kategori sayfasında yalnızca bir ana H1 bulunmalıdır.

Örnek:

```text
Vazolar
Kahve Fincanları
Nevresim Takımları
Yapay Çiçekler
```

---

# 11. Kategori Açıklamaları

Kategori açıklamaları:

- kullanıcıya gerçek bilgi vermeli
- kategori bağlamını açıklamalı
- sadece SEO için yazılmış yapay metin olmamalı
- ürün grid'ini aşağı itmemeli

Üst bölüm için kısa ve net içerik tercih edilmelidir.

---

# 12. Breadcrumb Yapısı

Her kategori sayfası breadcrumb göstermelidir.

Örnek:

```text
Ana Sayfa > Dekorasyon > Dekoratif Objeler > Vazolar
```

Structured data tarafında `BreadcrumbList` kullanılmalıdır.

---

# 13. Canonical Kuralları

Normal kategori sayfasında self-canonical kullanılmalıdır.

Filtre, sıralama ve tracking parametreleri canonical URL'yi değiştirmemelidir.

Örnek:

```text
/dekorasyon/dekoratif-objeler/vazolar?sort=price-asc
```

canonical:

```text
/dekorasyon/dekoratif-objeler/vazolar
```

---

# 14. Filtre ve Faceted Navigation

Filtre sistemi kontrolsüz indekslenmemelidir.

Örnek filtreler:

- Marka
- Renk
- Fiyat
- Malzeme
- Ölçü
- Koleksiyon
- Stok durumu

Filtre URL'leri varsayılan olarak bağımsız SEO landing page sayılmamalıdır.

---

# 15. Sıralama Parametreleri

Aşağıdaki parametreler yeni indekslenebilir URL üretmemelidir:

```text
?sort=price-asc
?sort=price-desc
?sort=newest
?sort=popular
```

---

# 16. Pagination

Ürün sayısı yüksek kategorilerde pagination kullanılabilir.

Infinite scroll kullanılıyorsa botların ulaşabileceği gerçek pagination URL'leri de bulunmalıdır.

---

# 17. Marka Sayfaları

Marka sayfaları ayrı landing page olarak oluşturulmalıdır.

Örnek:

```text
/markalar/lucky-art
```

Marka filtre URL'leri ile marka landing page'leri duplicate oluşturmamalıdır.

---

# 18. Ürün-Kategori İlişkisi

Bir ürün gerektiğinde birden fazla kategoride listelenebilir.

Ancak ürünün tek bir canonical ürün URL'si olmalıdır.

Kategori değiştiğinde ürün URL'si mümkün olduğunca değişmemelidir.

---

# 19. Structured Data

Kategori sayfasında kullanılabilecek yapılar:

```text
BreadcrumbList
ItemList
```

Ürün sayfalarında:

```text
Product
Offer
AggregateRating
Review
BreadcrumbList
```

Sadece sayfada gerçekten bulunan veri structured data içine eklenmelidir.

---

# 20. XML Sitemap

Sitemap ayrı gruplara bölünebilir:

```text
/sitemap.xml
/sitemap-categories.xml
/sitemap-products.xml
/sitemap-brands.xml
/sitemap-pages.xml
```

Sitemap yalnızca canonical, indekslenebilir ve 200 durum kodu dönen URL'leri içermelidir.

---

# 21. Robots ve Index Yönetimi

Aşağıdaki sayfalar varsayılan olarak indekslenmemelidir:

- dahili arama sonuçları
- sepet
- ödeme
- hesap
- login
- filtre kombinasyonları
- sıralama parametreleri
- geçici kampanya URL'leri
- tracking parametreleri

---

# 22. Duplicate Content Kontrolü

Aynı ürün grubunu hedefleyen gereksiz kategori sayfaları oluşturulmamalıdır.

Tek güçlü canonical kategori kullanılmalıdır.

---

# 23. Cannibalization Kontrolü

Her kategori mümkün olduğunca farklı bir ana kullanıcı niyetini hedeflemelidir.

Örneğin `Mumlar & Mumluklar` tek kategori olarak yönetiliyorsa, ürün hacmi ve arama niyeti bunu gerektirmedikçe ayrıca `Mumlar` ve `Mumluklar` kategorileri oluşturulmamalıdır.

---

# 24. Internal Linking

Ana kategoriler şu akışta erişilebilir olmalıdır:

```text
Ana Sayfa
↓
Ana Kategori
↓
Alt Kategori
↓
Ürün
```

Kategori sayfaları birbirine bağlamsal olarak bağlanabilir.

---

# 25. Menü ve Mega Menü

Desktop mega menüde ana kategoriler sabit kalmalıdır:

```text
Dekorasyon
Mutfak & Sofra
Tekstil
Banyo
Yapay Çiçek & Bitki
Yılbaşı Ürünleri
Markalar
```

Mobil menü accordion veya drill-down mantığında çalışabilir.

---

# 26. Çoklu Dil Hazırlığı

Site ileride çoklu dile açılacaksa URL mimarisi buna uyumlu olmalıdır.

Her dil URL'si:

- kendi canonical'ına sahip olmalı
- karşılıklı hreflang kullanmalı
- gerçek çevrilmiş içerik barındırmalı

---

# 27. Redirect ve Migration Kuralları

Mevcut sitede eski kategori URL'leri varsa silinmeden önce mapping yapılmalıdır.

Kurallar:

- 301 kullanılmalı
- redirect chain oluşturulmamalı
- eski URL doğrudan yeni nihai URL'ye gitmeli
- hiçbir URL körlemesine 404'e düşürülmemeli

---

# 28. 404 Yönetimi

Gerçekten kaldırılan ve eşdeğeri olmayan kategori 404 veya 410 dönebilir.

Her eski kategori ana sayfaya 301 yönlendirilmemelidir.

---

# 29. Core Web Vitals

Kategori sayfalarında özellikle kontrol edilmelidir:

- LCP
- INP
- CLS

---

# 30. Görsel SEO

Kategori ve ürün görselleri için:

- anlamlı dosya adı
- doğru width / height
- responsive images
- WebP / AVIF
- uygun `alt`
- lazy loading

kullanılmalıdır.

---

# 31. Codex Uygulama Talimatı

Codex kategori yapısını doğrudan yeniden yazmaya başlamamalıdır.

Önce mevcut projeyi analiz et.

Aşağıdaki alanları tespit et:

1. Framework ve routing yapısı
2. Kategori veri modeli
3. Product model
4. Product-category ilişkisi
5. Mevcut category slug sistemi
6. Mevcut ürün URL yapısı
7. Metadata sistemi
8. Canonical implementasyonu
9. robots.txt
10. sitemap
11. schema / structured data
12. breadcrumb
13. filtre sistemi
14. pagination
15. marka sistemi
16. mevcut redirect'ler
17. mevcut indekslenebilir kategori URL'leri

Ardından:

```text
MEVCUT DURUM
↓
HEDEF YAPI
↓
FARK ANALİZİ
↓
MIGRATION PLANI
↓
UYGULAMA
↓
TEST
```

sırasıyla ilerle.

---

# 32. Codex İçin Veri Modeli Beklentisi

Kategori modelinde en az aşağıdaki alanlar bulunmalıdır:

```text
id
name
slug
parent_id
description
seo_title
seo_description
canonical_url
is_indexable
is_active
sort_order
created_at
updated_at
```

Gerekirse:

```text
image
icon
locale
translation_key
```

eklenebilir.

Kategori ağacı mümkün olduğunca veri tabanı veya CMS üzerinden yönetilebilir olmalıdır.

---

# 33. Navigation ve SEO Ayrımı

Menü hiyerarşisi ile SEO landing page yapısı aynı veri kaynağından beslense de birebir aynı olmak zorunda değildir.

Örneğin Mutfak & Sofra altında Kahve Fincanları, Çay Fincanları ve Kupalar doğrudan listelenebilir.

Bunları sırf görsel olarak gruplayabilmek için gereksiz bir `/kahve-cay/` ara URL'si üretmek zorunlu değildir.

---

# 34. Yılbaşı Kategorisi

Yılbaşı ürünleri sezonluk olsa da URL her yıl korunmalıdır.

Sezon dışında:

- URL silinmemeli
- kategori geçmiş SEO değerini kaybetmemeli
- aynı URL sonraki sezonda yeniden kullanılmalı

---

# 35. Stokta Ürün Kalmayan Kategoriler

Kategori geçici olarak stok dışı kaldığında doğrudan silinmemelidir.

Duruma göre ilgili ürünler, benzer kategoriler veya yeniden stok bilgisi gösterilebilir.

---

# 36. SEO Kabul Kriterleri

Uygulama tamamlandığında aşağıdakilerin tamamı test edilmelidir:

- [ ] Tüm ana kategoriler çalışıyor
- [ ] Tüm alt kategori URL'leri 200 dönüyor
- [ ] URL slug'ları standarda uygun
- [ ] Türkçe karakter URL'de yok
- [ ] Canonical doğru
- [ ] Her kategori tek H1 kullanıyor
- [ ] Title duplicate değil
- [ ] Meta description duplicate değil
- [ ] Breadcrumb doğru
- [ ] Breadcrumb schema doğru
- [ ] Filter URL'leri kontrol altında
- [ ] Sort URL'leri indeks üretmiyor
- [ ] Sitemap sadece canonical URL içeriyor
- [ ] Eski URL'ler 301 ile doğru hedefe gidiyor
- [ ] Redirect chain yok
- [ ] 404 sayfası doğru
- [ ] Marka URL'leri duplicate üretmiyor
- [ ] Ürün URL'si kategori değişiminden etkilenmiyor
- [ ] Mobil navigation çalışıyor
- [ ] Desktop mega menü çalışıyor
- [ ] Core Web Vitals açısından kritik regresyon yok
- [ ] Structured data valid
- [ ] robots.txt doğru

---

# 37. Sabit Kabul Edilecek Kategori Ağacı

Codex aşağıdaki kategori isimlerini kullanıcıdan yeni onay almadan değiştirmemelidir:

```text
DEKORASYON
├── Dekoratif Objeler
│   ├── Vazolar
│   ├── Dekoratif Küpler
│   ├── Saksılar
│   ├── Jardenyer
│   ├── Dekoratif Tabak & Kaseler
│   ├── Masaüstü Dekoratif Objeler
│   └── Gondollar
├── Duvar Dekorasyonu
└── Mum & Oda Kokusu
    ├── Mumlar & Mumluklar
    └── Oda Kokuları

MUTFAK & SOFRA
├── Yemek Takımları
├── Kahvaltı Takımları
├── Kahve Fincanları
├── Çay Fincanları
├── Kupalar
├── Kahve Yanı Bardakları
├── Bardak & Kadeh
├── Servis & Sunum
├── Tepsiler
├── Kavanoz & Saklama
├── Sürahi & Karaf
└── Dondurmalık

TEKSTİL
├── Yatak Odası
│   ├── Nevresim Takımları
│   ├── Pike Takımları
│   └── Yatak Örtüleri
├── Sofra Tekstili
│   ├── Masa Örtüleri
│   ├── Runner
│   └── Amerikan Servisleri
└── Kırlent

BANYO
├── Havlu
├── Banyo Setleri
└── Banyo Paspasları

YAPAY ÇİÇEK & BİTKİ
├── Yapay Çiçekler
└── Yapay Ağaçlar

YILBAŞI ÜRÜNLERİ

MARKALAR
├── ZK Home
├── Mikasa Moor
├── Lucky Art
└── La Medore
```

---

# 38. Son Uygulama Prensibi

Kategori yapısı yalnızca menü tasarımı olarak değerlendirilmemelidir.

Uygulama aynı anda şu katmanları kapsamalıdır:

```text
Kategori veri modeli
+
URL mimarisi
+
Navigation
+
Breadcrumb
+
SEO metadata
+
Canonical
+
Schema
+
Sitemap
+
Filter index kontrolü
+
Redirect migration
+
Internal linking
```

Kod değişiklikleri tamamlandıktan sonra:

1. Build çalıştır
2. Type check çalıştır
3. Lint çalıştır
4. Kırık route testi yap
5. Canonical testi yap
6. Sitemap testi yap
7. Structured data testi yap
8. Redirect testi yap
9. Mobil menü testi yap
10. Production'a almadan önce değişiklik özetini raporla

Mevcut çalışan sistemde gereksiz refactor yapma.

Sadece kategori mimarisi, navigasyon ve SEO hedefi için gerekli değişiklikleri uygula.
