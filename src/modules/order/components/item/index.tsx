import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
  isLast?: boolean
}

const Item = ({ item, currencyCode, isLast }: ItemProps) => {
  // product_title veya title'dan ürün adını al
  const productName =
    (item as any).product_title ||
    (item as any).title ||
    (item as any).product?.title ||
    "Ürün"

  // Varyant başlığı (boşsa gösterme)
  const variantTitle = (item.variant as any)?.title

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 ${!isLast ? "border-b border-slate-100" : ""}`}
      data-testid="product-row"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
        <Thumbnail thumbnail={item.thumbnail} size="square" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold text-slate-800 leading-snug"
          data-testid="product-name"
          title={productName}
        >
          {productName}
        </p>
        {variantTitle && (
          <p className="text-xs text-slate-400 mt-0.5" data-testid="product-variant">
            Seçenek: {variantTitle}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="flex flex-col items-end flex-shrink-0 ml-3">
        <span className="text-xs text-slate-400">
          {item.quantity} x{" "}
          {convertToLocale({
            amount: item.unit_price ?? 0,
            currency_code: currencyCode,
          })}
        </span>
        <span className="text-sm font-bold text-slate-800 mt-0.5">
          {convertToLocale({
            amount: (item.unit_price ?? 0) * item.quantity,
            currency_code: currencyCode,
          })}
        </span>
      </div>
    </div>
  )
}

export default Item
