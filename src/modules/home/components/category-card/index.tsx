import { HttpTypes } from "@medusajs/types"

import {
  AppIcon,
  Box,
  ChevronRight,
  Drill,
  Hammer,
  Ruler,
  Scissors,
  Settings,
  Toolbox,
  Wrench,
  Zap,
} from "@lib/icons"
import { SafeImage } from "@lib/SafeImage"
import Image from "@components/common/SmartImage"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { categoryPath } from "@lib/seo/category"

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

export default function CategoryCard({
  category,
  circlePx = 76,
  singleLine = false,
  tabIndex,
}: {
  category: HttpTypes.StoreProductCategory
  circlePx?: number
  singleLine?: boolean
  tabIndex?: number
  iconSize?: string | number
  fontSize?: string | number
  fontWeight?: string | number
  iconColor?: string
  textColor?: string
  iconBg?: string
}) {
  const metadata = (category.metadata || {}) as Record<string, unknown>
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
    typeof metadata.icon === "string" ? metadata.icon : undefined,
  )
  const FallbackIcon = fallbackIcons[iconName as keyof typeof fallbackIcons] || Box

  const iconClass = "h-5.5 w-5.5"

  return (
    <LocalizedClientLink
      href={categoryPath(category)}
      className="group flex min-w-[70px] sm:min-w-[80px] md:min-w-[88px] lg:min-w-[94px] flex-col items-center px-1 py-0.5 sm:px-1.5 sm:py-1 text-center transition-all duration-300 focus-visible:outline-none"
      tabIndex={tabIndex}
    >
      {/* Compact Circular Badge */}
      <div
        className="relative shrink-0 overflow-hidden rounded-full border border-slate-200/90 bg-white shadow-2xs transition-[transform,border-color,box-shadow] duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-105 group-hover:border-[#C98484] group-hover:shadow-[0_8px_24px_rgba(185,132,132,0.22)] group-focus-visible:-translate-y-1 group-focus-visible:scale-105 group-focus-visible:border-[#C98484] group-focus-visible:ring-2 group-focus-visible:ring-[#C98484]/40 group-focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:transform-none"
        style={{
          width: `${circlePx}px`,
          height: `${circlePx}px`,
        }}
      >
        {cardImageUrl ? (
          cardImageUrl.startsWith("/") ? (
            <Image
              src={cardImageUrl}
              alt={category.name}
              fill
              sizes={`${circlePx}px`}
              quality={50}
              className="object-contain p-2 sm:p-2.5 transition-transform duration-300 ease-out group-hover:scale-[1.12] group-focus-visible:scale-[1.12] motion-reduce:transition-none motion-reduce:transform-none"
            />
          ) : (
            <SafeImage
              src={cardImageUrl}
              alt={category.name}
              width={circlePx}
              height={circlePx}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-contain p-2 sm:p-2.5 transition-transform duration-300 ease-out group-hover:scale-[1.12] group-focus-visible:scale-[1.12] motion-reduce:transition-none motion-reduce:transform-none"
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-white">
            {metadata.icon ? (
              <AppIcon
                name={iconName}
                fallback="box"
                className={`${iconClass} text-primary transition-transform duration-300 group-hover:scale-110`}
              />
            ) : (
              <FallbackIcon
                className={`${iconClass} text-primary transition-transform duration-300 group-hover:scale-110`}
              />
            )}
          </div>
        )}
      </div>

      {/* Category Name Label */}
      <span className="mt-1 sm:mt-1.5 block min-h-[26px] sm:min-h-[30px] max-w-[70px] sm:max-w-[80px] md:max-w-[88px] lg:max-w-[94px] px-0.5 pb-0.5 text-center text-[10px] sm:text-[11px] font-semibold leading-[1.25] text-slate-800 line-clamp-2 transition-colors group-hover:text-primary">
        {category.name}
      </span>
    </LocalizedClientLink>
  )
}
