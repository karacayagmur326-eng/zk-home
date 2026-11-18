import { notFound } from "next/navigation"
import { catalogRouteKind } from "@lib/commerce/catalog-routing"
import Store, { generateMetadata as storeMetadata } from "../../magaza/listing-page"
import Slug, { generateMetadata as slugMetadata } from "../../[slug]/listing-page"
import Category, { generateMetadata as categoryMetadata } from "../../[slug]/[...category]/listing-page"
import Legacy, { generateMetadata as legacyMetadata } from "../../kategoriler/[...category]/listing-page"
import Brand, { generateMetadata as brandMetadata } from "../../markalar/[handle]/listing-page"

export const dynamic = "force-dynamic"
type Props = { params: Promise<{ segments: string[] }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

async function view(props: Props) {
  const { segments } = await props.params
  const original = `/${segments.join("/")}`
  const kind = catalogRouteKind(original)
  const searchParams = props.searchParams
  if (kind === "store") return { render: () => <Store searchParams={searchParams} />, metadata: () => storeMetadata({ searchParams }) }
  if (kind === "brand") {
    const input = { params: Promise.resolve({ handle: segments[1] }), searchParams }
    return { render: () => <Brand {...input} />, metadata: () => brandMetadata(input) }
  }
  if (kind === "legacy") {
    const input = { params: Promise.resolve({ category: segments.slice(1) }), searchParams }
    return { render: () => <Legacy {...input} />, metadata: () => legacyMetadata(input) }
  }
  if (kind === "slug") {
    const input = { params: Promise.resolve({ slug: segments[0] }), searchParams }
    return { render: () => <Slug {...input} />, metadata: () => slugMetadata(input) }
  }
  if (kind === "category") {
    const input = { params: Promise.resolve({ slug: segments[0], category: segments.slice(1) }), searchParams }
    return { render: () => <Category {...input} />, metadata: () => categoryMetadata(input) }
  }
  notFound()
}
export async function generateMetadata(props: Props) { return (await view(props)).metadata() }
export default async function CatalogView(props: Props) { return (await view(props)).render() }
