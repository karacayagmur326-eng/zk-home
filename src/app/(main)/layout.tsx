import { Metadata } from "next"

import { getBaseURL } from "@lib/util/env"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import StorefrontSession from "@modules/layout/components/storefront-session"
import MobileSiteChrome from "@modules/layout/components/mobile-site-chrome"
import DesktopCartSidebar from "@modules/layout/components/desktop-cart-sidebar"
import { getMobileSettings } from "@lib/content/mobile-settings"

import MaintenanceScreen from "@modules/layout/components/maintenance-screen"
import { getThemeSettings } from "@lib/content/theme-settings"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export const revalidate = 300

export default async function PageLayout(props: { children: React.ReactNode }) {
  const themeSettings = await getThemeSettings()

  const mobileSettings = await getMobileSettings()

  return (
    <StorefrontSession maintenance={themeSettings?.maintenance_mode ? <MaintenanceScreen message={themeSettings.maintenance_message} /> : undefined}>
    <div data-ui-scope="storefront" className="min-h-screen">
      {/* Keep both navigation variants available when the viewport changes. */}
      <div className="hidden md:block">
        <Nav />
      </div>
      <MobileSiteChrome settings={mobileSettings} logoUrl={themeSettings?.footer_logo_url || "/brand/placeholder.svg"} />
      <div>{props.children}</div>
      <DesktopCartSidebar />
      <Footer />
    </div>
    </StorefrontSession>
  )
}
