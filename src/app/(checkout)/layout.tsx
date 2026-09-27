import Nav from "@modules/layout/templates/nav"
import MobileSiteChrome from "@modules/layout/components/mobile-site-chrome"
import { getMobileSettings } from "@lib/content/mobile-settings"

export default async function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const mobileSettings = await getMobileSettings()

  return (
    <div
      data-ui-scope="storefront"
      className="w-full bg-[#F8F9FA] relative min-h-screen font-sans text-slate-900 pb-20 md:pb-0"
    >
      <div className="hidden md:block">
        <Nav />
      </div>
      <MobileSiteChrome settings={mobileSettings} />
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
    </div>
  )
}
