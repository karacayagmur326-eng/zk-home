import repeat from "@lib/util/repeat"
import SkeletonProductPreview from "@modules/skeletons/components/skeleton-product-preview"

const SkeletonProductGrid = ({
  numberOfProducts = 8,
}: {
  numberOfProducts?: number
}) => {
  return (
    <div className="flex-1 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-200 gap-4 animate-pulse">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
            <div className="flex gap-2">
              <div className="h-9 w-[120px] bg-gray-200 rounded-md"></div>
              <div className="h-9 w-[130px] bg-gray-200 rounded-md"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
      <ul
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-8 flex-1"
        data-testid="products-list-loader"
      >
      {repeat(numberOfProducts).map((index) => (
        <li key={index}>
          <SkeletonProductPreview />
        </li>
      ))}
      </ul>
    </div>
  )
}

export default SkeletonProductGrid
