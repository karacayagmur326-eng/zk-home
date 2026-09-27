import { getMobileSettings } from "@lib/content/mobile-settings"
import MobilePersonalizationPage from "@modules/account/components/mobile-personalization-page"

import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Son Gezilenler",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}
export default async function RecentlyViewedPage() { return <MobilePersonalizationPage mode="history" settings={await getMobileSettings()} /> }
