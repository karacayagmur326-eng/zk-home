import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts) {
    return null
  }

  return (
    <div className="content-container py-8 lg:py-24">
      <div className="flex justify-between mb-8">
        <Text className="txt-xlarge font-bold text-industrial">{collection.title}</Text>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          Tümünü Gör
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 lg:gap-x-6 gap-y-12 lg:gap-y-24">
        {pricedProducts &&
          pricedProducts.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} isFeatured />
            </li>
          ))}
      </ul>
    </div>
  )
}
