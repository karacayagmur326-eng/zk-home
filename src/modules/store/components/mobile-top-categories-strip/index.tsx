"use client"

import { usePathname } from "next/navigation"
import Image from "@components/common/SmartImage"
import { SafeImage } from "@lib/SafeImage"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import { AppIcon, Box, Drill, Hammer, Ruler, Scissors, Settings, Toolbox, Wrench, Zap } from "@lib/icons"

function resolveCategoryIcon(name: string, iconName?: string) {
  if (iconName) return iconName

  const n = name.toLocaleLowerCase("tr-TR")
  if (n.includes("matkap") || n.includes("vidalama")) return "drill"
  if (n.includes("el alet") || n.includes("anahtar")) return "wrench"
  if (n.includes("kırıcı") || n.includes("darbeli")) return "hammer"
  if (n.includes("set") || n.includes("çanta")) return "toolbox"
  if (n.includes("ölçüm") || n.includes("metre")) return "ruler"
  if (n.includes("aksesuar") || n.includes("yedek") || n.includes("zımpara") || n.includes("polisaj"))
    return "settings"
  if (n.includes("kaynak")) return "zap"
  if (n.includes("testere") || n.includes("planya") || n.includes("tırpan") || n.includes("kesme"))
    return "scissors"
  return "box"
}

const fallbackIcons = {
  drill: Drill,
  wrench: Wrench,
  hammer: Hammer,
  toolbox: Toolbox,
  ruler: Ruler,
  settings: Settings,
  zap: Zap,
  scissors: Scissors,
  box: Box,
}

export default function MobileTopCategoriesStrip({ categories = [] }: { categories?: any[] }) {
  const pathname = usePathname()
  const topCategories = categories.filter((cat: any) => !cat.parent_category_id && !cat.parent_category)

  if (topCategories.length === 0) return null

  return (
    <div className="lg:hidden w-[calc(100%+2rem)] -mx-4 mb-0 bg-gradient-to-r from-[#FCF7F6] via-white to-[#FCF7F6] border-t border-b-0 border-slate-200/80 p-3 pb-1">
      <div className="flex items-center justify-between mb-2 px-4">
        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Kategoriler</span>
      </div>

      <div className="no-scrollbar flex items-start gap-3 overflow-x-auto py-1 px-4 touch-pan-x">
        {topCategories.map((category) => {
          const metadata = (category.metadata || {}) as Record<string, any>
          const cardImageUrl =
            typeof metadata.card_image_url === "string" && metadata.card_image_url
              ? metadata.card_image_url
              : typeof metadata.image_url === "string" && metadata.image_url
              ? metadata.image_url
              : typeof metadata.banner_url === "string" && metadata.banner_url
              ? metadata.banner_url
              : undefined

          const iconName = resolveCategoryIcon(
            category.name,
            typeof metadata.icon === "string" ? metadata.icon : undefined
          )
          const FallbackIcon = fallbackIcons[iconName as keyof typeof fallbackIcons] || Box
          const isActive = Boolean(pathname && pathname.includes(`/kategoriler/${category.handle}`))

          return (
            <LocalizedClientLink
              key={category.id}
              href={`/kategoriler/${category.handle}`}
              className="group relative flex flex-col items-center text-center shrink-0 w-[72px] cursor-pointer pb-2"
            >
              {/* Round Circle Badge with Active Orange Highlight */}
              <div
                className={clx(
                  "relative w-14 h-14 rounded-full border-2 transition-all duration-200 overflow-hidden flex items-center justify-center p-2",
                  isActive
                    ? "border-[#C98484] bg-gradient-to-br from-rose-100/90 via-rose-50/80 to-white shadow-xs ring-4 ring-[#C98484]/20 scale-105"
                    : "border-slate-200/90 bg-slate-50/70 shadow-2xs group-hover:scale-105 group-hover:border-[#C98484] group-hover:bg-rose-50/80"
                )}
              >
                {cardImageUrl ? (
                  cardImageUrl.startsWith("/") ? (
                    <Image
                      src={cardImageUrl}
                      alt={category.name}
                      fill
                      sizes="56px"
                      quality={50}
                      className="object-contain p-2 transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <SafeImage
                      src={cardImageUrl}
                      alt={category.name}
                      width={56}
                      height={56}
                      className="w-full h-full object-contain p-0.5 transition-transform group-hover:scale-110"
                    />
                  )
                ) : (
                  <FallbackIcon
                    className="w-6 h-6 text-[#C98484] transition-transform group-hover:scale-110"
                  />
                )}
              </div>

              {/* Category Name */}
              <span
                className={clx(
                  "mt-1.5 text-[10.5px] font-bold leading-tight line-clamp-2 transition-colors",
                  isActive ? "text-[#C98484] font-black" : "text-slate-800 group-hover:text-[#C98484]"
                )}
              >
                {category.name}
              </span>

              {/* Downward Pointer Arrow Connecting Directly to Subcategories Below */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30">
                  <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-[#C98484] filter drop-shadow-xs" />
                </div>
              )}
            </LocalizedClientLink>
          )
        })}
      </div>
    </div>
  )
}
