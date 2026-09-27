import LegalPage, { legalMetadata } from "@modules/content/templates/legal-page"

const title = "Gizlilik Politikası"
const description =
  "Mağazamız; üyelik, sipariş, teslimat, ödeme, destek ve yasal yükümlülüklerin yerine getirilmesi için gerekli kişisel verileri amaçla sınırlı ve ölçülü biçimde işler.\n\nİşlenen veriler; kimlik ve iletişim bilgileri, teslimat ve fatura bilgileri, sipariş kayıtları, müşteri işlem kayıtları ve güvenlik verilerinden oluşabilir. Ödeme kartı bilgileri mağaza veritabanında saklanmaz; yetkili ödeme kuruluşu tarafından işlenir.\n\nKişisel veriler yalnızca hizmetin yürütülmesi, yasal yükümlülükler ve açık rıza bulunan pazarlama faaliyetleri kapsamında yetkili hizmet sağlayıcılarla paylaşılır. İlgili kişiler erişim, düzeltme, silme ve itiraz taleplerini iletişim sayfasındaki kanallardan iletebilir."

export const metadata = legalMetadata(title, description, "/gizlilik-politikasi")

export default function Page() {
  return <LegalPage handle="gizlilik-politikasi" fallbackTitle={title} fallbackDescription={description} />
}
