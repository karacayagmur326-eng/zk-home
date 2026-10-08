import { getThemeSettings } from "@lib/content/theme-settings"
import { Metadata } from "next"
import AdminLayoutClient from "./AdminLayoutClient"
import AdminLoginForm from "./components/AdminLoginForm"
import { getAdminSession } from "@lib/admin/auth"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getThemeSettings()
  return {
  title: { absolute: `Yönetim Paneli | ${settings?.logo_text || "Mağaza"}` },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Protect the server-rendered subtree, not only the browser navigation.
  const session = await getAdminSession()
  if (!session) return <AdminLoginForm />
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
