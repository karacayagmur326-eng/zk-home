import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveCustomer } from "@lib/data/customer"
import ProfileTemplate from "@modules/account/components/profile-template"

export const metadata: Metadata = {
  title: "Profilim",
  description: "Profil bilgilerinizi görüntüleyin ve düzenleyin.",
  robots: { index: false, follow: false },
}

export default async function Profile() {
  const customer = await retrieveCustomer()

  if (!customer) notFound()

  return <ProfileTemplate customer={customer} />
}
