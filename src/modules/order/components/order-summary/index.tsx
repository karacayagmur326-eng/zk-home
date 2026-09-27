import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderSummaryProps = {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const getAmount = (amount?: number | null) => {
    if (amount === undefined || amount === null) {
      return "–"
    }
    return convertToLocale({
      amount,
      currency_code: order.currency_code,
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
            />
          </svg>
        </div>
        <h2 className="text-base font-bold text-slate-800">Sipariş özeti</h2>
      </div>

      {/* Summary rows */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Ara Toplam</span>
          <span className="text-sm font-medium text-slate-800">
            {getAmount(order.subtotal)}
          </span>
        </div>

        {(order.discount_total ?? 0) > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">İndirim</span>
            <span className="text-sm font-medium text-emerald-600">
              - {getAmount(order.discount_total)}
            </span>
          </div>
        )}

        {(order.gift_card_total ?? 0) > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Hediye Kartı</span>
            <span className="text-sm font-medium text-emerald-600">
              - {getAmount(order.gift_card_total)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Kargo</span>
          <span className="text-sm font-medium text-slate-800">
            {getAmount(order.shipping_total)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">Vergiler</span>
          <span className="text-sm font-medium text-slate-800">
            {order.tax_total ? getAmount(order.tax_total) : "–"}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-slate-100 my-4" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-800">Toplam</span>
        <span className="text-lg font-bold text-slate-900">
          {getAmount(order.total)}
        </span>
      </div>
    </div>
  )
}

export default OrderSummary
