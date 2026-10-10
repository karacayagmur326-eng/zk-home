import LegalPage, { legalMetadata } from "@modules/content/templates/legal-page"

const title = "Kullanım Koşulları"
const description =
  "Bu site ürünlerin tanıtımı, satışı ve satış sonrası hizmetlerin sunulması amacıyla işletilir.\n\nKullanıcılar üyelik ve sipariş işlemlerinde doğru ve güncel bilgi vermekle, hesap erişim bilgilerini korumakla yükümlüdür. Site içeriği, marka ve görseller hak sahibinin izni olmadan ticari amaçla kullanılamaz.\n\nFiyat, stok ve kampanya bilgileri sipariş onayı öncesinde güncellenebilir. Tüketici mevzuatından doğan emredici haklar saklıdır."

export async function generateMetadata() { return legalMetadata(title, description, "/kullanim-kosullari") }

export default function Page() {
  return <LegalPage handle="kullanim-kosullari" fallbackTitle={title} fallbackDescription={description} />
}
