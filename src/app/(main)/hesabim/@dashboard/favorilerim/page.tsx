import { Metadata } from "next"
import FavoritesTemplate from "@modules/account/components/favorites-template"
import { getMobileSettings } from "@lib/content/mobile-settings"

export const metadata: Metadata = {
  title: "Favorilerim",
  description: "Favori ürünlerinizi görüntüleyin ve sepetinize ekleyin.",
  robots: { index: false, follow: false },
}

export default async function FavoritesDashboardPage() {
  return <FavoritesTemplate mobileSettings={await getMobileSettings()} />
}
