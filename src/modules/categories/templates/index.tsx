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
import { categoryPath } from "@lib/seo/category"
import { turkishTitleCase } from "@lib/util/turkish-title-case"

type DesignItem = {
  title: string
  subtitle: string
  icon: string
}

const defaultFeatures: DesignItem[] = [
  {
    title: "Özenli Seçki",
    subtitle: "Evinize uyumlu parçalar",
    icon: "sparkles",
  },
  {
    title: "Zamansız Tasarım",
    subtitle: "Farklı stillere uyum",
    icon: "heart",
  },
  {
    title: "Kaliteli Detaylar",
    subtitle: "Özenli malzeme seçimi",
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
  collectionId?: string | string[]
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
  const categoryArtwork = imageValue(metadata, "card_image_url", imageValue(metadata, "icon"))
  const heroMobileImageUrl = imageValue(
    metadata,
    "hero_mobile_image_url",
    heroImageUrl,
  )
  const displayTitle = textValue(metadata, "display_title", category.name)
  const eyebrow = textValue(metadata, "eyebrow", "").trim() || parents[0]?.name || "ZK Home Seçkisi"
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
  const titleSize = numberValue(metadata, "title_size", 42, 32, 72)
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
    3,
    3,
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
    textValue(metadata, "badge_text", "Evinize Uyumlu Seçimler"),
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

  const children = rawChildren.length > 0
    ? rawChildren
    : menuGroup?.children && menuGroup.children.length > 0
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
      ...parents.slice().reverse().map((parent, index) => ({
        "@type": "ListItem", position: index + 2, name: parent.name,
        item: `${getBaseURL()}${categoryPath(parent)}`,
      })),
      { "@type": "ListItem", position: parents.length + 2, name: category.name, item: `${getBaseURL()}${categoryPath(category)}` },
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
          {parents.slice().reverse().map((parent) => (
            <span key={parent.id} className="contents">
              <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
              <LocalizedClientLink
                href={categoryPath(parent)}
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
                  <p className="inline-flex items-center gap-2 text-xs font-semibold normal-case tracking-wide text-primary">
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {turkishTitleCase(eyebrow)}
                  </p>
                ) : null}
                <h1
                  data-testid="category-page-title"
                  className="mt-2 max-w-3xl text-[clamp(1.75rem,8.5vw,var(--category-mobile-title-size))] font-bold leading-[1.12] tracking-tight text-slate-800 lg:text-[length:var(--category-title-size)]"
                >
                  {turkishTitleCase(displayTitle)}
                </h1>
                <span className="mt-3 h-0.5 w-12 rounded-full bg-primary/80" />
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
                            {turkishTitleCase(feature.title)}
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
              {!heroImageUrl && categoryArtwork.startsWith("/") && (
                <div aria-hidden="true" className="hidden w-[29%] shrink-0 items-center justify-center pr-8 lg:flex">
                  <div className="flex aspect-square w-full max-w-[210px] items-center justify-center rounded-full border border-rose-100 bg-gradient-to-br from-rose-50/90 via-white to-[#f9eeee] shadow-[0_16px_45px_-28px_rgba(128,75,75,0.38)]">
                    <SafeImage src={categoryArtwork} alt="" className="h-[70%] w-[70%] object-contain" />
                  </div>
                </div>
              )}
            </header>

            {children.length > 0 && (
              <section
                className="mb-6 rounded-[20px] border border-[#eee7e2] bg-[#fffdfb] p-4 shadow-[0_10px_30px_rgba(90,63,55,0.06)] sm:mb-8 sm:p-5"
                aria-labelledby="subcategories-heading"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 id="subcategories-heading" className="text-xl font-semibold tracking-tight text-[#c77e80] sm:text-2xl">Alt Kategoriler</h2>
                  <a href="#category-products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#bd6f72] transition-colors hover:text-[#9e5055] hover:underline">
                    Tüm Kategoriyi Keşfet <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>

                <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 ${childCardColumns === 4 ? "2xl:grid-cols-4" : ""}`}>
                  {children.map((child) => {
                    const childMetadata = metadataOf(child)
                    const grandchildren = Array.isArray(child.category_children) ? child.category_children : []
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
                      <div
                        key={child.id}
                        className="group min-w-0 rounded-xl border border-[#eee9e5] bg-white shadow-[0_4px_16px_rgba(99,71,61,0.04)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#dfb9b5] hover:shadow-[0_10px_24px_rgba(99,71,61,0.10)]"
                      >
                        <LocalizedClientLink
                          href={categoryPath(child)}
                          className="flex min-w-0 items-center gap-3 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484]"
                        >
                          <div
                            className="relative flex max-w-[44%] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f5efeb]"
                            style={{ width: childCardImageWidth, height: childCardImageHeight }}
                          >
                            {cardImageUrl ? (
                              cardImageUrl.startsWith("/") ? (
                                <Image
                                  src={cardImageUrl}
                                  alt=""
                                  fill
                                  sizes="(max-width: 639px) 40vw, 145px"
                                  quality={75}
                                  className={`${childCardImageFit === "contain" ? "object-contain" : "object-cover"} transition-transform duration-300 group-hover:scale-[1.04]`}
                                />
                              ) : (
                                <SafeImage
                                  src={cardImageUrl}
                                  alt=""
                                  width={childCardImageWidth}
                                  height={childCardImageHeight}
                                  className={`h-full w-full ${childCardImageFit === "contain" ? "object-contain" : "object-cover"} transition-transform duration-300 group-hover:scale-[1.04]`}
                                />
                              )
                            ) : (
                              <AppIcon
                                name={cardIcon}
                                fallback="box"
                                className="h-12 w-12 text-[#c98484] transition-transform duration-300 group-hover:scale-110"
                              />
                            )}
                          </div>

                          <div className="flex min-h-[112px] min-w-0 flex-1 flex-col py-1 pr-1">
                            <span className="line-clamp-2 text-sm font-semibold leading-snug text-[#253047] transition-colors group-hover:text-[#b9686b]">
                              {cardTitle}
                            </span>
                            {cardDescription && (
                              <span className="mt-1 line-clamp-3 text-xs leading-[1.35] text-[#8490a3]">
                                {cardDescription}
                              </span>
                            )}
                            <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs font-semibold text-[#bd6f72]">
                              İncele <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                            </span>
                          </div>
                        </LocalizedClientLink>
                        {grandchildren.length > 0 && (
                          <ul className="mx-3 mb-2 space-y-0.5 border-t border-[#eee5e1] pt-2" aria-label={`${child.name} alt kategorileri`}>
                            {grandchildren.map((grandchild) => (
                              <li key={grandchild.id}>
                                <LocalizedClientLink
                                  href={categoryPath(grandchild)}
                                  className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-xs font-medium text-[#655b58] transition-colors hover:bg-[#fbf4f1] hover:text-[#a45d5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C98484]"
                                >
                                  <span>{grandchild.name}</span>
                                  <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#bd7779]" />
                                </LocalizedClientLink>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}



            <div id="category-products" className="scroll-mt-28">
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
                title={textValue(metadata, "product_list_title", "").trim() || category.name}
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
    </div>
  )
}
