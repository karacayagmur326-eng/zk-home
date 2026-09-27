import { notFound } from "next/navigation"
import Image from "@components/common/SmartImage"
import { CSSProperties, Suspense } from "react"

import { AppIcon, ChevronRight, Home } from "@lib/icons"
import { SafeImage } from "@lib/SafeImage"
import { getMenu } from "@lib/data/menus"
import { listCategories } from "@lib/data/categories"
import { serializeJsonLd } from "@lib/security/html"
import { query } from "@lib/admin/db"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { getBaseURL } from "@lib/util/env"

type DesignItem = {
  title: string
  subtitle: string
  icon: string
}

const defaultFeatures: DesignItem[] = [
  {
    title: "Yüksek Performans",
    subtitle: "Güçlü ve dayanıklı",
    icon: "shield",
  },
  {
    title: "Profesyonel Sonuç",
    subtitle: "İşinize uygun çözüm",
    icon: "target",
  },
  {
    title: "Uzun Ömürlü",
    subtitle: "Kaliteli malzeme",
    icon: "award",
  },
]

const defaultTrustItems: DesignItem[] = [
  {
    title: "Teslimat Bilgisi",
    subtitle: "Koşullar ödeme adımında gösterilir",
    icon: "truck",
  },
  {
    title: "Güvenli Alışveriş",
    subtitle: "Ödeme kuruluşu tarafından işlenir",
    icon: "shield",
  },
  {
    title: "Ürün Koşulları",
    subtitle: "Detaylar ürün sayfasında belirtilir",
    icon: "award",
  },
  {
    title: "Uzman Destek",
    subtitle: "Çalışma saatlerinde destek",
    icon: "headphones",
  },
]

function metadataOf(category: HttpTypes.StoreProductCategory) {
  return (category.metadata || {}) as Record<string, unknown>
}

function textValue(
  metadata: Record<string, unknown>,
  key: string,
  fallback = "",
) {
  return typeof metadata[key] === "string"
    ? (metadata[key] as string)
    : fallback
}

function numberValue(
  metadata: Record<string, unknown>,
  key: string,
  fallback: number,
  min: number,
  max: number,
) {
  const parsed = Number(metadata[key])
  return Number.isFinite(parsed)
    ? Math.min(max, Math.max(min, parsed))
    : fallback
}

function imageValue(
  metadata: Record<string, unknown>,
  key: string,
  fallback = "",
) {
  const value = textValue(metadata, key, fallback).trim()
  return /^(https?:\/\/|\/|data:image\/)/i.test(value) ? value : fallback
}

