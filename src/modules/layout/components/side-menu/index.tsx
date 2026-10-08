"use client"
import { useSiteContact } from "@components/common/SellerQuestion"

import { useState } from "react"
import { HttpTypes } from "@medusajs/types"

import { ChevronRight, Heart, Menu, ShoppingCart, User } from "@lib/icons"
import { NavigationItem } from "@lib/types/navigation"
import Drawer from "@modules/common/components/drawer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import HeaderSearch from "@modules/layout/components/header-search"
import ThemeToggle from "@modules/layout/components/theme-toggle"

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales?: unknown
  currentLocale?: string | null
  headerMenu?: {
    items?: NavigationItem[]
  } | null
}

const SideMenu = ({ headerMenu }: SideMenuProps) => {
  const siteContact = useSiteContact()
  const [isOpen, setIsOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const menuItems = headerMenu?.items ?? []
  const closeMenu = () => setIsOpen(false)

  const renderMenuItems = (items: NavigationItem[], depth = 0) => (
    <ul
      className={
        depth === 0
          ? "flex flex-col gap-1"
          : "mb-2 ml-4 flex flex-col gap-1 border-l border-border pl-3"
      }
    >
      {items.map((item) => {
        const key = item.id || item.label
        const hasChildren = Boolean(item.children?.length)
        const isExpanded = Boolean(openGroups[key])

        return (
          <li key={key}>
            <div
              className={
                depth === 0
                  ? "flex min-h-12 items-stretch rounded-rounded border-b border-border"
                  : ""
              }
            >
              <LocalizedClientLink
                href={item.url || "#"}
                className={
                  depth === 0
                    ? "flex min-w-0 flex-1 items-center rounded-rounded px-3 py-3 text-base font-semibold text-foreground transition-colors hover:bg-subtle hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    : "flex min-h-11 items-center gap-2 rounded-rounded px-3 py-2.5 text-sm text-muted transition-colors hover:bg-subtle hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                }
                onClick={closeMenu}
              >
                {depth > 0 && (
                  <span className="h-1 w-1 shrink-0 rounded-circle bg-primary/60" />
                )}
                <span>{item.label}</span>
              </LocalizedClientLink>
              {depth === 0 && hasChildren && (
                <button
                  type="button"
                  aria-label={`${item.label} alt menüsünü ${
                    isExpanded ? "kapat" : "aç"
                  }`}
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setOpenGroups((current) => ({
                      ...current,
                      [key]: !current[key],
                    }))
                  }
                  className="flex w-12 shrink-0 items-center justify-center rounded-rounded text-muted transition-colors hover:bg-subtle hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRight
                    aria-hidden="true"
                    className={`h-4 w-4 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </button>
              )}
            </div>
            {hasChildren &&
              (depth > 0 || isExpanded) &&
              renderMenuItems(item.children!, depth + 1)}
          </li>
        )
      })}
    </ul>
  )

  const footer = (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <LocalizedClientLink
          href="/hesabim"
          aria-label="Hesabım"
          className="flex flex-col items-center justify-center gap-1 rounded-rounded bg-subtle px-2 py-3 text-xs font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={closeMenu}
        >
          <User aria-hidden="true" className="h-5 w-5" />
          Hesabım
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/favorilerim"
          aria-label="Favorilerim"
          className="flex flex-col items-center justify-center gap-1 rounded-rounded bg-subtle px-2 py-3 text-xs font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={closeMenu}
        >
          <Heart aria-hidden="true" className="h-5 w-5" />
          Favoriler
        </LocalizedClientLink>
        <LocalizedClientLink
          href="/sepet"
          aria-label="Sepetim"
          className="flex flex-col items-center justify-center gap-1 rounded-rounded bg-primary px-2 py-3 text-xs font-medium text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={closeMenu}
        >
          <ShoppingCart aria-hidden="true" className="h-5 w-5" />
          Sepet
        </LocalizedClientLink>
      </div>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>© {new Date().getFullYear()} {siteContact.brandName}</span>
        <ThemeToggle />
      </div>
    </div>
  )

  return (
    <div className="flex h-full items-center">
      <button
        type="button"
        data-testid="nav-menu-button"
        onClick={() => setIsOpen(true)}
        className="group flex h-11 w-11 items-center justify-center rounded-circle text-foreground transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Menüyü Aç"
        aria-expanded={isOpen}
      >
        <Menu aria-hidden="true" className="h-6 w-6" />
      </button>

      <Drawer
        isOpen={isOpen}
        onClose={closeMenu}
        title={
          <span className="font-black uppercase tracking-widest">Menü</span>
        }
        footer={footer}
        side="left"
        size="small"
      >
        <div className="mb-5 lg:hidden">
          <HeaderSearch />
        </div>

        <nav aria-label="Mobil navigasyon">
          {menuItems.length ? (
            renderMenuItems(menuItems)
          ) : (
            <div className="rounded-rounded border border-dashed border-border bg-subtle p-5 text-center">
              <p className="mb-3 text-sm text-muted">
                Menü henüz yapılandırılmadı.
              </p>
              <LocalizedClientLink
                href="/magaza"
                className="text-sm font-semibold text-primary hover:text-primary-hover"
                onClick={closeMenu}
              >
                Mağazaya Git
              </LocalizedClientLink>
            </div>
          )}
        </nav>
      </Drawer>
    </div>
  )
}

export default SideMenu
