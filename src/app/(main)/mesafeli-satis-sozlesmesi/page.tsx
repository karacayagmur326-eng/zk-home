import LegalPage, { legalMetadata } from "@modules/content/templates/legal-page"

const title = "Mesafeli Satış Sözleşmesi"
const description =
  "Bu sözleşme, mağazamız üzerinden verilen siparişlerde satıcı ile alıcının hak ve yükümlülüklerini düzenler.\n\nSiparişe konu ürünlerin temel nitelikleri, vergiler dâhil toplam bedeli, teslimat masrafları ve ödeme yöntemi sipariş özeti ile ön bilgilendirme formunda gösterilir.\n\nTüketici, mevzuatta belirtilen istisnalar dışında ürünü teslim aldığı tarihten itibaren on dört gün içinde cayma hakkını kullanabilir. Cayma bildirimi iletişim kanallarımız üzerinden kalıcı veri saklayıcısı ile iletilebilir.\n\nSatıcının ticari unvanı, açık adresi, iletişim bilgileri, siparişe özel ürün ve fiyat bilgileri ödeme öncesinde oluşturulan sözleşme nüshasında ayrıca gösterilir."

export async function generateMetadata() { return legalMetadata(title, description, "/mesafeli-satis-sozlesmesi") }

export default function Page() {
  return <LegalPage handle="mesafeli-satis-sozlesmesi" fallbackTitle={title} fallbackDescription={description} />
}
