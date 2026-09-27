import LegalPage, { legalMetadata } from "@modules/content/templates/legal-page"

const title = "Çerez Politikası"
const description =
  "Sitede oturum, sepet, güvenlik ve tercihlerin çalışması için zorunlu çerezler kullanılabilir. Zorunlu olmayan analiz ve pazarlama çerezleri kullanıcı tercihi alınmadan etkinleştirilmemelidir.\n\nÇerez tercihleri daha sonra değiştirilebilir. Kullanılan çerezin adı, sağlayıcısı, amacı ve saklama süresi çerez yönetim panelinde güncel olarak gösterilmelidir.\n\nTarayıcı ayarlarından çerezler silinebilir; zorunlu çerezlerin engellenmesi sepet ve üyelik gibi temel işlevleri etkileyebilir."

export const metadata = legalMetadata(title, description, "/cerez-politikasi")

export default function Page() {
  return <LegalPage handle="cerez-politikasi" fallbackTitle={title} fallbackDescription={description} />
}
