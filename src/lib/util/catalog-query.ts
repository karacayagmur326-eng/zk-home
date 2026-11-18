type Filters = {
  sortBy?: string; page?: string; optionValueIds?: string[]; collectionId?: string | string[]
  hideOutOfStock?: string; priceMin?: string; priceMax?: string; viewMode?: string
  searchQuery?: string; fixedCollectionId?: string
}

export function catalogQueryString(filters: Filters) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({
    sortBy: filters.sortBy, page: filters.page, hide_out_of_stock: filters.hideOutOfStock,
    price_min: filters.priceMin, price_max: filters.priceMax, viewMode: filters.viewMode, q: filters.searchQuery,
  })) if (value) params.set(key, value)
  for (const value of filters.optionValueIds || []) params.append("optionValueIds", value)
  if (!filters.fixedCollectionId && filters.collectionId) {
    for (const id of Array.isArray(filters.collectionId) ? filters.collectionId : [filters.collectionId]) params.append("collection_id", id)
  }
  return params.toString()
}
