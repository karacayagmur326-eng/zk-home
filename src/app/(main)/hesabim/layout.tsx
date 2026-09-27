import { retrieveCustomer } from "@lib/data/customer"
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
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <AccountLayout customer={customer}>
      {customer ? dashboard : login}
      {/* TODO: Re-add Toaster component when needed */}
    </AccountLayout>
  )
}
