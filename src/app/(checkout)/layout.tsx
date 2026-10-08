import Nav from "@modules/layout/templates/nav"
import MobileSiteChrome from "@modules/layout/components/mobile-site-chrome"
import { getMobileSettings } from "@lib/content/mobile-settings"
import { getThemeSettings } from "@lib/content/theme-settings"

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileSettings, themeSettings] = await Promise.all([getMobileSettings(), getThemeSettings()])

  return (
    <div
      data-ui-scope="storefront"
      className="w-full bg-[#F8F9FA] relative min-h-screen font-sans text-slate-900 pb-20 md:pb-0"
    >
      <div className="hidden md:block">
        <Nav />
      </div>
      <MobileSiteChrome settings={mobileSettings} logoUrl={themeSettings?.footer_logo_url || "/brand/placeholder.svg"} />
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
    </div>
  )
}
