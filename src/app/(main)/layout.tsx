import { Metadata } from "next"

import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { getBaseURL } from "@lib/util/env"
import { StoreCartShippingOption } from "@medusajs/types"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"
import AdminQuickEditBar from "@modules/layout/components/admin-quick-edit-bar"
import FavoriteAccountSync from "@modules/account/components/favorite-account-sync"
import MobileSiteChrome from "@modules/layout/components/mobile-site-chrome"
import DesktopCartSidebar from "@modules/layout/components/desktop-cart-sidebar"
import { getMobileSettings } from "@lib/content/mobile-settings"

import MaintenanceScreen from "@modules/layout/components/maintenance-screen"
import { getThemeSettings } from "@lib/content/theme-settings"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export const dynamic = "force-dynamic"

export default async function PageLayout(props: { children: React.ReactNode }) {
  const themeSettings = await getThemeSettings()

  if (themeSettings?.maintenance_mode) {
    return <MaintenanceScreen message={themeSettings.maintenance_message} />
  }

  const [cart, mobileSettings] = await Promise.all([
    retrieveCart(),
    getMobileSettings(),
  ])
  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions()

    shippingOptions = shipping_options
  }

  return (
    <div data-ui-scope="storefront" className="min-h-screen">
      <FavoriteAccountSync enabled={Boolean(cart?.customer_id)} />
      {/* Keep both navigation variants available when the viewport changes. */}
      <div className="hidden md:block">
        <Nav />
      </div>
      <MobileSiteChrome settings={mobileSettings} logoUrl={themeSettings?.footer_logo_url || "/brand/zkhome-logo.svg"} />
      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      <div>{props.children}</div>
      <DesktopCartSidebar cart={cart} />
      <Footer />
      <AdminQuickEditBar />
    </div>
  )
}
