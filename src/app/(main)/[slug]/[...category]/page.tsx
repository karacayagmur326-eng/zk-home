import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getCategoryByHandle } from "@lib/data/categories"
import { categoryPath } from "@lib/seo/category"
import CategoryTemplate from "@modules/categories/templates"
import { generateMetadata as getCategoryMetadata } from "../../kategoriler/[...category]/page"
import { parseOptionValueIds } from "@lib/util/product-option-filters"
import type { SortOptions } from "@modules/store/components/refinement-list/sort-products"

type Props = {
  params: Promise<{ slug: string; category: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const dynamic = "force-dynamic"

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, category } = await props.params
  const found = await getCategoryByHandle([slug, ...category])
  if (!found || categoryPath(found) !== `/${[slug, ...category].join("/")}`) notFound()
  return getCategoryMetadata({
    params: Promise.resolve({ category: [slug, ...category] }),
    searchParams: props.searchParams,
  } as Parameters<typeof getCategoryMetadata>[0])
}

export default async function PrettyCategoryPage(props: Props) {
  const { slug, category } = await props.params
  const path = [slug, ...category]
  const found = await getCategoryByHandle(path)
  if (!found || categoryPath(found) !== `/${path.join("/")}`) notFound()
  const searchParams = await props.searchParams
  return <CategoryTemplate
    category={found}
    sortBy={searchParams.sortBy as SortOptions | undefined}
    page={typeof searchParams.page === "string" ? searchParams.page : undefined}
    countryCode="tr"
    optionValueIds={parseOptionValueIds(searchParams)}
    collectionId={searchParams.collection_id}
    hideOutOfStock={typeof searchParams.hide_out_of_stock === "string" ? searchParams.hide_out_of_stock : undefined}
    priceMin={typeof searchParams.price_min === "string" ? searchParams.price_min : undefined}
    priceMax={typeof searchParams.price_max === "string" ? searchParams.price_max : undefined}
    viewMode={typeof searchParams.viewMode === "string" ? searchParams.viewMode : undefined}
  />
}
