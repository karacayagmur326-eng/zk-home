import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartTemplate from "@modules/cart/templates"
import { Metadata } from "next"
import { getMobileSettings } from "@lib/content/mobile-settings"

import { getBaseURL } from "@lib/util/env"

export const metadata: Metadata = {
  title: "Alışveriş Sepetim",
  description: "Alışveriş sepetiniz ve seçtiğiniz ürünler.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  alternates: {
    canonical: `${getBaseURL()}/sepet`,
  },
}

export const dynamic = "force-dynamic"

export default async function Cart() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return null
  })

  const customer = await retrieveCustomer()

  return <CartTemplate cart={cart} customer={customer} mobileSettings={await getMobileSettings()} />
}
