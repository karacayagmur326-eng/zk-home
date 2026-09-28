import { query } from "@lib/admin/db"
import { Metadata } from "next"
import Link from "next/link"
import { getContactInfo } from "@lib/content/contact-info"
import { getThemeSettings } from "@lib/content/theme-settings"
import { getBaseURL } from "@lib/util/env"
import {
  ArrowRight,
  Cookie,
  FileCheck2,
  Info,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react"
import PageHero from "../../../components/common/PageHero"
import PrintPageButton from "../components/print-page-button"
import { AppIcon } from "@lib/icons"

type LegalPageProps = {
  handle: string
  fallbackTitle: string
  fallbackDescription: string
}

type LegalSection = { title: string; body: string }
type LegalConfig = {
  intro: string
  sections: LegalSection[]
  note: string
  heroImage: string
  action?: { label: string; href: string }
  aside?: "contact" | "cookie" | "download"
  asideTitle?: string
  asideText?: string
}

const defaultIcons: Record<string, string[]> = {
  "on-bilgilendirme-formu": ["store", "box", "credit-card", "truck", "rotate-ccw", "package-check", "user-check", "scale"],
  "mesafeli-satis-sozlesmesi": ["users", "file-text", "box", "list", "rotate-ccw", "coins", "truck", "credit-card", "scale", "file-check"],
  "kvkk-aydinlatma-metni": ["user-check", "shield-check", "file-text", "share-2", "database", "user-cog", "message-square"],
  "gizlilik-politikasi": ["user-check", "lock", "settings", "share-2", "database", "user-cog", "shield-check", "cookie", "file-text", "mail"],
  "cerez-politikasi": ["cookie", "list", "settings", "sliders", "share-2", "clock", "file-text", "mail"],
}

const configs: Record<string, LegalConfig> = {
  "on-bilgilendirme-formu": {
    heroImage: "/brand/placeholder.svg",
    intro: "İşbu Ön Bilgilendirme Formu'nun konusu, Alıcı ve Satıcı arasındaki Sözleşme'ye ilişkin 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri uyarınca bilgilendirilmesidir.",
    sections: [
      { title: "1. Taraflar ve Konu", body: "İşbu Ön Bilgilendirme Formu'nun konusu, Alıcı ve Satıcı arasındaki Sözleşme'ye ilişkin Kanun ve Yönetmelik hükümleri uyarınca bilgilendirilmesidir. Alıcı, Ön Bilgilendirme Formu ve Sözleşme'ye ilişkin bilgileri üyeliğinin bağlı olduğu 'Hesabım' sayfasından takip edebilecek olup değişen bilgilerini bu sayfa üstünden güncelleyebilecektir." },
      { title: "2. Tanımlar", body: "ALICI: Bir Mal veya Hizmet'i ticari veya mesleki olmayan amaçlarla edinen gerçek kişiyi,\nSATICI: ZK Home,\nPLATFORM: www.zk-home.com internet sitesi ve mobil uygulamalarını,\nKANUN: 6502 sayılı Tüketicinin Korunması Hakkında Kanun'u,\nYÖNETMELİK: Mesafeli Sözleşmeler Yönetmeliği'ni ifade eder." },
      { title: "3. Satıcı ve İletişim Bilgileri", body: "Satıcı Unvanı: ZK Home\nAdres: [Şirket adresi yönetim panelinden eklenecektir]\nTelefon: [Telefon yönetim panelinden eklenecektir]\nE-posta: info@zk-home.com\nVergi Dairesi & No: [Vergi bilgileri yönetim panelinden eklenecektir]\nTicaret Sicil No: \nMersis No: \nKEP: " },
      { title: "4. Ürün / Hizmet Bilgileri ve Fiyatlandırma", body: "Ürün/Hizmet’in temel özellikleri (türü, miktarı, marka/modeli, rengi, adedi, fiyatı) Platform’da yer almakta olup sipariş özeti ekranında detaylı şekilde incelenebilecektir. Tüm vergiler dâhil satış fiyatı, kargo bedeli ve toplam ödeme tutarı sipariş aşamasında açıkça gösterilir." },
      { title: "5. Genel Hükümler", body: "Satıcı, Ürün/Hizmet’i eksiksiz, siparişte belirtilen niteliklere uygun ve varsa garanti belgeleri, kullanım kılavuzları ile birlikte teslim etmeyi kabul eder. Ürün, yasal 30 günlük süreyi aşmamak koşulu ile Alıcı’nın belirttiği teslimat adresine kargo şirketi ile teslim edilir." },
      { title: "6. Özel Şartlar", body: "Alıcı’nın vereceği siparişlerde kurumsal fatura seçeneğini seçmesi durumunda Satıcı, Alıcı tarafından bildirilecek vergi kimlik numarası ve vergi dairesi bilgilerini kullanarak kurumsal fatura düzenleyecektir. Dijital ürünler fiziki gönderime uygun olmayıp elektronik ortamda teslim edilir." },
      { title: "7. Kişisel Verilerin Korunması", body: "Satıcı, işbu sözleşme kapsamındaki kişisel verileri sadece Ürün/Hizmet’in sunulması amacıyla sınırlı olarak 6698 sayılı Kişisel Verilerin Korunması Kanunu’na ('KVKK') uygun olarak işleyecektir." },
      { title: "8. Cayma Hakkı", body: "Alıcı, ürünü teslim aldığı tarihten itibaren 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin Sözleşme’den cayma hakkına sahiptir. Bu süre içinde e-posta veya iletişim formuyla bildirim yapılması yeterlidir; gerekçe ve fotoğraf zorunlu değildir. İade gönderimi için bildirimden itibaren 14 gün vardır. Satıcının belirttiği taşıyıcıyla iade halinde tüketiciden iade kargo bedeli alınmaz." },
      { title: "9. Cayma Hakkının Kullanılamayacağı Halleri", body: "Tüketicinin istekleri veya kişisel ihtiyaçları doğrultusunda hazırlanan mallar, çabuk bozulabilen ürünler, ambalajı veya mühürlü koruyucu unsurları açılmış hijyen ürünleri ve tek kullanımlık dijital içeriklerde cayma hakkı kullanılamaz." },
      { title: "10. Uyuşmazlıkların Çözümü", body: "Sözleşme’nin uygulanmasında, Bakanlık’ça ilan edilen değerlere uygun olarak Alıcı’nın Ürün/Hizmet’i satın aldığı ve ikametgahının bulunduğu yerdeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir." },
    ],
    note: "Bu ön bilgilendirme formu, mesafeli satış sözleşmesi yapılmadan önce tüketiciyi bilgilendirmek amacıyla hazırlanmıştır.",
    action: { label: "Mesafeli Satış Sözleşmesi", href: "/mesafeli-satis-sozlesmesi" },
  },
  "mesafeli-satis-sozlesmesi": {
    heroImage: "/brand/placeholder.svg",
    intro: "İşbu Mesafeli Satış Sözleşmesi ('Sözleşme'), Alıcı ve Satıcı arasında aşağıda belirtilen hüküm ve şartlar çerçevesinde elektronik ortamda kurulmuştur.",
    sections: [
      { title: "1. Taraflar", body: "İşbu Sözleşme; Alıcı (Müşteri) ile Satıcı (ZK Home) arasında, www.zk-home.com internet sitesi üzerinden siparişe konu mal ve hizmetlerin satışı ve teslimi amacıyla akdedilmiştir." },
      { title: "2. Tanımlar", body: "ALICI: Mal veya Hizmet'i ticari/mesleki olmayan amaçlarla edinen gerçek kişi,\nSATICI: ZK Home,\nPLATFORM: www.zk-home.com internet sitesi,\nSÖZLEŞME: İşbu Mesafeli Satış Sözleşmesi'ni ifade eder." },
      { title: "3. Sözleşmenin Konusu ve Kapsamı", body: "Sözleşme’nin konusu Alıcı'nın, Platform’da satın alınmasına yönelik elektronik olarak sipariş verdiği Ürün/Hizmet’in satışı ve teslimi ile ilgili olarak 6502 sayılı Kanun ve Yönetmelik hükümleri gereğince Taraflar’ın hak ve yükümlülüklerinin belirlenmesidir." },
      { title: "4. Alıcı'nın Önceden Bilgilendirildiği Hususlar", body: "Alıcı, siparişi onaylamadan önce Ürün'ün temel nitelikleri, Satıcı bilgileri, vergiler dahil toplam satış fiyatı, kargo ve teslimat masrafları ile cayma hakkı şartları hakkında eksiksiz bilgilendirildiğini kabul eder." },
      { title: "5. Alıcı, Satıcı ve Fatura Bilgileri", body: "Satıcı: ZK Home\nAdres: [Şirket adresi yönetim panelinden eklenecektir]\nTelefon: [Telefon yönetim panelinden eklenecektir] | E-Posta: info@zk-home.com\nVergi Dairesi / No: [Vergi bilgileri yönetim panelinden eklenecektir] | Ticaret Sicil:  | MERSİS: \nAlıcı ve Fatura bilgileri sipariş anında Alıcı tarafından girilen güncel veri ve adreslerdir." },
      { title: "6. Ürün/Hizmet Bilgileri", body: "Siparişe konu ürün veya hizmetlerin türü, miktarı, rengi, satış bedeli, KDV tutarı ve kargo bedeli sipariş özetinde gösterildiği gibidir." },
      { title: "7. Genel Hükümler", body: "Satıcı, Ürün/Hizmet’i eksiksiz ve siparişte belirtilen niteliklere uygun teslim etmekle yükümlüdür. Ürün, yasal 30 (otuz) günlük süreyi aşmamak koşulu ile Alıcı’nın adresine teslim edilir." },
      { title: "8. Özel Şartlar", body: "Kurumsal fatura taleplerinde faturada yer alması gereken bilgilerin doğru girilmesi Alıcı sorumluluğundadır. Kredi kartı taksit kampanyaları bankaların inisiyatifindedir." },
      { title: "9. Kişisel Verilerin Korunması", body: "Kişisel veriler 6698 sayılı KVKK kapsamında yalnızca siparişin ifası, teslimatı ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmektedir." },
      { title: "10. Cayma Hakkı", body: "Alıcı, 14 (on dört) gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin Sözleşme’den cayma hakkına sahiptir." },
      { title: "11. Cayma Hakkının Kullanılamayacağı Haller", body: "Kişisel ihtiyaçlara göre hazırlanan mallar, hızlı bozulan ürünler, koruyucu ambalajı açılmış hijyen ürünleri ve dijital içeriklerde cayma hakkı kullanılamaz." },
      { title: "12. Uyuşmazlıkların Çözümü", body: "Uyuşmazlıklarda Alıcı'nın ikametgahının bulunduğu yerdeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir." },
      { title: "13. Bildirimler ve Delil Sözleşmesi", body: "Taraflar arasında yapılan her türlü yazışma e-posta ve Platform üzerinden yürütülür. Satıcı'nın ticari ve elektronik kayıtları HMK m. 193 uyarınca kesin delil teşkil eder." },
      { title: "14. Yürürlük", body: "14 maddeden ibaret işbu Sözleşme, Alıcı tarafından elektronik ortamda onaylandığı anda akdedilmiş ve yürürlüğe girmiştir." },
    ],
    note: "Bu sözleşme, Alıcı'nın siparişi onaylaması ile birlikte geçerlilik kazanır ve elektronik ortamda saklanır.",
    aside: "download",
    asideTitle: "Sözleşmeyi PDF olarak kaydedin",
    asideText: "Belgeyi yazdırabilir veya cihazınıza PDF olarak kaydedebilirsiniz.",
  },
  "kvkk-aydinlatma-metni": {
    heroImage: "/brand/placeholder.svg",
    intro: "ZK Home olarak kişisel verilerinizin 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında işlenmesine büyük önem veriyoruz.",
    sections: [
      { title: "Veri Sorumlusu", body: "İşbu aydınlatma metninde belirtilen amaçlar doğrultusunda kişisel verilerinizi işleyen veri sorumlusu ZK Home'dir." },
      { title: "Kişisel Verilerin İşlenme Amaçları", body: "Kişisel veriler; siparişlerin yürütülmesi, ürün ve hizmetlerin sunulması, müşteri ilişkilerinin yönetilmesi ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenmektedir." },
      { title: "İşlenen Kişisel Veriler", body: "Kimlik, iletişim, adres, ödeme ve fatura, işlem güvenliği, müşteri işlem ve şikâyet verileri işlenebilmektedir." },
      { title: "Kişisel Verilerin Aktarılması", body: "Kişisel veriler; kanunen yetkili kurumlara, hizmet sağlayıcılara, iş ortaklarına ve gerektiğinde ödeme kuruluşlarına aktarılabilir." },
      { title: "Veri Toplama Yöntemleri ve Hukuki Sebepler", body: "Veriler internet sitesi, mobil uygulamalar, çağrı merkezi, e-posta ve diğer elektronik ortamlar üzerinden toplanabilir." },
      { title: "Kişisel Veri Sahiplerinin Hakları", body: "KVKK'nın 11. maddesi kapsamındaki bilgi talep etme, düzeltme, silme, yok etme ve işleme itiraz haklarınızı kullanabilirsiniz." },
      { title: "Başvuru Yöntemi", body: "Taleplerinizi kimliğinizi tespit edici belgelerle birlikte yazılı olarak ([Şirket adresi yönetim panelinden eklenecektir]) veya info@zk-home.com e-posta adresi üzerinden iletebilirsiniz." },
    ],
    note: "İşbu Aydınlatma Metni güncel mevzuata uygun olarak hazırlanmış olup gerekli görüldüğünde güncellenebilir.",
    aside: "contact",
    asideTitle: "KVKK ile ilgili sorularınız mı var?",
    asideText: "Her türlü soru ve talebiniz için ekibimize ulaşabilirsiniz.",
  },
  "gizlilik-politikasi": {
    heroImage: "/brand/placeholder.svg",
    intro: "ZK Home olarak kişisel verilerinizin güvenliğini önemsiyoruz. Bu politika, verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.",
    sections: [
      { title: "Genel Bilgiler", body: "İşbu Gizlilik Politikası, ZK Home tarafından işletilen internet sitesi ve diğer dijital kanallar aracılığıyla kişisel verilerin işlenmesine ilişkin usul ve esasları belirler." },
      { title: "Toplanan Veriler", body: "Kimlik, iletişim, adres, ödeme ve fatura, işlem güvenliği, cihaz ve kullanım bilgileri işlenebilir." },
      { title: "Verilerin Kullanım Amaçları", body: "Veriler siparişlerin yürütülmesi, müşteri hizmetleri, ödeme güvenliği, yasal yükümlülükler ve iletişim faaliyetleri için kullanılabilir." },
      { title: "Verilerin Aktarılması", body: "Kişisel veriler yasal yükümlülüklerin yerine getirilmesi amacıyla hizmet sağlayıcıları ve yetkili kurumlarla paylaşılabilir." },
      { title: "Veri Toplama Yöntemleri ve Hukuki Sebepler", body: "Veriler internet sitesi, mobil uygulama, çağrı merkezi, e-posta ve diğer elektronik ortamlar aracılığıyla toplanır." },
      { title: "Kişisel Veri Sahiplerinin Hakları", body: "Kişisel verilerinizle ilgili bilgi talep etme, düzeltme, silme veya yok etme ve işlemeye itiraz etme haklarına sahipsiniz." },
      { title: "Veri Güvenliği", body: "Kişisel verilerin güvenliği için teknik ve idari tedbirler alınmakta, yetkisiz erişim ve kayıplara karşı korunmaktadır." },
      { title: "Çerez Politikası", body: "Web sitemiz kullanıcı deneyimini geliştirmek ve site trafiğini analiz etmek amacıyla çerezler kullanabilir." },
      { title: "Politika Değişiklikleri", body: "Bu politika gerektiğinde güncellenebilir. Güncellemeler web sitemizde yayımlandığı tarihte yürürlüğe girer." },
      { title: "İletişim", body: "Sorularınız için info@zk-home.com adresinden veya [Telefon yönetim panelinden eklenecektir] numaralı telefondan bize ulaşabilirsiniz." },
    ],
    note: "Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu'na uygun olarak hazırlanmıştır.",
    aside: "contact",
    asideTitle: "Verileriniz Bizimle Güvende",
    asideText: "Gizlilik politikamız hakkında ekibimize ulaşabilirsiniz.",
  },
  "cerez-politikasi": {
    heroImage: "/brand/placeholder.svg",
    intro: "Web sitemizde kullanılan çerezler hakkında bilgi almak, tercihlerinizi yönetmek ve gizliliğinizin nasıl korunduğunu öğrenmek için bu sayfayı inceleyebilirsiniz.",
    sections: [
      { title: "Çerez Nedir?", body: "Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınıza veya cihazınıza yerleştirilen küçük metin dosyalarıdır." },
      { title: "Hangi Çerezleri Kullanıyoruz?", body: "Zorunlu çerezler, performans çerezleri, işlevsellik çerezleri ve izin vermeniz hâlinde hedefleme/reklam çerezleri kullanılabilir." },
      { title: "Çerezlerin Kullanım Amaçları", body: "Çerezler siteyi düzgün çalıştırmak, tercihlerinizi hatırlamak, performansı ölçmek ve deneyimi geliştirmek amacıyla kullanılır." },
      { title: "Çerezleri Nasıl Yönetebilirsiniz?", body: "Tarayıcı ayarlarınızdan çerezleri kabul edebilir, reddedebilir veya belirli çerez türlerini silebilirsiniz." },
      { title: "Üçüncü Taraf Çerezler", body: "Analiz ve reklam hizmetleri sunan üçüncü taraf sağlayıcıların çerezleri, açık tercihleriniz doğrultusunda kullanılabilir." },
      { title: "Veri Saklama Süreleri", body: "Çerezlerin saklama süreleri çerezin türüne göre oturum süresince veya belirli bir süre boyunca olabilir." },
      { title: "Politika Değişiklikleri", body: "Çerez Politikası gerektiğinde güncellenebilir ve yayımlandığı tarihte yürürlüğe girer." },
      { title: "İletişim", body: "Çerez politikamız ile ilgili sorularınız için info@zk-home.com adresinden bize ulaşabilirsiniz." },
    ],
    note: "Çerez tercihlerinizi dilediğiniz zaman tarayıcınızdan veya sitedeki tercih panelinden değiştirebilirsiniz.",
    aside: "cookie",
    asideTitle: "Çerez Tercihlerinizi Yönetin",
    asideText: "Tercihlerinizi dilediğiniz zaman değiştirebilirsiniz.",
  },
}

export function legalMetadata(title: string, description: string, path: string): Metadata {
  const baseUrl = getBaseURL()
  const isTransactionContract =
    path === "/on-bilgilendirme-formu" ||
    path === "/mesafeli-satis-sozlesmesi"

  return {
    title: `${title}`,
    description,
    alternates: {
      canonical: `${baseUrl}${path}`,
    },
    robots: isTransactionContract
      ? { index: false, follow: true }
      : { index: true, follow: true },
  }
}

export default async function LegalPage({ handle, fallbackTitle, fallbackDescription }: LegalPageProps) {
  const page = await query<{ content: Record<string, unknown> }>(
    "SELECT content FROM content_pages WHERE handle = $1",
    [handle]
  ).then((rows) => rows[0]?.content || null).catch(() => null)

  const contact = await getContactInfo()
  const theme = await getThemeSettings()
  const brandName = contact.brand_name || theme?.logo_text || "Mağazamız"
  const companyName = contact.company_name || brandName
  const phone = contact.phone || "0850 ..."
  const phoneRaw = contact.phone_raw || ""
  const email = contact.email || ""
  const address = contact.full_address || contact.street_address || "Türkiye"
  const website = contact.website || ""
  const taxOffice = contact.tax_office || ""
  const taxNo = contact.tax_no || ""
  const mersisNo = contact.mersis_no || ""
  const kepAddress = contact.kep_address || ""
  const tradeRegNo = contact.trade_reg_no || ""

  function sanitizeDynamicText(text: string): string {
    if (!text) return ""
    return text
      .replace(/ZK Home/gi, brandName)
      .replace(/www\.zk-home\.com/gi, website ? website.replace(/^https?:\/\//, "") : "zk-home.com")
      .replace(/info@zk-home\.com/gi, email || "[E-posta yönetim panelinden eklenecektir]")
      .replace(/\[Telefon yönetim panelinden eklenecektir\]/g, phone || "[Telefon yönetim panelinden eklenecektir]")
      .replace(/\[Şirket adresi yönetim panelinden eklenecektir\]/g, address || "[Şirket adresi yönetim panelinden eklenecektir]")
      .replace(/\[Vergi bilgileri yönetim panelinden eklenecektir\]/g, taxOffice && taxNo ? `${taxOffice} / ${taxNo}` : "[Vergi bilgileri yönetim panelinden eklenecektir]")
  }

  const config = configs[handle]
  const storedTitle = typeof page?.title === "string" && page.title.trim() ? page.title : fallbackTitle
  const title = handle === "gizlilik-politikasi" && storedTitle === "Gizlilik ve KVKK Politikası" ? fallbackTitle : storedTitle
  const configuredHero = typeof page?.hero_image === "string" ? page.hero_image : page?.heroImage
  const heroImage = typeof configuredHero === "string" && configuredHero.trim() ? configuredHero : config?.heroImage || "/brand/placeholder.svg"
  const configuredHeroText = typeof page?.hero_text === "string" ? page.hero_text : page?.heroText
  const heroText = sanitizeDynamicText(typeof configuredHeroText === "string" && configuredHeroText.trim() ? configuredHeroText : config?.intro || fallbackDescription)

  if (!config) {
    return (
      <main className="min-h-screen bg-white pb-20">
        <PageHero breadcrumb={[{ title }]} title={title} paragraphs={[heroText]} heroImage={heroImage} heroImageAlt={title} />
        <section className="content-container py-10">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-9 shadow-xs text-sm leading-7 text-slate-600 whitespace-pre-line">{sanitizeDynamicText(fallbackDescription)}</article>
        </section>
      </main>
    )
  }

  const savedSections = Array.isArray(page?.legal_sections) ? page.legal_sections : null
  const rawSections = (savedSections?.length ? savedSections : config.sections) as Array<LegalSection & { icon?: string }>
  const sections = rawSections.map((sec) => ({
    ...sec,
    title: sanitizeDynamicText(sec.title),
    body: sanitizeDynamicText(sec.body),
  }))
  const note = sanitizeDynamicText(typeof page?.legal_note === "string" ? page.legal_note : config.note)
  const aside = typeof page?.legal_aside === "string" ? page.legal_aside : config.aside
  const actionLabel = typeof page?.legal_action_label === "string" ? page.legal_action_label : config.action?.label
  const actionHref = typeof page?.legal_action_href === "string" ? page.legal_action_href : config.action?.href
  const asideTitle = sanitizeDynamicText(typeof page?.legal_aside_title === "string" ? page.legal_aside_title : config.asideTitle || "")
  const asideText = sanitizeDynamicText(typeof page?.legal_aside_text === "string" ? page.legal_aside_text : config.asideText || "")
  const asidePhone = typeof page?.legal_aside_phone === "string" ? page.legal_aside_phone : phone
  const asideEmail = typeof page?.legal_aside_email === "string" ? page.legal_aside_email : email

  return (
    <main className="min-h-screen bg-[#fbfcfd] pb-16">
      <PageHero breadcrumb={[{ title }]} title={title} paragraphs={[heroText]} heroImage={heroImage} heroImageAlt={title} />

      <section className="content-container py-8 sm:py-10">
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-xs lg:sticky lg:top-28">
            <nav aria-label={`${title} bölümleri`} className="divide-y divide-slate-100">
              {sections.map((section, index) => (
                <a key={section.title} href={`#bolum-${index + 1}`} className="group flex items-center gap-3 rounded-xl px-3 py-3.5 text-xs font-bold text-slate-700 transition hover:bg-rose-50 hover:text-[#C98484]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[#C98484]"><AppIcon name={section.icon || defaultIcons[handle]?.[index] || "file-text"} className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">{section.title}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-[#C98484]" />
                </a>
              ))}
            </nav>

            {aside === "contact" && (
              <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 p-4">
                <ShieldCheck className="h-6 w-6 text-[#C98484]" />
                <h2 className="mt-3 text-sm font-extrabold text-slate-900">{asideTitle || "Sorularınız mı var?"}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">{asideText || "Kişisel veriler ve gizlilik konularında ekibimize ulaşabilirsiniz."}</p>
                <div className="mt-3 space-y-2 text-xs font-semibold text-slate-700">
                  <a href={`tel:${phoneRaw}`} className="flex items-center gap-2 hover:text-[#C98484]">
                    <Phone className="h-4 w-4 text-[#C98484]" />
                    <span>{asidePhone}</span>
                  </a>
                  <a href={`mailto:${asideEmail}`} className="flex items-center gap-2 hover:text-[#C98484]">
                    <Mail className="h-4 w-4 text-[#C98484]" />
                    <span className="truncate">{asideEmail}</span>
                  </a>
                </div>
                <Link href="/iletisim" className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-xs font-extrabold text-[#C98484]">İletişim Sayfasına Git <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            )}
            {aside === "cookie" && (
              <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 p-4">
                <Cookie className="h-7 w-7 text-[#C98484]" />
                <h2 className="mt-3 text-sm font-extrabold text-slate-900">{asideTitle || "Çerez Tercihlerinizi Yönetin"}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">{asideText || "Tercihlerinizi tarayıcı ayarlarınızdan dilediğiniz zaman değiştirebilirsiniz."}</p>
              </div>
            )}
            {aside === "download" && (
              <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 p-4 text-center">
                <FileCheck2 className="mx-auto h-7 w-7 text-[#C98484]" />
                <h2 className="mt-3 text-sm font-extrabold text-slate-900">{asideTitle || "Sözleşmeyi PDF olarak kaydedin"}</h2>
                <p className="mt-1 text-xs font-medium leading-5 text-slate-600">{asideText || "Sözleşmeyi yazdırabilir veya PDF olarak kaydedebilirsiniz."}</p>
                <PrintPageButton />
              </div>
            )}
          </aside>

          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="divide-y divide-slate-100 px-5 sm:px-8">
              {sections.map((section, index) => (
                <section id={`bolum-${index + 1}`} key={section.title} className="scroll-mt-28 py-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C98484] text-[10px] font-black text-white">{index + 1}</span>
                    <div>
                      <h2 className="text-sm font-extrabold text-[#C98484] sm:text-base">{section.title}</h2>
                      <p className="mt-2 whitespace-pre-line text-xs leading-6 text-slate-600 sm:text-sm">{section.body}</p>
                    </div>
                  </div>
                </section>
              ))}
            </div>
            <div className="m-4 flex flex-col gap-3 rounded-xl border border-rose-100 bg-rose-50/60 p-4 sm:m-5 sm:flex-row sm:items-center">
              <Info className="h-7 w-7 shrink-0 text-[#C98484]" />
              <p className="flex-1 text-xs font-medium leading-5 text-slate-700">{note}</p>
              {actionLabel && actionHref && <Link href={actionHref} className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2.5 text-xs font-extrabold text-[#C98484]">{actionLabel}<ArrowRight className="h-3.5 w-3.5" /></Link>}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
