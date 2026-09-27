import { Metadata } from "next"
import { notFound } from "next/navigation"

import AddressBook from "@modules/account/components/address-book"

import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "Adreslerim",
  description: "View your addresses",
}

export default async function Addresses() {
  const customer = await retrieveCustomer()
  const region = await getRegion("tr")

  if (!customer || !region) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Teslimat Adresleri</h1>
        <p className="text-base-regular">
          Teslimat adreslerinizi görüntüleyin ve güncelleyin.
          İstediğiniz kadar adres ekleyebilirsiniz.
        </p>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
