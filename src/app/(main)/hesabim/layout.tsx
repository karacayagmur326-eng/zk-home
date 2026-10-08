import { retrieveCustomer } from "@lib/data/customer"
import { getThemeSettings } from "@lib/content/theme-settings"
// TODO: Re-add Toaster component when needed
import AccountLayout from "@modules/account/templates/account-layout"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hesabım",
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

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const [customer, themeSettings] = await Promise.all([
    retrieveCustomer().catch(() => null),
    getThemeSettings(),
  ])

  return (
    <AccountLayout customer={customer} logoUrl={themeSettings?.footer_logo_url || "/brand/placeholder.svg"}>
      {customer ? dashboard : login}
      {/* TODO: Re-add Toaster component when needed */}
    </AccountLayout>
  )
}