function itemList(
  metadata: Record<string, unknown>,
  key: string,
  fallback: DesignItem[],
) {
  if (!Array.isArray(metadata[key])) return fallback
  const items = (metadata[key] as unknown[])
    .slice(0, fallback.length)
    .map((item, index) => {
      const value =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : {}
      return {
        title:
          typeof value.title === "string"
            ? value.title
            : fallback[index]?.title || "",
        subtitle:
          typeof value.subtitle === "string"
            ? value.subtitle
            : fallback[index]?.subtitle || "",
        icon:
          typeof value.icon === "string"
            ? value.icon
            : fallback[index]?.icon || "box",
      }
    })
  return items.length ? items : fallback
}

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  optionValueIds,
  collectionId,
  hideOutOfStock,
  priceMin,
  priceMax,
  viewMode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  collectionId?: string
  hideOutOfStock?: string
  priceMin?: string
  priceMax?: string
  viewMode?: string
}) {
  const [sidebarMenu, navigationCategories, navigationCollections] = await Promise.all([
    getMenu("category-sidebar").catch(() => null).then(async (m) => m || await getMenu("ikincil-menu").catch(() => null)),
    listCategories().catch(() => []),
    query<{ id: string; title: string; handle: string }>(
      `SELECT id,title,handle FROM store_collection ORDER BY title`,
    ).catch(() => []),
  ])
  const navigationGroups = navigationCategories.filter(
    (item) => Array.isArray(item.category_children) && item.category_children.length > 0,
  )
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]
  const getParents = (current: HttpTypes.StoreProductCategory) => {
    if (current.parent_category) {
      parents.push(current.parent_category)
      getParents(current.parent_category)
    }
  }
  getParents(category)

  const metadata = metadataOf(category)
  const heroImageUrl = imageValue(
    metadata,
    "hero_image_url",
    imageValue(metadata, "banner_url", imageValue(metadata, "image_url")),
  )
  const heroMobileImageUrl = imageValue(
    metadata,
    "hero_mobile_image_url",
    heroImageUrl,
  )
  const displayTitle = textValue(metadata, "display_title", category.name)
  const eyebrow = textValue(metadata, "eyebrow", "ÜRÜN KATEGORİSİ")
  const heroHeight = numberValue(metadata, "hero_height", 300, 240, 620)
  const heroMobileHeight = numberValue(
    metadata,
    "hero_mobile_height",
    230,
    200,
    440,
  )
  const heroImageWidth = numberValue(
    metadata,
    "hero_image_width",
    52,
    35,
    70,
  )
  const titleSize = numberValue(metadata, "title_size", 48, 32, 72)
  const titleSizeMobile = numberValue(
    metadata,
    "title_size_mobile",
    32,
    24,
    48,
  )
  const heroBackground = textValue(metadata, "hero_background", "#ffffff")
  const heroObjectPosition = textValue(
    metadata,
    "hero_object_position",
    "center",
  )
  const childCardColumns = numberValue(
    metadata,
    "child_card_columns",
    4,
    2,
    4,
  )
  const childCardImageWidth = numberValue(
    metadata,
    "child_card_image_width",
    74,
    40,
    140,
  )
  const childCardImageHeight = numberValue(
    metadata,
    "child_card_image_height",
    68,
    40,
    140,
  )
  const childCardImageFit = textValue(
    metadata,
    "child_card_image_fit",
    "cover",
  )
  const features = itemList(
    metadata,
    "hero_features",
    defaultFeatures,
  )
  const trustItems = itemList(
    metadata,
    "trust_items",
    defaultTrustItems,
  )
  const badgeText = textValue(
    metadata,
    "hero_badge_text",
    textValue(metadata, "badge_text", "Doğru Ekipman Mükemmel Sonuç"),
  )
  // Check if sidebar menu defines custom items for this category
  const menuGroup = sidebarMenu?.items?.find((item: any) => {
    const itemUrl = (item.url || "").trim()
    return (
      itemUrl === `/kategoriler/${category.handle}` ||
      itemUrl.endsWith(`/${category.handle}`) ||
      item.id === category.id ||
      item.label?.toLowerCase() === category.name?.toLowerCase()
    )
  })

  const rawChildren = category.category_children || []

  const children =
    menuGroup?.children && menuGroup.children.length > 0
      ? menuGroup.children.map((menuChild: any) => {
          const childHandle = (menuChild.url || "")
            .replace(/^\/kategoriler\//, "")
            .replace(/\/$/, "")
          const matched =
            navigationCategories.find((c: any) => c.handle === childHandle) ||
            rawChildren.find((c: any) => c.handle === childHandle) ||
            navigationCategories.find((c: any) => c.id === menuChild.id) ||
            navigationCategories.find(
              (c: any) =>
                c.name?.toLowerCase() === menuChild.label?.toLowerCase() &&
                c.is_active !== false
            ) ||
            rawChildren.find(
              (c: any) =>
                c.name?.toLowerCase() === menuChild.label?.toLowerCase() &&
                c.is_active !== false
            )
          if (matched) {
            return {
              ...matched,
              name: menuChild.label || matched.name,
            }
          }
          return {
            id: menuChild.id || childHandle,
            name: menuChild.label,
            handle: childHandle,
            metadata: { card_title: menuChild.label },
            category_children: [],
          } as unknown as HttpTypes.StoreProductCategory
        })
      : rawChildren
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: getBaseURL() },
      { "@type": "ListItem", position: 2, name: "Mağaza", item: `${getBaseURL()}/magaza` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${getBaseURL()}/kategoriler/${category.handle}` },
    ],
  }

  const categoryStyle = {
    "--category-hero-height": `${heroHeight}px`,
    "--category-mobile-height": `${heroMobileHeight}px`,
    "--category-image-width": `${heroImageWidth}%`,
    "--category-title-size": `${titleSize}px`,
    "--category-mobile-title-size": `${titleSizeMobile}px`,
  } as React.CSSProperties

  return (
    <div className="content-container pt-0 pb-4 sm:py-6" style={categoryStyle}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <div>
        <nav
          aria-label="Sayfa yolu"
          className="hidden sm:flex no-scrollbar mb-4 sm:mb-5 items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-xs text-muted"
        >
          <LocalizedClientLink
            href="/"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <Home aria-hidden="true" className="h-3.5 w-3.5" />
            Ana Sayfa
          </LocalizedClientLink>
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          <LocalizedClientLink
            href="/magaza"
            className="transition-colors hover:text-primary"
          >
            Ürün Kategorileri
          </LocalizedClientLink>
          {parents.map((parent) => (
            <span key={parent.id} className="contents">
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
              <LocalizedClientLink
                href={`/kategoriler/${parent.handle}`}
                className="transition-colors hover:text-primary"
              >
                {parent.name}
              </LocalizedClientLink>
            </span>
          ))}
          <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          <span aria-current="page" className="font-semibold text-primary">
            {category.name}
          </span>
        </nav>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <RefinementList
            sortBy={sort}
            sidebarMenu={sidebarMenu}
            initialCategories={navigationGroups}
            initialCollections={navigationCollections}
            data-testid="sort-by-container"
            hideOptionsPicker
          />

          <div className="min-w-0 w-full flex-1">
            <header
              className="hidden sm:flex group/hero relative mb-6 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft hover:shadow-lg transition-all duration-500 lg:min-h-[var(--category-hero-height)] lg:flex-row"
              style={{ backgroundColor: heroBackground }}
            >
              <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-center p-4 min-[400px]:p-5 sm:p-7 lg:p-9">
                {eyebrow ? (
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    {eyebrow}
                  </p>
                ) : null}
                <h1
                  data-testid="category-page-title"
                  className="mt-1.5 max-w-3xl text-[clamp(1.75rem,8.5vw,var(--category-mobile-title-size))] font-bold leading-[1.08] tracking-tight text-slate-800 lg:text-[length:var(--category-title-size)]"
                >
                  {displayTitle}
                </h1>
                <span className="mt-2.5 h-1 w-16 rounded-full bg-primary" />
                {category.description && (
                  <p className="mt-3 max-w-xl text-[12px] font-normal leading-relaxed text-slate-600 sm:text-sm">
                    {category.description}
                  </p>
                )}

                {features && features.length > 0 && (
                  <div className="mt-4 grid w-full grid-cols-3 gap-1.5 border-t border-slate-100/90 pt-3 sm:mt-6 sm:gap-3 sm:pt-4">
                    {features.slice(0, 3).map((feature, index) => (
                      <div
                        key={`${feature.title}-${index}`}
                        className="group/feat flex min-w-0 flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50/50 p-2 text-center transition-all duration-200 hover:border-rose-200 hover:bg-rose-50/80 sm:flex-row sm:gap-2.5 sm:p-2.5 sm:text-left cursor-default"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-rose-100 bg-rose-50/80 text-primary transition-colors duration-200 group-hover/feat:bg-primary group-hover/feat:text-white sm:h-9 sm:w-9">
                          <AppIcon
                            name={feature.icon}
                            fallback="shield"
                            className="h-4.5 w-4.5"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="block text-[10px] font-semibold leading-tight text-slate-800 line-clamp-2 transition-colors group-hover/feat:text-primary sm:text-xs sm:font-bold">
                            {feature.title}
                          </strong>
                          <span className="mt-0.5 hidden text-[10px] font-medium text-slate-500 truncate sm:block">
                            {feature.subtitle}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {heroImageUrl && (
                <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-slate-100 sm:aspect-[21/9] lg:aspect-auto lg:h-auto lg:w-[var(--category-image-width)] lg:[clip-path:polygon(14%_0,100%_0,100%_100%,0_100%)]">
                  {heroImageUrl.startsWith("/") ? (
                    <Image
                      src={heroImageUrl}
                      alt={`${category.name} kategori kapak görseli`}
                      fill
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 100vw, 42vw"
                      quality={75}
                      className="object-cover transform group-hover/hero:scale-105 transition-transform duration-700 ease-out"
                      style={{ objectPosition: heroObjectPosition }}
                    />
                  ) : (
                    <SafeImage
                      src={heroImageUrl}
                      alt={`${category.name} kategori kapak görseli`}
                      className="absolute inset-0 h-full w-full object-cover transform group-hover/hero:scale-105 transition-transform duration-700 ease-out"
                      style={{ objectPosition: heroObjectPosition }}
                    />
                  )}
                </div>
              )}
            </header>

            {children.length > 0 && (
              <section
                className="relative z-20 mb-4 sm:mb-8 w-[calc(100%+2rem)] -mx-4 sm:mx-0 sm:w-full max-sm:bg-gradient-to-b max-sm:from-[#F9EEEE] max-sm:via-[#FCF7F6] max-sm:to-white sm:bg-none sm:bg-transparent max-sm:border-b max-sm:border-rose-200/80 p-3 pt-2.5 sm:p-0 max-sm:shadow-2xs sm:shadow-none"
                aria-labelledby="subcategories-heading"
              >
                {/* Subcategories Header Label for Mobile */}
                <div className="sm:hidden flex items-center justify-between mb-1.5 px-1 pt-1">
                  <span className="text-[11px] font-black text-[#C98484] uppercase tracking-tight">
                    Alt Kategoriler
                  </span>
                </div>

                {/* Subcategories: Horizontal Scrollable Strip on Mobile / 1x4 Responsive Grid on Desktop */}
                <div className="no-scrollbar flex items-start gap-3 overflow-x-auto py-1 px-1 sm:px-0 touch-pan-x sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 sm:overflow-visible">
                  {children.map((child) => {
                    const childMetadata = metadataOf(child)
                    const cardImageUrl = imageValue(
                      childMetadata,
                      "card_image_url",
                      imageValue(
                        childMetadata,
                        "image_url",
                        imageValue(childMetadata, "banner_url"),
                      ),
                    )
                    const rawCardTitle = textValue(
                      childMetadata,
                      "card_title",
                      "",
                    )
                    const cardTitle = rawCardTitle.trim() || child.name

                    const cardIcon = textValue(
                      childMetadata,
                      "icon",
                      "box",
                    )

                    const cardDescription =
                      typeof childMetadata.card_description === "string" && childMetadata.card_description.trim()
                        ? childMetadata.card_description.trim()
                        : typeof childMetadata.description === "string" && childMetadata.description.trim()
                        ? childMetadata.description.trim()
                        : child.description?.trim()
                        ? child.description.trim()
                        : `${cardTitle} çeşitleri ve modelleri.`

                    return (
                      <LocalizedClientLink
                        key={child.id}
                        href={`/kategoriler/${child.handle}`}
                        className="group flex flex-col items-center text-center shrink-0 w-[72px] cursor-pointer sm:w-full sm:flex-row sm:items-center sm:gap-3.5 sm:rounded-2xl sm:border sm:border-slate-200/80 sm:bg-white sm:p-3.5 sm:px-4 sm:shadow-2xs hover:sm:border-rose-300 hover:sm:shadow-md transition-all"
                      >
                        {/* Icon Container: Mobile keeps round border badge; Desktop removes icon zemin (sm:bg-transparent sm:border-0) and enlarges icon */}
                        <div className="relative w-14 h-14 rounded-full border-2 border-slate-200/90 bg-white shadow-2xs transition-all duration-200 group-hover:scale-105 group-hover:border-[#C98484] group-hover:bg-rose-50/80 overflow-hidden flex items-center justify-center p-2 shrink-0 sm:w-10 sm:h-10 sm:rounded-none sm:border-0 sm:bg-transparent sm:shadow-none sm:p-0">
                          {cardImageUrl ? (
                            cardImageUrl.startsWith("/") ? (
                              <Image
                                src={cardImageUrl}
                                alt={cardTitle}
                                fill
                                sizes="(max-width: 639px) 56px, 32px"
                                quality={50}
                                className="object-contain p-0.5 group-hover:scale-110 transition-transform sm:p-1"
                              />
                            ) : (
                              <SafeImage
                                src={cardImageUrl}
                                alt={cardTitle}
                                width={56}
                                height={56}
                                className="w-full h-full object-contain p-0.5 group-hover:scale-110 transition-transform sm:p-0 sm:w-8 sm:h-8"
                              />
                            )
                          ) : (
                            <AppIcon
                              name={cardIcon}
                              fallback="box"
                              className="w-6 h-6 text-primary group-hover:scale-110 transition-transform sm:w-7 sm:h-7"
                            />
                          )}
                        </div>

                        {/* Subcategory Name & Description */}
                        <div className="flex flex-col min-w-0 text-center sm:text-left">
                          <span className="mt-1.5 sm:mt-0 text-[10.5px] font-bold text-slate-800 leading-tight line-clamp-1 group-hover:text-[#C98484] transition-colors sm:text-xs">
                            {cardTitle}
                          </span>
                          {cardDescription && (
                            <span className="hidden sm:block mt-0.5 text-[11px] font-normal text-slate-500 line-clamp-1 leading-tight">
                              {cardDescription}
                            </span>
                          )}
                        </div>
                      </LocalizedClientLink>
                    )
                  })}
                </div>
              </section>
            )}



            <Suspense
              fallback={
                <SkeletonProductGrid
                  numberOfProducts={category.products?.length ?? 8}
                />
              }
            >
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                categoryId={category.id}
                title={category.name}
                collectionId={collectionId}
                countryCode={countryCode}
                optionValueIds={optionValueIds}
                hideOutOfStock={hideOutOfStock}
                priceMin={priceMin}
                priceMax={priceMax}
                viewMode={viewMode}
                headingLevel={2}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
