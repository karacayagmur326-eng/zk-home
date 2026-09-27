import LegalPage, { legalMetadata } from "@modules/content/templates/legal-page"

const title = "Ön Bilgilendirme Formu"
const description =
  "Sipariş vermeden önce ürünün temel nitelikleri, satıcının iletişim bilgileri, vergiler dâhil toplam fiyat, teslimat ve varsa ek masraflar müşteriye açık biçimde gösterilir.\n\nÖdeme yükümlülüğü doğuran sipariş onayından önce teslimat süresi, ödeme yöntemi, cayma hakkının kullanım şekli ve başvuru yolları müşterinin onayına sunulur.\n\nSiparişe özgü ön bilgilendirme formu sepet ve ödeme ekranındaki güncel bilgiler kullanılarak oluşturulur ve müşteriye kalıcı veri saklayıcısı ile iletilir."

export const metadata = legalMetadata(title, description, "/on-bilgilendirme-formu")

export default function Page() {
  return <LegalPage handle="on-bilgilendirme-formu" fallbackTitle={title} fallbackDescription={description} />
}
