import { Metadata } from "next"
import { retrieveCustomer } from "@lib/data/customer"
import CustomerMessages from "@modules/account/components/customer-messages"

export const metadata: Metadata = { title: "Mesajlarım", robots: { index: false, follow: false } }

export default async function MessagesPage() {
  const customer = await retrieveCustomer()
  return customer ? <CustomerMessages /> : null
}
