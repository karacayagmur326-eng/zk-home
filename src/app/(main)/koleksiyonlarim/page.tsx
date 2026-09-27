import { getMobileSettings } from "@lib/content/mobile-settings"
import MobilePersonalizationPage from "@modules/account/components/mobile-personalization-page"

import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Koleksiyonlarım",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}
export default async function CollectionsPage() { return <MobilePersonalizationPage mode="collections" settings={await getMobileSettings()} /> }
