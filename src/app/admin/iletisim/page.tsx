import { redirect } from "next/navigation"
import ContactManagement from "../components/ContactManagement"

export default async function AdminContactPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  if (tab === "info_settings" || tab === "smtp_settings") {
    redirect(`/admin/ayarlar?tab=iletisim&contact_section=${tab}`)
  }
  return <ContactManagement />
}
