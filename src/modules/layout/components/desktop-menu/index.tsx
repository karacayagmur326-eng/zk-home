"use client"

import { useState } from "react"

import { AppIcon, ChevronDown } from "@lib/icons"
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
    const usesMegaMenu =
      hasChildren &&
      (item.children!.length > 3 ||
        item.children!.some((child) => child.children?.length))

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
        const usesMegaMenu =
          hasChildren &&
          (item.children!.length > 3 ||
            item.children!.some((child) => child.children?.length))
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
              className="flex items-center gap-0.5 xl:gap-1 whitespace-nowrap rounded-base py-6 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-xs lg:text-[12px] xl:text-[13px] 2xl:text-sm"
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

            {hasChildren && isOpen && !usesMegaMenu && (
              <div
                role="menu"
                aria-label={`${item.label} alt menüsü`}
                className="absolute left-0 top-[calc(100%-0.25rem)] min-w-[16rem] overflow-hidden rounded-xl border border-slate-200/90 bg-white/98 dark:bg-slate-900/95 py-2 text-foreground shadow-2xl backdrop-blur-xl"
                data-testid="dropdown-menu-panel"
              >
                {item.children!.map((child) => (
                  <LocalizedClientLink
                    key={child.id || child.label}
                    href={child.url || "#"}
                    role="menuitem"
                    className="group/item flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-subtle hover:text-primary focus-visible:bg-subtle focus-visible:text-primary focus-visible:outline-none"
                    onClick={() => setActiveItem(null)}
                  >
                    {child.imageUrl ? (
                      <img
                        src={child.imageUrl}
                        alt=""
                        onError={(e) => {
                          const target = e.currentTarget
                          if (!target.dataset.retried) {
                            target.dataset.retried = "true"
                            target.src = child.imageUrl!.includes("?") ? `${child.imageUrl}&retry=${Date.now()}` : `${child.imageUrl}?retry=${Date.now()}`
                          }
                        }}
                        className="w-8 h-8 object-contain shrink-0"
                      />
                    ) : (
                      <AppIcon
                        name={child.iconName || "box"}
                        fallback="box"
                        className="w-5 h-5 text-primary shrink-0"
                      />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span
                        style={{
                          fontSize: customFontSize,
                          fontWeight: customFontWeight,
                          letterSpacing: customLetterSpacing,
                          textTransform: customTextTransform,
                        }}
                        className="leading-tight text-slate-800 dark:text-slate-100 group-hover/item:text-primary transition-colors"
                      >
                        {child.label}
                      </span>
                      {child.description && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-normal">
                          {child.description}
                        </span>
                      )}
                    </div>
                  </LocalizedClientLink>
                ))}
              </div>
            )}
          </div>
        )
      })}
      {activeMegaItem && (
        <MegaMenu
          item={activeMegaItem}
          themeSettings={themeSettings}
          onNavigate={() => setActiveItem(null)}
        />
      )}
    </div>
  )
}
