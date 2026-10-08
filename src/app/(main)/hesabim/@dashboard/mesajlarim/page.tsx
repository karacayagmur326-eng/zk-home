import { Metadata } from "next"
import { retrieveCustomer } from "@lib/data/customer"
import CustomerInbox from "@modules/account/components/customer-inbox"

export const metadata: Metadata = { title: "Mesajlarım", robots: { index: false, follow: false } }

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ talep?: string }> }) {
  const { talep } = await searchParams
  const customer = await retrieveCustomer()
  return customer ? <CustomerInbox initialId={typeof talep === "string" && /^\d{1,18}$/.test(talep) ? talep : ""} /> : null
}
