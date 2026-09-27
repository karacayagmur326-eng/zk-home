import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#C98484] flex items-center justify-center flex-shrink-0">
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
              d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
            />
          </svg>
        </div>
        <h2 className="text-base font-bold text-slate-800">Teslimat</h2>
      </div>

      {/* 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Shipping address */}
        <div data-testid="shipping-address-summary">
          <div className="flex items-center gap-1.5 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="w-4 h-4 text-slate-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
              />
            </svg>
            <p className="text-xs font-semibold text-slate-700">Teslimat adresi</p>
          </div>
          <div className="text-xs text-slate-500 space-y-0.5 pl-5">
            <p className="font-medium text-slate-700">
              {order.shipping_address?.first_name}{" "}
              {order.shipping_address?.last_name}
            </p>
            <p>
              {order.shipping_address?.address_1}{" "}
              {order.shipping_address?.address_2}
            </p>
            <p>
              {order.shipping_address?.postal_code},{" "}
              {order.shipping_address?.city}
            </p>
            <p>{order.shipping_address?.country_code?.toUpperCase()}</p>
          </div>
        </div>

        {/* Contact */}
        <div data-testid="shipping-contact-summary">
          <div className="flex items-center gap-1.5 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="w-4 h-4 text-slate-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
              />
            </svg>
            <p className="text-xs font-semibold text-slate-700">İletişim</p>
          </div>
          <div className="text-xs text-slate-500 space-y-0.5 pl-5">
            <p>{order.shipping_address?.phone}</p>
            <p>{order.email}</p>
          </div>
        </div>

        {/* Shipping method */}
        <div data-testid="shipping-method-summary">
          <div className="flex items-center gap-1.5 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="w-4 h-4 text-slate-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
              />
            </svg>
            <p className="text-xs font-semibold text-slate-700">Teslimat yöntemi</p>
          </div>
          <div className="text-xs text-slate-500 pl-5">
            <p>
              (
              {convertToLocale({
                amount: order.shipping_methods?.[0]?.total ?? 0,
                currency_code: order.currency_code,
              })}
              )
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShippingDetails
