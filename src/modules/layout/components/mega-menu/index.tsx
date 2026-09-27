"use client"

import { AppIcon, ChevronRight, LayoutGrid } from "@lib/icons"
import { NavigationItem } from "@lib/types/navigation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type MegaMenuProps = {
  item: NavigationItem
  themeSettings?: any
  onNavigate: () => void
}

export default function MegaMenu({ item, themeSettings, onNavigate }: MegaMenuProps) {
  if (!item.children?.length) return null

  const customFontSize = themeSettings?.header_menu_font_size || "12px"
  const customFontWeight = themeSettings?.header_menu_font_weight || "700"
  const customLetterSpacing = themeSettings?.header_menu_letter_spacing || "0"
  const customTextTransform = (themeSettings?.header_menu_text_transform || "none") as any

  // Find a featured child with an image or pick the first child
  const featuredChild =
    item.children.find((c) => c.imageUrl) || item.children[0]

  const promoEnabled = item.promo_enabled !== false
  const promoBadge = item.promo_badge || "ÖNE ÇIKAN"
  const promoTitle =
    item.promo_title ||
    (featuredChild?.label
      ? `${featuredChild.label}'de Güç ve Performans.`
      : "Kesimde Güç, Sonuçta Mükemmellik.")
  const promoDescription =
    item.promo_description ||
    "Profesyonel kesim işleriniz için üstün performanslı çözümler."
  const promoImage = item.promo_image_url || featuredChild?.imageUrl
  const promoButtonText =
    item.promo_button_text ||
    (featuredChild?.label ? `${featuredChild.label}'i Keşfet` : "Keşfet")
  const promoButtonUrl =
    item.promo_button_url || featuredChild?.url || item.url || "#"

  return (
    <div
      role="group"
      aria-label={`${item.label} alt menüsü`}
      className="absolute left-1/2 -translate-x-1/2 top-[calc(100%-0.1rem)] z-50 flex w-[calc(100vw-3rem)] max-w-[1140px] gap-6 rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 p-6 text-foreground shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all"
      data-testid="mega-menu-panel"
    >
      {/* Left Area: 3-column subcategories list + bottom button */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
          {item.children.map((child) => (
            <LocalizedClientLink
              key={child.id || child.label}
              href={child.url || "#"}
              className="group/item flex items-center justify-between gap-3 py-1 transition-colors hover:text-primary"
              onClick={onNavigate}
            >
              {/* Image / Icon (LEFT) */}
              <div className="flex h-11 w-12 shrink-0 items-center justify-center">
                {child.imageUrl ? (
                  <img
                    src={child.imageUrl}
                    alt={child.label}
                    onError={(e) => {
                      const target = e.currentTarget
                      if (!target.dataset.retried) {
                        target.dataset.retried = "true"
                        target.src = child.imageUrl!.includes("?") ? `${child.imageUrl}&retry=${Date.now()}` : `${child.imageUrl}?retry=${Date.now()}`
                      }
                    }}
                    className="h-full w-full object-contain transform group-hover/item:scale-110 transition-transform duration-300 filter drop-shadow-sm"
                  />
                ) : (
                  <AppIcon
                    name={child.iconName || "box"}
                    fallback="box"
                    className="h-7 w-7 text-slate-700 dark:text-slate-200 transition-colors group-hover/item:text-primary"
                  />
                )}
              </div>

              {/* Title & Subtitle (MIDDLE) */}
              <div className="min-w-0 flex-1 text-left">
                <strong
                  style={{
                    fontSize: customFontSize,
                    fontWeight: customFontWeight,
                    letterSpacing: customLetterSpacing,
                    textTransform: customTextTransform,
                  }}
                  className="block leading-snug text-slate-800 dark:text-slate-100 group-hover/item:text-primary transition-colors"
                >
                  {child.label}
                </strong>
                {child.description && (
                  <span className="mt-0.5 line-clamp-2 block text-[11px] leading-tight text-slate-500 dark:text-slate-400 font-normal">
                    {child.description}
                  </span>
                )}
              </div>

              {/* Chevron Arrow (RIGHT) */}
              <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform group-hover/item:translate-x-0.5 group-hover/item:text-primary" />
            </LocalizedClientLink>
          ))}
        </div>

        {/* Bottom Button: "Tüm [Category] Ürünleri >" */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <LocalizedClientLink
            href={item.url || "#"}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 px-6 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-200 hover:text-primary shadow-2xs"
            onClick={onNavigate}
          >
            <LayoutGrid className="h-4 w-4 text-primary" />
            <span>Tüm {item.label} Ürünleri</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </LocalizedClientLink>
        </div>
      </div>

      {/* Right Area: Featured Promo Card */}
      {promoEnabled && (
        <div className="w-[280px] shrink-0 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 p-5 flex flex-col justify-between border border-slate-200/60 dark:border-slate-700/60 relative overflow-hidden">
          <div>
            <span className="inline-block rounded-md bg-[#C98484] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white mb-2 shadow-xs">
              {promoBadge}
            </span>
            <h4 className="text-sm font-extrabold leading-snug text-slate-900 dark:text-white mb-1">
              {promoTitle}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
              {promoDescription}
            </p>
          </div>

          {/* Featured Image */}
          <div className="my-3 flex items-center justify-center h-28">
            {promoImage ? (
              <img
                src={promoImage}
                alt={promoTitle}
                onError={(e) => {
                  const target = e.currentTarget
                  if (!target.dataset.retried) {
                    target.dataset.retried = "true"
                    target.src = promoImage.includes("?") ? `${promoImage}&retry=${Date.now()}` : `${promoImage}?retry=${Date.now()}`
                  }
                }}
                className="max-h-full max-w-full object-contain transform hover:scale-105 transition-transform duration-300 drop-shadow-md"
              />
            ) : (
              <AppIcon
                name={item.iconName || "box"}
                fallback="box"
                className="h-16 w-16 text-[#C98484]"
              />
            )}
          </div>

          {/* Featured Action Button */}
          <LocalizedClientLink
            href={promoButtonUrl}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#C98484] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-rose-600 hover:shadow-lg"
            onClick={onNavigate}
          >
            <span>{promoButtonText}</span>
            <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </LocalizedClientLink>
        </div>
      )}
    </div>
  )
}
