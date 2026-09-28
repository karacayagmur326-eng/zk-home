"use client"

import { useState } from "react"
import { ArrowRight, AppIcon, LayoutGrid } from "@lib/icons"
import type { NavigationItem } from "@lib/types/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type MegaMenuProps = {
  item: NavigationItem
  themeSettings?: any
  onNavigate: () => void
}

export default function MegaMenu({ item, themeSettings, onNavigate }: MegaMenuProps) {
  const [activeGroup, setActiveGroup] = useState(0)
  if (!item.children?.length) return null

  const groupSize = item.children.length > 3 ? 4 : 3
  const groupColumns = groupSize === 4 ? "grid-cols-4" : "grid-cols-3"
  const groups = Array.from({ length: Math.ceil(item.children.length / groupSize) }, (_, index) =>
    item.children!.slice(index * groupSize, index * groupSize + groupSize)
  )
  const featuredChild = item.children.find((child) => child.imageUrl) || item.children[0]
  const promoEnabled = item.promo_enabled !== false
  const promoImage = item.promo_image_url || featuredChild?.imageUrl
  const promoBadge = item.promo_badge || "Öne çıkan"
  const promoTitle = item.promo_title || `${item.label} koleksiyonu`
  const promoDescription = item.promo_description || item.description || "Yaşam alanınıza uyum sağlayan seçkin parçaları keşfedin."
  const promoUrl = item.promo_button_url || featuredChild?.url || item.url || "#"
  const promoButtonText = item.promo_button_text || "Keşfet"
  const customTextTransform = (themeSettings?.header_menu_text_transform || "none") as React.CSSProperties["textTransform"]

  return (
    <div
      role="group"
      aria-label={`${item.label} alt menüsü`}
      data-testid="mega-menu-panel"
      className={`absolute left-1/2 top-[calc(100%-0.1rem)] z-50 grid w-[calc(100vw-3rem)] max-w-[1400px] -translate-x-1/2 gap-5 rounded-[22px] border border-[#eee5e1] bg-[#fffdfb] p-5 text-foreground shadow-[0_22px_55px_rgba(66,45,40,0.17)] ${promoEnabled ? "grid-cols-[minmax(0,1fr)_minmax(300px,35%)]" : "grid-cols-1"}`}
    >
      <div className="flex min-w-0 flex-col">
        <div className="space-y-3">
          {groups.map((group, groupIndex) => activeGroup === groupIndex ? (
            <div key={groupIndex} className={`grid ${groupColumns} gap-3`} aria-label={`${item.label} ${groupIndex + 1}. kategori grubu`}>
              {group.map((child) => (
            <div
              key={child.id || child.label}
              className="group/card min-w-0 rounded-2xl p-2 transition-[background-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:bg-[#fbf4f1] hover:shadow-[0_12px_28px_rgba(125,87,77,0.12)] motion-reduce:transform-none motion-reduce:transition-none"
            >
              <LocalizedClientLink href={child.url || "#"} onClick={onNavigate} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484]">
              <div className={`flex items-center justify-center rounded-xl bg-[#f8f3ef] ${groupSize === 4 ? "h-[140px]" : "h-[165px]"}`}>
                {child.imageUrl ? (
                  <img
                    src={child.imageUrl}
                    alt=""
                    loading="eager"
                    className="h-full w-full object-contain object-center p-1"
                  />
                ) : (
                  <AppIcon
                    name={child.iconName || "box"}
                    fallback="box"
                    className="h-20 w-20 text-[#C98484] transition-transform duration-500 group-hover/card:scale-110 motion-reduce:transform-none"
                  />
                )}
              </div>
              <div className="px-1 pt-3">
                <h3
                  style={{ textTransform: customTextTransform }}
                  className="text-[15px] font-semibold leading-snug tracking-tight text-[#302b2a] transition-colors group-hover/card:text-[#a45d5f]"
                >
                  {child.label}
                </h3>
                {child.description && (
                  <p className="mt-1 line-clamp-2 text-xs leading-[1.45] text-[#827c7a]">
                    {child.description}
                  </p>
                )}
                <span className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#b86f71]">
                  Keşfet
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/card:translate-x-1 motion-reduce:transform-none" />
                </span>
              </div>
              </LocalizedClientLink>
            </div>
              ))}
            </div>
          ) : (
            <div key={groupIndex} className={`grid ${groupColumns} gap-3`} aria-label={`${item.label} ${groupIndex + 1}. kategori grubu`}>
              {group.map((child) => (
                <div key={child.id || child.label} className="group/compact flex min-w-0 items-center gap-1 border-b border-[#ece4df] py-2">
                  <button
                    type="button"
                    onMouseEnter={() => setActiveGroup(groupIndex)}
                    onFocus={() => setActiveGroup(groupIndex)}
                    onClick={() => setActiveGroup(groupIndex)}
                    className="min-w-0 flex-1 truncate text-left text-[13px] font-semibold text-[#524845] transition-colors hover:text-[#a45d5f] focus-visible:outline-none focus-visible:underline"
                    aria-label={`${child.label} grubunu göster`}
                  >
                    {child.label}
                  </button>
                  <LocalizedClientLink
                    href={child.url || "#"}
                    onClick={onNavigate}
                    aria-label={`${child.label} sayfasına git`}
                    className="shrink-0 p-1 text-[#b87879] transition-transform hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484]"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </LocalizedClientLink>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-center border-t border-[#eee7e3] pt-4">
          <LocalizedClientLink
            href={item.url || "#"}
            onClick={onNavigate}
            className="inline-flex items-center gap-3 rounded-full border border-[#d9aca9] px-6 py-2.5 text-xs font-semibold text-[#5b4f4c] transition-[background-color,border-color,color,transform] duration-300 hover:-translate-y-0.5 hover:border-[#C98484] hover:bg-[#fbf1ef] hover:text-[#a45d5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484] motion-reduce:transform-none"
          >
            <LayoutGrid className="h-4 w-4 text-[#C98484]" />
            {item.label} Ürünlerini Gör
            <ArrowRight className="h-4 w-4" />
          </LocalizedClientLink>
        </div>
      </div>

      {promoEnabled && (
        <LocalizedClientLink
          href={promoUrl}
          onClick={onNavigate}
          className="group/promo relative isolate flex min-h-[340px] overflow-hidden rounded-[18px] bg-[#efe3db] p-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484]"
        >
          {promoImage ? (
            <img
              src={promoImage}
              alt=""
              loading="eager"
              className="absolute bottom-0 right-0 -z-20 h-full w-[50%] object-contain object-right-bottom p-4"
            />
          ) : (
            <AppIcon name={item.iconName || "box"} fallback="box" className="absolute bottom-6 right-4 -z-20 h-44 w-44 text-[#c98484]/50" />
          )}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#f7f0eb]/95 via-[#f7f0eb]/80 to-transparent" />
          <div className="relative flex max-w-[55%] flex-col items-start self-center">
            <span className="rounded-full bg-[#C98484] px-3 py-1 text-[10px] font-bold tracking-wide text-white">
              {promoBadge}
            </span>
            <h3 className="mt-5 text-[28px] font-medium leading-[1.12] tracking-tight text-[#352e2c] xl:text-[34px]">
              {promoTitle}
            </h3>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#6d6460]">
              {promoDescription}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 border-b border-[#aa6a69] pb-1 text-sm font-semibold text-[#a45d5f]">
              {promoButtonText}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/promo:translate-x-1 motion-reduce:transform-none" />
            </span>
          </div>
        </LocalizedClientLink>
      )}
    </div>
  )
}
