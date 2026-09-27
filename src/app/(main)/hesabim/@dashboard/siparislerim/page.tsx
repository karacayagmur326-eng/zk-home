import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listOrders } from "@lib/data/orders"
import OrdersTemplate from "@modules/account/components/orders-template"

export const metadata: Metadata = {
  title: "Siparişlerim",
  description: "Siparişlerinizi görüntüleyin ve durumlarını takip edin.",
  robots: { index: false, follow: false },
}

export default async function Orders() {
  const orders = await listOrders()

  if (!orders) {
    notFound()
  }

  return <OrdersTemplate orders={orders} />
}
