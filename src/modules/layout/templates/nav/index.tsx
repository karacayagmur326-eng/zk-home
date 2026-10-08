import { Suspense } from "react"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreProductCategory, StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FavoriteCounter from "@modules/layout/components/favorite-counter"
import CartButton from "@modules/layout/components/cart-button"
import CustomerNotifications from "@modules/layout/components/customer-notifications"
import { SideMenu, DesktopMenu, HeaderSearch } from "@modules/layout/components/desktop-header-components"
import ThemeToggle from "@modules/layout/components/theme-toggle"
import { getMenu } from "@lib/data/menus"
import { listCategories } from "@lib/data/categories"
import { query, cachedQuery } from "@lib/admin/db"
import { isStoreReady, sanitizePublicSettings } from "@lib/security/store-readiness"

import { User, Heart, ShoppingCart, AppIcon } from "@lib/icons"
import { getThemeSettings } from "@lib/content/theme-settings"
import { retrieveCustomer } from "@lib/data/customer"
import { categoryPath } from "@lib/seo/category"
import type { NavigationItem } from "@lib/types/navigation"

export default async function Nav() {
  const [
    regions,
    locales,
    currentLocale,
    headerMenu,
    themeSettings,
    activeSlider,
    activeCategories,
    customer,
  ] = await Promise.all([
    listRegions()
      .then((regions: StoreRegion[]) => regions)
      .catch(() => []),
    listLocales().catch(() => []),
    getLocale().catch(() => "tr"),
    getMenu("header-menu").catch(() => null),
    getThemeSettings(),
    cachedQuery<any>(
      "active-top-slider",
      "SELECT * FROM slider WHERE deleted_at IS NULL AND is_active = true ORDER BY order_index ASC LIMIT 1",
      [],
      300
    )
      .then((r) => r[0] || null)
      .catch(() => null),
    listCategories().catch(() => []),
    retrieveCustomer().catch(() => null),
  ])
  const publicThemeSettings = sanitizePublicSettings(themeSettings)
  const brandLogoUrl = themeSettings?.footer_logo_url || "/brand/placeholder.svg"
  const isAdminCustomer = (customer as { role?: string } | null)?.role === "Admin"
  const accountLabel = isAdminCustomer ? "Admin" : customer?.first_name || "Hesabım"
  const accountTitle = isAdminCustomer
    ? "Admin hesabı"
    : customer?.first_name
      ? `${customer.first_name} ${customer.last_name || ""}`.trim()
      : customer?.email || "Hesabım"

  const activeCategoryHandles = new Set<string>()
  const collectHandles = (categories: typeof activeCategories) => {
    for (const category of categories) {
      activeCategoryHandles.add(category.handle)
      collectHandles(category.category_children as typeof activeCategories || [])
    }
  }
  collectHandles(activeCategories)

  const categoryMap = new Map<string, StoreProductCategory>()
  const buildCategoryMap = (cats: StoreProductCategory[]) => {
    for (const cat of cats) {
      if (cat.handle) categoryMap.set(cat.handle, cat)
      if (cat.category_children?.length) {
        buildCategoryMap(cat.category_children)
      }
    }
  }
  buildCategoryMap(activeCategories)

  const filterAndEnrichMenuCategories = (items: any[] = []): any[] =>
    items
      .filter((item) => {
        const match =
          typeof item.url === "string" &&
          item.url.match(/^\/kategoriler\/([^/?#]+)/)
        return !match || activeCategoryHandles.has(match[1])
      })
      .map((item) => {
        const match =
          typeof item.url === "string" &&
          item.url.match(/^\/kategoriler\/([^/?#]+)/)
        const category = match ? categoryMap.get(match[1]) : null

        let imageUrl: string | undefined = undefined
        let iconName: string | undefined = undefined
        let description: string | undefined = undefined
        let promoFields: Record<string, unknown> = {}

        if (category) {
          const meta = (category.metadata || {}) as Record<string, unknown>
          imageUrl =
            typeof meta.card_image_url === "string" && meta.card_image_url
              ? meta.card_image_url
              : typeof meta.image_url === "string" && meta.image_url
              ? meta.image_url
              : typeof meta.banner_url === "string" && meta.banner_url
              ? meta.banner_url
              : undefined

          iconName = typeof meta.icon === "string" ? meta.icon : undefined
          description =
            typeof meta.card_description === "string" && meta.card_description
              ? meta.card_description
              : category.description || undefined

          // Mega Menu Promo Card fields
          promoFields = {
            promo_enabled: meta.promo_enabled !== false,
            promo_badge: typeof meta.promo_badge === "string" ? meta.promo_badge : undefined,
            promo_title: typeof meta.promo_title === "string" ? meta.promo_title : undefined,
            promo_description: typeof meta.promo_description === "string" ? meta.promo_description : undefined,
            promo_image_url: typeof meta.promo_image_url === "string" ? meta.promo_image_url : undefined,
            promo_button_text: typeof meta.promo_button_text === "string" ? meta.promo_button_text : undefined,
            promo_button_url: typeof meta.promo_button_url === "string" ? meta.promo_button_url : undefined,
          }
        }

        return {
          ...item,
          imageUrl,
          iconName,
          description,
          ...promoFields,
          children: filterAndEnrichMenuCategories(item.children),
        }
      })

  const categoryMenuItem = (category: (typeof activeCategories)[number]): NavigationItem => {
    const metadata = (category.metadata || {}) as Record<string, unknown>
    return {
      id: category.id,
      label: category.name,
      url: categoryPath(category),
      type: "category",
      imageUrl: typeof metadata.card_image_url === "string" ? metadata.card_image_url : undefined,
      description: category.description || undefined,
      children: (category.category_children || []).map((child) => categoryMenuItem(child as typeof category)),
    }
  }
  const categoryMenu = activeCategories.map(categoryMenuItem)
  categoryMenu.push({ id: "brands", label: "Markalar", url: "/markalar", type: "page", children: [] })
  const visibleHeaderMenu = headerMenu?.items?.length
    ? { ...headerMenu, items: filterAndEnrichMenuCategories(headerMenu.items) }
    : { items: categoryMenu }

  let topBarColor = "#C98484"
  let topBarFeatures = [
    { text: "GÜVENLİ ALIŞVERİŞ", icon: "shield" },
    { text: "STOKTAN GÖNDERİM", icon: "truck" },
    { text: "UZMAN ÜRÜN DESTEĞİ", icon: "headphones" },
  ]

  if (activeSlider) {
    if (activeSlider.top_bar_color && activeSlider.top_bar_color !== "transparent" && activeSlider.top_bar_color.trim() !== "") {
      topBarColor =
        activeSlider.top_bar_color.toUpperCase() === "#C94700" ||
        activeSlider.top_bar_color.toUpperCase() === "#C98484"
          ? "#C98484"
          : activeSlider.top_bar_color
    }
    if (activeSlider.top_bar_features && isStoreReady()) {
      try {
        const parsed =
          typeof activeSlider.top_bar_features === "string"
            ? JSON.parse(activeSlider.top_bar_features)
            : activeSlider.top_bar_features
        if (Array.isArray(parsed) && parsed.length > 0) {
          topBarFeatures = parsed
        }
      } catch (e) {
        // ignore
      }
    }
  }

  return (
    <div className="sticky inset-x-0 top-0 z-50 shadow-soft">
      {/* Top Orange Info Bar */}
      <div className="w-full" style={{ backgroundColor: topBarColor }}>
        <div className="content-container">
          <div className="flex items-center justify-between gap-3 py-2 sm:justify-center sm:gap-10">
            {topBarFeatures.map((feat, idx) => (
              <div
                key={idx}
                className={`min-w-0 items-center gap-1.5 whitespace-nowrap text-[10px] font-semibold text-white sm:text-[12px] ${
                  idx > 0 && idx < topBarFeatures.length - 1
                    ? "hidden sm:flex"
                    : "flex"
                }`}
              >
                {feat.icon &&
                (feat.icon.startsWith("http") || feat.icon.startsWith("/")) ? (
                  <img
                    src={feat.icon}
                    alt=""
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain shrink-0 filter brightness-0 invert"
                  />
                ) : (
                  <AppIcon
                    name={feat.icon}
                    fallback="shield"
                    className="w-3.5 h-3.5 shrink-0"
                  />
                )}
                <span className="truncate">{feat.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Header — dark in dark mode, white in light mode */}
      <header className="relative mx-auto h-16 border-b border-border bg-card text-foreground transition-colors duration-200 sm:h-[72px]">
        <nav
          aria-label="Ana navigasyon"
          className="relative mx-auto flex h-full w-full max-w-[1440px] items-center justify-between gap-3 px-3 text-small-regular sm:px-5 xl:gap-4"
        >
          {/* Left: Mobile Hamburger (SideMenu) & Logo Section */}
          <div className="flex h-full shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="flex items-center xl:hidden">
              <SideMenu
                regions={regions}
                locales={locales}
                currentLocale={currentLocale}
                headerMenu={visibleHeaderMenu}
              />
            </div>
            <LocalizedClientLink
              href="/"
              className="hover:opacity-80 transition-opacity flex items-center gap-3 shrink-0"
              data-testid="nav-store-link"
            >
              <img
                src={brandLogoUrl}
                alt={themeSettings?.footer_logo_alt || themeSettings?.logo_text || "Mağaza"}
                width={220}
                height={50}
                className="h-9 w-auto max-w-[190px] object-contain sm:h-10 xl:max-w-[220px]"
              />
            </LocalizedClientLink>
          </div>

          {/* Center Navigation */}
          {(() => {
            const menuAlign = publicThemeSettings?.header_menu_align || "center"
            const alignClass =
              menuAlign === "left"
                ? "justify-start"
                : menuAlign === "right"
                ? "justify-end"
                : "justify-center"

            return (
              <div className={`hidden h-full min-w-0 flex-1 items-center ${alignClass} xl:flex`}>
                <DesktopMenu
                  items={visibleHeaderMenu?.items || []}
                  themeSettings={publicThemeSettings}
                />
              </div>
            )
          })()}

          {/* Right Section: Search & Icons */}
          <div className="flex h-full shrink-0 items-center justify-end gap-x-0.5 sm:gap-x-1">
            {/* Search Bar */}
            <div className="relative hidden w-10 items-center lg:flex 2xl:w-[220px]">
              <HeaderSearch />
            </div>

            <div className="hidden h-full items-center gap-0.5 sm:gap-1 lg:flex">
              {customer ? (
                <LocalizedClientLink
                  aria-label={`Hesabım (${accountTitle})`}
                  title={`Hesabım: ${accountTitle}`}
                  className="flex items-center gap-1.5 pl-1 pr-2.5 h-8 xl:h-9 rounded-full bg-[#C98484] text-white shadow-sm hover:bg-[#A95E5E] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  href="/hesabim"
                  data-testid="nav-account-link"
                >
                  <div className="flex h-6 w-6 xl:h-7 xl:w-7 items-center justify-center rounded-full bg-white/20 text-white font-extrabold text-[11px]">
                    {accountLabel ? accountLabel.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-xs font-extrabold max-w-[90px] truncate hidden 2xl:inline">
                    {accountLabel}
                  </span>
                </LocalizedClientLink>
              ) : (
                <LocalizedClientLink
                  aria-label="Giriş Yap / Hesabım"
                  title="Giriş Yap / Hesabım"
                  className="flex h-9 w-9 xl:h-10 xl:w-10 items-center justify-center rounded-circle text-muted transition-colors hover:bg-subtle hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="/hesabim"
                  data-testid="nav-account-link"
                >
                  <User aria-hidden="true" className="w-4 h-4 xl:w-[21px] xl:h-[21px]" />
                </LocalizedClientLink>
              )}


              <ThemeToggle />
            </div>

            <FavoriteCounter />
            {customer && <CustomerNotifications key={customer.id} customerId={customer.id} />}
            <Suspense
              fallback={
                <LocalizedClientLink
                  aria-label="Sepetim, 0 ürün"
                  className="relative flex h-9 w-9 xl:h-10 xl:w-10 items-center justify-center rounded-circle text-muted transition-colors hover:bg-subtle hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="/sepet"
                >
                  <ShoppingCart
                    aria-hidden="true"
                    className="w-4 h-4 xl:w-[21px] xl:h-[21px]"
                  />
                  <span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-circle bg-primary text-[10px] font-bold text-on-primary">
                    0
                  </span>
                </LocalizedClientLink>
              }
            >
              <div className="h-9 w-9 xl:h-10 xl:w-10 flex items-center justify-center">
                <CartButton />
              </div>
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
