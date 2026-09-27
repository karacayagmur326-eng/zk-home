import { HttpTypes } from "@medusajs/types"
import Item from "@modules/order/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"
import repeat from "@lib/util/repeat"

type ItemsProps = {
  order: HttpTypes.StoreOrder
}

const Items = ({ order }: ItemsProps) => {
  const items = order.items

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
      {items?.length
        ? items
            .sort((a, b) => {
              return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
            })
            .map((item, idx) => {
              return (
                <Item
                  key={item.id}
                  item={item}
                  currencyCode={order.currency_code}
                  isLast={idx === items.length - 1}
                />
              )
            })
        : repeat(5).map((i) => {
            return <SkeletonLineItem key={i} />
          })}
    </div>
  )
}

export default Items
