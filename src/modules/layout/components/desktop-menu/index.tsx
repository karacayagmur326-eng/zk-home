"use client"

import { useState } from "react"

import { ChevronDown } from "@lib/icons"
import { NavigationItem } from "@lib/types/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MegaMenu from "@modules/layout/components/mega-menu"

export default function DesktopMenu({
  items,
  themeSettings,
}: {
  items: NavigationItem[]
  themeSettings?: any
}) {
  const [activeItem, setActiveItem] = useState<string | null>(null)

  if (!items?.length) return null

  const activeMegaItem = items.find((item) => {
    const itemKey = item.id || item.label
    const hasChildren = !!item.children?.length
    const usesMegaMenu = hasChildren

    return activeItem === itemKey && usesMegaMenu
  })

  const customGap = themeSettings?.header_menu_gap || "16px"
  const customFontSize = themeSettings?.header_menu_font_size || "13px"
  const customFontWeight = themeSettings?.header_menu_font_weight || "600"
  const customLetterSpacing = themeSettings?.header_menu_letter_spacing || "0"
  const customTextTransform = (themeSettings?.header_menu_text_transform || "none") as any

  return (
    <div
      style={{ gap: customGap }}
      className="z-50 flex h-full items-center gap-1.5 lg:gap-2 xl:gap-3.5 2xl:gap-5 min-w-0"
      onMouseLeave={() => setActiveItem(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setActiveItem(null)
        }
      }}
    >
      {items.map((item) => {
        const itemKey = item.id || item.label
        const hasChildren = !!item.children?.length
        const isOpen = activeItem === itemKey

        return (
          <div
            key={itemKey}
            className="group relative flex h-full items-center shrink-0"
            onMouseEnter={() => setActiveItem(itemKey)}
            onFocus={() => setActiveItem(itemKey)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setActiveItem(null)
                event.currentTarget
                  .querySelector<HTMLAnchorElement>("a")
                  ?.focus()
              }
            }}
          >
            <LocalizedClientLink
              href={item.url || "#"}
              aria-haspopup={hasChildren ? "menu" : undefined}
              aria-expanded={hasChildren ? isOpen : undefined}
              style={{
                fontSize: customFontSize,
                fontWeight: customFontWeight,
                letterSpacing: customLetterSpacing,
                textTransform: customTextTransform,
              }}
              className={`relative flex items-center gap-0.5 whitespace-nowrap rounded-base py-6 text-xs transition-colors after:absolute after:bottom-4 after:left-0 after:h-px after:bg-[#C98484] after:transition-[width] after:duration-300 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:text-[12px] xl:gap-1 xl:text-[13px] 2xl:text-sm ${isOpen && hasChildren ? "text-primary after:w-full" : "text-foreground after:w-0"}`}
            >
              {item.label}
              {hasChildren && (
                <ChevronDown
                  aria-hidden="true"
                  className={`h-3.5 w-3.5 opacity-70 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </LocalizedClientLink>

          </div>
        )
      })}
      {activeMegaItem && (
        <MegaMenu
          key={activeMegaItem.id || activeMegaItem.label}
          item={activeMegaItem}
          themeSettings={themeSettings}
          onNavigate={() => setActiveItem(null)}
        />
      )}
    </div>
  )
}
