import LegalPage, { legalMetadata } from "@modules/content/templates/legal-page"

const title = "KVKK Aydınlatma Metni"
const description = "Şirketimiz kişisel verilerin korunmasına önem verir. Bu metin, verilerinizin hangi amaçlarla ve hangi hukuki sebeplerle işlendiğini açıklar."

export async function generateMetadata() { return legalMetadata(title, description, "/kvkk") }

export default function Page() {
  return <LegalPage handle="kvkk-aydinlatma-metni" fallbackTitle={title} fallbackDescription={description} />
}
