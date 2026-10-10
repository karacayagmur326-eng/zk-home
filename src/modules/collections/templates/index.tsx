import StoreTemplate from "@modules/store/templates"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { OptionValueIds } from "@lib/util/product-option-filters"

export default function CollectionTemplate({ collection, ...filters }: {
  collection: HttpTypes.StoreCollection
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  hideOutOfStock?: string
  priceMin?: string
  priceMax?: string
  searchQuery?: string
  viewMode?: string
}) {
  const heading = typeof collection.metadata?.h1_title === "string" && collection.metadata.h1_title.trim() ? collection.metadata.h1_title : collection.title
  return <StoreTemplate {...filters} title={heading} collectionId={collection.id} fixedCollectionId={collection.id} />
}
