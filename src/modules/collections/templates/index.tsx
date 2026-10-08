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
  return <StoreTemplate {...filters} title={collection.title} collectionId={collection.id} fixedCollectionId={collection.id} />
}
